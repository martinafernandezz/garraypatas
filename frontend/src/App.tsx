import { useState, useCallback } from 'react';
import { Page } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import NuevaVenta from './pages/NuevaVenta';
import Historial from './pages/Historial';
import Productos from './pages/Productos';
import CargarProducto from './pages/CargarProducto';
import Precios from './pages/Precios';
import Ajustes from './pages/Ajustes';
import Categorias from './pages/Categorias';
import Login from './pages/Login';
import CuentasCorrientes from './pages/CuentasCorrientes';


function AppContent() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [logoutToast, setLogoutToast] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    setLogoutToast(true);
    setTimeout(() => setLogoutToast(false), 3000);
  }, [logout]);

  if (!user) {
    return (
      <>
        <Login onLogin={() => setCurrentPage('dashboard')} />
        {logoutToast && (
          <div className="fixed bottom-lg right-lg bg-primary text-white px-lg py-base rounded-xl shadow-2xl flex items-center gap-base z-50">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="text-label-md font-bold">Has salido de tu sesión</span>
          </div>
        )}
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'ventas': return <NuevaVenta />;
      case 'historial': return <Historial />;
      case 'productos': return <Productos onNavigate={setCurrentPage} />;
      case 'cargar-producto': return <CargarProducto />;
      case 'precios': return <Precios />;
      case 'ajustes': return <Ajustes />;
      case 'categorias': return <Categorias />;
      case 'cuentas-corrientes': return <CuentasCorrientes />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
      <div className="ml-64 flex flex-col min-h-screen">
        <TopBar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
        <main className="flex-grow overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
