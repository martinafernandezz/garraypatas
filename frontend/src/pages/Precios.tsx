import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiIntegrado } from '../services/apiIntegrado';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  sku: string;
  icon: string;
  isBulk: boolean;
  pricePerKg: number;
  stock: number;
  maxStock: number;
  currentKgStock?: number;
  initialKgStock?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

export default function Precios() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'percent' | 'fixed'>('percent');
  const [adjValue, setAdjValue] = useState('');
  const [search, setSearch] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const data = await apiIntegrado.getProducts(token);
      setProducts(data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price ?? 0),
        category: p.category,
        sku: p.sku,
        icon: p.icon || 'nutrition',
        isBulk: p.isBulk === 1 || p.isBulk === true,
        pricePerKg: Number(p.pricePerKg ?? p.price_per_kg ?? 0),
        stock: p.stock,
        maxStock: p.maxStock,
        currentKgStock: Number(p.currentKgStock ?? p.current_kg_stock ?? 0),
        initialKgStock: Number(p.initialKgStock ?? p.initial_kg_stock ?? 0),
      })));
      setLoading(false);
    };
    loadProducts();
  }, [token]);

  const filtered = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    ),
    [products, search]
  );

  const selected = products.find(p => p.id === selectedId) ?? null;
  const val = parseFloat(adjValue) || 0;

  const currentPrice = selected
    ? (selected.isBulk ? selected.pricePerKg : selected.price)
    : 0;

  const newPrice = selected
    ? mode === 'percent'
      ? currentPrice * (1 + val / 100)
      : currentPrice + val
    : null;

  const diff = newPrice !== null && selected ? newPrice - currentPrice : null;

  const handleConfirm = async () => {
    if (!selected || newPrice === null || !adjValue) return;
    setSaving(true);
    setErrorMsg('');

    const updatePayload = {
      name: selected.name,
      sku: selected.sku,
      category: selected.category,
      stock: selected.isBulk ? 0 : selected.stock,
      maxStock: selected.isBulk ? 0 : selected.maxStock,
      price: selected.isBulk ? 0 : Math.max(0, newPrice),
      icon: selected.icon,
      isBulk: selected.isBulk,
      pricePerKg: selected.isBulk ? Math.max(0, newPrice) : null,
      currentKgStock: selected.isBulk ? selected.currentKgStock : null,
      alertThreshold: 2,
    };

    const result = await apiIntegrado.updateProduct(token, selected.id, updatePayload);

    if (result) {
      setProducts(prev => prev.map(p =>
        p.id === selected.id
          ? selected.isBulk
            ? { ...p, pricePerKg: Math.max(0, newPrice) }
            : { ...p, price: Math.max(0, newPrice) }
          : p
      ));
      setAdjValue('');
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 3000);
    } else {
      setErrorMsg('Error al actualizar el precio. Intenta de nuevo.');
    }
    setSaving(false);
  };

  return (
    <main className="p-md min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-gutter">

        {/* LEFT PANEL */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-md">
          <div className="bg-tertiary/5 border border-outline-variant/30 rounded-xl p-md shadow-sm flex flex-col gap-md">
            <h2 className="text-headline-md font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">filter_alt</span> Seleccionar Producto
            </h2>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: '20px' }}>search</span>
              <input
                type="text"
                placeholder="Buscar por nombre o categoria"
                className="w-full bg-surface border border-outline-variant rounded-lg p-base pl-12 focus:ring-2 focus:ring-primary focus:outline-none transition-all text-body-md"
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedId(null); }}
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-xs">
              {loading ? (
                <p className="text-center text-on-surface-variant py-md">Cargando productos...</p>
              ) : filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedId(p.id); setAdjValue(''); setErrorMsg(''); }}
                  className={`w-full text-left px-sm py-base rounded-lg border transition-all flex items-center justify-between gap-sm ${
                    selectedId === p.id
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-label-md font-bold truncate">{p.name}</p>
                    <p className="text-caption text-on-surface-variant">{p.category}{p.isBulk ? ' · Granel' : ''}</p>
                  </div>
                  <span className={`text-label-md font-bold flex-shrink-0 ${selectedId === p.id ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {p.isBulk ? `${fmt(p.pricePerKg)}/kg` : fmt(p.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-secondary-container/10 border border-outline-variant/30 rounded-xl p-md shadow-sm">
            <h2 className="text-headline-md font-bold text-primary mb-md flex items-center gap-2">
              <span className="material-symbols-outlined">trending_up</span> Tipo de Ajuste
            </h2>
            <div className="flex gap-sm mb-md">
              <button
                onClick={() => setMode('percent')}
                className={`flex-1 py-base px-sm rounded-lg border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'percent' ? 'border-primary bg-primary text-white' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined">percent</span> Porcentaje
              </button>
              <button
                onClick={() => setMode('fixed')}
                className={`flex-1 py-base px-sm rounded-lg border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === 'fixed' ? 'border-primary bg-primary text-white' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined">attach_money</span> Monto Fijo
              </button>
            </div>
            <div className="mb-lg">
              <label className="block text-label-md text-on-surface-variant mb-xs">
                {mode === 'percent' ? 'Valor del Ajuste (%)' : 'Monto Fijo de Ajuste ($)'}
              </label>
              <div className="relative">
                <input
                  className="w-full bg-surface border border-outline-variant rounded-lg p-base pr-12 focus:ring-2 focus:ring-primary focus:outline-none text-headline-md font-bold"
                  type="number"
                  placeholder="0"
                  value={adjValue}
                  onChange={e => setAdjValue(e.target.value)}
                  disabled={!selected}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                  {mode === 'percent' ? '%' : '$'}
                </span>
              </div>
              <p className="text-caption text-on-surface-variant mt-sm">Use valores negativos para descuentos (ej: -10).</p>
            </div>
            {errorMsg && <p className="text-error text-caption mb-sm">{errorMsg}</p>}
            <button
              onClick={handleConfirm}
              disabled={!selected || !adjValue || newPrice === null || saving}
              className="w-full py-md bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-sm active:scale-95 transition-transform shadow-md hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">check_circle</span>
              {saving ? 'Guardando...' : 'Confirmar Cambio'}
            </button>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="col-span-12 lg:col-span-8 bg-surface border border-outline-variant/20 rounded-xl flex flex-col overflow-hidden shadow-lg" style={{ maxHeight: '700px' }}>
          <div className="p-md border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
            <h2 className="text-headline-md font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">visibility</span> Vista Previa del Cambio
            </h2>
            {selected && (
              <span className="bg-primary/10 text-primary px-sm py-xs rounded-full text-label-md">
                {selected.name}
              </span>
            )}
          </div>

          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-xl opacity-50">
              <span className="material-symbols-outlined" style={{ fontSize: '64px' }}>touch_app</span>
              <p className="text-body-lg font-bold mt-md">Seleccione un producto</p>
              <p className="text-body-md text-on-surface-variant mt-xs">Elija un producto de la lista para ver y aplicar el ajuste de precio.</p>
            </div>
          ) : (
            <>
              <div className="flex-1 p-md overflow-y-auto">
                <div className="bg-surface-container rounded-xl p-md border border-outline-variant/20 mb-md">
                  <div className="flex items-center gap-md">
                    <div className="w-14 h-14 rounded-xl bg-tertiary-fixed/30 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>{selected.icon || 'nutrition'}</span>
                    </div>
                    <div>
                      <p className="text-headline-md font-bold text-on-surface">{selected.name}</p>
                      <p className="text-body-md text-on-surface-variant">{selected.category}{selected.isBulk ? ' · Precio por kg' : ''}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-md mb-md">
                  <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant/20 text-center">
                    <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Precio Actual</p>
                    <p className="text-headline-md font-bold text-on-surface">
                      {selected.isBulk ? `${fmt(selected.pricePerKg)}/kg` : fmt(selected.price)}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex flex-col items-center gap-xs">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>arrow_forward</span>
                      {adjValue && diff !== null && (
                        <span className={`text-label-md font-bold ${diff >= 0 ? 'text-secondary' : 'text-error'}`}>
                          {diff >= 0 ? '+' : ''}{fmt(diff)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`rounded-xl p-md border text-center transition-all ${newPrice !== null && adjValue ? 'bg-secondary-container/20 border-primary/30' : 'bg-surface-container-low border-outline-variant/20 opacity-50'}`}>
                    <p className="text-caption text-primary uppercase tracking-wider mb-xs">Precio Nuevo</p>
                    <p className="text-headline-md font-bold text-primary">
                      {newPrice !== null && adjValue
                        ? selected.isBulk
                          ? `${fmt(Math.max(0, newPrice))}/kg`
                          : fmt(Math.max(0, newPrice))
                        : '—'}
                    </p>
                  </div>
                </div>

                {newPrice !== null && adjValue && diff !== null && (
                  <div className={`rounded-xl p-md border ${diff >= 0 ? 'bg-secondary-container/10 border-secondary/20' : 'bg-error-container/10 border-error/20'}`}>
                    <div className="flex items-center gap-sm mb-sm">
                      <span className={`material-symbols-outlined ${diff >= 0 ? 'text-secondary' : 'text-error'}`}>
                        {diff >= 0 ? 'trending_up' : 'trending_down'}
                      </span>
                      <h3 className={`text-label-md font-bold uppercase tracking-wider ${diff >= 0 ? 'text-secondary' : 'text-error'}`}>
                        {diff >= 0 ? 'Aumento de precio' : 'Reduccion de precio'}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-md text-sm">
                      <div className="flex justify-between"><span className="text-on-surface-variant">Tipo de ajuste</span><span className="font-bold">{mode === 'percent' ? `${val}%` : fmt(val)}</span></div>
                      <div className="flex justify-between"><span className="text-on-surface-variant">Variacion</span><span className={`font-bold ${diff >= 0 ? 'text-secondary' : 'text-error'}`}>{diff >= 0 ? '+' : ''}{fmt(diff)}</span></div>
                      <div className="flex justify-between"><span className="text-on-surface-variant">Precio anterior</span><span className="font-bold">{fmt(currentPrice)}</span></div>
                      <div className="flex justify-between"><span className="text-on-surface-variant">Precio nuevo</span><span className="font-bold text-primary">{fmt(Math.max(0, newPrice))}</span></div>
                    </div>
                  </div>
                )}

                {!adjValue && (
                  <div className="bg-surface-container rounded-xl p-md border border-outline-variant/10 text-center text-on-surface-variant opacity-60">
                    <p className="text-body-md">Ingrese el valor de ajuste en el panel izquierdo para ver la vista previa.</p>
                  </div>
                )}
              </div>

              <div className="p-md bg-surface-container-low border-t border-outline-variant/10 flex justify-between items-center">
                <div>
                  <p className="text-caption text-on-surface-variant uppercase">Producto seleccionado</p>
                  <p className="text-label-md font-bold">{selected.name}</p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {confirmed && (
        <div className="fixed bottom-lg right-lg bg-primary text-white px-lg py-base rounded-xl shadow-2xl flex items-center gap-base z-50">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-label-md font-bold">Precio actualizado correctamente</span>
        </div>
      )}
    </main>
  );
}
