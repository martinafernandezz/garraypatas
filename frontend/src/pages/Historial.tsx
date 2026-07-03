import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiIntegrado } from '../services/apiIntegrado';
import html2canvas from 'html2canvas';

interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  kg_quantity?: number;
  unit_price: number;
  subtotal: number;
}

interface Sale {
  id: number;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  installments: number;
  discount_type?: string;
  discount_value?: number;
  discount_label?: string;
  status: string;
  created_at: string;
  user_name: string;
}

interface SaleDetail extends Sale {
  items?: SaleItem[];
}

export default function Historial() {
  const { token } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Cargar ventas del backend
  useEffect(() => {
    const loadSales = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const remoteSales = await apiIntegrado.getSales(token);
        if (remoteSales && remoteSales.length > 0) {
          setSales(remoteSales);
          setFilteredSales(remoteSales);
        }
      } catch (error) {
        console.warn('Error cargando historial', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSales();
  }, [token]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...sales];

    // Filtro por búsqueda (ID o usuario)
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por método de pago
    if (paymentFilter !== 'todos') {
      filtered = filtered.filter(s => s.payment_method === paymentFilter);
    }

    // Filtro por fecha inicial
    if (startDate) {
      filtered = filtered.filter(s => new Date(s.created_at) >= new Date(startDate));
    }

    // Filtro por fecha final
    if (endDate) {
      filtered = filtered.filter(s => new Date(s.created_at) <= new Date(endDate));
    }

    setFilteredSales(filtered);
  }, [searchTerm, paymentFilter, startDate, endDate, sales]);

  // Cargar detalles de una venta
  const loadSaleDetails = async (saleId: number) => {
    if (!token) return;

    setIsLoadingDetail(true);
    try {
      const saleIndex = sales.findIndex(s => s.id === saleId);
      const sale = sales[saleIndex];

      // Obtener items de la venta
      const response = await fetch(`http://localhost:5000/api/sales/${saleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const items = await response.json();
        setSelectedSale({
          ...sale,
          items: items
        });
      }
    } catch (error) {
      console.warn('Error cargando detalles de venta', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Función para imprimir comprobante
  const handlePrint = async () => {
    if (!selectedSale) return;

    try {
      const element = document.getElementById('comprobante-print');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Comprobante_${selectedSale.sale_number}.png`;
      link.click();
    } catch (error) {
      console.error('Error al generar comprobante', error);
    }
  };

  const fmt = (n: number) =>  `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'efectivo': '💵 Efectivo',
      'debito': '🏦 Débito',
      'transferencia': '📱 Transferencia',
      'credito': '💳 Crédito'
    };
    return labels[method] || method;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-md flex flex-col gap-lg">
      <h1 className="text-headline-lg font-bold text-primary">Historial de Ventas</h1>

      {/* Filtros */}
      <div className="bg-surface-container rounded-xl border border-outline-variant/30 p-md grid grid-cols-2 gap-md md:grid-cols-4">
        <div>
          <label className="block text-label-md font-bold text-primary mb-xs">Buscar</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
            <input
              type="text"
              placeholder="ID venta o usuario"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-sm bg-background border border-secondary/20 rounded-lg text-body-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-label-md font-bold text-primary mb-xs">Método Pago</label>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="w-full bg-background border border-secondary/20 rounded-lg p-sm text-body-md"
          >
            <option value="todos">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="debito">Débito</option>
            <option value="transferencia">Transferencia</option>
            <option value="credito">Crédito</option>
          </select>
        </div>

        <div>
          <label className="block text-label-md font-bold text-primary mb-xs">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-background border border-secondary/20 rounded-lg p-sm text-body-md"
          />
        </div>

        <div>
          <label className="block text-label-md font-bold text-primary mb-xs">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full bg-background border border-secondary/20 rounded-lg p-sm text-body-md"
          />
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-md">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-md text-center">
          <p className="text-caption text-on-surface-variant">Total Ventas</p>
          <p className="text-headline-sm font-bold text-primary">{filteredSales.length}</p>
        </div>
        <div className="bg-tertiary/10 border border-tertiary/20 rounded-lg p-md text-center">
          <p className="text-caption text-on-surface-variant">Monto Total</p>
          <p className="text-headline-sm font-bold text-tertiary">
            {fmt(filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0))}
          </p>
        </div>
        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-md text-center">
          <p className="text-caption text-on-surface-variant">Promedio Venta</p>
          <p className="text-headline-sm font-bold text-secondary">
            {filteredSales.length > 0 
  ? fmt(filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0) / filteredSales.length)
  : fmt(0)}
          </p>
        </div>
      </div>

      {/* Tabla de ventas */}
      {isLoading ? (
        <div className="text-center p-md text-on-surface-variant">Cargando ventas...</div>
      ) : filteredSales.length === 0 ? (
        <div className="text-center p-md text-on-surface-variant">No hay ventas</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/20">
                  <th className="px-md py-base text-label-md">ID Venta</th>
                  <th className="px-md py-base text-label-md">Usuario</th>
                  <th className="px-md py-base text-label-md">Método Pago</th>
                  <th className="px-md py-base text-label-md">Fecha y Hora</th>
                  <th className="px-md py-base text-label-md">Monto</th>
                  <th className="px-md py-base text-label-md">Descuento</th>
                  <th className="px-md py-base text-label-md">Total</th>
                  <th className="px-md py-base text-label-md">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-md py-md">
                      <span className="font-mono font-bold text-primary">{sale.sale_number}</span>
                    </td>
                    <td className="px-md py-md">{sale.user_name}</td>
                    <td className="px-md py-md">
                      <span className="px-sm py-xs bg-secondary-container/20 text-secondary text-caption font-bold rounded-full">
                        {getPaymentMethodLabel(sale.payment_method)}
                      </span>
                    </td>
                    <td className="px-md py-md text-caption text-on-surface-variant">
                      {formatDate(sale.created_at)} {formatTime(sale.created_at)}
                    </td>
                    <td className="px-md py-md font-bold">{fmt(Number(sale.total_amount) + Number(sale.discount_value || 0))}</td>
                    <td className="px-md py-md">
                      {sale.discount_label ? (
                        <span className="text-caption text-green-700 font-bold">{sale.discount_label}</span>
                      ) : (
                        <span className="text-caption text-on-surface-variant">-</span>
                      )}
                    </td>
                    <td className="px-md py-md font-bold text-primary text-body-lg">
                      {fmt(sale.total_amount)}
                    </td>
                    <td className="px-md py-md">
                      <button
                        onClick={() => loadSaleDetails(sale.id)}
                        className="px-md py-sm bg-primary text-white rounded-lg text-caption font-bold hover:opacity-90 transition-opacity"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Venta */}
      {selectedSale && (
        <>
          <div 
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-40"
            onClick={() => setSelectedSale(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-surface shadow-2xl z-50 flex flex-col overflow-y-auto">
            {/* Encabezado */}
            <div className="p-md border-b border-outline-variant/20 flex items-center justify-between sticky top-0 bg-surface">
              <h2 className="text-headline-md font-bold text-primary">Detalle de Venta</h2>
              <button
                className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors"
                onClick={() => setSelectedSale(null)}
              >
                close
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-lg">
                <p className="text-on-surface-variant">Cargando detalles...</p>
              </div>
            ) : (
              <>
                {/* Contenido imprimible */}
                <div id="comprobante-print" className="flex-grow p-md space-y-md">
                  {/* Encabezado */}
                  <div className="bg-primary-container text-white p-md rounded-lg">
                    <h3 className="text-headline-sm font-bold">COMPROBANTE DE VENTA</h3>
                    <p className="text-label-md mt-xs">{selectedSale.sale_number}</p>
                  </div>

                  {/* Información General */}
                  <div className="bg-surface-container-low p-md rounded-lg space-y-sm">
                    <div>
                      <p className="text-caption text-on-surface-variant">ID DE TRANSACCIÓN</p>
                      <p className="text-body-lg font-bold text-primary">{selectedSale.sale_number}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                      <div>
                        <p className="text-caption text-on-surface-variant">Fecha</p>
                        <p className="text-body-md font-bold">{formatDate(selectedSale.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-caption text-on-surface-variant">Hora</p>
                        <p className="text-body-md font-bold">{formatTime(selectedSale.created_at)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                      <div>
                        <p className="text-caption text-on-surface-variant">Vendedor</p>
                        <p className="text-body-md font-bold">{selectedSale.user_name}</p>
                      </div>
                      <div>
                        <p className="text-caption text-on-surface-variant">Método</p>
                        <p className="text-body-md font-bold">{getPaymentMethodLabel(selectedSale.payment_method)}</p>
                      </div>
                    </div>
                    <div>
                      <span className="inline-block px-md py-sm bg-secondary-container/30 text-secondary text-caption font-bold rounded-full">
                        {selectedSale.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Productos */}
                  {selectedSale.items && selectedSale.items.length > 0 && (
                    <div className="bg-surface-container-low p-md rounded-lg">
                      <h4 className="text-label-md font-bold text-primary mb-md">Productos</h4>
                      <div className="space-y-sm">
                        {selectedSale.items.map(item => (
                          <div key={item.id} className="flex justify-between items-start border-b border-outline-variant/10 pb-sm">
                            <div className="flex-1">
                              <p className="text-body-md font-bold">{item.product_name}</p>
                              <p className="text-caption text-on-surface-variant">
                                {item.quantity ? `${item.quantity} unidad${item.quantity !== 1 ? 'es' : ''}` : `${item.kg_quantity} kilos`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-caption text-on-surface-variant">{fmt(item.unit_price)}</p>
                              <p className="text-body-md font-bold">{fmt(item.subtotal)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Totales */}
                  <div className="bg-surface-container-low p-md rounded-lg space-y-sm border-t-2 border-outline-variant">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Subtotal:</span>
                      <span className="font-bold">{fmt(selectedSale.total_amount + (selectedSale.discount_value || 0))}</span>
                    </div>
                    {selectedSale.discount_value && selectedSale.discount_value > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>{selectedSale.discount_label}</span>
                        <span className="font-bold">-{fmt(selectedSale.discount_value)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-sm border-t border-outline-variant">
                      <span className="text-title-sm font-bold">Total:</span>
                      <span className="text-title-sm font-bold text-primary">{fmt(selectedSale.total_amount)}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center pt-md border-t border-outline-variant">
                    <p className="text-caption text-on-surface-variant">Gracias por su compra</p>
                  </div>
                </div>

                {/* Botón de impresión */}
                <div className="p-md bg-surface-container-low border-t border-outline-variant/20 flex gap-sm">
                  <button
                    onClick={handlePrint}
                    className="flex-1 bg-primary text-white py-sm rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined">print</span>
                    Imprimir Comprobante
                  </button>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="flex-1 border border-outline-variant text-on-surface-variant py-sm rounded-lg font-bold hover:bg-surface active:scale-95 transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
