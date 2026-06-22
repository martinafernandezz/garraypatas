import { useState } from 'react';

interface Category {
  id: number;
  name: string;
  description: string;
  productCount: number;
}

const initialCategories: Category[] = [
  { id: 1, name: 'Alimentos', description: 'Alimentos balanceados para perros y gatos', productCount: 12 },
  { id: 2, name: 'Higiene', description: 'Shampoo, cepillos y productos de aseo', productCount: 8 },
  { id: 3, name: 'Farmacia', description: 'Pipetas, antipulgas y medicamentos', productCount: 6 },
  { id: 4, name: 'Juguetes', description: 'Juguetes y accesorios para mascotas', productCount: 15 },
];

export default function Categorias() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim()) {
      setError('El nombre de la categoría es obligatorio');
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === form.name.trim().toLowerCase())) {
      setError('Ya existe una categoría con ese nombre');
      return;
    }
    const newCategory: Category = {
      id: Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      productCount: 0,
    };
    setCategories(prev => [...prev, newCategory]);
    setForm({ name: '', description: '' });
    setSuccess('Categoría creada con éxito');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = (id: number) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const inputCls = 'w-full bg-background border border-secondary/20 rounded-lg p-base text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all';

  return (
    <div className="p-xl max-w-4xl mx-auto">
      <div className="mb-lg">
        <h2 className="text-headline-lg font-bold text-primary mb-base">Categorías</h2>
        <p className="text-body-lg text-on-surface-variant">Gestione las categorías de productos de su tienda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Form */}
        <div className="bg-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm">
          <h3 className="text-headline-md font-bold text-primary mb-lg flex items-center gap-sm">
            <span className="material-symbols-outlined">add_circle</span>
            Nueva Categoría
          </h3>
          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="space-y-base">
              <label className="block text-label-md font-bold text-primary">Nombre de la Categoría *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>category</span>
                <input
                  className={inputCls + ' pl-10'}
                  placeholder="Ej. Alimentos"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-base">
              <label className="block text-label-md font-bold text-primary">Descripción</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-base top-1/2 -translate-y-1/2 text-outline-variant" style={{ fontSize: '20px' }}>description</span>
                <input
                  className={inputCls + ' pl-10'}
                  placeholder="Breve descripción..."
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            {error && (
              <div className="bg-error-container/30 border border-error/20 rounded-lg p-sm flex items-center gap-sm">
                <span className="material-symbols-outlined text-error" style={{ fontSize: '18px' }}>error</span>
                <span className="text-caption text-error font-bold">{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-secondary-container/30 border border-secondary/20 rounded-lg p-sm flex items-center gap-sm">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '18px' }}>check_circle</span>
                <span className="text-caption text-secondary font-bold">{success}</span>
              </div>
            )}
            <div className="flex justify-end gap-md">
              <button
                type="button"
                onClick={() => setForm({ name: '', description: '' })}
                className="px-lg py-sm rounded-lg border border-secondary text-secondary font-bold text-body-md hover:bg-secondary/5 transition-all active:scale-95"
              >
                Limpiar
              </button>
              <button
                type="submit"
                className="px-lg py-sm rounded-lg bg-primary-container text-white font-bold text-body-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-base"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                Guardar Categoría
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-surface p-lg rounded-xl border border-outline-variant/30 shadow-sm">
          <h3 className="text-headline-md font-bold text-primary mb-lg flex items-center gap-sm">
            <span className="material-symbols-outlined">list</span>
            Categorías Existentes
          </h3>
          <div className="space-y-sm">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-sm p-sm bg-surface-container-low rounded-lg border border-outline-variant/10">
                <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-white flex-shrink-0">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>folder</span>
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-label-md font-bold truncate">{cat.name}</p>
                  <p className="text-caption text-on-surface-variant truncate">{cat.description}</p>
                </div>
                <span className="px-sm py-xs bg-secondary-container/30 text-secondary text-caption font-bold rounded-full flex-shrink-0">
                  {cat.productCount} productos
                </span>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all flex-shrink-0"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center py-lg text-on-surface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>folder_off</span>
                <p className="mt-sm text-body-md">No hay categorías cargadas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
