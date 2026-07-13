import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

interface NavItem {
  page: Page;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { page: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { page: 'ventas', icon: 'point_of_sale', label: 'Ventas' },
  { page: 'historial', icon: 'receipt_long', label: 'Historial' },
  { page: 'cuentas-corrientes', icon: 'account_balance_wallet', label: 'Cuentas Corrientes' },
  { page: 'productos', icon: 'inventory_2', label: 'Productos' },
  { page: 'categorias', icon: 'category', label: 'Categorías' },
  { page: 'precios', icon: 'payments', label: 'Precios' },
];

export default function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container border-r border-outline-variant/20 flex flex-col py-sm px-sm z-20">
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex flex-col items-center gap-xs px-base py-sm mb-sm cursor-pointer hover:opacity-80 transition-opacity w-full flex-shrink-0"
      >
        <div className="flex items-center gap-sm">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '52px', fontVariationSettings: "'FILL' 1" }}
          >
            pets
          </span>
          <span className="text-[28px] font-bold text-primary leading-tight whitespace-nowrap">GarrayPatas</span>
        </div>
        <span className="text-caption text-on-surface-variant">Petshop</span>
      </button>

      <div
        className="flex-grow min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden flex flex-col"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <nav className="space-y-xs">
          {navItems.map(({ page, icon, label }) => {
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`w-full flex items-center gap-sm px-base py-sm rounded-lg transition-all text-left ${
                  isActive
                    ? 'text-primary font-bold border-r-4 border-primary bg-secondary-container/30'
                    : 'text-on-surface-variant hover:text-primary hover:bg-tertiary-fixed/20'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {icon}
                </span>
                <span className="text-body-md">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-lg border-t border-outline-variant/20 space-y-xs">
          <button
            onClick={() => onNavigate('ventas')}
            className="w-full bg-primary-container text-white py-sm rounded-lg font-bold mb-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-body-md">add</span>
            Nueva Venta
          </button>
          <button
            onClick={() => onNavigate('ajustes')}
            className={`w-full flex items-center gap-sm px-base py-sm rounded-lg transition-colors ${
              currentPage === 'ajustes'
                ? 'text-primary font-bold border-r-4 border-primary bg-secondary-container/30'
                : 'text-on-surface-variant hover:text-primary hover:bg-tertiary-fixed/20'
            }`}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-body-md">Ajustes</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-sm px-base py-sm text-on-surface-variant hover:text-error transition-colors hover:bg-error-container/20 rounded-lg"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-body-md">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}