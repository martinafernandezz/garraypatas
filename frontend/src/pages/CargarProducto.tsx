import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiIntegrado } from '../services/apiIntegrado';

type ProductTab = 'normal' | 'peso' | 'talle';

interface NormalForm {
  name: string;
  sku: string;
  category: string;
  purchasePrice: string;
  profitPercent: string;
  initialStock: string;
}

interface PesoForm {
  name: string;
  sku: string;
  category: string;
  bolsaPrice: string;
  costPerKg: string;
  profitPerKgPercent: string;
  kgPerBolsa: string;
}

interface SizeRow {
  id: string;
  talle: string;
  stock: string;
  costo: string;
  gananciaPercent: string;
  price: string;
}

interface TalleForm {
  name: string;
  sku: string;
  category: string;
  purchasePrice: string;
  profitPercent: string;
  sizes: SizeRow[];
}

const EMPTY_NORMAL: NormalForm = { name: '', sku: '', category: '', purchasePrice: '', profitPercent: '', initialStock: '' };
const EMPTY_PESO: PesoForm = { name: '', sku: '', category: '', bolsaPrice: '', costPerKg: '', profitPerKgPercent: '', kgPerBolsa: '' };

const newSizeRow = (): SizeRow => ({ id: crypto.randomUUID(), talle: '', stock: '', costo: '', gananciaPercent: '', price: '' });
const createEmptyTalle = (): TalleForm => ({ name: '', sku: '', category: '', purchasePrice: '', profitPercent: '', sizes: [newSizeRow()] });

// Calcula el precio sugerido de una fila: usa el costo/% propio de la fila si está cargado,
// si no, cae al costo/% general del producto.
function suggestedPrice(row: SizeRow, generalCost: string, generalPct: string): number | null {
  const costo = parseFloat(row.costo) || parseFloat(generalCost) || 0;
  const pctRaw = row.gananciaPercent !== '' ? row.gananciaPercent : generalPct;
  const pct = parseFloat(pctRaw) || 0;
  if (costo > 0 && pct > 0) return costo * (1 + pct / 100);
  return null;
}

export default function CargarProducto() {
  const { token } = useAuth();
  const [tab, setTab] = useState<ProductTab>('normal');
  const [categories, setCategories] = useState<string[]>([]);
  const [normalForm, setNormalForm] = useState<NormalForm>(EMPTY_NORMAL);
  const [pesoForm, setPesoForm] = useState<PesoForm>(EMPTY_PESO);
  const [talleForm, setTalleForm] = useState<TalleForm>(createEmptyTalle());
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('Producto guardado con éxito');
  const [toastError, setToastError] = useState(false);
  const [loading, setLoading] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Normal form derived values
  const cost = parseFloat(normalForm.purchasePrice) || 0;
  const pct = parseFloat(normalForm.profitPercent) || 0;
  const salePrice = cost > 0 && pct > 0 ? cost * (1 + pct / 100) : null;

  // Peso form derived values
  const costKg = parseFloat(pesoForm.costPerKg) || 0;
  const profitKgPct = parseFloat(pesoForm.profitPerKgPercent) || 0;
  const salePriceKg = costKg > 0 && profitKgPct > 0 ? costKg * (1 + profitKgPct / 100) : null;

  // Talle form derived values
  const totalStockTalle = talleForm.sizes.reduce((acc, s) => acc + (parseInt(s.stock) || 0), 0);

  useEffect(() => {
    apiIntegrado.getCategories(token).then((data: any[]) => {
      if (data && data.length > 0) {
        setCategories(data.map((c: any) => c.name));
      }
    });
  }, [token]);

  const changeNormal = (field: keyof NormalForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setNormalForm(prev => ({ ...prev, [field]: e.target.value }));

  const changePeso = (field: keyof PesoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setPesoForm(prev => ({ ...prev, [field]: e.target.value }));

  const changeTalle = (field: 'name' | 'sku' | 'category' | 'purchasePrice' | 'profitPercent') =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setTalleForm(prev => ({ ...prev, [field]: e.target.value }));

  const addSizeRow = () => setTalleForm(prev => ({ ...prev, sizes: [...prev.sizes, newSizeRow()] }));
  const removeSizeRow = (id: string) => setTalleForm(prev => ({ ...prev, sizes: prev.sizes.filter(s => s.id !== id) }));
  const updateSizeRow = (id: string, field: 'talle' | 'stock' | 'costo' | 'gananciaPercent' | 'price', value: string) =>
    setTalleForm(prev => ({ ...prev, sizes: prev.sizes.map(s => s.id === id ? { ...s, [field]: value } : s) }));

  const applySuggestion = (id: string, value: number) =>
    setTalleForm(prev => ({ ...prev, sizes: prev.sizes.map(s => s.id === id ? { ...s, price: value.toFixed(2) } : s) }));

  const showNotification = (msg: string, error = false) => {
    setToastMsg(msg);
    setToastError(error);
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 3000);
  };

  const handleNormalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await apiIntegrado.createProduct(token, {
        name: normalForm.name,
        sku: normalForm.sku,
        category: normalForm.category,
        price: salePrice ?? cost,
        stock: parseInt(normalForm.initialStock) || 0,
        maxStock: 50,
        icon: 'nutrition',
        is_bulk: false,
      });

      if (result) {
        showNotification('Producto guardado con éxito');
        setNormalForm(EMPTY_NORMAL);
      } else {
        showNotification('Error al guardar el producto', true);
      }
    } catch {
      showNotification('Error al guardar el producto', true);
    } finally {
      setLoading(false);
    }
  };

  const handlePesoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await apiIntegrado.createProduct(token, {
        name: pesoForm.name,
        sku: pesoForm.sku,
        category: pesoForm.category,
        price: 0,
        stock: 0,
        maxStock: 0,
        icon: 'nutrition',
        isBulk: true,
        pricePerKg: salePriceKg ?? costKg,
        initialKgStock: parseFloat(pesoForm.kgPerBolsa) || 0,
      });

      if (result) {
        showNotification('Producto por peso guardado con éxito');
        setPesoForm(EMPTY_PESO);
      } else {
        showNotification('Error al guardar el producto', true);
      }
    } catch {
      showNotification('Error al guardar el producto', true);
    } finally {
      setLoading(false);
    }
  };

  const handleTalleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validSizes = talleForm.sizes.filter(s => s.talle.trim() !== '');
    if (validSizes.length === 0) {
      showNotification('Agregá al menos un talle con su stock', true);
      return;
    }
    setLoading(true);
    try {
      const sizesPayload = validSizes.map(s => {
        const effectiveCost = s.costo !== '' ? parseFloat(s.costo) : (talleForm.purchasePrice !== '' ? parseFloat(talleForm.purchasePrice) : null);
        const effectivePct = s.gananciaPercent !== '' ? parseFloat(s.gananciaPercent) : (talleForm.profitPercent !== '' ? parseFloat(talleForm.profitPercent) : null);
        const suggestion = suggestedPrice(s, talleForm.purchasePrice, talleForm.profitPercent);
        const finalPrice = s.price !== '' ? parseFloat(s.price) : (suggestion ?? 0);
        return {
          talle: s.talle.trim(),
          stock: parseInt(s.stock) || 0,
          price: finalPrice,
          costPrice: effectiveCost,
          profitPercent: effectivePct,
        };
      });

      const basePrice = Math.min(...sizesPayload.map(s => s.price).filter(p => p > 0));

      const result = await apiIntegrado.createProduct(token, {
        name: talleForm.name,
        sku: talleForm.sku,
        category: talleForm.category,
        price: isFinite(basePrice) ? basePrice : 0,
        stock: 0,
        maxStock: 50,
        icon: 'inventory_2',
        hasSizes: true,
        sizes: sizesPayload,
      });

      if (result) {
        showNotification('Producto con talles guardado con éxito');
        setTalleForm(createEmptyTalle());
      } else {
        showNotification('Error al guardar el producto', true);
      }
    } catch {
      showNotification('Error al guardar el producto', true);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (confirm('¿Está seguro de descartar los cambios?')) {
      if (tab === 'normal') setNormalForm(EMPTY_NORMAL);
      else if (tab === 'peso') setPesoForm(EMPTY_PESO);
      else setTalleForm(createEmptyTalle());
    }
  };

  const inputCls = 'w-full bg-background border border-secondary/20 rounded-lg p-base text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-tertiary-fixed/10 transition-all';
  const inputSmCls = 'w-full bg-background border border-secondary/20 rounded-lg p-xs text-caption focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

  const categorySelect = (value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void) => (
    <select className={inputCls + ' appearance-none'} value={value} onChange={onChange}>
      <option value="" disabled>Seleccione una categoría</option>
      {categories.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );

  return (
    <section className="p-xl max-w-5xl mx-auto">
      <div className="mb-lg">
        <h2 className="text-headline-lg font-bold text-primary mb-base">Detalles del Nuevo Producto</h2>
        <p className="text-body-lg text-on-surface-variant">Complete la información técnica y comercial para dar de alta un nuevo artículo en el inventario.</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-surface-container rounded-xl p-1 mb-lg w-fit border border-outline-variant/20">
        <button
          onClick={() => setTab('normal')}
          className={`px-lg py-sm rounded-lg text-label-md font-bold transition-all ${tab === 'normal' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="flex items-center gap-xs">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>inventory_2</span>
            Producto Normal
          </span>
        </button>
        <button
          onClick={() => setTab('peso')}
          className={`px-lg py-sm rounded-lg text-label-md font-bold transition-all ${tab === 'peso' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="flex items-center gap-xs">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>scale</span>
            Producto por Peso
          </span>
        </button>
        <button
          onClick={() => setTab('talle')}
          className={`px-lg py-sm rounded-lg text-label-md font-bold transition-all ${tab === 'talle' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="flex items-center gap-xs">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>straighten</span>
            Producto por Talle
          </span>
        </button>
      </div>

      <div className="bg-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/5 rounded-full -mr-32 -mt-32 pointer-events-none" />

        {/* NORMAL PRODUCT FORM */}
        {tab === 'normal' && (
          <form className="relative z-10 space-y-md" onSubmit={handleNormalSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">

              <div className="space-y-base col-span-1 md:col-span-2">
                <label className="block text-label-md font-bold text-primary">Nombre del Producto</label>
                <input className={inputCls} placeholder="Ej. Alimento Premium Salmón 15kg" required type="text" value={normalForm.name} onChange={changeNormal('name')} />
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Código</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>barcode</span>
                  <input className={inputCls + ' pl-10'} placeholder="77900000000" required type="text" value={normalForm.sku} onChange={changeNormal('sku')} />
                </div>
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Categoría</label>
                {categorySelect(normalForm.category, changeNormal('category'))}
              </div>

              <div className="col-span-1 md:col-span-2 pt-base">
                <div className="border-l-4 border-primary pl-base mb-base">
                  <h3 className="text-label-md font-bold text-primary uppercase tracking-wider">Gestión de Precios</h3>
                </div>
              </div>

              <div className="space-y-base bg-surface-container/30 p-base rounded-lg border border-outline-variant/10">
                <label className="block text-label-md font-bold text-on-surface-variant">Precio de Compra (Costo)</label>
                <div className="relative">
                  <span className="absolute left-base top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                  <input className={inputCls + ' pl-8'} placeholder="0.00" required step="0.01" type="number" min="0" value={normalForm.purchasePrice} onChange={changeNormal('purchasePrice')} />
                </div>
              </div>

              <div className="space-y-base bg-secondary-container/10 p-base rounded-lg border border-secondary/10">
                <label className="block text-label-md font-bold text-primary">Porcentaje de Ganancia</label>
                <div className="flex gap-sm items-stretch">
                  <div className="relative flex-grow">
                    <input className={inputCls + ' pr-8 font-bold'} placeholder="0" step="0.5" type="number" min="0" value={normalForm.profitPercent} onChange={changeNormal('profitPercent')} />
                    <span className="absolute right-base top-1/2 -translate-y-1/2 text-primary font-bold">%</span>
                  </div>
                  <div className={`flex-grow flex items-center justify-between bg-background border rounded-lg px-base transition-all ${salePrice ? 'border-primary/40 bg-secondary-container/20' : 'border-secondary/20 opacity-50'}`}>
                    <span className="text-caption text-on-surface-variant font-bold">Precio Final</span>
                    <span className="text-body-md font-bold text-primary">
                      {salePrice ? `$${salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </span>
                  </div>
                </div>
                {salePrice && cost > 0 && (
                  <p className="text-caption text-secondary font-bold mt-xs">
                    Ganancia: ${(salePrice - cost).toLocaleString('es-AR', { minimumFractionDigits: 2 })} sobre costo de ${cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 pt-base">
                <div className="border-l-4 border-primary pl-base mb-base">
                  <h3 className="text-label-md font-bold text-primary uppercase tracking-wider">Logística y Stock</h3>
                </div>
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Stock Inicial</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>inventory</span>
                  <input className={inputCls + ' pl-10'} placeholder="0" required type="number" min="0" value={normalForm.initialStock} onChange={changeNormal('initialStock')} />
                </div>
              </div>

              {salePrice && (
                <div className="flex items-end">
                  <div className="w-full bg-primary/5 border border-primary/20 rounded-lg p-base">
                    <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Resumen de Rentabilidad</p>
                    <div className="flex justify-between text-sm"><span className="text-on-surface-variant">Costo</span><span className="font-bold">${cost.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm mt-xs"><span className="text-on-surface-variant">Ganancia ({pct}%)</span><span className="font-bold text-secondary">+${(salePrice - cost).toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm mt-xs pt-xs border-t border-primary/10"><span className="font-bold text-primary">Precio de Venta</span><span className="font-bold text-primary">${salePrice.toFixed(2)}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-md mt-lg pt-lg border-t border-outline-variant/20">
              <button type="button" onClick={handleDiscard} className="px-lg py-sm rounded-lg border border-secondary text-secondary font-bold text-body-md hover:bg-secondary/5 transition-all active:scale-95">Descartar</button>
              <button type="submit" disabled={loading} className="px-lg py-sm rounded-lg bg-primary-container text-white font-bold text-body-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-base disabled:opacity-60">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                {loading ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        )}

        {/* BULK / WEIGHT PRODUCT FORM */}
        {tab === 'peso' && (
          <form className="relative z-10 space-y-md" onSubmit={handlePesoSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">

              <div className="space-y-base col-span-1 md:col-span-2">
                <label className="block text-label-md font-bold text-primary">Nombre del Producto</label>
                <input className={inputCls} placeholder="Ej. Royal Canin Adultos Granel" required type="text" value={pesoForm.name} onChange={changePeso('name')} />
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Código</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>barcode</span>
                  <input className={inputCls + ' pl-10'} placeholder="77900000000" required type="text" value={pesoForm.sku} onChange={changePeso('sku')} />
                </div>
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Categoría</label>
                <select className={inputCls + ' appearance-none'} value={pesoForm.category} onChange={changePeso('category')}>
  <option value="" disabled>Seleccione una categoría</option>
  <option value="Alimentos Perros">Alimentos Perros</option>
  <option value="Alimentos Gatos">Alimentos Gatos</option>
</select>
              </div>

              <div className="col-span-1 md:col-span-2 pt-base">
                <div className="border-l-4 border-tertiary pl-base mb-base">
                  <h3 className="text-label-md font-bold text-tertiary uppercase tracking-wider">Gestión de Precios por Peso</h3>
                </div>
              </div>

              <div className="space-y-base bg-surface-container/30 p-base rounded-lg border border-outline-variant/10">
                <label className="block text-label-md font-bold text-on-surface-variant">Precio de Bolsa</label>
                <p className="text-caption text-on-surface-variant">Precio de compra de la bolsa completa.</p>
                <div className="relative">
                  <span className="absolute left-base top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                  <input className={inputCls + ' pl-8'} placeholder="0.00" required step="0.01" type="number" min="0" value={pesoForm.bolsaPrice} onChange={changePeso('bolsaPrice')} />
                </div>
              </div>

              <div className="space-y-base bg-surface-container/30 p-base rounded-lg border border-outline-variant/10">
  <label className="block text-label-md font-bold text-on-surface-variant">Kilos por Bolsa</label>
  <p className="text-caption text-on-surface-variant">Cantidad de kilos que trae la bolsa.</p>
  <div className="relative">
    <span className="absolute left-base top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">kg</span>
    <input className={inputCls + ' pl-8'} placeholder="0.00" required step="0.01" type="number" min="0" value={pesoForm.kgPerBolsa} onChange={changePeso('kgPerBolsa')} />
  </div>
</div>

              <div className="space-y-base bg-surface-container/30 p-base rounded-lg border border-outline-variant/10">
                <label className="block text-label-md font-bold text-on-surface-variant">Costo por Kilo</label>
                <p className="text-caption text-on-surface-variant">Costo calculado por kilogramo.</p>
                <div className="relative">
                  <span className="absolute left-base top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                  <input className={inputCls + ' pl-8'} placeholder="0.00" required step="0.01" type="number" min="0" value={pesoForm.costPerKg} onChange={changePeso('costPerKg')} />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-base bg-secondary-container/10 p-base rounded-lg border border-secondary/10">
                <label className="block text-label-md font-bold text-primary">Ganancia por Kilo (%)</label>
                <div className="flex gap-sm items-stretch">
                  <div className="relative flex-grow">
                    <input className={inputCls + ' pr-8 font-bold'} placeholder="0" step="0.5" type="number" min="0" value={pesoForm.profitPerKgPercent} onChange={changePeso('profitPerKgPercent')} />
                    <span className="absolute right-base top-1/2 -translate-y-1/2 text-primary font-bold">%</span>
                  </div>
                  <div className={`flex-grow flex items-center justify-between bg-background border rounded-lg px-base transition-all ${salePriceKg ? 'border-primary/40 bg-secondary-container/20' : 'border-secondary/20 opacity-50'}`}>
                    <span className="text-caption text-on-surface-variant font-bold">Precio Venta / kg</span>
                    <span className="text-body-md font-bold text-primary">
                      {salePriceKg ? `$${salePriceKg.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-md mt-lg pt-lg border-t border-outline-variant/20">
              <button type="button" onClick={handleDiscard} className="px-lg py-sm rounded-lg border border-secondary text-secondary font-bold text-body-md hover:bg-secondary/5 transition-all active:scale-95">Descartar</button>
              <button type="submit" disabled={loading} className="px-lg py-sm rounded-lg bg-primary-container text-white font-bold text-body-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-base disabled:opacity-60">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                {loading ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        )}

        {/* SIZE / TALLE PRODUCT FORM */}
        {tab === 'talle' && (
          <form className="relative z-10 space-y-md" onSubmit={handleTalleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">

              <div className="space-y-base col-span-1 md:col-span-2">
                <label className="block text-label-md font-bold text-primary">Nombre del Producto</label>
                <input className={inputCls} placeholder="Ej. Campera Impermeable para Perro" required type="text" value={talleForm.name} onChange={changeTalle('name')} />
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Código</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>barcode</span>
                  <input className={inputCls + ' pl-10'} placeholder="77900000000" required type="text" value={talleForm.sku} onChange={changeTalle('sku')} />
                </div>
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Categoría</label>
                {categorySelect(talleForm.category, changeTalle('category'))}
              </div>

              <div className="col-span-1 md:col-span-2 pt-base">
                <div className="border-l-4 border-primary pl-base mb-base">
                  <h3 className="text-label-md font-bold text-primary uppercase tracking-wider">Costo y Ganancia General (opcional)</h3>
                </div>
                <p className="text-caption text-on-surface-variant mb-base">
                  Usalo si el precio <strong>no varía</strong> entre talles. Sirve como respaldo para calcular el precio sugerido de los talles que no tengan su propio costo/ganancia cargado.
                </p>
              </div>

              <div className="space-y-base bg-surface-container/30 p-base rounded-lg border border-outline-variant/10">
                <label className="block text-label-md font-bold text-on-surface-variant">Costo General</label>
                <div className="relative">
                  <span className="absolute left-base top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                  <input className={inputCls + ' pl-8'} placeholder="0.00" step="0.01" type="number" min="0" value={talleForm.purchasePrice} onChange={changeTalle('purchasePrice')} />
                </div>
              </div>

              <div className="space-y-base bg-secondary-container/10 p-base rounded-lg border border-secondary/10">
                <label className="block text-label-md font-bold text-primary">Ganancia General (%)</label>
                <div className="relative">
                  <input className={inputCls + ' pr-8 font-bold'} placeholder="0" step="0.5" type="number" min="0" value={talleForm.profitPercent} onChange={changeTalle('profitPercent')} />
                  <span className="absolute right-base top-1/2 -translate-y-1/2 text-primary font-bold">%</span>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 pt-base">
                <div className="border-l-4 border-primary pl-base mb-base flex items-center justify-between">
                  <h3 className="text-label-md font-bold text-primary uppercase tracking-wider">Talles</h3>
                  {totalStockTalle > 0 && (
                    <span className="text-caption text-on-surface-variant font-bold">Stock total: {totalStockTalle}</span>
                  )}
                </div>
                <p className="text-caption text-on-surface-variant mb-base">
                  El costo y la ganancia de cada talle son opcionales. Si un talle sale más caro o más barato que el resto, cargalos ahí. Si los dejás vacíos, se usa el costo/ganancia general de arriba.
                </p>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-sm">
                {talleForm.sizes.map(row => {
                  const suggestion = suggestedPrice(row, talleForm.purchasePrice, talleForm.profitPercent);
                  const showSuggestion = suggestion !== null && row.price !== suggestion.toFixed(2);
                  return (
                    <div key={row.id} className="bg-surface-container/30 p-sm rounded-lg border border-outline-variant/10 space-y-xs">
                      <div className="flex items-end gap-sm">
                        <div className="w-20">
                          <label className="block text-caption text-on-surface-variant mb-xs">Talle</label>
                          <input
                            className={inputCls}
                            placeholder="S, M, L..."
                            type="text"
                            value={row.talle}
                            onChange={e => updateSizeRow(row.id, 'talle', e.target.value)}
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-caption text-on-surface-variant mb-xs">Stock</label>
                          <input
                            className={inputCls}
                            placeholder="0"
                            type="number"
                            min="0"
                            value={row.stock}
                            onChange={e => updateSizeRow(row.id, 'stock', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-caption text-on-surface-variant mb-xs">Costo (opcional)</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-caption">$</span>
                            <input
                              className={inputCls + ' pl-6'}
                              placeholder="Usar general"
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.costo}
                              onChange={e => updateSizeRow(row.id, 'costo', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-caption text-on-surface-variant mb-xs">Ganancia % (opcional)</label>
                          <div className="relative">
                            <input
                              className={inputCls + ' pr-6'}
                              placeholder="Usar general"
                              type="number"
                              min="0"
                              step="0.5"
                              value={row.gananciaPercent}
                              onChange={e => updateSizeRow(row.id, 'gananciaPercent', e.target.value)}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-caption">%</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-caption text-on-surface-variant mb-xs">Precio final</label>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-caption">$</span>
                            <input
                              className={inputCls + ' pl-6 font-bold'}
                              placeholder="0.00"
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.price}
                              onChange={e => updateSizeRow(row.id, 'price', e.target.value)}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSizeRow(row.id)}
                          disabled={talleForm.sizes.length === 1}
                          className="w-9 h-9 flex-shrink-0 rounded-lg border border-error/30 text-error flex items-center justify-center hover:bg-error-container/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                        </button>
                      </div>
                      {showSuggestion && (
                        <button
                          type="button"
                          onClick={() => applySuggestion(row.id, suggestion!)}
                          className="text-caption text-secondary font-bold hover:underline"
                        >
                          Sugerido: ${suggestion!.toLocaleString('es-AR', { minimumFractionDigits: 2 })} (click para usar)
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addSizeRow}
                  className="w-full py-sm rounded-lg border-2 border-dashed border-primary/30 text-primary font-bold text-label-md flex items-center justify-center gap-xs hover:bg-primary/5 transition-all"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                  Agregar talle
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-md mt-lg pt-lg border-t border-outline-variant/20">
              <button type="button" onClick={handleDiscard} className="px-lg py-sm rounded-lg border border-secondary text-secondary font-bold text-body-md hover:bg-secondary/5 transition-all active:scale-95">Descartar</button>
              <button type="submit" disabled={loading} className="px-lg py-sm rounded-lg bg-primary-container text-white font-bold text-body-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-base disabled:opacity-60">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                {loading ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        )}
      </div>

      {showToast && (
        <div className={`fixed bottom-lg right-lg px-lg py-base rounded-xl shadow-2xl flex items-center gap-base z-50 ${toastError ? 'bg-error text-white' : 'bg-primary text-white'}`}>
          <span className="material-symbols-outlined">{toastError ? 'error' : 'check_circle'}</span>
          <span className="text-label-md font-bold">{toastMsg}</span>
        </div>
      )}
    </section>
  );
}