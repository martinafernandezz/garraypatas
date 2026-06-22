import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Complete todos los campos');
      return;
    }
    const ok = login(username.trim(), password);
    if (ok) {
      onLogin();
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-md">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-xl">
          <div className="flex items-center gap-sm mb-xs">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: '56px', fontVariationSettings: "'FILL' 1" }}
            >
              pets
            </span>
            <span className="text-[32px] font-bold text-primary leading-tight">Garra y Patas</span>
          </div>
          <span className="text-caption text-on-surface-variant">Petshop</span>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 shadow-lg p-xl">
          <h2 className="text-headline-md font-bold text-primary mb-lg text-center">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="space-y-xs">
              <label className="text-label-md font-bold text-primary">Usuario</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>
                  person
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Ingrese su usuario"
                  className="w-full bg-background border border-secondary/20 rounded-lg p-base pl-10 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-xs">
              <label className="text-label-md font-bold text-primary">Contraseña</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  className="w-full bg-background border border-secondary/20 rounded-lg p-base pl-10 pr-10 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-base top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-error-container/30 border border-error/20 rounded-lg p-sm flex items-center gap-sm">
                <span className="material-symbols-outlined text-error" style={{ fontSize: '18px' }}>error</span>
                <span className="text-caption text-error font-bold">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-md bg-primary-container text-white rounded-lg font-bold text-body-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-sm"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
