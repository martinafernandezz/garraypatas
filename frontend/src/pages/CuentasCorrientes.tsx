import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiIntegrado } from '../services/apiIntegrado';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  pendingTotal: number;
  salesCount: number;
}

interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  kg_quantity?: number;
  unit_price: number;
  subtotal: number;
  talle?: string;
}

interface CustomerSale {
  id: number;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: 'paid' | 'pending';
  discount_label?: string;
  created_at: string;
}

const fmt = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    'efectivo': '💵 Efectivo',
    'debito': '🏦 Débito',
    'transferencia': '📱 Transferencia',
    'credito': '💳 Crédito',
    'cuenta_corriente': '📒 Cta. Cte.'
  };
  return labels[method] || method;
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-AR');
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

export default function CuentasCorrientes() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<CustomerSale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<SaleItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const loadCustomers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await apiIntegrado.getCustomers(token);
      setCustomers((data || []).map((c: any) => ({
        ...c,
        pendingTotal: Number(c.pendingTotal) || 0,
        salesCount: Number(c.salesCount) || 0,
      })));
    } catch (error) {
      console.warn('Error cargando clientes', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [token]);

  const filtered = customers.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const handleCreateCustomer = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) return;
    setCreating(true);
    setErrorMsg('');
    const result = await apiIntegrado.createCustomer(token, {
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      phone: newPhone.trim() || null,
    });
    setCreating(false);

    if (result) {
      setShowNewCustomer(false);
      setNewFirstName('');
      setNewLastName('');
      setNewPhone('');
      await loadCustomers();
    } else {
      setErrorMsg('Error al crear el cliente. Intenta de nuevo.');
    }
  };

  const openCustomer = async (c: Customer) => {
    setSelectedCustomer(c);
    setLoadingSales(true);
    try {
      const data = await apiIntegrado.getCustomerSales(token, c.id);
      setCustomerSales(data || []);
    } finally {
      setLoadingSales(false);
    }
  };

  const toggleSaleDetails = async (saleId: number) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      setExpandedItems([]);
      return;
    }
    setExpandedSaleId(saleId);
    setLoadingItems(true);
    try {
      const items = await apiIntegrado.getSaleDetails(token, saleId);
      setExpandedItems(items || []);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleMarkPaid = async (saleId: number) => {
    const result = await apiIntegrado.markSalePaymentStatus(token, saleId, 'paid');
    if (result) {
      setCustomerSales(prev => prev.map(s => s.id === saleId ? { ...s, payment_status: 'paid' } : s));
      await loadCustomers();
    }
  };

  const inputCls = 'w-full bg-background border border-secondary/20 rounded-lg p-base text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

  return (
    <div className="p-md flex flex-col gap-lg">
      {isLoading && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-md text-center text-primary">
          Cargando clientes...
        </div>
      )}

      {errorMsg && (
        <div className="bg-error-container/30 border border-error/20 rounded-lg p-md text-center text-error font-bold">
          {errorMsg}
        </div>
      )}

      <section className="flex flex-col md:flex-row justify-between items-end gap-md">
        <div className="flex flex-col gap-xs w-full md:w-auto">
          <label className="text-caption font-bold text-on-surface-variant uppercase tracking-wider">Buscar</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
            <input
              className="pl-10 pr-4 py-sm bg-surface rounded-full border border-outline-variant focus:outline-none focus:border-primary text-body-md w-56"
              placeholder="Nombre o teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => setShowNewCustomer(true)}
          className="flex items-center gap-xs px-lg py-sm bg-primary-container text-white font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          Nuevo Cliente
        </button>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/20">
                <th className="px-md py-base text-label-md">Cliente</th>
                <th className="px-md py-base text-label-md">Teléfono</th>
                <th className="px-md py-base text-label-md text-center">Ventas</th>
                <th className="px-md py-base text-label-md text-right">Pendiente</th>
                <th className="px-md py-base text-label-md text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filtered.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={5} className="px-md py-xl text-center text-on-surface-variant opacity-50">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-md py-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded-lg bg-tertiary-fixed/30 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>person</span>
                      </div>
                      <span className="font-bold text-on-surface">{c.first_name} {c.last_name}</span>
                    </div>
                  </td>
                  <td className="px-md py-md text-on-surface-variant">{c.phone || '-'}</td>
                  <td className="px-md py-md text-center">{c.salesCount}</td>
                  <td className="px-md py-md text-right font-bold">
                    {c.pendingTotal > 0 ? (
                      <span className="text-error">{fmt(c.pendingTotal)}</span>
                    ) : (
                      <span className="text-on-surface-variant">{fmt(0)}</span>
                    )}
                  </td>
                  <td className="px-md py-md text-center">
                    <button
                      onClick={() => openCustomer(c)}
                      className="px-md py-sm bg-primary text-white rounded-lg text-caption font-bold hover:opacity-90 transition-opacity"
                    >
                      Ver Cuenta
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-md py-md bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between">
          <span className="text-label-md text-on-surface-variant">Mostrando {filtered.length} de {customers.length} clientes</span>
        </div>
      </section>

      {/* Modal Nuevo Cliente */}
      {showNewCustomer && (
        <>
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-20" onClick={() => setShowNewCustomer(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-30 p-md">
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md p-lg space-y-md">
              <div className="flex items-center justify-between">
                <h2 className="text-headline-md font-bold text-primary">Nuevo Cliente</h2>
                <button className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors" onClick={() => setShowNewCustomer(false)}>
                  close
                </button>
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Nombre</label>
                <input className={inputCls} value={newFirstName} onChange={e => setNewFirstName(e.target.value)} placeholder="Ej. Martina" />
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Apellido</label>
                <input className={inputCls} value={newLastName} onChange={e => setNewLastName(e.target.value)} placeholder="Ej. Fernandez" />
              </div>

              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Teléfono (opcional)</label>
                <input className={inputCls} value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Ej. 2474-123-456" />
              </div>

              <div className="flex gap-sm pt-base">
                <button
                  onClick={handleCreateCustomer}
                  disabled={!newFirstName.trim() || !newLastName.trim() || creating}
                  className="flex-1 bg-primary text-white py-sm rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                >
                  <span className="material-symbols-outlined">save</span>
                  {creating ? 'Guardando...' : 'Guardar Cliente'}
                </button>
                <button
                  onClick={() => setShowNewCustomer(false)}
                  className="flex-1 border border-outline-variant text-on-surface-variant py-sm rounded-lg font-bold hover:bg-surface active:scale-95 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Drawer Cuenta del Cliente */}
      {selectedCustomer && (
        <>
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-40" onClick={() => setSelectedCustomer(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface shadow-2xl z-50 flex flex-col overflow-y-auto">
            <div className="p-md border-b border-outline-variant/20 flex items-center justify-between sticky top-0 bg-surface">
              <div>
                <h2 className="text-headline-md font-bold text-primary">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </h2>
                {selectedCustomer.phone && (
                  <p className="text-caption text-on-surface-variant">{selectedCustomer.phone}</p>
                )}
              </div>
              <button
                className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors"
                onClick={() => setSelectedCustomer(null)}
              >
                close
              </button>
            </div>

            <div className="p-md">
              <div className="bg-error/5 border border-error/20 rounded-lg p-md text-center mb-md">
                <p className="text-caption text-on-surface-variant">Total pendiente</p>
                <p className="text-headline-md font-bold text-error">{fmt(selectedCustomer.pendingTotal)}</p>
              </div>

              <h3 className="text-label-md font-bold text-primary uppercase tracking-wider mb-sm">Historial de compras</h3>

              {loadingSales ? (
                <p className="text-caption text-on-surface-variant text-center py-md">Cargando ventas...</p>
              ) : customerSales.length === 0 ? (
                <p className="text-caption text-on-surface-variant text-center py-md">Este cliente todavía no tiene ventas registradas.</p>
              ) : (
                <div className="space-y-sm">
                  {customerSales.map(s => (
                    <div key={s.id} className="bg-surface-container-low rounded-lg p-md border border-outline-variant/10">
                      <div className="flex justify-between items-start mb-xs">
                        <div>
                          <p className="font-mono font-bold text-primary text-body-md">{s.sale_number}</p>
                          <p className="text-caption text-on-surface-variant">
                            {formatDate(s.created_at)} {formatTime(s.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-body-lg font-bold text-primary">{fmt(s.total_amount)}</p>
                          {s.payment_status === 'pending' ? (
                            <span className="px-sm py-xs bg-error-container/30 text-error text-caption font-bold rounded-full">Pendiente</span>
                          ) : (
                            <span className="px-sm py-xs bg-primary/10 text-primary text-caption font-bold rounded-full">Pagado</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-caption text-on-surface-variant">{getPaymentMethodLabel(s.payment_method)}</span>
                        <div className="flex gap-xs">
                          <button
                            onClick={() => toggleSaleDetails(s.id)}
                            className="px-md py-xs border border-outline-variant text-on-surface-variant rounded-lg text-caption font-bold hover:bg-surface-variant transition-colors"
                          >
                            {expandedSaleId === s.id ? 'Ocultar' : 'Ver Detalle'}
                          </button>
                          {s.payment_status === 'pending' && (
                            <button
                              onClick={() => handleMarkPaid(s.id)}
                              className="px-md py-xs border border-primary text-primary rounded-lg text-caption font-bold hover:bg-primary/10 transition-colors"
                            >
                              Marcar pagado
                            </button>
                          )}
                        </div>
                      </div>

                      {expandedSaleId === s.id && (
                        <div className="mt-sm pt-sm border-t border-outline-variant/20 space-y-xs">
                          {loadingItems ? (
                            <p className="text-caption text-on-surface-variant">Cargando productos...</p>
                          ) : expandedItems.length === 0 ? (
                            <p className="text-caption text-on-surface-variant">No se encontraron productos para esta venta.</p>
                          ) : (
                            expandedItems.map(item => (
                              <div key={item.id} className="flex justify-between items-start text-caption">
                                <div>
                                  <p className="font-bold text-on-surface">
                                    {item.product_name}{item.talle ? ` - Talle ${item.talle}` : ''}
                                  </p>
                                  <p className="text-on-surface-variant">
                                    {item.quantity ? `${item.quantity} unidad${item.quantity !== 1 ? 'es' : ''}` : `${item.kg_quantity} kilos`}
                                  </p>
                                </div>
                                <p className="font-bold">{fmt(item.subtotal)}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}