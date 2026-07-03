const API_URL = 'http://localhost:5000/api';
export const apiIntegrado = {
  // ========================
  // PRODUCTOS
  // ========================

  getProducts: async (token: string | null) => {
    if (!token) return [];
    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.warn('Error al obtener productos', error);
      return [];
    }
  },

  createProduct: async (token: string | null, product: any) => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn('Error al crear producto', error);
      return null;
    }
  },

  updateProduct: async (token: string | null, id: number, product: any) => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn('Error al actualizar producto', error);
      return null;
    }
  },

  deleteProduct: async (token: string | null, id: number) => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn('Error al eliminar producto', error);
      return null;
    }
  },

  // ========================
  // CATEGORÍAS
  // ========================

  getCategories: async (token: string | null) => {
    if (!token) return [];
    try {
      const response = await fetch(`${API_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.warn('Error al obtener categorías', error);
      return [];
    }
  },

  createCategory: async (token: string | null, category: any) => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(category)
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn('Error al crear categoría', error);
      return null;
    }
  },

  deleteCategory: async (token: string | null, id: number) => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn('Error al eliminar categoría', error);
      return null;
    }
  },

  // ========================
  // VENTAS
  // ========================

  getSales: async (token: string | null) => {
    if (!token) return [];
    try {
      const response = await fetch(`${API_URL}/sales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.warn('Error al obtener ventas', error);
      return [];
    }
  },

  createSale: async (token: string | null, sale: any) => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sale)
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn('Error al crear venta', error);
      return null;
    }
  },
  getUsers: async (token: string | null) => {
    if (!token) return [];
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.warn('Error al obtener usuarios', error);
      return [];
    }
  },

  createUser: async (token: string | null, user: any) => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(user)
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn('Error al crear usuario', error);
      return null;
    }
  },

  getSaleDetails: async (token: string | null, id: number) => {
  if (!token) return [];
  try {
    const response = await fetch(`${API_URL}/sales/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.warn('Error al obtener detalle de venta', error);
    return [];
  }
},
};
