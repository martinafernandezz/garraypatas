export type Page = 'dashboard' | 'ventas' | 'historial' | 'productos' | 'cargar-producto' | 'precios' | 'ajustes' | 'categorias';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'admin';
}
