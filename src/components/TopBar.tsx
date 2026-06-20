import { useState } from 'react';
import { Page } from '../types';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const pageTitles: Record<Page, string> = {
  dashboard: 'Dashboard',
  ventas: 'Terminal de Venta',
  historial: 'Historial de Ventas',
  productos: 'Gestión de Stock',
  'cargar-producto': 'Cargar Producto',
  precios: 'Actualización de Precios',
  ajustes: 'Ajustes',
  categorias: 'Categorías',
};

const tabs: { label: string; section: string }[] = [
  { label: 'Inicio', section: 'home' },
  { label: 'Inventario', section: 'inventory' },
  { label: 'Reportes', section: 'reports' },
];

const activeTab: Record<Page, string> = {
  dashboard: 'home',
  ventas: 'home',
  historial: 'reports',
  productos: 'inventory',
  'cargar-producto': 'inventory',
  precios: 'reports',
  ajustes: 'home',
  categorias: 'inventory',
};

export default function TopBar({ currentPage, onNavigate, onLogout }: TopBarProps) {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const currentTab = activeTab[currentPage];

  return (
    <header className="flex justify-between items-center px-md h-16 bg-surface-container-low border-b border-outline-variant/20 sticky top-0 z-10">
      <div className="flex items-center gap-lg">
        <h1 className="text-headline-md font-bold text-primary">{pageTitles[currentPage]}</h1>
        <nav className="hidden md:flex gap-md items-center">
          {tabs.map(tab => (
            <button
              key={tab.section}
              onClick={() => {
                if (tab.section === 'home') onNavigate('dashboard');
                if (tab.section === 'inventory') onNavigate('productos');
                if (tab.section === 'reports') onNavigate('historial');
              }}
              className={`text-label-md pb-1 transition-colors ${
                currentTab === tab.section
                  ? 'text-primary font-bold border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-sm bg-surface-container border border-outline-variant/20 px-sm py-xs rounded-full">
          <span className="material-symbols-outlined text-outline" style={{ fontSize: '20px' }}>search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-40 text-body-md placeholder:text-outline/60 outline-none"
            placeholder="Buscar..."
            type="text"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-label-md hover:opacity-90 transition-opacity"
          >
            {user ? user.fullName.charAt(0).toUpperCase() : 'M'}
          </button>
          {showProfile && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 top-10 w-64 bg-surface rounded-xl shadow-2xl border border-outline-variant/20 z-30 p-md">
                <div className="flex items-center gap-sm mb-md pb-md border-b border-outline-variant/10">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-label-md">
                    {user ? user.fullName.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-label-md font-bold truncate">{user ? user.fullName : 'Marcelo Gomez'}</p>
                    <p className="text-caption text-on-surface-variant truncate">{user ? user.email : 'marcelo@garra.com'}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowProfile(false); onLogout(); }}
                  className="w-full flex items-center gap-sm px-sm py-sm text-error hover:bg-error-container/20 rounded-lg transition-colors text-left"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                  <span className="text-body-md font-bold">Cerrar Sesión</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
