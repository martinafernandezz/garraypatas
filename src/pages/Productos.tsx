import { useState } from 'react';
import { Page } from '../types';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock: number;
  maxStock: number;
  price: number;
  icon: string;
}

const products: Product[] = [
  { id: 1, name: 'Pro Plan Gato Adulto', sku: '00020349', category: 'Alimentos', stock: 45, maxStock: 60, price: 1200, icon: 'nutrition' },
  { id: 2, name: 'Pipetas Antipulgas (4 dosis)', sku: '00010225', category: 'Farmacia', stock: 5, maxStock: 40, price: 5000, icon: 'medical_services' },
  { id: 3, name: 'Shampoo Avena 500ml', sku: '07087115', category: 'Higiene', stock: 12, maxStock: 30, price: 4200, icon: 'soap' },
  { id: 4, name: 'Juguete Mordedor KONG L', sku: '01143445', category: 'Juguetes', stock: 28, maxStock: 45, price: 6700, icon: 'sports_baseball' },
  { id: 5, name: 'Royal Canin Mini Adult 3kg', sku: '00038291', category: 'Alimentos', stock: 18, maxStock: 50, price: 12500, icon: 'nutrition' },
  { id: 6, name: 'NexGard Tabletas Antipulgas', sku: '00029847', category: 'Farmacia', stock: 3, maxStock: 20, price: 11200, icon: 'medication' },
];

const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

const stockBarColor = (stock: number, max: number) => {
  const pct = stock / max;
  if (pct <= 0.2) return 'bg-error';
  if (pct <= 0.4) return 'bg-tertiary';
  return 'bg-primary';
};

interface ProductosProps {
  onNavigate: (page: Page) => void;
}

export default function Productos({ onNavigate }: ProductosProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [stockFilter, setStockFilter] = useState('Todos');
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [productList, setProductList] = useState<Product[]>(products);

  const filtered = productList.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search);
    const matchCat = categoryFilter === 'Todas' || p.category === categoryFilter;
    const matchStock = stockFilter === 'Todos'
      || (stockFilter === 'Bajo' && p.stock / p.maxStock <= 0.3)
      || (stockFilter === 'Normal' && p.stock / p.maxStock > 0.3);
    return matchSearch && matchCat && matchStock;
  });

  const handleSaveEdit = () => {
    if (!editProduct) return;
    setProductList(prev => prev.map(p => p.id === editProduct.id ? editProduct : p));
    setEditProduct(null);
  };

  const inputCls = 'w-full bg-background border border-secondary/20 rounded-lg p-base text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

  return (
    <div className="p-md flex flex-col gap-lg">
      {/* Filters & Actions */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-md">
        <div className="flex flex-wrap gap-md w-full md:w-auto">
          <div className="flex flex-col gap-xs">
            <label className="text-caption font-bold text-on-surface-variant uppercase tracking-wider">Categoría</label>
            <select
              className="bg-surface-container-low border border-outline-variant/50 rounded-lg px-md py-sm text-label-md text-on-surface focus:ring-1 focus:ring-primary outline-none min-w-[180px]"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option>Todas</option>
              <option>Alimentos</option>
              <option>Higiene</option>
              <option>Farmacia</option>
              <option>Juguetes</option>
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
                placeholder="Nombre o código..."
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

      {/* Table */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/20">
                <th className="px-md py-base text-label-md">Nombre del Producto</th>
                <th className="px-md py-base text-label-md">Código</th>
                <th className="px-md py-base text-label-md">Categoría</th>
                <th className="px-md py-base text-label-md text-center">Stock Actual</th>
                <th className="px-md py-base text-label-md text-right">Precio</th>
                <th className="px-md py-base text-label-md text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filtered.map(p => {
                const pct = p.stock / p.maxStock;
                const isLow = pct <= 0.2;
                return (
                  <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-md py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/30 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>{p.icon}</span>
                        </div>
                        <span className="text-body-md font-semibold">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-md py-md text-on-surface-variant text-label-md">{p.sku}</td>
                    <td className="px-md py-md">
                      <span className="px-sm py-xs bg-secondary-container/20 text-secondary text-caption font-bold rounded-full">{p.category}</span>
                    </td>
                    <td className="px-md py-md text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-body-md ${isLow ? 'text-error font-bold' : ''}`}>{p.stock} unidades</span>
                        <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className={`h-full ${stockBarColor(p.stock, p.maxStock)} transition-all`}
                            style={{ width: `${Math.min(100, (p.stock / p.maxStock) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-md py-md text-right font-bold text-on-surface">{fmt(p.price)}</td>
                    <td className="px-md py-md text-center">
                      <div className="flex justify-center gap-sm">
                        <button
                          onClick={() => setEditProduct(p)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                        </button>
                        <button className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all">
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
          <div className="flex gap-xs">
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded font-bold">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center border border-outline-variant rounded hover:bg-surface transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Edit Product Modal */}
      {editProduct && (
        <>
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-20" onClick={() => setEditProduct(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface shadow-2xl z-30 flex flex-col">
            <div className="p-md border-b border-outline-variant/20 flex items-center justify-between">
              <h2 className="text-headline-md font-bold text-primary">Editar Producto</h2>
              <button
                className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors"
                onClick={() => setEditProduct(null)}
              >
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
                <label className="block text-label-md font-bold text-primary">Código (SKU / Barra)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>barcode</span>
                  <input className={inputCls + ' pl-10'} value={editProduct.sku} onChange={e => setEditProduct({ ...editProduct, sku: e.target.value })} />
                </div>
              </div>
              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Categoría</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>category</span>
                  <select
                    className={inputCls + ' pl-10'}
                    value={editProduct.category}
                    onChange={e => setEditProduct({ ...editProduct, category: e.target.value })}
                  >
                    <option>Alimentos</option>
                    <option>Higiene</option>
                    <option>Farmacia</option>
                    <option>Juguetes</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-gutter">
                <div className="space-y-base">
                  <label className="block text-label-md font-bold text-primary">Stock Actual</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>inventory</span>
                    <input className={inputCls + ' pl-10'} type="number" min={0} value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-base">
                  <label className="block text-label-md font-bold text-primary">Stock Máximo</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>warehouse</span>
                    <input className={inputCls + ' pl-10'} type="number" min={1} value={editProduct.maxStock} onChange={e => setEditProduct({ ...editProduct, maxStock: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
              </div>
              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Precio de Venta</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>attach_money</span>
                  <input className={inputCls + ' pl-10'} type="number" min={0} step={0.01} value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
            <div className="p-md bg-surface-container-low border-t border-outline-variant/20 flex gap-sm">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-primary text-white py-sm rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">save</span>
                Guardar Cambios
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
