import { useState, useEffect } from 'react';
import { Page } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiIntegrado } from '../services/apiIntegrado';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  maxStock: number;
  price: number;
  icon: string;
  is_bulk: number | boolean;
  isBulk?: number | boolean;
  pricePerKg?: number;
  price_per_kg?: number;
  currentKgStock?: number;
  initialKgStock?: number;
}

const ICON_OPTIONS = [
  { value: 'nutrition', label: 'Alimento' },
  { value: 'scale', label: 'Granel' },
  { value: 'sports_baseball', label: 'Juguete' },
  { value: 'medical_services', label: 'Medicamento' },
  { value: 'soap', label: 'Higiene' },
  { value: 'checkroom', label: 'Ropa/Accesorio' },
  { value: 'pets', label: 'General' },
  { value: 'vaccines', label: 'Vacuna' },
  { value: 'bug_report', label: 'Antiparasitario' },
  { value: 'shopping_bag', label: 'Accesorio' },
];

const fmt = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const stockBarColor = (stock: number) => {
  if (stock <= 2) return 'bg-error';
  if (stock <= 5) return 'bg-tertiary';
  return 'bg-primary';
};

interface ProductosProps {
  onNavigate: (page: Page) => void;
}

export default function Productos({ onNavigate }: ProductosProps) {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [stockFilter, setStockFilter] = useState('Todos');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productList, setProductList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');


const getIconForCategory = (category: string, isBulk: boolean) => {
  if (isBulk) return 'scale';
  const cat = category.toLowerCase();
  if (cat.includes('alimento') || cat.includes('nutricion')) return 'nutrition';
  if (cat.includes('higiene') || cat.includes('estetica')) return 'soap';
  if (cat.includes('medicamento') || cat.includes('farmacia') || cat.includes('veterinaria')) return 'medical_services';
  if (cat.includes('juguete') || cat.includes('accesorio') || cat.includes('paseo')) return 'sports_baseball';
  if (cat.includes('ropa')) return 'checkroom';
  if (cat.includes('ave') || cat.includes('roedor')) return 'pets';
  return 'nutrition';
};



  const loadProducts = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await apiIntegrado.getProducts(token);
      if (data) {
        setProductList(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          stock: p.stock,
          maxStock: p.maxStock,
          price: p.price,
          icon: p.icon && p.icon !== 'nutrition' ? p.icon : getIconForCategory(p.category, p.isBulk === 1 || p.isBulk === true),
          isBulk: p.isBulk === 1 || p.isBulk === true,
          pricePerKg: p.pricePerKg,
          currentKgStock: p.currentKgStock,
          initialKgStock: p.initialKgStock,
        })));
      }
    } catch (error) {
      console.warn('Error cargando productos', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [token]);

  const categories = ['Todas', ...Array.from(new Set(productList.map(p => p.category)))];

  const filtered = productList.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search);
    const matchCat = categoryFilter === 'Todas' || p.category === categoryFilter;
    const matchStock = stockFilter === 'Todos'
      || (stockFilter === 'Bajo' && (p.isBulk ? Number(p.currentKgStock) <= 2 : p.stock <= 2))
      || (stockFilter === 'Normal' && (p.isBulk ? Number(p.currentKgStock) > 2 : p.stock > 2));
    return matchSearch && matchCat && matchStock;
  });

  const handleSaveEdit = async () => {
    if (!editProduct) return;
    setSaving(true);
    setErrorMsg('');

    const payload = {
      name: editProduct.name,
      sku: editProduct.sku,
      category: editProduct.category,
      stock: editProduct.isBulk ? 0 : editProduct.stock,
      maxStock: editProduct.isBulk ? 0 : editProduct.maxStock,
      price: editProduct.isBulk ? 0 : editProduct.price,
      icon: editProduct.icon || 'nutrition',
      isBulk: editProduct.isBulk || false,
      pricePerKg: editProduct.isBulk ? (editProduct.pricePerKg ?? 0) : null,
      currentKgStock: editProduct.isBulk ? (editProduct.currentKgStock ?? 0) : null,
      alertThreshold: 2,
    };

    const result = await apiIntegrado.updateProduct(token, editProduct.id, payload);
    setSaving(false);

    if (result) {
      setProductList(prev => prev.map(p => p.id === editProduct.id ? editProduct : p));
      setEditProduct(null);
    } else {
      setErrorMsg('Error al guardar los cambios. Intenta de nuevo.');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Eliminar este producto?')) return;
    const result = await apiIntegrado.deleteProduct(token, id);
    if (result) {
      setProductList(prev => prev.filter(p => p.id !== id));
    } else {
      setErrorMsg('No se pudo eliminar el producto.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const inputCls = 'w-full bg-background border border-secondary/20 rounded-lg p-base text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

  return (
    <div className="p-md flex flex-col gap-lg">
      {isLoading && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-md text-center text-primary">
          Cargando productos del servidor...
        </div>
      )}

      {errorMsg && (
        <div className="bg-error-container/30 border border-error/20 rounded-lg p-md text-center text-error font-bold">
          {errorMsg}
        </div>
      )}

      <section className="flex flex-col md:flex-row justify-between items-end gap-md">
        <div className="flex flex-wrap gap-md w-full md:w-auto">
          <div className="flex flex-col gap-xs">
            <label className="text-caption font-bold text-on-surface-variant uppercase tracking-wider">Categoria</label>
            <select
              className="bg-surface-container-low border border-outline-variant/50 rounded-lg px-md py-sm text-label-md text-on-surface focus:ring-1 focus:ring-primary outline-none min-w-[180px]"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-caption font-bold text-on-surface-variant uppercase tracking-wider">Estado de Stock</label>
            <select
              className="bg-surface-container-low border border-outline-variant/50 rounded-lg px-md py-sm text-label-md text-on-surface focus:ring-1 focus:ring-primary outline-none min-w-[180px]"
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value)}
            >
              <option>Todos</option>
              <option>Normal</option>
              <option>Bajo</option>
            </select>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-caption font-bold text-on-surface-variant uppercase tracking-wider">Buscar</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
              <input
                className="pl-10 pr-4 py-sm bg-surface rounded-full border border-outline-variant focus:outline-none focus:border-primary text-body-md w-56"
                placeholder="Nombre o codigo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigate('cargar-producto')}
          className="flex items-center gap-xs px-lg py-sm bg-primary-container text-white font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          Nuevo Producto
        </button>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/20">
                <th className="px-md py-base text-label-md">Nombre del Producto</th>
                <th className="px-md py-base text-label-md">Tipo</th>
                <th className="px-md py-base text-label-md">Codigo</th>
                <th className="px-md py-base text-label-md">Categoria</th>
                <th className="px-md py-base text-label-md text-center">Stock</th>
                <th className="px-md py-base text-label-md text-right">Precio</th>
                <th className="px-md py-base text-label-md text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filtered.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={7} className="px-md py-xl text-center text-on-surface-variant opacity-50">
                    No se encontraron productos.
                  </td>
                </tr>
              ) : filtered.map(p => {
                const pct = p.maxStock > 0 ? p.stock / p.maxStock : 0;
                const isLow = p.isBulk ? Number(p.currentKgStock) <= 2 : p.stock <= 2;
                return (
                  <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-md py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/30 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>{p.icon}</span>
                        </div>
                        <span className="font-bold text-on-surface">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-md py-md">
                      {p.isBulk
                        ? <span className="px-sm py-xs bg-tertiary/10 text-tertiary text-caption font-bold rounded-full">Por Peso</span>
                        : <span className="px-sm py-xs bg-primary/10 text-primary text-caption font-bold rounded-full">Normal</span>
                      }
                    </td>
                    <td className="px-md py-md"><span className="font-mono text-label-md text-on-surface-variant">{p.sku}</span></td>
                    <td className="px-md py-md">
                      <span className="px-sm py-xs bg-secondary-container/20 text-secondary text-caption font-bold rounded-full">{p.category}</span>
                    </td>
                    <td className="px-md py-md text-center">
                      <div className="flex flex-col items-center gap-1">
                        {p.isBulk ? (
                          <div className="text-center">
                            <span className={`text-body-md ${isLow ? 'text-error font-bold' : ''}`}>
                              {Number(p.currentKgStock).toFixed(2)} kg
                            </span>
                            <span className="text-caption text-on-surface-variant block">
                              de {Number(p.initialKgStock ?? 0).toFixed(2)} kg
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className={`text-body-md ${isLow ? 'text-error font-bold' : ''}`}>
                              {p.stock} unidades
                            </span>
                            {p.maxStock > 0 && (
                              <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${stockBarColor(p.stock)} transition-all`}
                                  style={{ width: `${Math.min(100, pct * 100)}%` }}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-md py-md text-right font-bold text-on-surface">
                      {p.isBulk ? `${fmt(Number(p.pricePerKg ?? 0))}/kg` : fmt(Number(p.price))}
                    </td>
                    <td className="px-md py-md text-center">
                      <div className="flex justify-center gap-sm">
                        <button
                          onClick={() => { setEditProduct(p); setErrorMsg(''); }}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-md py-md bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between">
          <span className="text-label-md text-on-surface-variant">Mostrando {filtered.length} de {productList.length} productos</span>
        </div>
      </section>

      {/* Edit Modal */}
      {editProduct && (
        <>
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-20" onClick={() => setEditProduct(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface shadow-2xl z-30 flex flex-col">
            <div className="p-md border-b border-outline-variant/20 flex items-center justify-between">
              <div>
                <h2 className="text-headline-md font-bold text-primary">Editar Producto</h2>
                <span className={`text-caption font-bold px-sm py-xs rounded-full ${editProduct.isBulk ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary'}`}>
                  {editProduct.isBulk ? 'Producto por Peso' : 'Producto Normal'}
                </span>
              </div>
              <button className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors" onClick={() => setEditProduct(null)}>
                close
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-md space-y-lg">

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Nombre del Producto</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>inventory_2</span>
                  <input className={inputCls + ' pl-10'} value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} />
                </div>
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Codigo (SKU / Barra)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>barcode</span>
                  <input className={inputCls + ' pl-10'} value={editProduct.sku} onChange={e => setEditProduct({ ...editProduct, sku: e.target.value })} />
                </div>
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Categoria</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>category</span>
                  <select
                    className={inputCls + ' pl-10'}
                    value={editProduct.category}
                    onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                  >
                    {categories.filter(c => c !== 'Todas').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Selector de icono */}
              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Icono</label>
                <div className="grid grid-cols-5 gap-sm">
                  {ICON_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditProduct({ ...editProduct, icon: opt.value })}
                      className={`flex flex-col items-center gap-xs p-sm rounded-lg border-2 transition-all ${
                        editProduct.icon === opt.value
                          ? 'border-primary bg-primary/10'
                          : 'border-outline-variant/30 hover:border-primary/40'
                      }`}
                      title={opt.label}
                    >
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>{opt.value}</span>
                      <span className="text-[10px] text-on-surface-variant text-center leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock diferenciado por tipo */}
              {editProduct.isBulk ? (
                <div className="space-y-base bg-tertiary/5 p-md rounded-xl border border-tertiary/20">
                  <h3 className="text-label-md font-bold text-tertiary uppercase tracking-wider">Stock de Bolsa</h3>
                  <div className="space-y-base">
                    <label className="block text-label-md font-bold text-primary">Kilos disponibles actualmente</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>scale</span>
                      <input className={inputCls + ' pl-10'} type="number" min={0} step={0.001}
                        value={editProduct.currentKgStock ?? ''}
                        onChange={e => setEditProduct({ ...editProduct, currentKgStock: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <p className="text-caption text-on-surface-variant">
                      Stock original de la bolsa: {Number(editProduct.initialKgStock ?? 0).toFixed(2)} kg
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-gutter">
                  <div className="space-y-base">
                    <label className="block text-label-md font-bold text-primary">Stock Actual</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>inventory</span>
                      <input className={inputCls + ' pl-10'} type="number" min={0}
                        value={editProduct.stock || ''}
                        onChange={e => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="space-y-base">
                    <label className="block text-label-md font-bold text-primary">Stock Maximo</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>warehouse</span>
                      <input className={inputCls + ' pl-10'} type="number" min={1}
                        value={editProduct.maxStock || ''}
                        onChange={e => setEditProduct({ ...editProduct, maxStock: parseInt(e.target.value) || 1 })} />
                    </div>
                  </div>
                </div>
              )}

              {/* Precio diferenciado por tipo */}
              {editProduct.isBulk ? (
                <div className="space-y-base">
                  <label className="block text-label-md font-bold text-primary">Precio por Kilo</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>attach_money</span>
                    <input className={inputCls + ' pl-10'} type="number" min={0} step={0.01}
                      value={editProduct.pricePerKg ?? ''}
                      onChange={e => setEditProduct({ ...editProduct, pricePerKg: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              ) : (
                <div className="space-y-base">
                  <label className="block text-label-md font-bold text-primary">Precio de Venta</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>attach_money</span>
                    <input className={inputCls + ' pl-10'} type="number" min={0} step={0.01}
                      value={editProduct.price || ''}
                      onChange={e => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-error-container/30 border border-error/20 rounded-lg p-sm text-error text-caption font-bold">
                  {errorMsg}
                </div>
              )}
            </div>
            <div className="p-md bg-surface-container-low border-t border-outline-variant/20 flex gap-sm">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 bg-primary text-white py-sm rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
              >
                <span className="material-symbols-outlined">save</span>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                onClick={() => setEditProduct(null)}
                className="flex-1 border border-outline-variant text-on-surface-variant py-sm rounded-lg font-bold hover:bg-surface active:scale-95 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
