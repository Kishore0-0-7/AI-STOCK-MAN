// API service for all backend communications
const API_BASE_URL = "http://localhost:4000/api";

// Health check function
export const healthCheck = async (): Promise<{
  status: string;
  message: string;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return { status: "connected", message: "Backend is running" };
  } catch (error) {
    return { status: "disconnected", message: "Cannot connect to backend" };
  }
};

// Type definitions for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  metadata?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  current_stock: number;
  low_stock_threshold: number;
  supplier_id: number;
  description?: string;
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
  payment_terms?: string;
  status?: "active" | "inactive";
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: number;
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
  product_id?: string;
  type: "low_stock" | "system" | "manual";
  message: string;
  priority: "high" | "medium" | "low";
  status: "active" | "acknowledged" | "resolved";
  created_at: string;
  resolved_at?: string;
  product_name?: string;
  current_stock?: number;
  low_stock_threshold?: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber?: string;
  supplier_id?: string;
  supplier?: {
    id: string;
    name: string;
    email?: string;
  };
  supplier_name?: string;
  totalAmount: number;
  total_amount?: number; // Legacy support
  orderDate?: string;
  expectedDeliveryDate?: string;
  status: "pending" | "approved" | "shipped" | "received" | "cancelled";
  notes?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  unitPrice?: number; // Backend camelCase
  totalPrice?: number; // Backend camelCase
  subtotal?: number; // Legacy support
  product_name?: string; // Flattened structure
  receivedQuantity?: number; // Backend camelCase
  received_quantity?: number; // Snake case
  notes?: string;
  // Backend nested structure
  product?: {
    id: string;
    name: string;
    sku?: string;
    category?: string;
  };
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  expectedDate?: string | null;
  notes?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

// Customer Orders interfaces
export interface CustomerOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  order_date: string;
  delivery_date?: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  total_amount: number;
  payment_method: "cash" | "card" | "upi" | "bank_transfer" | "cheque";
  payment_status: "pending" | "paid" | "failed" | "partial";
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items?: CustomerOrderItem[];
  items_count?: number;
  calculated_total?: number;
}

export interface CustomerOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  product_category?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  available_stock?: number;
  created_at?: string;
}

export interface CreateCustomerOrderRequest {
  customer_id: string;
  order_date?: string;
  delivery_date?: string;
  status?: string;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
}

// Generic API call function with error handling
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    // Check if the response has content
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      const text = await response.text();
      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error(`JSON parse error for ${endpoint}:`, parseError);
          throw new Error(
            `Invalid JSON response: ${text.substring(0, 100)}...`
          );
        }
      } else {
        // Empty response
        data = {};
      }
    } else {
      // Non-JSON response
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (typeof data === "object" && data.error) ||
        (typeof data === "string"
          ? data
          : `HTTP error! status: ${response.status}`);
      throw new Error(errorMessage);
    }

    // Handle different response formats from backend
    if (typeof data === "object" && data.success !== undefined) {
      return data.data || data; // Return data if available, otherwise full response
    }

    return data; // Direct response
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Dashboard API
export const dashboardAPI = {
  getOverview: () => apiCall<any>("/dashboard/overview"),
  getActivity: () => apiCall<any>("/dashboard/activity"),
  getTrends: () => apiCall<any>("/dashboard/trends"),
  getAlerts: () => apiCall<any>("/dashboard/alerts"),
  getForecast: () => apiCall<any>("/dashboard/forecast"),
};

// Products API
export const productsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<Product[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.category) queryParams.append("category", params.category);

    const query = queryParams.toString();
    const response = await apiCall<{ products: Product[] } | Product[]>(
      `/products${query ? `?${query}` : ""}`
    );

    console.log(response)

    // Handle both response formats: direct array or nested in products property
    if (Array.isArray(response)) {
      return response;
    } else {
      return (response as { products: Product[] }).products || [];
    }
  },

  getById: (id: string) => apiCall<Product>(`/products/${id}`),

  create: (product: Omit<Product, "id" | "created_at" | "updated_at">) =>
    apiCall<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    }),

  bulkCreate: (products: any[]) =>
    apiCall<{
      message: string;
      results: { success: number; failed: number; errors: any[] };
    }>("/products/bulk", {
      method: "POST",
      body: JSON.stringify({ products }),
    }),

  update: (id: string, product: Partial<Product>) =>
    apiCall<Product>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/products/${id}`, {
      method: "DELETE",
    }),

  getLowStock: () => apiCall<Product[]>("/products/low-stock"),

  getStats: () => apiCall<any>("/products/stats/overview"),

  addStockMovement: (
    id: string,
    movement: { type: "in" | "out"; quantity: number; reason?: string }
  ) =>
    apiCall<any>(`/products/${id}/stock-movement`, {
      method: "POST",
      body: JSON.stringify(movement),
    }),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    return apiCall<Supplier[]>(`/suppliers${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => apiCall<Supplier>(`/suppliers/${id}`),

  create: (supplier: Omit<Supplier, "id" | "created_at">) =>
    apiCall<Supplier>("/suppliers", {
      method: "POST",
      body: JSON.stringify(supplier),
    }),

  update: (id: string, supplier: Partial<Supplier>) =>
    apiCall<Supplier>(`/suppliers/${id}`, {
      method: "PUT",
      body: JSON.stringify(supplier),
    }),

  updateStatus: (id: string, status: string) =>
    apiCall<{ message: string }>(`/suppliers/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/suppliers/${id}`, {
      method: "DELETE",
    }),

  getPerformance: (id: string) => apiCall<any>(`/suppliers/${id}/performance`),

  getStats: () => apiCall<any>("/suppliers/stats/overview"),

  getTopPerformers: () => apiCall<any>("/suppliers/stats/top-performers"),
};

// Customers API
export const customersAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<Customer[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    const response = await apiCall<{ customers: Customer[]; pagination: any }>(
      `/customers${query ? `?${query}` : ""}`
    );
    return response.customers || [];
  },

  getById: (id: string) => apiCall<Customer>(`/customers/${id}`),

  create: (customer: Omit<Customer, "id" | "created_at">) =>
    apiCall<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    }),

  update: (id: string, customer: Partial<Customer>) =>
    apiCall<Customer>(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(customer),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/customers/${id}`, {
      method: "DELETE",
    }),

  search: (query: string) =>
    apiCall<Customer[]>(`/customers/search?q=${encodeURIComponent(query)}`),

  getStats: () => apiCall<any>("/customers/stats/overview"),

  getTopCustomers: () => apiCall<any>("/customers/stats/top"),
};

// Bills API
export const billsAPI = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    const query = queryParams.toString();
    return apiCall<Bill[]>(`/bills${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => apiCall<Bill>(`/bills/${id}`),

  upload: (file: File) => {
    const formData = new FormData();
    formData.append("bill", file);

    return apiCall<any>("/bills/upload", {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type for FormData
    });
  },

  processExtracted: (billData: any) =>
    apiCall<any>("/bills/process-extracted", {
      method: "POST",
      body: JSON.stringify(billData),
    }),

  updateStatus: (id: string, status: string) =>
    apiCall<any>(`/bills/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/bills/${id}`, {
      method: "DELETE",
    }),

  getStats: () => apiCall<any>("/bills/stats/summary"),
};

// Alerts API
export const alertsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.type) queryParams.append("type", params.type);

    const query = queryParams.toString();
    return apiCall<Alert[]>(`/alerts${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => apiCall<Alert>(`/alerts/${id}`),

  create: (alert: Omit<Alert, "id" | "created_at">) =>
    apiCall<Alert>("/alerts", {
      method: "POST",
      body: JSON.stringify(alert),
    }),

  updateStatus: (id: string, status: string) =>
    apiCall<Alert>(`/alerts/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/alerts/${id}`, {
      method: "DELETE",
    }),

  generateSystemAlerts: () =>
    apiCall<any>("/alerts/generate-system-alerts", {
      method: "POST",
    }),
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);

    const query = queryParams.toString();
    return apiCall<PurchaseOrder[]>(
      `/purchase-orders${query ? `?${query}` : ""}`
    );
  },

  getById: (id: string) => apiCall<PurchaseOrder>(`/purchase-orders/${id}`),

  create: (order: CreatePurchaseOrderRequest) =>
    apiCall<PurchaseOrder>("/purchase-orders", {
      method: "POST",
      body: JSON.stringify(order),
    }),

  update: (id: string, order: Partial<PurchaseOrder>) =>
    apiCall<PurchaseOrder>(`/purchase-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    }),

  updateStatus: (id: string, status: string) =>
    apiCall<PurchaseOrder>(`/purchase-orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/purchase-orders/${id}`, {
      method: "DELETE",
    }),

  getStats: () => apiCall<any>("/purchase-orders/stats/summary"),
};

// Customer Orders API
export const customerOrdersAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customer_id?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.customer_id)
      queryParams.append("customer_id", params.customer_id);
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);

    const query = queryParams.toString();
    return apiCall<{
      orders: CustomerOrder[];
      pagination: {
        current_page: number;
        total_pages: number;
        total_items: number;
        per_page: number;
      };
    }>(`/customer-orders${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => apiCall<CustomerOrder>(`/customer-orders/${id}`),

  create: (order: CreateCustomerOrderRequest) =>
    apiCall<CustomerOrder>("/customer-orders", {
      method: "POST",
      body: JSON.stringify(order),
    }),

  update: (id: string, order: Partial<CustomerOrder>) =>
    apiCall<CustomerOrder>(`/customer-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(order),
    }),

  updateStatus: (id: string, status: string) =>
    apiCall<{ message: string }>(`/customer-orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    apiCall<{ message: string }>(`/customer-orders/${id}`, {
      method: "DELETE",
    }),

  getStats: () => apiCall<any>("/customer-orders/stats"),
};

// Reports API
export const reportsAPI = {
  // Sales Reports API
  getSalesOverview: (params?: {
    period?: string;
    days?: string;
    compare?: "full" | "ptd";
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append("period", params.period);
    if (params?.days) queryParams.append("days", params.days);
    if (params?.compare) queryParams.append("compare", params.compare);

    const query = queryParams.toString();
    return apiCall<any>(`/reports/sales/overview${query ? `?${query}` : ""}`);
  },

  getSalesTrends: (params?: { period?: string; days?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append("period", params.period);
    if (params?.days) queryParams.append("days", params.days);

    const query = queryParams.toString();
    return apiCall<any>(`/reports/sales/trends${query ? `?${query}` : ""}`);
  },

  getCategoryBreakdown: (params?: { days?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append("days", params.days);

    const query = queryParams.toString();
    return apiCall<any>(`/reports/sales/categories${query ? `?${query}` : ""}`);
  },

  getTopCustomers: (params?: { days?: string; limit?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append("days", params.days);
    if (params?.limit) queryParams.append("limit", params.limit);

    const query = queryParams.toString();
    return apiCall<any>(`/reports/sales/customers${query ? `?${query}` : ""}`);
  },

  getTopProducts: (params?: { days?: string; limit?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append("days", params.days);
    if (params?.limit) queryParams.append("limit", params.limit);

    const query = queryParams.toString();
    return apiCall<any>(`/reports/sales/products${query ? `?${query}` : ""}`);
  },

  getRecentTransactions: (params?: { limit?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit);
    if (params?.search) queryParams.append("search", params.search);

    const query = queryParams.toString();
    return apiCall<any>(
      `/reports/sales/transactions${query ? `?${query}` : ""}`
    );
  },

  exportSalesReport: (params?: {
    format?: string;
    period?: string;
    days?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.format) queryParams.append("format", params.format);
    if (params?.period) queryParams.append("period", params.period);
    if (params?.days) queryParams.append("days", params.days);

    return apiCall<any>(`/reports/sales/export?${queryParams.toString()}`);
  },
};

// Export all APIs
export default {
  dashboard: dashboardAPI,
  products: productsAPI,
  suppliers: suppliersAPI,
  customers: customersAPI,
  bills: billsAPI,
  alerts: alertsAPI,
  purchaseOrders: purchaseOrdersAPI,
  customerOrders: customerOrdersAPI,
  reports: reportsAPI,
};
