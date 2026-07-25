const API_URL = 'https://garraypatas-production.up.railway.app/api';
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

  getProductVariants: async (token: string | null, productId: number) => {
    if (!token) return [];
    try {
      const response = await fetch(`${API_URL}/products/${productId}/variants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.warn('Error al obtener talles', error);
      return [];
    }
  },

  getProductBatches: async (token: string | null, productId: number) => {
  if (!token) return [];
  try {
    const response = await fetch(`${API_URL}/products/${productId}/batches`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.warn('Error al obtener bolsas', error);
    return [];
  }
},

addProductBatches: async (token: string | null, productId: number, initialKg: number, quantity: number) => {
  if (!token) return null;
  try {
    const response = await fetch(`${API_URL}/products/${productId}/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ initialKg, quantity })
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.warn('Error al agregar bolsas', error);
    return null;
  }
},

updateProductBatch: async (token: string | null, productId: number, batchId: number, remainingKg: number) => {
  if (!token) return null;
  try {
    const response = await fetch(`${API_URL}/products/${productId}/batches/${batchId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ remainingKg })
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.warn('Error al actualizar la bolsa', error);
    return null;
  }
},

deleteProductBatch: async (token: string | null, productId: number, batchId: number) => {
  if (!token) return null;
  try {
    const response = await fetch(`${API_URL}/products/${productId}/batches/${batchId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.warn('Error al eliminar la bolsa', error);
    return null;
  }
},

  updateProductVariants: async (token: string | null, productId: number, sizes: { talle: string; stock: number }[]) => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/products/${productId}/variants`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sizes })
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn('Error al actualizar talles', error);
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

  // ========================
  // CLIENTES / CUENTAS CORRIENTES
  // ========================

  getCustomers: async (token: string | null) => {
    if (!token) return [];
    try {
      const response = await fetch(`${API_URL}/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.warn('Error al obtener clientes', error);
      return [];
    }
  },

  createCustomer: async (token: string | null, customer: { firstName: string; lastName: string; phone?: string | null }) => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customer)
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn('Error al crear cliente', error);
      return null;
    }
  },

  getCustomerSales: async (token: string | null, customerId: number) => {
    if (!token) return [];
    try {
      const response = await fetch(`${API_URL}/customers/${customerId}/sales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.warn('Error al obtener ventas del cliente', error);
      return [];
    }
  },

  markSalePaymentStatus: async (token: string | null, saleId: number, paymentStatus: 'paid' | 'pending') => {
    if (!token) return null;
    try {
      const response = await fetch(`${API_URL}/sales/${saleId}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus })
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.warn('Error al actualizar estado de pago', error);
      return null;
    }
  },
};