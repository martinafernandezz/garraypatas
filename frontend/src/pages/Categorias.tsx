import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiIntegrado } from '../services/apiIntegrado';

interface Category {
  id: number;
  name: string;
  description: string;
  productCount: number;
}

export default function Categorias() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await apiIntegrado.getCategories(token);
      if (data) setCategories(data);
    } catch (e) {
      console.warn('Error cargando categorías', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('El nombre de la categoría es obligatorio');
      return;
    }

    setSaving(true);
    const result = await apiIntegrado.createCategory(token, {
      name: form.name.trim(),
      description: form.description.trim(),
    });
    setSaving(false);

    if (result) {
      setForm({ name: '', description: '' });
      setSuccess('Categoría creada con éxito');
      setTimeout(() => setSuccess(''), 3000);
      await loadCategories(); // recarga desde BD para tener el id real
    } else {
      setError('Error al crear la categoría. Puede que ya exista.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    const result = await apiIntegrado.deleteCategory(token, id);
    if (result) {
      setCategories(prev => prev.filter(c => c.id !== id));
    } else {
      setError('No se pudo eliminar. Puede que tenga productos asociados.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="p-md flex flex-col gap-lg">
      {isLoading && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-md text-center text-primary">
          Cargando categorías del servidor...
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-md">
        {/* Formulario */}
        <div className="bg-surface-container rounded-2xl border border-outline-variant/30 p-lg shadow-sm">
          <h2 className="text-headline-md font-bold text-primary mb-lg">Crear Categoría</h2>
          <form onSubmit={handleSubmit} className="space-y-md">
            <div>
              <label className="block text-label-md font-bold text-primary mb-xs">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Alimentos"
                className="w-full bg-background border border-secondary/20 rounded-lg p-base text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div>
              <label className="block text-label-md font-bold text-primary mb-xs">Descripción</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe esta categoría..."
                rows={3}
                className="w-full bg-background border border-secondary/20 rounded-lg p-base text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
              />
            </div>

            {error && (
              <div className="bg-error-container/30 border border-error/20 rounded-lg p-sm flex items-center gap-sm">
                <span className="material-symbols-outlined text-error">error</span>
                <span className="text-caption text-error font-bold">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-tertiary/10 border border-tertiary/20 rounded-lg p-sm flex items-center gap-sm">
                <span className="material-symbols-outlined text-tertiary">check_circle</span>
                <span className="text-caption text-tertiary font-bold">{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-md bg-primary-container text-white rounded-lg font-bold hover:opacity-90 transition-opacity active:scale-95 flex items-center justify-center gap-sm disabled:opacity-60"
            >
              <span className="material-symbols-outlined">add</span>
              {saving ? 'Guardando...' : 'Crear Categoría'}
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="md:col-span-2">
          <h2 className="text-headline-md font-bold text-primary mb-lg">
            Categorías Registradas
            <span className="ml-sm text-body-md text-on-surface-variant font-normal">({categories.length})</span>
          </h2>
          {categories.length === 0 && !isLoading ? (
            <div className="text-center text-on-surface-variant p-xl opacity-50">
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>category</span>
              <p className="mt-sm">No hay categorías registradas.</p>
            </div>
          ) : (
            <div className="space-y-md">
              {categories.map(category => (
                <div key={category.id} className="bg-surface-container rounded-xl border border-outline-variant/30 p-md hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-md">
                    <div className="flex-1">
                      <h3 className="text-label-md font-bold text-primary">{category.name}</h3>
                      <p className="text-caption text-on-surface-variant mt-xs">{category.description}</p>
                      <p className="text-caption text-on-surface-variant mt-sm flex items-center gap-xs">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>inventory_2</span>
                        {category.productCount} productos
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                    </button>
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
