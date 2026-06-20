import { useState, useRef } from 'react';

type ProductTab = 'normal' | 'peso';

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
}

export default function CargarProducto() {
  const [tab, setTab] = useState<ProductTab>('normal');

  const [normalForm, setNormalForm] = useState<NormalForm>({
    name: '', sku: '', category: '', purchasePrice: '', profitPercent: '', initialStock: '',
  });

  const [pesoForm, setPesoForm] = useState<PesoForm>({
    name: '', sku: '', category: '', bolsaPrice: '', costPerKg: '', profitPerKgPercent: '',
  });

  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Normal form derived values
  const cost = parseFloat(normalForm.purchasePrice) || 0;
  const pct = parseFloat(normalForm.profitPercent) || 0;
  const salePrice = cost > 0 && pct > 0 ? cost * (1 + pct / 100) : null;

  // Peso form derived values
  const costKg = parseFloat(pesoForm.costPerKg) || 0;
  const profitKgPct = parseFloat(pesoForm.profitPerKgPercent) || 0;
  const salePriceKg = costKg > 0 && profitKgPct > 0 ? costKg * (1 + profitKgPct / 100) : null;

  const changeNormal = (field: keyof NormalForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setNormalForm(prev => ({ ...prev, [field]: e.target.value }));

  const changePeso = (field: keyof PesoForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setPesoForm(prev => ({ ...prev, [field]: e.target.value }));

  const showSuccess = () => {
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 3000);
  };

  const handleNormalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess();
    setNormalForm({ name: '', sku: '', category: '', purchasePrice: '', profitPercent: '', initialStock: '' });
  };

  const handlePesoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess();
    setPesoForm({ name: '', sku: '', category: '', bolsaPrice: '', costPerKg: '', profitPerKgPercent: '' });
  };

  const handleDiscard = () => {
    if (confirm('¿Está seguro de descartar los cambios?')) {
      if (tab === 'normal') setNormalForm({ name: '', sku: '', category: '', purchasePrice: '', profitPercent: '', initialStock: '' });
      else setPesoForm({ name: '', sku: '', category: '', bolsaPrice: '', costPerKg: '', profitPerKgPercent: '' });
    }
  };

  const inputCls = 'w-full bg-background border border-secondary/20 rounded-lg p-base text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-tertiary-fixed/10 transition-all';

  const categorySelect = (value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void) => (
    <select className={inputCls + ' appearance-none'} value={value} onChange={onChange}>
      <option value="" disabled>Seleccione una categoría</option>
      <option value="alimento">Alimentos y Nutrición</option>
      <option value="farmacia">Farmacia Veterinaria</option>
      <option value="accesorios">Accesorios y Paseo</option>
      <option value="higiene">Higiene y Estética</option>
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
      </div>

      <div className="bg-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/5 rounded-full -mr-32 -mt-32 pointer-events-none" />

        {/* ── NORMAL PRODUCT FORM ── */}
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
              <button type="submit" className="px-lg py-sm rounded-lg bg-primary-container text-white font-bold text-body-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-base">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                Guardar Producto
              </button>
            </div>
          </form>
        )}

        {/* ── BULK / WEIGHT PRODUCT FORM ── */}
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
                {categorySelect(pesoForm.category, changePeso('category'))}
              </div>

              <div className="col-span-1 md:col-span-2 pt-base">
                <div className="border-l-4 border-tertiary pl-base mb-base">
                  <h3 className="text-label-md font-bold text-tertiary uppercase tracking-wider">Gestión de Precios por Peso</h3>
                </div>
              </div>

              {/* Precio de Bolsa */}
              <div className="space-y-base bg-surface-container/30 p-base rounded-lg border border-outline-variant/10">
                <label className="block text-label-md font-bold text-on-surface-variant">Precio de Bolsa</label>
                <p className="text-caption text-on-surface-variant">Precio de compra de la bolsa completa.</p>
                <div className="relative">
                  <span className="absolute left-base top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                  <input className={inputCls + ' pl-8'} placeholder="0.00" required step="0.01" type="number" min="0" value={pesoForm.bolsaPrice} onChange={changePeso('bolsaPrice')} />
                </div>
              </div>

              {/* Costo por Kilo */}
              <div className="space-y-base bg-surface-container/30 p-base rounded-lg border border-outline-variant/10">
                <label className="block text-label-md font-bold text-on-surface-variant">Costo por Kilo</label>
                <p className="text-caption text-on-surface-variant">Costo calculado por kilogramo.</p>
                <div className="relative">
                  <span className="absolute left-base top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                  <input className={inputCls + ' pl-8'} placeholder="0.00" required step="0.01" type="number" min="0" value={pesoForm.costPerKg} onChange={changePeso('costPerKg')} />
                </div>
              </div>

              {/* Ganancia por Kilo */}
              <div className="col-span-1 md:col-span-2 space-y-base bg-secondary-container/10 p-base rounded-lg border border-secondary/10">
                <label className="block text-label-md font-bold text-primary">Ganancia por Kilo (%)</label>
                <div className="flex gap-sm items-stretch">
                  <div className="relative flex-grow">
                    <input
                      className={inputCls + ' pr-8 font-bold'}
                      placeholder="0"
                      step="0.5"
                      type="number"
                      min="0"
                      value={pesoForm.profitPerKgPercent}
                      onChange={changePeso('profitPerKgPercent')}
                    />
                    <span className="absolute right-base top-1/2 -translate-y-1/2 text-primary font-bold">%</span>
                  </div>
                  <div className={`flex-grow flex items-center justify-between bg-background border rounded-lg px-base transition-all ${salePriceKg ? 'border-primary/40 bg-secondary-container/20' : 'border-secondary/20 opacity-50'}`}>
                    <span className="text-caption text-on-surface-variant font-bold">Precio Venta / kg</span>
                    <span className="text-body-md font-bold text-primary">
                      {salePriceKg ? `$${salePriceKg.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </span>
                  </div>
                </div>
                {salePriceKg && costKg > 0 && (
                  <p className="text-caption text-secondary font-bold mt-xs">
                    Ganancia: ${(salePriceKg - costKg).toLocaleString('es-AR', { minimumFractionDigits: 2 })} por kg sobre costo de ${costKg.toLocaleString('es-AR', { minimumFractionDigits: 2 })}/kg
                  </p>
                )}
              </div>

              {salePriceKg && (
                <div className="col-span-1 md:col-span-2">
                  <div className="w-full bg-primary/5 border border-primary/20 rounded-lg p-base">
                    <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Resumen de Rentabilidad por Kilo</p>
                    <div className="flex gap-xl">
                      <div className="flex justify-between text-sm gap-lg"><span className="text-on-surface-variant">Costo/kg</span><span className="font-bold">${costKg.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm gap-lg"><span className="text-on-surface-variant">Ganancia ({profitKgPct}%)</span><span className="font-bold text-secondary">+${(salePriceKg - costKg).toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm gap-lg"><span className="font-bold text-primary">Venta/kg</span><span className="font-bold text-primary">${salePriceKg.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-md mt-lg pt-lg border-t border-outline-variant/20">
              <button type="button" onClick={handleDiscard} className="px-lg py-sm rounded-lg border border-secondary text-secondary font-bold text-body-md hover:bg-secondary/5 transition-all active:scale-95">Descartar</button>
              <button type="submit" className="px-lg py-sm rounded-lg bg-primary-container text-white font-bold text-body-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-base">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                Guardar Producto
              </button>
            </div>
          </form>
        )}
      </div>

      {showToast && (
        <div className="fixed bottom-lg right-lg bg-primary text-white px-lg py-base rounded-xl shadow-2xl flex items-center gap-base z-50">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-label-md font-bold">Producto guardado con éxito</span>
        </div>
      )}
    </section>
  );
}
