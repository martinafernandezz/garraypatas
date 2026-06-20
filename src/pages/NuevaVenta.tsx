import { useState, useCallback } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  isBulk?: boolean;
  pricePerKg?: number;
  kgQty?: number;
}

const catalog = [
  { id: 1, name: 'Royal Canin Mini Adult 3kg', price: 12500, sku: '001' },
  { id: 2, name: 'Pro Plan Puppy Small Breed 7.5kg', price: 28400, sku: '002' },
  { id: 3, name: 'Pipeta Antipulgas (4 dosis)', price: 3200, sku: '003' },
  { id: 4, name: 'Shampoo Premium Avena 500ml', price: 5600, sku: '004' },
  { id: 5, name: 'Juguete Mordedor KONG L', price: 8900, sku: '005' },
  { id: 6, name: 'NexGard Tabletas Antipulgas', price: 11200, sku: '006' },
];

const bulkFoods = [
  { id: 101, name: 'Royal Canin Puppy Mix', pricePerKg: 3200 },
  { id: 102, name: 'Alimento Gato Mix', pricePerKg: 2800 },
  { id: 103, name: 'Pro Plan Adultos Granel', pricePerKg: 4100 },
];

const paymentMethods = [
  { id: 'efectivo',      icon: 'payments',     label: 'Efectivo',     badge: '-10%', badgeColor: 'text-secondary' },
  { id: 'debito',        icon: 'credit_card',   label: 'Débito',       badge: null,   badgeColor: '' },
  { id: 'transferencia', icon: 'swap_horiz',    label: 'Transf.',      badge: '-10%', badgeColor: 'text-secondary' },
  { id: 'credito',       icon: 'contactless',   label: 'Crédito',      badge: null,   badgeColor: '' },
];

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6];

function paymentSurcharge(method: string | null, installments: number): number {
  if (method === 'efectivo' || method === 'transferencia') return -0.10;
  if (method === 'credito') return installments === 1 ? 0.10 : 0.30;
  return 0;
}

function paymentLabel(method: string | null, installments: number): string {
  if (method === 'efectivo') return 'Descuento Efectivo (10%)';
  if (method === 'transferencia') return 'Descuento Transf. (10%)';
  if (method === 'credito') return installments === 1 ? 'Cargo 1 Cuota (10%)' : `Cargo ${installments} Cuotas (30%)`;
  return '';
}

const fmt = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

export default function NuevaVenta() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);
  const [bulkFood, setBulkFood] = useState('');
  const [bulkQty, setBulkQty] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const filteredCatalog = search.length > 1
    ? catalog.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search))
    : [];

  const addToCart = (item: typeof catalog[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
    setSearch('');
  };

  const addBulk = useCallback(() => {
    const food = bulkFoods.find(f => f.name === bulkFood);
    const qty = parseFloat(bulkQty);
    if (!food || !qty || qty <= 0) return;
    setCart(prev => [...prev, {
      id: Date.now(),
      name: food.name,
      price: food.pricePerKg * qty,
      qty: 1,
      isBulk: true,
      pricePerKg: food.pricePerKg,
      kgQty: qty,
    }]);
    setBulkFood('');
    setBulkQty('');
  }, [bulkFood, bulkQty]);

  const handleBulkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBulk();
    }
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev
      .map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)
      .filter(c => c.qty > 0)
    );
  };

  const removeItem = (id: number) => setCart(prev => prev.filter(c => c.id !== id));

  // --- Pricing calculations ---
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const discountRaw = parseFloat(discountValue) || 0;
  const manualDiscountAmount = discountValue
    ? discountType === 'percent'
      ? subtotal * (discountRaw / 100)
      : discountRaw
    : 0;

  const netSubtotal = Math.max(0, subtotal - manualDiscountAmount);
  const surcharge = paymentSurcharge(selectedPayment, installments);
  const paymentAdjAmount = netSubtotal * surcharge;
  const finalTotal = netSubtotal + paymentAdjAmount;

  const finishSale = () => {
    if (cart.length === 0 || !selectedPayment) return;
    setShowConfirm(true);
    setTimeout(() => {
      setShowConfirm(false);
      setCart([]);
      setSelectedPayment(null);
      setInstallments(1);
      setDiscountValue('');
    }, 3000);
  };

  return (
    <div className="flex gap-gutter p-lg h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── LEFT SIDE ── */}
      <div className="flex-grow flex flex-col gap-lg overflow-hidden">

        {/* Search */}
        <section className="bg-surface border border-outline-variant/30 rounded-xl p-xl flex flex-col items-center text-center shadow-sm">
          <div className="w-full max-w-2xl">
            <h2 className="text-headline-md font-bold text-primary mb-md">Nueva Venta</h2>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary">
                barcode_scanner
              </span>
              <input
                className="w-full pl-12 pr-4 py-5 bg-surface-container-low border-2 border-outline-variant/40 rounded-xl text-body-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline/60"
                placeholder="Buscar por código, nombre o marca..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            {filteredCatalog.length > 0 && (
              <div className="mt-2 bg-surface border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden text-left">
                {filteredCatalog.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="w-full flex justify-between items-center px-md py-sm hover:bg-secondary-container/20 transition-colors border-b border-outline-variant/10 last:border-0"
                  >
                    <span className="text-body-md font-bold">{item.name}</span>
                    <span className="text-label-md text-primary font-bold">{fmt(item.price)}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="mt-base text-on-surface-variant text-caption">Buscar por código escrito manual o por descripción del producto.</p>
          </div>
        </section>

        {/* Bulk food */}
        <section className="bg-tertiary-fixed/20 border border-outline-variant/20 rounded-xl p-lg">
          <div className="flex items-center gap-sm mb-md">
            <span className="material-symbols-outlined text-tertiary">scale</span>
            <h3 className="text-headline-md font-bold text-tertiary">Alimento por peso</h3>
          </div>
          <div className="grid grid-cols-12 gap-md items-end">
            <div className="col-span-7">
              <label className="block text-label-md text-on-surface-variant mb-xs">Alimento</label>
              <select
                className="w-full px-md py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary transition-all text-body-md"
                value={bulkFood}
                onChange={e => setBulkFood(e.target.value)}
              >
                <option value="">Seleccionar alimento...</option>
                {bulkFoods.map(f => (
                  <option key={f.id} value={f.name}>{f.name} — {fmt(f.pricePerKg)}/kg</option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <label className="block text-label-md text-on-surface-variant mb-xs">Cantidad (kg)</label>
              <input
                className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary transition-all font-bold text-right"
                placeholder="0.00"
                step="0.1"
                type="number"
                value={bulkQty}
                onChange={e => setBulkQty(e.target.value)}
                onKeyDown={handleBulkKeyDown}
              />
            </div>
            <div className="col-span-2">
              <button
                onClick={addBulk}
                className="w-full py-3 bg-tertiary text-white rounded-lg font-bold flex items-center justify-center gap-xs hover:opacity-90 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined">add</span>
                Añadir
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ── RIGHT SIDE: Cart + Payment ── */}
      <div className="w-96 flex flex-col gap-md flex-shrink-0 overflow-y-auto custom-scrollbar">

        {/* Cart */}
        <div className="bg-surface-container border border-outline-variant/30 rounded-xl flex flex-col overflow-hidden shadow-sm" style={{ minHeight: '280px', maxHeight: '380px' }}>
          <div className="p-md border-b border-outline-variant/20 flex justify-between items-center bg-white">
            <h3 className="text-headline-md font-bold text-primary">Carrito</h3>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-md">
              {cart.reduce((a, c) => a + c.qty, 0)} items
            </span>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40 p-md">
                <span className="material-symbols-outlined" style={{ fontSize: '56px' }}>shopping_basket</span>
                <p className="text-body-md italic mt-sm">El carrito está vacío</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {cart.map(item => (
                  <div key={item.id} className="px-md py-sm flex items-center gap-sm">
                    <div className="flex-grow min-w-0">
                      <p className="text-label-md font-bold truncate">{item.name}</p>
                      {item.isBulk && item.pricePerKg && item.kgQty ? (
                        <p className="text-caption text-tertiary font-bold">
                          {fmt(item.pricePerKg)}/kg × {item.kgQty}kg
                        </p>
                      ) : (
                        <p className="text-caption text-on-surface-variant">{fmt(item.price)} c/u</p>
                      )}
                    </div>
                    <div className="flex items-center gap-xs flex-shrink-0">
                      <button onClick={() => updateQty(item.id, -1)} className="w-5 h-5 rounded border border-outline-variant flex items-center justify-center hover:bg-surface-variant">
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>remove</span>
                      </button>
                      <span className="w-5 text-center text-label-md font-bold">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-5 h-5 rounded border border-outline-variant flex items-center justify-center hover:bg-surface-variant">
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>add</span>
                      </button>
                      <button onClick={() => removeItem(item.id)} className="w-5 h-5 rounded flex items-center justify-center text-error hover:bg-error-container/20 ml-xs">
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close</span>
                      </button>
                    </div>
                    <span className="text-label-md font-bold text-primary w-20 text-right flex-shrink-0">
                      {fmt(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-white border border-outline-variant/20 rounded-xl p-md space-y-xs shadow-sm">
          <div className="flex justify-between text-body-md text-on-surface-variant">
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          {manualDiscountAmount > 0 && (
            <div className="flex justify-between text-body-md text-error">
              <span>Descuento manual</span><span>-{fmt(manualDiscountAmount)}</span>
            </div>
          )}
          {selectedPayment && surcharge !== 0 && (
            <div className={`flex justify-between text-body-md font-bold ${surcharge < 0 ? 'text-secondary' : 'text-error'}`}>
              <span>{paymentLabel(selectedPayment, installments)}</span>
              <span>{surcharge < 0 ? '-' : '+'}{fmt(Math.abs(paymentAdjAmount))}</span>
            </div>
          )}
          <div className="flex justify-between text-headline-md font-bold text-primary pt-sm border-t border-outline-variant/20">
            <span>TOTAL</span><span>{fmt(finalTotal)}</span>
          </div>
          {selectedPayment === 'credito' && installments > 1 && (
            <p className="text-caption text-on-surface-variant text-right">
              {installments} cuotas de {fmt(finalTotal / installments)}
            </p>
          )}
        </div>

        {/* Manual Discount */}
        <div className="bg-surface border border-outline-variant/20 rounded-xl p-md shadow-sm">
          <div className="flex items-center gap-sm mb-sm">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>sell</span>
            <p className="text-label-md font-bold text-on-surface-variant uppercase tracking-wide">Descuento Manual</p>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={() => setDiscountType(discountType === 'percent' ? 'fixed' : 'percent')}
              className="flex-shrink-0 w-10 h-10 border border-outline-variant rounded-lg flex items-center justify-center font-bold text-label-md hover:bg-surface-container transition-all text-on-surface-variant"
              title="Cambiar tipo de descuento"
            >
              {discountType === 'percent' ? '%' : '$'}
            </button>
            <div className="relative flex-grow">
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder={discountType === 'percent' ? '0 %' : '0.00 $'}
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-sm py-2 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            {discountValue && (
              <button
                onClick={() => setDiscountValue('')}
                className="flex-shrink-0 w-10 h-10 border border-error/30 rounded-lg flex items-center justify-center text-error hover:bg-error-container/20 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
          </div>
          {manualDiscountAmount > 0 && (
            <p className="text-caption text-secondary font-bold mt-xs">
              Ahorro: {fmt(manualDiscountAmount)} {discountType === 'percent' ? `(${discountValue}%)` : ''}
            </p>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-surface border border-outline-variant/30 rounded-xl p-md shadow-sm">
          <p className="text-label-md text-on-surface-variant mb-md uppercase tracking-wide">Método de Pago</p>
          <div className="grid grid-cols-2 gap-sm">
            {paymentMethods.map(pm => (
              <button
                key={pm.id}
                onClick={() => { setSelectedPayment(pm.id); if (pm.id !== 'credito') setInstallments(1); }}
                className={`flex flex-col items-center gap-xs p-sm border rounded-lg transition-all relative ${
                  selectedPayment === pm.id
                    ? 'bg-primary-container border-primary-container text-white'
                    : 'border-outline-variant hover:bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">{pm.icon}</span>
                <span className="text-caption font-bold">{pm.label}</span>
                {pm.badge && (
                  <span className={`text-[10px] font-bold absolute top-1 right-1 ${selectedPayment === pm.id ? 'text-white/80' : pm.badgeColor}`}>
                    {pm.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Installments (credit card only) */}
          {selectedPayment === 'credito' && (
            <div className="mt-md">
              <p className="text-label-md text-on-surface-variant mb-sm">Cuotas</p>
              <div className="grid grid-cols-6 gap-xs">
                {INSTALLMENT_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setInstallments(n)}
                    className={`py-sm rounded-lg text-label-md font-bold border transition-all ${
                      installments === n
                        ? 'bg-primary text-white border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                    }`}
                  >
                    {n}x
                  </button>
                ))}
              </div>
              <p className="text-caption text-on-surface-variant mt-xs">
                {installments === 1 ? '1 cuota: +10% sobre el total' : `${installments} cuotas: +30% sobre el total`}
              </p>
            </div>
          )}

          <button
            onClick={finishSale}
            disabled={cart.length === 0 || !selectedPayment}
            className="w-full mt-md py-4 bg-primary text-white rounded-lg text-headline-md font-bold flex items-center justify-center gap-sm hover:opacity-90 transition-all active:scale-95 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Finalizar Venta
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {showConfirm && (
        <div className="fixed bottom-lg right-lg bg-primary text-white px-lg py-base rounded-xl shadow-2xl flex items-center gap-base z-50">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-label-md font-bold">Venta registrada con éxito</span>
        </div>
      )}
    </div>
  );
}
