// API service for all backend communications
const API_BASE_URL = 'http://localhost:4000/api';

// Type definitions
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  current_stock: number;
  low_stock_threshold: number;
  supplier_id: string;
  barcode?: string;
  unit?: string;
  created_at?: string;
  updated_at?: string;
  // Legacy property names for backward compatibility
  currentStock?: number;
  lowStockThreshold?: number;
  qrCode?: string;
  supplier?: Supplier;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export interface Bill {
  id: string;
  customer_id: string;
  total_amount: number;
  created_at: string;
  items: BillItem[];
}

export interface BillItem {
  id: string;
  bill_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Alert {
  id: string;
  product_id: string;
  current_stock: number;
  low_stock_threshold: number;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'ignored' | 'resolved';
  created_at: string;
  product_name?: string;
  supplier_name?: string;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Generic API call function with error handling
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Products API
export const productsAPI = {
  getAll: () => apiCall<Product[]>('/products'),
  
  create: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => apiCall<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  
  update: (id: string, product: Partial<Product>) => apiCall<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  }),
  
  delete: (id: string) => apiCall<{ success: boolean }>(`/products/${id}`, {
    method: 'DELETE',
  }),
};

// Alerts API
export const alertsAPI = {
  getLowStock: () => apiCall<Alert[]>('/alerts/low-stock'),
  
  getIgnored: () => apiCall<Alert[]>('/alerts/ignored'),
  
  getResolved: () => apiCall<Alert[]>('/alerts/resolved'),
  
  ignore: (productId: string, reason?: string) => apiCall<ApiResponse<boolean>>('/alerts/ignore', {
    method: 'POST',
    body: JSON.stringify({ productId, reason }),
  }),
  
  createPurchaseOrder: (data: { productId: string; quantity: number; notes?: string }) => 
    apiCall<ApiResponse<{ poNumber: string; poId: number; totalAmount: number }>>('/alerts/purchase-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  sendPO: (data: { poId: string; method: string; recipientInfo: string }) => 
    apiCall<ApiResponse<{ message: string }>>('/alerts/send-po', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Customers API
export const customersAPI = {
  getAll: () => apiCall<Customer[]>('/customers'),
  
  create: (customer: Omit<Customer, 'id' | 'created_at'>) => apiCall<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(customer),
  }),
  
  update: (id: string, customer: Partial<Customer>) => apiCall<Customer>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customer),
  }),
  
  delete: (id: string) => apiCall<ApiResponse<boolean>>(`/customers/${id}`, {
    method: 'DELETE',
  }),
};

// Bills API
export const billsAPI = {
  getAll: () => apiCall<Bill[]>('/bills'),
  
  create: (bill: Omit<Bill, 'id' | 'created_at'>) => apiCall<Bill>('/bills', {
    method: 'POST',
    body: JSON.stringify(bill),
  }),
  
  update: (id: string, bill: Partial<Bill>) => apiCall<Bill>(`/bills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(bill),
  }),
  
  delete: (id: string) => apiCall<ApiResponse<boolean>>(`/bills/${id}`, {
    method: 'DELETE',
  }),
};

// Suppliers API
export const suppliersAPI = {
  getAll: () => apiCall<Supplier[]>('/suppliers'),
  
  getById: (id: string) => apiCall<Supplier>(`/suppliers/${id}`),
  
  create: (supplier: Omit<Supplier, 'id' | 'created_at'>) => apiCall<Supplier>('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  }),
  
  update: (id: string, supplier: Partial<Supplier>) => apiCall<Supplier>(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplier),
  }),
  
  delete: (id: string) => apiCall<ApiResponse<{ message: string }>>(`/suppliers/${id}`, {
    method: 'DELETE',
  }),
  
  getProducts: (id: string) => apiCall<Product[]>(`/suppliers/${id}/products`),
};

// Export all APIs
export default {
  products: productsAPI,
  suppliers: suppliersAPI,
  alerts: alertsAPI,
  customers: customersAPI,
  bills: billsAPI,
};
