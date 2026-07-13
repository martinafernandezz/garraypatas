import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiIntegrado } from '../services/apiIntegrado';

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  isBulk?: boolean;
  pricePerKg?: number;
  kgQty?: number;
  talle?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  sku: string;
  stock: number;
  is_bulk: number | boolean;
  isBulk?: number | boolean;
  has_sizes?: number | boolean;
  hasSizes?: number | boolean;
  price_per_kg?: number;
  pricePerKg?: number;
  current_kg_stock?: number;
  currentKgStock?: number;
  category: string;
  icon: string;
}

interface Variant {
  id: number;
  talle: string;
  stock: number;
}

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
}

const getPricePerKg = (p: Product) => Number(p.pricePerKg ?? p.price_per_kg ?? 0);
const getCurrentKgStock = (p: Product) => Number(p.currentKgStock ?? p.current_kg_stock ?? 0);
const getIsBulk = (p: Product) => p.is_bulk === 1 || p.is_bulk === true || p.isBulk === 1 || p.isBulk === true;
const getHasSizes = (p: Product) => p.has_sizes === 1 || p.has_sizes === true || p.hasSizes === 1 || p.hasSizes === true;

const paymentMethods = [
  { id: 'efectivo',         icon: 'payments',              label: 'Efectivo',     badge: '-10%', badgeColor: 'text-secondary' },
  { id: 'debito',           icon: 'credit_card',            label: 'Debito',       badge: null,   badgeColor: '' },
  { id: 'transferencia',    icon: 'swap_horiz',             label: 'Transf.',      badge: '-10%', badgeColor: 'text-secondary' },
  { id: 'credito',          icon: 'contactless',            label: 'Credito',      badge: null,   badgeColor: '' },
  { id: 'cuenta_corriente', icon: 'account_balance_wallet', label: 'Cta. Cte.',    badge: null,   badgeColor: '' },
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
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [saleNumber, setSaleNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkSelected, setBulkSelected] = useState<Product | null>(null);
  const [bulkKg, setBulkKg] = useState('');
  const [bulkGrams, setBulkGrams] = useState('');
  const [showBulkResults, setShowBulkResults] = useState(false);

  const [calcProduct, setCalcProduct] = useState<Product | null>(null);
  const [calcSearch, setCalcSearch] = useState('');
  const [calcAmount, setCalcAmount] = useState('');
  const [showCalcResults, setShowCalcResults] = useState(false);

  const [talleSearch, setTalleSearch] = useState('');
  const [talleSelected, setTalleSelected] = useState<Product | null>(null);
  const [talleVariants, setTalleVariants] = useState<Variant[]>([]);
  const [selectedTalle, setSelectedTalle] = useState<string | null>(null);
  const [talleQty, setTalleQty] = useState('1');
  const [showTalleResults, setShowTalleResults] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  useEffect(() => {
    apiIntegrado.getProducts(token).then(setProducts);
    apiIntegrado.getCustomers(token).then(setCustomers);
  }, [token]);

  useEffect(() => {
    if (talleSelected) {
      setLoadingVariants(true);
      apiIntegrado.getProductVariants(token, talleSelected.id).then((data: Variant[]) => {
        setTalleVariants(data || []);
        setLoadingVariants(false);
      });
    } else {
      setTalleVariants([]);
    }
    setSelectedTalle(null);
    setTalleQty('1');
  }, [talleSelected, token]);

  const normalProducts = products.filter(p => !getIsBulk(p) && !getHasSizes(p));
  const bulkProducts = products.filter(p => getIsBulk(p));
  const talleProducts = products.filter(p => getHasSizes(p));

  const filteredCatalog = search.length > 1
    ? normalProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.includes(search)
      )
    : [];

  const filteredBulk = bulkSearch.length > 0
    ? bulkProducts.filter(p => p.name.toLowerCase().includes(bulkSearch.toLowerCase()))
    : bulkProducts;

  const filteredCalc = calcSearch.length > 0
    ? bulkProducts.filter(p => p.name.toLowerCase().includes(calcSearch.toLowerCase()))
    : bulkProducts;

  const filteredTalleProducts = talleSearch.length > 0
    ? talleProducts.filter(p => p.name.toLowerCase().includes(talleSearch.toLowerCase()))
    : talleProducts;

  const filteredCustomers = customerSearch.length > 0
    ? customers.filter(c => `${c.first_name} ${c.last_name}`.toLowerCase().includes(customerSearch.toLowerCase()))
    : customers;

  const bulkTotalKg = (parseFloat(bulkKg) || 0) + (parseFloat(bulkGrams) || 0) / 1000;
  const bulkTotalPrice = bulkSelected ? getPricePerKg(bulkSelected) * bulkTotalKg : 0;

  const calcGrams = calcProduct && calcAmount
    ? (parseFloat(calcAmount) / (getPricePerKg(calcProduct) || 1)) * 1000
    : null;

  const selectedVariant = talleVariants.find(v => v.talle === selectedTalle) || null;

  const addToCart = (item: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id && !c.talle);
      if (existing) return prev.map(c => c.id === item.id && !c.talle ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: Number(item.price), qty: 1 }];
    });
    setSearch('');
  };

  const addBulk = useCallback(() => {
    if (!bulkSelected || bulkTotalKg <= 0) return;
    const pricePerKg = getPricePerKg(bulkSelected);
    setCart(prev => [...prev, {
      id: bulkSelected.id,
      name: bulkSelected.name,
      price: pricePerKg * bulkTotalKg,
      qty: 1,
      isBulk: true,
      pricePerKg,
      kgQty: bulkTotalKg,
    }]);
    setBulkSelected(null);
    setBulkSearch('');
    setBulkKg('');
    setBulkGrams('');
  }, [bulkSelected, bulkTotalKg]);

  const addTalleToCart = () => {
    if (!talleSelected || !selectedTalle || !selectedVariant) return;
    const qty = Math.max(1, parseInt(talleQty) || 1);
    if (qty > selectedVariant.stock) return;

    setCart(prev => {
      const existing = prev.find(c => c.id === talleSelected.id && c.talle === selectedTalle);
      if (existing) {
        return prev.map(c => c.id === talleSelected.id && c.talle === selectedTalle ? { ...c, qty: c.qty + qty } : c);
      }
      return [...prev, {
        id: talleSelected.id,
        name: `${talleSelected.name} - Talle ${selectedTalle}`,
        price: Number(talleSelected.price),
        qty,
        talle: selectedTalle,
      }];
    });

    setTalleSelected(null);
    setTalleSearch('');
    setSelectedTalle(null);
    setTalleQty('1');
  };

  const updateQty = (id: number, delta: number, talle?: string) => {
    setCart(prev => prev
      .map(c => (c.id === id && c.talle === talle) ? { ...c, qty: Math.max(1, c.qty + delta) } : c)
      .filter(c => c.qty > 0)
    );
  };

  const removeItem = (id: number, talle?: string) => setCart(prev => prev.filter(c => !(c.id === id && c.talle === talle)));

  const handleCreateCustomer = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) return;
    setCreatingCustomer(true);
    const result = await apiIntegrado.createCustomer(token, {
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      phone: newPhone.trim() || null,
    });
    setCreatingCustomer(false);

    if (result) {
      const newCustomer: Customer = {
        id: result.id,
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        phone: newPhone.trim() || undefined,
      };
      setCustomers(prev => [...prev, newCustomer]);
      setSelectedCustomer(newCustomer);
      setShowNewCustomerForm(false);
      setNewFirstName('');
      setNewLastName('');
      setNewPhone('');
    }
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discountRaw = parseFloat(discountValue) || 0;
  const manualDiscountAmount = discountValue
    ? discountType === 'percent' ? subtotal * (discountRaw / 100) : discountRaw
    : 0;
  const netSubtotal = Math.max(0, subtotal - manualDiscountAmount);
  const surcharge = paymentSurcharge(selectedPayment, installments);
  const paymentAdjAmount = netSubtotal * surcharge;
  const finalTotal = netSubtotal + paymentAdjAmount;

  const needsCustomer = selectedPayment === 'cuenta_corriente' && !selectedCustomer;

  const finishSale = async () => {
    if (cart.length === 0 || !selectedPayment || needsCustomer) return;
    setSaving(true);
    setErrorMsg('');

    const items = cart.map(item => ({
      productId: item.id,
      quantity: item.isBulk ? 0 : item.qty,
      kgQuantity: item.isBulk ? (item.kgQty ?? 0) : 0,
      price: item.isBulk ? (item.pricePerKg ?? 0) : item.price,
      talle: item.talle || undefined,
    }));

    const result = await apiIntegrado.createSale(token, {
      items,
      totalAmount: finalTotal,
      paymentMethod: selectedPayment,
      installments,
      discountType: discountValue ? discountType : null,
      discountValue: discountValue ? discountRaw : null,
      customerId: selectedCustomer ? selectedCustomer.id : undefined,
    });

    setSaving(false);

    if (result) {
      setSaleNumber(result.saleNumber || result.id || '');
      setShowConfirm(true);
      setTimeout(() => {
        setShowConfirm(false);
        setCart([]);
        setSelectedPayment(null);
        setInstallments(1);
        setDiscountValue('');
        setSaleNumber('');
        setSelectedCustomer(null);
        setCustomerSearch('');
      }, 3000);
    } else {
      setErrorMsg('Error al registrar la venta. Intenta de nuevo.');
    }
  };

  return (
    <div className="flex gap-gutter p-lg h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex-grow flex flex-col gap-lg overflow-hidden overflow-y-auto custom-scrollbar">

        <section className="bg-surface border border-outline-variant/30 rounded-xl p-xl flex flex-col items-center text-center shadow-sm">
          <div className="w-full max-w-2xl">
            <h2 className="text-headline-md font-bold text-primary mb-md">Nueva Venta</h2>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary">barcode_scanner</span>
              <input
                className="w-full pl-12 pr-4 py-5 bg-surface-container-low border-2 border-outline-variant/40 rounded-xl text-body-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline/60"
                placeholder="Buscar por codigo, nombre o marca..."
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
                    <div>
                      <span className="text-body-md font-bold">{item.name}</span>
                      <span className="text-caption text-on-surface-variant ml-sm">Stock: {item.stock}</span>
                    </div>
                    <span className="text-label-md text-primary font-bold">{fmt(Number(item.price))}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-tertiary-fixed/20 border border-outline-variant/20 rounded-xl p-lg">
          <div className="flex items-center gap-sm mb-md">
            <span className="material-symbols-outlined text-tertiary">scale</span>
            <h3 className="text-headline-md font-bold text-tertiary">Alimento por peso</h3>
          </div>

          <div className="space-y-md">
            <div className="relative">
              <label className="block text-label-md text-on-surface-variant mb-xs">Buscar alimento</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: '18px' }}>search</span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary transition-all text-body-md"
                  placeholder="Escribi el nombre del alimento..."
                  value={bulkSearch}
                  onChange={e => { setBulkSearch(e.target.value); setShowBulkResults(true); setBulkSelected(null); }}
                  onFocus={() => setShowBulkResults(true)}
                />
              </div>
              {showBulkResults && filteredBulk.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden">
                  {filteredBulk.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setBulkSelected(p); setBulkSearch(p.name); setShowBulkResults(false); }}
                      className="w-full flex justify-between items-center px-md py-sm hover:bg-tertiary/10 transition-colors border-b border-outline-variant/10 last:border-0 text-left"
                    >
                      <div>
                        <span className="text-body-md font-bold">{p.name}</span>
                        <span className="text-caption text-on-surface-variant block">Stock: {getCurrentKgStock(p).toFixed(2)} kg</span>
                      </div>
                      <span className="text-label-md text-tertiary font-bold">{fmt(getPricePerKg(p))}/kg</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {bulkSelected && (
              <div className="bg-white rounded-lg p-md border border-tertiary/20">
                <p className="text-label-md font-bold text-tertiary mb-sm">{bulkSelected.name} — {fmt(getPricePerKg(bulkSelected))}/kg</p>
                <div className="grid grid-cols-3 gap-md items-end">
                  <div>
                    <label className="block text-caption text-on-surface-variant mb-xs">Kilos</label>
                    <input
                      className="w-full px-md py-2 border border-outline-variant rounded-lg text-body-md font-bold text-right focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary"
                      placeholder="0"
                      type="number"
                      min="0"
                      step="1"
                      value={bulkKg}
                      onChange={e => setBulkKg(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-caption text-on-surface-variant mb-xs">Gramos</label>
                    <input
                      className="w-full px-md py-2 border border-outline-variant rounded-lg text-body-md font-bold text-right focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary"
                      placeholder="0"
                      type="number"
                      min="0"
                      step="50"
                      value={bulkGrams}
                      onChange={e => setBulkGrams(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={addBulk}
                    disabled={bulkTotalKg <= 0}
                    className="py-2 bg-tertiary text-white rounded-lg font-bold flex items-center justify-center gap-xs hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined">add</span>
                    Añadir
                  </button>
                </div>
                {bulkTotalKg > 0 && (
                  <div className="mt-sm flex justify-between text-caption text-on-surface-variant">
                    <span>Total: {bulkTotalKg >= 1 ? `${bulkTotalKg.toFixed(3)} kg` : `${(bulkTotalKg * 1000).toFixed(0)} gr`}</span>
                    <span className="font-bold text-tertiary">{fmt(bulkTotalPrice)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="bg-primary/5 border border-outline-variant/20 rounded-xl p-lg">
          <div className="flex items-center gap-sm mb-md">
            <span className="material-symbols-outlined text-primary">straighten</span>
            <h3 className="text-headline-md font-bold text-primary">Producto por talle</h3>
          </div>

          <div className="space-y-md">
            <div className="relative">
              <label className="block text-label-md text-on-surface-variant mb-xs">Buscar producto</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: '18px' }}>search</span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-body-md"
                  placeholder="Escribi el nombre del producto..."
                  value={talleSearch}
                  onChange={e => { setTalleSearch(e.target.value); setShowTalleResults(true); setTalleSelected(null); }}
                  onFocus={() => setShowTalleResults(true)}
                />
              </div>
              {showTalleResults && filteredTalleProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden">
                  {filteredTalleProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setTalleSelected(p); setTalleSearch(p.name); setShowTalleResults(false); }}
                      className="w-full flex justify-between items-center px-md py-sm hover:bg-primary/10 transition-colors border-b border-outline-variant/10 last:border-0 text-left"
                    >
                      <span className="text-body-md font-bold">{p.name}</span>
                      <span className="text-label-md text-primary font-bold">{fmt(Number(p.price))}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {talleSelected && (
              <div className="bg-white rounded-lg p-md border border-primary/20">
                <p className="text-label-md font-bold text-primary mb-sm">{talleSelected.name} — {fmt(Number(talleSelected.price))}</p>

                {loadingVariants ? (
                  <p className="text-caption text-on-surface-variant">Cargando talles...</p>
                ) : talleVariants.length === 0 ? (
                  <p className="text-caption text-on-surface-variant">Este producto no tiene talles cargados.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-xs mb-sm">
                      {talleVariants.map(v => (
                        <button
                          key={v.talle}
                          onClick={() => setSelectedTalle(v.talle)}
                          disabled={v.stock <= 0}
                          className={`px-md py-2 rounded-lg border font-bold text-label-md transition-all ${
                            selectedTalle === v.talle
                              ? 'bg-primary text-white border-primary'
                              : v.stock <= 0
                              ? 'border-outline-variant/30 text-outline-variant/50 cursor-not-allowed line-through'
                              : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                          }`}
                        >
                          {v.talle} ({v.stock})
                        </button>
                      ))}
                    </div>

                    {selectedTalle && (
                      <div className="grid grid-cols-3 gap-md items-end">
                        <div className="col-span-1">
                          <label className="block text-caption text-on-surface-variant mb-xs">Cantidad</label>
                          <input
                            className="w-full px-md py-2 border border-outline-variant rounded-lg text-body-md font-bold text-right"
                            type="number"
                            min="1"
                            max={selectedVariant?.stock ?? 1}
                            value={talleQty}
                            onChange={e => setTalleQty(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={addTalleToCart}
                          disabled={!selectedVariant || (parseInt(talleQty) || 0) > selectedVariant.stock}
                          className="col-span-2 py-2 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-xs hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined">add</span>
                          Añadir talle {selectedTalle}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="bg-secondary/5 border border-secondary/20 rounded-xl p-lg">
          <div className="flex items-center gap-sm mb-md">
            <span className="material-symbols-outlined text-secondary">calculate</span>
            <h3 className="text-headline-md font-bold text-secondary">Calculadora por monto</h3>
          </div>
          <p className="text-caption text-on-surface-variant mb-md">Ingresa el monto que quiere gastar el cliente y te dice cuantos gramos se lleva.</p>

          <div className="space-y-md">
            <div className="relative">
              <label className="block text-label-md text-on-surface-variant mb-xs">Alimento</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: '18px' }}>search</span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-body-md"
                  placeholder="Buscar alimento..."
                  value={calcSearch}
                  onChange={e => { setCalcSearch(e.target.value); setShowCalcResults(true); setCalcProduct(null); }}
                  onFocus={() => setShowCalcResults(true)}
                />
              </div>
              {showCalcResults && filteredCalc.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden">
                  {filteredCalc.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setCalcProduct(p); setCalcSearch(p.name); setShowCalcResults(false); }}
                      className="w-full flex justify-between items-center px-md py-sm hover:bg-secondary/10 transition-colors border-b border-outline-variant/10 last:border-0 text-left"
                    >
                      <span className="text-body-md font-bold">{p.name}</span>
                      <span className="text-label-md text-secondary font-bold">{fmt(getPricePerKg(p))}/kg</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {calcProduct && (
              <div className="bg-white rounded-lg p-md border border-secondary/20">
                <div className="flex gap-md items-end">
                  <div className="flex-grow">
                    <label className="block text-caption text-on-surface-variant mb-xs">Monto ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">$</span>
                      <input
                        className="w-full pl-8 pr-4 py-2 border border-outline-variant rounded-lg text-body-md font-bold"
                        placeholder="0"
                        type="number"
                        min="0"
                        value={calcAmount}
                        onChange={e => setCalcAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  {calcGrams !== null && calcGrams > 0 && (
                    <div className="flex-grow bg-secondary/10 rounded-lg p-sm text-center">
                      <p className="text-caption text-on-surface-variant">Se lleva</p>
                      <p className="text-headline-md font-bold text-secondary">
                        {calcGrams >= 1000 ? `${(calcGrams / 1000).toFixed(2)} kg` : `${calcGrams.toFixed(0)} gr`}
                      </p>
                    </div>
                  )}
                </div>
                {calcGrams !== null && calcGrams > 0 && (
                  <button
                    onClick={() => {
                      const kgQty = calcGrams / 1000;
                      const pricePerKg = getPricePerKg(calcProduct);
                      setCart(prev => [...prev, {
                        id: calcProduct.id,
                        name: calcProduct.name,
                        price: pricePerKg * kgQty,
                        qty: 1,
                        isBulk: true,
                        pricePerKg,
                        kgQty,
                      }]);
                      setCalcAmount('');
                      setCalcSearch('');
                      setCalcProduct(null);
                    }}
                    className="w-full mt-sm py-2 bg-secondary text-white rounded-lg font-bold text-caption hover:opacity-90 transition-all active:scale-95"
                  >
                    Agregar al carrito
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="w-96 flex flex-col gap-md flex-shrink-0 overflow-y-auto custom-scrollbar">

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
                <p className="text-body-md italic mt-sm">El carrito esta vacio</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {cart.map(item => (
                  <div key={`${item.id}-${item.talle || 'base'}`} className="px-md py-sm flex items-center gap-sm">
                    <div className="flex-grow min-w-0">
                      <p className="text-label-md font-bold truncate">{item.name}</p>
                      {item.isBulk && item.pricePerKg && item.kgQty ? (
                        <p className="text-caption text-tertiary font-bold">
                          {item.kgQty >= 1 ? `${item.kgQty.toFixed(3)} kg` : `${(item.kgQty * 1000).toFixed(0)} gr`} x {fmt(item.pricePerKg)}/kg
                        </p>
                      ) : (
                        <p className="text-caption text-on-surface-variant">{fmt(item.price)} c/u</p>
                      )}
                    </div>
                    <div className="flex items-center gap-xs flex-shrink-0">
                      {!item.isBulk && <>
                        <button onClick={() => updateQty(item.id, -1, item.talle)} className="w-5 h-5 rounded border border-outline-variant flex items-center justify-center hover:bg-surface-variant">
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>remove</span>
                        </button>
                        <span className="w-5 text-center text-label-md font-bold">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1, item.talle)} className="w-5 h-5 rounded border border-outline-variant flex items-center justify-center hover:bg-surface-variant">
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>add</span>
                        </button>
                      </>}
                      <button onClick={() => removeItem(item.id, item.talle)} className="w-5 h-5 rounded flex items-center justify-center text-error hover:bg-error-container/20 ml-xs">
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

        <div className="bg-surface border border-outline-variant/20 rounded-xl p-md shadow-sm">
          <div className="flex items-center gap-sm mb-sm">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '18px' }}>sell</span>
            <p className="text-label-md font-bold text-on-surface-variant uppercase tracking-wide">Descuento Manual</p>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={() => setDiscountType(discountType === 'percent' ? 'fixed' : 'percent')}
              className="flex-shrink-0 w-10 h-10 border border-outline-variant rounded-lg flex items-center justify-center font-bold text-label-md hover:bg-surface-container transition-all text-on-surface-variant"
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
              <button onClick={() => setDiscountValue('')} className="flex-shrink-0 w-10 h-10 border border-error/30 rounded-lg flex items-center justify-center text-error hover:bg-error-container/20 transition-all">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-surface border border-outline-variant/30 rounded-xl p-md shadow-sm">
          <p className="text-label-md text-on-surface-variant mb-md uppercase tracking-wide">Metodo de Pago</p>
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

          {selectedPayment === 'credito' && (
            <div className="mt-md">
              <p className="text-label-md text-on-surface-variant mb-sm">Cuotas</p>
              <div className="grid grid-cols-6 gap-xs">
                {INSTALLMENT_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setInstallments(n)}
                    className={`py-sm rounded-lg text-label-md font-bold border transition-all ${
                      installments === n ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
                    }`}
                  >
                    {n}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedPayment === 'cuenta_corriente' && (
            <div className="mt-md p-md bg-secondary/5 border border-secondary/20 rounded-lg space-y-sm">
              <p className="text-label-md font-bold text-secondary">Cliente</p>

              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-white rounded-lg p-sm border border-secondary/20">
                  <span className="text-body-md font-bold">{selectedCustomer.first_name} {selectedCustomer.last_name}</span>
                  <button onClick={() => setSelectedCustomer(null)} className="text-error text-caption font-bold hover:underline">
                    Cambiar
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <input
                      className="w-full px-md py-2 border border-outline-variant rounded-lg text-body-md"
                      placeholder="Buscar cliente por nombre..."
                      value={customerSearch}
                      onChange={e => { setCustomerSearch(e.target.value); setShowCustomerResults(true); }}
                      onFocus={() => setShowCustomerResults(true)}
                    />
                    {showCustomerResults && filteredCustomers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                        {filteredCustomers.map(c => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setShowCustomerResults(false); }}
                            className="w-full flex justify-between items-center px-md py-sm hover:bg-secondary/10 transition-colors border-b border-outline-variant/10 last:border-0 text-left"
                          >
                            <span className="text-body-md font-bold">{c.first_name} {c.last_name}</span>
                            {c.phone && <span className="text-caption text-on-surface-variant">{c.phone}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!showNewCustomerForm && (
                    <button
                      type="button"
                      onClick={() => setShowNewCustomerForm(true)}
                      className="text-caption font-bold text-secondary hover:underline"
                    >
                      + Crear cliente nuevo
                    </button>
                  )}
                </>
              )}

              {showNewCustomerForm && (
                <div className="bg-white rounded-lg p-md border border-secondary/20 space-y-sm">
                  <input
                    className="w-full px-md py-2 border border-outline-variant rounded-lg text-body-md"
                    placeholder="Nombre"
                    value={newFirstName}
                    onChange={e => setNewFirstName(e.target.value)}
                  />
                  <input
                    className="w-full px-md py-2 border border-outline-variant rounded-lg text-body-md"
                    placeholder="Apellido"
                    value={newLastName}
                    onChange={e => setNewLastName(e.target.value)}
                  />
                  <input
                    className="w-full px-md py-2 border border-outline-variant rounded-lg text-body-md"
                    placeholder="Teléfono (opcional)"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                  />
                  <div className="flex gap-sm">
                    <button
                      onClick={handleCreateCustomer}
                      disabled={!newFirstName.trim() || !newLastName.trim() || creatingCustomer}
                      className="flex-1 py-2 bg-secondary text-white rounded-lg font-bold text-caption disabled:opacity-40"
                    >
                      {creatingCustomer ? 'Creando...' : 'Guardar Cliente'}
                    </button>
                    <button
                      onClick={() => setShowNewCustomerForm(false)}
                      className="flex-1 py-2 border border-outline-variant rounded-lg font-bold text-caption"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && <p className="text-error text-caption mt-sm">{errorMsg}</p>}

          <button
            onClick={finishSale}
            disabled={cart.length === 0 || !selectedPayment || saving || needsCustomer}
            className="w-full mt-md py-4 bg-primary text-white rounded-lg text-headline-md font-bold flex items-center justify-center gap-sm hover:opacity-90 transition-all active:scale-95 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Registrando...' : needsCustomer ? 'Seleccioná un cliente' : 'Finalizar Venta'}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed bottom-lg right-lg bg-primary text-white px-lg py-base rounded-xl shadow-2xl flex items-center gap-base z-50">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="text-label-md font-bold">
            {saleNumber ? `Venta ${saleNumber} registrada con exito` : 'Venta registrada con exito'}
          </span>
        </div>
      )}
    </div>
  );
}