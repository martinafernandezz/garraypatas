import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiIntegrado } from '..//services/apiIntegrado'; 

export default function Ajustes() {

const { user, token, updateUser, updatePassword } = useAuth();
const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'perfil' | 'nuevo'>('perfil');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    email: user?.email || '',
  });

  const [pwdForm, setPwdForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [newForm, setNewForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => {
  const savedToken = localStorage.getItem('garra_auth_token');
  if (savedToken) {
    apiIntegrado.getUsers(savedToken).then(setDbUsers);
  }
}, []);

  const handleEditChange = (field: keyof typeof editForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handlePwdChange = (field: keyof typeof pwdForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPwdForm(prev => ({ ...prev, [field]: e.target.value }));
    setPwdError('');
    setPwdSuccess('');
  };

  const handleNewChange = (field: keyof typeof newForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewForm(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) return;
    if (!editForm.username.trim() || !editForm.fullName.trim() || !editForm.email.trim()) {
      setError('Complete todos los campos');
      return;
    }
    updateUser(user.id, {
      username: editForm.username.trim(),
      fullName: editForm.fullName.trim(),
      email: editForm.email.trim(),
    });
    setIsEditing(false);
    setSuccess('Perfil actualizado con éxito');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handlePwdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (!user) return;
    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmNewPassword) {
      setPwdError('Complete todos los campos');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmNewPassword) {
      setPwdError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    const ok = updatePassword(user.id, pwdForm.oldPassword, pwdForm.newPassword);
    if (!ok) {
      setPwdError('La contraseña anterior es incorrecta');
      return;
    }
    setPwdSuccess('Contraseña actualizada con éxito');
    setPwdForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    setTimeout(() => setPwdSuccess(''), 3000);
  };

  const handleNewSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  if (!newForm.username.trim() || !newForm.fullName.trim() || !newForm.email.trim() || !newForm.password) {
    setError('Complete todos los campos');
    return;
  }
  if (newForm.password !== newForm.confirmPassword) {
    setError('Las contraseñas no coinciden');
    return;
  }
  if (newForm.password.length < 6) {
    setError('La contraseña debe tener al menos 6 caracteres');
    return;
  }

  const result = await apiIntegrado.createUser(token, {
    username: newForm.username.trim(),
    fullName: newForm.fullName.trim(),
    email: newForm.email.trim(),
    password: newForm.password,
    role: 'admin',
  });

  if (result) {
    setSuccess('Usuario creado con éxito');
    setNewForm({ username: '', fullName: '', email: '', password: '', confirmPassword: '' });
    const updated = await apiIntegrado.getUsers(token);
    setDbUsers(updated);
  } else {
    setError('Error al crear usuario. El nombre de usuario o email ya existe.');
  }
};

  const inputCls = 'w-full bg-background border border-secondary/20 rounded-lg p-base text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

  return (
    <div className="p-xl max-w-5xl mx-auto">
      <div className="mb-lg">
        <h2 className="text-headline-lg font-bold text-primary mb-base">Ajustes</h2>
        <p className="text-body-lg text-on-surface-variant">Gestione su perfil y cree nuevos usuarios administradores.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-container rounded-xl p-1 mb-lg w-fit border border-outline-variant/20">
        <button
          onClick={() => { setActiveTab('perfil'); setError(''); setSuccess(''); }}
          className={`px-lg py-sm rounded-lg text-label-md font-bold transition-all ${activeTab === 'perfil' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="flex items-center gap-xs">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
            Mi Perfil
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('nuevo'); setError(''); setSuccess(''); }}
          className={`px-lg py-sm rounded-lg text-label-md font-bold transition-all ${activeTab === 'nuevo' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="flex items-center gap-xs">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Nuevo Usuario
          </span>
        </button>
      </div>

      {activeTab === 'perfil' && user && (
        <div className="space-y-lg">
          {/* Profile Card */}
          <div className="bg-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm">
            <div className="flex items-center justify-between mb-lg">
              <div className="flex items-center gap-md">
                <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-headline-md">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-headline-md font-bold text-primary">{user.fullName}</h3>
                  <p className="text-body-md text-on-surface-variant">{user.email}</p>
                  <span className="inline-block mt-xs px-sm py-xs bg-secondary-container/30 text-secondary text-caption font-bold rounded-full">
                    Administrador
                  </span>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditForm({ username: user.username, fullName: user.fullName, email: user.email });
                    setError('');
                    setSuccess('');
                  }}
                  className="flex items-center gap-xs px-md py-sm bg-primary-container text-white rounded-lg font-bold text-body-md hover:shadow-lg transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  Editar Perfil
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div className="space-y-base">
                  <label className="block text-label-md font-bold text-primary">Nombre de Usuario</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>badge</span>
                    <input className={inputCls + ' pl-10'} value={editForm.username} onChange={handleEditChange('username')} required />
                  </div>
                </div>
                <div className="space-y-base">
                  <label className="block text-label-md font-bold text-primary">Nombre y Apellido</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>person</span>
                    <input className={inputCls + ' pl-10'} value={editForm.fullName} onChange={handleEditChange('fullName')} required />
                  </div>
                </div>
                <div className="space-y-base col-span-1 md:col-span-2">
                  <label className="block text-label-md font-bold text-primary">Correo Electrónico</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>mail</span>
                    <input className={inputCls + ' pl-10'} type="email" value={editForm.email} onChange={handleEditChange('email')} required />
                  </div>
                </div>
                {error && (
                  <div className="col-span-1 md:col-span-2 bg-error-container/30 border border-error/20 rounded-lg p-sm flex items-center gap-sm">
                    <span className="material-symbols-outlined text-error" style={{ fontSize: '18px' }}>error</span>
                    <span className="text-caption text-error font-bold">{error}</span>
                  </div>
                )}
                <div className="col-span-1 md:col-span-2 flex justify-end gap-md">
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setError(''); }}
                    className="px-lg py-sm rounded-lg border border-secondary text-secondary font-bold text-body-md hover:bg-secondary/5 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-lg py-sm rounded-lg bg-primary-container text-white font-bold text-body-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-base"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                    Guardar Cambios
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div className="space-y-base">
                  <label className="block text-label-md font-bold text-primary">Nombre de Usuario</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>badge</span>
                    <input className={inputCls + ' pl-10'} value={user.username} disabled />
                  </div>
                </div>
                <div className="space-y-base">
                  <label className="block text-label-md font-bold text-primary">Nombre y Apellido</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>person</span>
                    <input className={inputCls + ' pl-10'} value={user.fullName} disabled />
                  </div>
                </div>
                <div className="space-y-base">
                  <label className="block text-label-md font-bold text-primary">Correo Electrónico</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>mail</span>
                    <input className={inputCls + ' pl-10'} value={user.email} disabled />
                  </div>
                </div>
                <div className="space-y-base">
                  <label className="block text-label-md font-bold text-primary">Rol</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>admin_panel_settings</span>
                    <input className={inputCls + ' pl-10'} value="Administrador" disabled />
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mt-md bg-secondary-container/30 border border-secondary/20 rounded-lg p-sm flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>check_circle</span>
                <span className="text-caption text-secondary font-bold">{success}</span>
              </div>
            )}
          </div>

          {/* Password Update Card */}
          <div className="bg-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm">
            <h3 className="text-headline-md font-bold text-primary mb-lg flex items-center gap-sm">
              <span className="material-symbols-outlined">lock_reset</span>
              Actualizar Contraseña
            </h3>
            <form onSubmit={handlePwdSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Contraseña Anterior</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>lock</span>
                  <input className={inputCls + ' pl-10'} type="password" value={pwdForm.oldPassword} onChange={handlePwdChange('oldPassword')} required />
                </div>
              </div>
              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Nueva Contraseña</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>lock_open</span>
                  <input className={inputCls + ' pl-10'} type="password" value={pwdForm.newPassword} onChange={handlePwdChange('newPassword')} required minLength={6} />
                </div>
              </div>
              <div className="space-y-base">
                <label className="block text-label-md font-bold text-primary">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>lock_reset</span>
                  <input className={inputCls + ' pl-10'} type="password" value={pwdForm.confirmNewPassword} onChange={handlePwdChange('confirmNewPassword')} required />
                </div>
              </div>
              {pwdError && (
                <div className="col-span-1 md:col-span-3 bg-error-container/30 border border-error/20 rounded-lg p-sm flex items-center gap-sm">
                  <span className="material-symbols-outlined text-error" style={{ fontSize: '18px' }}>error</span>
                  <span className="text-caption text-error font-bold">{pwdError}</span>
                </div>
              )}
              {pwdSuccess && (
                <div className="col-span-1 md:col-span-3 bg-secondary-container/30 border border-secondary/20 rounded-lg p-sm flex items-center gap-sm">
                  <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>check_circle</span>
                  <span className="text-caption text-secondary font-bold">{pwdSuccess}</span>
                </div>
              )}
              <div className="col-span-1 md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-lg py-sm rounded-lg bg-primary-container text-white font-bold text-body-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-base"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm">
            <h4 className="text-label-md font-bold text-primary mb-sm">Usuarios del Sistema</h4>
            <div className="space-y-xs">
              {dbUsers.map(u => (
  <div key={u.id} className="flex items-center gap-sm p-sm bg-surface-container-low rounded-lg border border-outline-variant/10">
    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-label-md">
      {(u.full_name || u.username).charAt(0).toUpperCase()}
    </div>
    <div className="flex-grow">
      <p className="text-label-md font-bold">{u.full_name}</p>
      <p className="text-caption text-on-surface-variant">{u.username} · {u.email}</p>
    </div>
    <span className="px-sm py-xs bg-secondary-container/30 text-secondary text-caption font-bold rounded-full">
      {u.role === 'admin' ? 'Admin' : u.role}
    </span>
  </div>
))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'nuevo' && (
        <div className="bg-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm">
          <div className="mb-lg">
            <h3 className="text-headline-md font-bold text-primary mb-base">Nuevo Usuario Administrador</h3>
            <p className="text-body-md text-on-surface-variant">Complete los datos para crear un nuevo usuario con permisos de administrador.</p>
          </div>

          <form onSubmit={handleNewSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <div className="space-y-base">
              <label className="block text-label-md font-bold text-primary">Nombre de Usuario *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>badge</span>
                <input className={inputCls + ' pl-10'} placeholder="Ej. juanperez" value={newForm.username} onChange={handleNewChange('username')} required />
              </div>
            </div>

            <div className="space-y-base">
              <label className="block text-label-md font-bold text-primary">Nombre y Apellido *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>person</span>
                <input className={inputCls + ' pl-10'} placeholder="Ej. Juan Pérez" value={newForm.fullName} onChange={handleNewChange('fullName')} required />
              </div>
            </div>

            <div className="space-y-base col-span-1 md:col-span-2">
              <label className="block text-label-md font-bold text-primary">Correo Electrónico *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>mail</span>
                <input className={inputCls + ' pl-10'} type="email" placeholder="ejemplo@correo.com" value={newForm.email} onChange={handleNewChange('email')} required />
              </div>
            </div>

            <div className="space-y-base">
              <label className="block text-label-md font-bold text-primary">Contraseña *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>lock</span>
                <input className={inputCls + ' pl-10'} type="password" placeholder="Mínimo 6 caracteres" value={newForm.password} onChange={handleNewChange('password')} required minLength={6} />
              </div>
            </div>

            <div className="space-y-base">
              <label className="block text-label-md font-bold text-primary">Confirmar Contraseña *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>lock_reset</span>
                <input className={inputCls + ' pl-10'} type="password" placeholder="Repita la contraseña" value={newForm.confirmPassword} onChange={handleNewChange('confirmPassword')} required />
              </div>
            </div>

            {error && (
              <div className="col-span-1 md:col-span-2 bg-error-container/30 border border-error/20 rounded-lg p-sm flex items-center gap-sm">
                <span className="material-symbols-outlined text-error" style={{ fontSize: '18px' }}>error</span>
                <span className="text-caption text-error font-bold">{error}</span>
              </div>
            )}

            {success && (
              <div className="col-span-1 md:col-span-2 bg-secondary-container/30 border border-secondary/20 rounded-lg p-sm flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>check_circle</span>
                <span className="text-caption text-secondary font-bold">{success}</span>
              </div>
            )}

            <div className="col-span-1 md:col-span-2 flex justify-end gap-md mt-sm">
              <button
                type="button"
                onClick={() => setNewForm({ username: '', fullName: '', email: '', password: '', confirmPassword: '' })}
                className="px-lg py-sm rounded-lg border border-secondary text-secondary font-bold text-body-md hover:bg-secondary/5 transition-all active:scale-95"
              >
                Limpiar
              </button>
              <button
                type="submit"
                className="px-lg py-sm rounded-lg bg-primary-container text-white font-bold text-body-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-base"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
