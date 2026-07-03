import { useState, useEffect } from 'react';
import { Page } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiIntegrado } from '../services/apiIntegrado';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

interface Sale {
  id: number;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  user_name: string;
}

interface Product {
  id: number;
  name: string;
  stock: number;
  maxStock: number;
  alertThreshold: number;
  isBulk: boolean;
  currentKgStock?: number;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user, token } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos del backend
  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        // Cargar ventas
        const remoteSales = await apiIntegrado.getSales(token);
        if (remoteSales && remoteSales.length > 0) {
          setSales(remoteSales);
        }

        // Cargar productos
        const remoteProducts = await apiIntegrado.getProducts(token);
        if (remoteProducts && remoteProducts.length > 0) {
          setProducts(remoteProducts);
        }
      } catch (error) {
        console.warn('Error cargando datos del dashboard', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [token]);

  const displayName = user?.fullName || 'Usuario';

  // Calcular ventas de hoy
const now = new Date();
const salesToday = sales.filter(s => {
  const d = new Date(s.created_at);
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
});
const totalToday = salesToday.reduce((sum, s) => sum + Number(s.total_amount), 0);


  // Obtener productos con bajo stock
  const lowStockProducts =  products.filter((p: any) => {
  const isBulk = p.isBulk === 1 || p.isBulk === true;
  if (isBulk) return Number(p.currentKgStock ?? p.current_kg_stock ?? 0) <= 2;
  return p.stock <= 2;
});

  // Obtener últimas 4 ventas
  const recentSales = sales.slice(0, 4);

 const fmt = (n: number | string) => {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS',
    minimumFractionDigits: 2 
  }).format(num || 0);
};

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'efectivo': '💵 Efectivo',
      'debito': '🏦 Débito',
      'transferencia': '📱 Transferencia',
      'credito': '💳 Crédito'
    };
    return labels[method] || method;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-margin-desktop space-y-xl">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-xl bg-primary-container p-xl text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-headline-xl font-bold mb-base text-white">¡Hola, {displayName}!</h1>
          <p className="text-body-lg opacity-90 max-w-2xl text-white">Bienvenido de nuevo. Aquí está el resumen de hoy.</p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-y-1/4 translate-x-1/4">
          <span className="material-symbols-outlined" style={{ fontSize: '300px', fontVariationSettings: "'FILL' 1" }}>pets</span>
        </div>
      </section>

      {/* KPI + Action Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Ventas de Hoy */}
        <div className="bg-surface-container rounded-xl p-md border border-outline-variant/20 flex items-start justify-between">
          <div>
            <p className="text-on-surface-variant text-label-md font-bold mb-xs">Ventas de Hoy</p>
            {isLoading ? (
              <h3 className="text-headline-lg font-bold text-primary animate-pulse">Cargando...</h3>
            ) : (
              <>
                <h3 className="text-headline-lg font-bold text-primary">{fmt(totalToday)}</h3>
                <p className="text-primary font-bold text-caption mt-base">
                  {salesToday.length} {salesToday.length === 1 ? 'venta' : 'ventas'}
                </p>
              </>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary flex-shrink-0">
            <span className="material-symbols-outlined">monetization_on</span>
          </div>
        </div>

        {/* Alertas de Bajo Stock */}
        <div className="bg-surface-container rounded-xl p-md border border-outline-variant/20 flex items-start justify-between">
          <div>
            <p className="text-on-surface-variant text-label-md font-bold mb-xs">Bajo Stock</p>
            {isLoading ? (
              <h3 className="text-headline-lg font-bold text-error animate-pulse">Cargando...</h3>
            ) : (
              <>
                <h3 className="text-headline-lg font-bold text-error">{lowStockProducts.length} Artículos</h3>
                {lowStockProducts.length > 0 && (
                  <p className="text-error font-bold text-caption mt-base">Acción requerida</p>
                )}
              </>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg bg-error-container/50 flex items-center justify-center text-error flex-shrink-0">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
        </div>

        {/* Nueva Venta Card */}
        <button
          onClick={() => onNavigate('ventas')}
          className="bg-primary text-white rounded-xl p-md flex items-start justify-between hover:opacity-90 transition-all active:scale-95 shadow-md group cursor-pointer"
        >
          <div className="text-left">
            <p className="text-white/80 text-label-md font-bold mb-xs">Acción Rápida</p>
            <h3 className="text-headline-md font-bold text-white">Nueva Venta</h3>
            <p className="text-white/70 text-caption mt-base">Abrir terminal POS</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-white">point_of_sale</span>
          </div>
        </button>

        {/* Cargar Producto Card */}
        <button
          onClick={() => onNavigate('cargar-producto')}
          className="bg-secondary text-white rounded-xl p-md flex items-start justify-between hover:opacity-90 transition-all active:scale-95 shadow-md group cursor-pointer"
        >
          <div className="text-left">
            <p className="text-white/80 text-label-md font-bold mb-xs">Acción Rápida</p>
            <h3 className="text-headline-md font-bold text-white">Cargar Producto</h3>
            <p className="text-white/70 text-caption mt-base">Agregar al inventario</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-white">library_add</span>
          </div>
        </button>
      </section>

      {/* Bottom Section: Recent Sales + Stock Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Recent Sales */}
        <div className="lg:col-span-8 bg-surface-container-low rounded-xl border border-outline-variant/20 p-md">
          <div className="flex items-center justify-between mb-lg">
            <h3 className="text-headline-md font-bold">Ventas Recientes</h3>
            <button
              onClick={() => onNavigate('historial')}
              className="text-primary font-bold text-label-md hover:underline"
            >
              Ver todas
            </button>
          </div>

          {isLoading ? (
            <p className="text-on-surface-variant text-center py-md">Cargando ventas...</p>
          ) : recentSales.length === 0 ? (
            <p className="text-on-surface-variant text-center py-md">No hay ventas registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-on-surface-variant text-label-md border-b border-outline-variant/10">
                  <tr>
                    <th className="py-sm">ID Venta</th>
                    <th className="py-sm">Hora</th>
                    <th className="py-sm">Método Pago</th>
                    <th className="py-sm">Total</th>
                  </tr>
                </thead>
                <tbody className="text-body-md">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-outline-variant/10 hover:bg-surface-variant/20 transition-colors">
                      <td className="py-sm font-bold text-primary">{sale.sale_number}</td>
                      <td className="py-sm text-on-surface-variant">{formatTime(sale.created_at)}</td>
                      <td className="py-sm">
                        <span className="px-2 py-1 rounded text-caption font-bold bg-secondary-container/30 text-secondary">
                          {getPaymentMethodLabel(sale.payment_method)}
                        </span>
                      </td>
                      <td className="py-sm font-bold text-primary">{fmt(sale.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stock Status */}
        <div className="lg:col-span-4 bg-surface-container-low rounded-xl border border-outline-variant/20 p-md">
          <h3 className="text-headline-md font-bold mb-lg">Estado de Stock</h3>
          {isLoading ? (
            <p className="text-on-surface-variant text-center py-md">Cargando productos...</p>
          ) : lowStockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-lg text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl text-green-500 mb-md">check_circle</span>
              <p className="font-bold">¡Todo en orden!</p>
              <p className="text-caption">Todos los productos tienen stock suficiente</p>
            </div>
          ) : (
            <div className="space-y-sm">
              {lowStockProducts.map((item) => (
                <div key={item.id} className="flex items-center gap-sm p-base bg-surface rounded border border-outline-variant/10">
                  <div className="w-10 h-10 rounded bg-error-container/20 flex items-center justify-center text-error flex-shrink-0">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-label-md font-bold truncate">{item.name}</p>
                    {item.isBulk ? (
                      <p className="text-caption text-error font-bold">
                       Quedan {Number(item.currentKgStock).toFixed(2)} kg
                      </p>
                    ) : (
                      <p className="text-caption text-error font-bold">
                        Quedan {item.stock} unidad{item.stock === 1 ? '' : 'es'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
