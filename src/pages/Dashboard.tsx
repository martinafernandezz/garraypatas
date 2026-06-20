import { Page } from '../types';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const recentSales = [
  { id: '#GP-9842', time: '14:20', total: '$1,250.00', status: 'Completado', statusColor: 'bg-secondary-container/30 text-secondary' },
  { id: '#GP-9841', time: '13:55', total: '$3,400.00', status: 'Completado', statusColor: 'bg-secondary-container/30 text-secondary' },
  { id: '#GP-9840', time: '13:15', total: '$850.00', status: 'Pendiente', statusColor: 'bg-tertiary-fixed/30 text-tertiary' },
  { id: '#GP-9839', time: '12:47', total: '$2,100.00', status: 'Completado', statusColor: 'bg-secondary-container/30 text-secondary' },
];

const stockAlerts = [
  { name: 'Alimento Senior 15kg', remaining: 2 },
  { name: 'Snacks Dentales Pack 50', remaining: 5 },
  { name: 'Pipetas Antipulgas (4 dosis)', remaining: 5 },
  { name: 'Shampoo Avena 500ml', remaining: 7 },
];

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const displayName = user?.fullName || 'Marcelo';

  return (
    <div className="p-margin-desktop space-y-xl">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-xl bg-primary-container p-xl text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-headline-xl font-bold mb-base text-white">¡Hola, {displayName}!</h1>
          <p className="text-body-lg opacity-90 max-w-2xl text-white">Bienvenido de nuevo a Garra y Patas. Aquí está el resumen de hoy.</p>
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
            <h3 className="text-headline-lg font-bold text-primary">$42,850.00</h3>
            <p className="text-primary font-bold text-caption mt-base flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
              +12% vs ayer
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary flex-shrink-0">
            <span className="material-symbols-outlined">monetization_on</span>
          </div>
        </div>

        {/* Alertas de Bajo Stock */}
        <div className="bg-surface-container rounded-xl p-md border border-outline-variant/20 flex items-start justify-between">
          <div>
            <p className="text-on-surface-variant text-label-md font-bold mb-xs">Bajo Stock</p>
            <h3 className="text-headline-lg font-bold text-error">14 Artículos</h3>
            <p className="text-error font-bold text-caption mt-base">Acción requerida</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-on-surface-variant text-label-md border-b border-outline-variant/10">
                <tr>
                  <th className="py-sm">ID</th>
                  <th className="py-sm">Hora</th>
                  <th className="py-sm">Total</th>
                  <th className="py-sm">Estado</th>
                </tr>
              </thead>
              <tbody className="text-body-md">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-outline-variant/10 hover:bg-surface-variant/20 transition-colors">
                    <td className="py-sm font-bold text-primary">{sale.id}</td>
                    <td className="py-sm text-on-surface-variant">{sale.time}</td>
                    <td className="py-sm font-bold">{sale.total}</td>
                    <td className="py-sm">
                      <span className={`px-2 py-1 rounded text-caption font-bold ${sale.statusColor}`}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Status */}
        <div className="lg:col-span-4 bg-surface-container-low rounded-xl border border-outline-variant/20 p-md">
          <h3 className="text-headline-md font-bold mb-lg">Estado de Stock</h3>
          <div className="space-y-sm">
            {stockAlerts.map((item) => (
              <div key={item.name} className="flex items-center gap-sm p-base bg-surface rounded border border-outline-variant/10">
                <div className="w-10 h-10 rounded bg-error-container/20 flex items-center justify-center text-error flex-shrink-0">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-label-md font-bold truncate">{item.name}</p>
                  <p className="text-caption text-error font-bold">Quedan {item.remaining} unidades</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
