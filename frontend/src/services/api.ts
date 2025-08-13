// API service for all backend communications
const API_BASE_URL = "http://localhost:5000/api/v1";

// Health check function
export const healthCheck = async (): Promise<{
  status: string;
  message: string;
}> => {
  try {
    const response = await fetch(`http://localhost:5000/health`);
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
  id: string;
  name: string;
  category: string;
  price: number;
  current_stock: number;
  low_stock_threshold: number;
  supplier_id: string;
  description?: string;
  barcode?: string;
  unit?: string;
  created_at?: string;
  updated_at?: string;
  // Frontend form fields and backend response compatibility
  stock?: number; // Backend response field
  minStock?: number; // Backend response field
  sku?: string; // Backend field
  cost?: number; // Backend field
  status?: string; // Backend field
  createdAt?: string; // Backend field
  updatedAt?: string; // Backend field
  // Legacy property names for backward compatibility
  currentStock?: number;
  lowStockThreshold?: number;
  qrCode?: string;
  supplier?: Supplier;
}

export interface Supplier {
  id: number;
  name: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  contact_person?: string;
  status: "active" | "inactive" | "suspended";
  payment_terms?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  total_orders?: number;
  total_value?: number;
  total_products?: number;
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

    console.log(response);

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
    return apiCall<{
      orders: PurchaseOrder[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/purchase-orders${query ? `?${query}` : ""}`);
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

// QC API
export const qcAPI = {
  getMetrics: () =>
    apiCall<{
      rejectionRate: number;
      totalInspections: number;
      scrapQuantity: number;
      scrapValue: number;
    }>("/qc/metrics"),

  getDefects: () =>
    apiCall<
      Array<{
        type: string;
        count: number;
      }>
    >("/qc/defects"),

  getRejectionTrend: (params?: { days?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.days) queryParams.append("days", params.days.toString());
    return apiCall<
      Array<{
        date: string;
        rejectionRate: number;
      }>
    >(
      `/qc/rejection-trend${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`
    );
  },

  getHoldItems: (params?: { limit?: number; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.status) queryParams.append("status", params.status);
    return apiCall<
      Array<{
        id: string;
        itemCode: string;
        description: string;
        quantity: number;
        status: string;
        date: string;
        order_number?: string;
        supplier_name?: string;
      }>
    >(
      `/qc/hold-items${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`
    );
  },

  updateItemStatus: (
    id: string,
    data: {
      quality_status: string;
      notes?: string;
    }
  ) =>
    apiCall<{ success: boolean; message: string }>(`/qc/items/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getStats: () =>
    apiCall<{
      totalItems: number;
      approvedItems: number;
      rejectedItems: number;
      holdItems: number;
      pendingItems: number;
      averageScrapValue: number;
      approvalRate: number;
    }>("/qc/stats"),
};

// Production Calculator API
export interface RawMaterial {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  costPerUnit: number;
  reorderLevel: number;
  supplier: string;
  category: string;
  lastUpdated: string;
}

export interface ProductRecipe {
  id: string;
  name: string;
  category: string;
  description: string;
  estimatedTime: number;
  complexity: "Low" | "Medium" | "High";
  materials: MaterialRequirement[];
}

export interface MaterialRequirement {
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  wastagePercent: number;
}

export interface ProductionCalculation {
  productId: string;
  productName: string;
  requestedQuantity: number;
  possibleQuantity: number;
  totalCost: number;
  estimatedTime: number;
  materialBreakdown: MaterialBreakdown[];
  feasible: boolean;
  bottlenecks: string[];
}

export interface MaterialBreakdown {
  materialId: string;
  materialName: string;
  required: number;
  available: number;
  shortage: number;
  cost: number;
  unit: string;
}

export interface ProductionBatch {
  id: string;
  productName: string;
  quantity: number;
  status: "Planned" | "In Progress" | "Completed" | "On Hold" | "Cancelled";
  startDate: string;
  estimatedCompletion: string;
  progress: number;
  materials: MaterialBreakdown[];
}

export interface InventoryAnalytics {
  stockAnalysis: Array<{
    name: string;
    current: number;
    reorder: number;
    cost: number;
    category: string;
  }>;
  categoryDistribution: Array<{
    name: string;
    value: number;
    itemCount: number;
    avgStock: number;
  }>;
  summary: {
    totalInventoryValue: number;
    lowStockCount: number;
    wellStockedCount: number;
    totalMaterials: number;
    restockInvestment: number;
  };
}

export const productionCalculatorAPI = {
  getRawMaterials: () =>
    apiCall<RawMaterial[]>("/production-calculator/raw-materials"),

  getProducts: () =>
    apiCall<ProductRecipe[]>("/production-calculator/products"),

  calculateProduction: (productId: string, requestedQuantity: number) =>
    apiCall<ProductionCalculation>("/production-calculator/calculate", {
      method: "POST",
      body: JSON.stringify({ productId, requestedQuantity }),
    }),

  getProductionBatches: () =>
    apiCall<ProductionBatch[]>("/production-calculator/batches"),

  createProductionBatch: (data: {
    productId: string;
    quantity: number;
    startDate?: string;
    estimatedCompletionDate?: string;
    notes?: string;
  }) =>
    apiCall<{ id: string; batchNumber: string; status: string }>(
      "/production-calculator/batches",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  getInventoryAnalytics: () =>
    apiCall<InventoryAnalytics>("/production-calculator/analytics"),
};

// Inbound Dashboard API
export interface InboundMetrics {
  totalReceivedToday: number;
  totalReceivedMonth: number;
  todayGrowth: number;
  monthGrowth: number;
}

export interface SupplierData {
  name: string;
  quantity: number;
  value: number;
  orders: number;
  avgOrderValue: number;
  color: string;
}

export interface PendingShipment {
  id: string;
  poNumber: string;
  supplier: string;
  expectedDate: string;
  quantity: number;
  status: "In Transit" | "Delayed" | "Confirmed" | "Processing";
  priority: "High" | "Medium" | "Low";
  itemCount: number;
  totalValue: number;
}

export interface QualityStatus {
  status: "Pass" | "Fail" | "Hold" | "Pending";
  quantity: number;
  percentage: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  orderNumber: string;
  supplier: string;
  status: string;
  date: string;
  itemCount: number;
  totalValue: number;
  type: string;
}

export interface InboundSummary {
  totalPurchaseOrders: number;
  activeSuppliers: number;
  pendingOrders: number;
  completedOrders: number;
  averageDeliveryDelay: number;
  onTimeDeliveryRate: number;
}

export const inboundAPI = {
  getMetrics: () => apiCall<InboundMetrics>("/inbound/metrics"),

  getSupplierData: () => apiCall<SupplierData[]>("/inbound/suppliers"),

  getPendingShipments: () =>
    apiCall<PendingShipment[]>("/inbound/pending-shipments"),

  getQualityStatus: () => apiCall<QualityStatus[]>("/inbound/quality-status"),

  getRecentActivities: () => apiCall<RecentActivity[]>("/inbound/activities"),

  getSummary: () => apiCall<InboundSummary>("/inbound/summary"),
};

// Outbound Dashboard API
export interface OutboundMetrics {
  totalDispatchedToday: number;
  totalDispatchedMonth: number;
  todayGrowth: number;
  monthGrowth: number;
  onTimeRate: number;
}

export interface CustomerDispatch {
  name: string;
  quantity: number;
  value: number;
  orders: number;
  color: string;
  type: "Customer" | "Work Order";
}

export interface PendingOrder {
  id: string;
  orderNumber: string;
  customer: string;
  dueDate: string;
  quantity: number;
  status: "Ready" | "Processing" | "Delayed" | "Quality Check";
  priority: "High" | "Medium" | "Low";
  orderType: "Customer Order" | "Work Order" | "Transfer Order";
  totalValue: number;
}

export interface OnTimeMetrics {
  period: string;
  onTime: number;
  delayed: number;
  rate: number;
}

export interface OutboundActivity {
  orderId: string;
  customer: string;
  status: string;
  timestamp: string | Date;
  quantity: number;
  type: "Customer Order" | "Work Order" | "Transfer Order";
}

export interface OutboundSummary {
  totalOrders: number;
  dispatchedOrders: number;
  pendingOrders: number;
  activeCustomers: number;
  avgOrderValue: number;
  dispatchRate: number;
}

export const outboundAPI = {
  getMetrics: () => apiCall<OutboundMetrics>("/outbound/metrics"),

  getCustomerData: () => apiCall<CustomerDispatch[]>("/outbound/customer-data"),

  getPendingOrders: () => apiCall<PendingOrder[]>("/outbound/pending-orders"),

  getOnTimeMetrics: () => apiCall<OnTimeMetrics[]>("/outbound/ontime-metrics"),

  getRecentActivities: () =>
    apiCall<OutboundActivity[]>("/outbound/activities"),

  getSummary: () => apiCall<OutboundSummary>("/outbound/summary"),
};

// Storage Utilization Dashboard API
export interface StorageOverview {
  totalCapacity: number;
  currentOccupied: number;
  occupancyPercentage: number;
  availableCapacity: number;
  totalProducts: number;
  avgStockPerProduct: number;
}

export interface RackUtilization {
  rackId: string;
  capacity: number;
  occupied: number;
  status: "available" | "near-full" | "overfilled";
  location: string;
  utilizationPercentage: number;
  categoryName?: string;
  productCount?: number;
}

export interface HeatMapCell {
  x: number;
  y: number;
  utilization: number;
  rackId: string;
  categoryName?: string;
}

export interface TrendData {
  date: string;
  inbound: number;
  outbound: number;
}

export interface StorageKPIData {
  averageUtilization: number;
  underutilizedRacks: number;
  storageEfficiency: number;
  totalProducts: number;
  lowStockItems: number;
}

export interface ForecastData {
  period: string;
  predictedUtilization: number;
  confidence: number;
}

export interface StorageSummary {
  totalCapacity: number;
  currentStock: number;
  availableCapacity: number;
  utilizationRate: number;
  totalProducts: number;
  totalCategories: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export const storageUtilizationAPI = {
  getOverview: () => apiCall<StorageOverview>("/storage-utilization/overview"),

  getRackUtilization: () =>
    apiCall<RackUtilization[]>("/storage-utilization/rack-utilization"),

  getHeatMap: () => apiCall<HeatMapCell[]>("/storage-utilization/heat-map"),

  getTrends: () =>
    apiCall<{ inboundData: TrendData[]; outboundData: TrendData[] }>(
      "/storage-utilization/trends"
    ),

  getKPIs: () => apiCall<StorageKPIData>("/storage-utilization/kpis"),

  getForecast: () => apiCall<ForecastData[]>("/storage-utilization/forecast"),

  getSummary: () => apiCall<StorageSummary>("/storage-utilization/summary"),
}; // Export all APIs
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
  qc: qcAPI,
  productionCalculator: productionCalculatorAPI,
  inbound: inboundAPI,
  outbound: outboundAPI,
  storageUtilization: storageUtilizationAPI,
};

// Stock Out Management interfaces
export interface StockOutItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  quantityRequested: number;
  quantityAllocated: number;
  quantityDispatched: number;
  unit: string;
  status:
    | "pending"
    | "allocated"
    | "dispatched"
    | "partially-dispatched"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  requestDate: string;
  requiredDate: string;
  dispatchDate?: string;
  destination: string;
  requestedBy: string;
  notes?: string;
  trackingNumber?: string;
  estimatedValue: number;
}

export interface StockOutRequest {
  id: string;
  requestNumber: string;
  requestDate: string;
  requiredDate: string;
  requestedBy: string;
  department: string;
  destination: string;
  status:
    | "draft"
    | "submitted"
    | "approved"
    | "processing"
    | "completed"
    | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  totalItems: number;
  totalValue: number;
  items: StockOutItem[];
  approvedBy?: string;
  processedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockOutMetrics {
  totalRequestsToday: number;
  totalItemsDispatched: number;
  totalValueDispatched: number;
  pendingRequests: number;
  completionRate: number;
  averageProcessingTime: number;
}

export interface StockOutDashboardData {
  categoryBreakdown: { name: string; value: number; count: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  dispatchTrends: { date: string; dispatched: number; value: number }[];
  topDestinations: { name: string; count: number; value: number }[];
}

export interface StockOutRequestsResponse {
  requests: StockOutRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRequests: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Stock Out Management API
export const stockOutAPI = {
  getRequests: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    department?: string;
  }): Promise<ApiResponse<StockOutRequestsResponse>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return fetch(
      `${API_BASE_URL}/stock-out/requests${
        queryString ? `?${queryString}` : ""
      }`
    ).then((res) => res.json());
  },

  getMetrics: (): Promise<ApiResponse<StockOutMetrics>> =>
    fetch(`${API_BASE_URL}/stock-out/metrics`).then((res) => res.json()),

  getDashboardData: (): Promise<ApiResponse<StockOutDashboardData>> =>
    fetch(`${API_BASE_URL}/stock-out/dashboard`).then((res) => res.json()),

  getRequestById: (id: string): Promise<ApiResponse<StockOutRequest>> =>
    fetch(`${API_BASE_URL}/stock-out/requests/${id}`).then((res) => res.json()),

  createRequest: (request: {
    requestedBy: string;
    department: string;
    destination: string;
    priority?: "low" | "medium" | "high" | "urgent";
    requiredDate: string;
    notes?: string;
    items: {
      itemCode: string;
      itemName: string;
      category: string;
      quantityRequested: number;
      unit: string;
      estimatedValue?: number;
    }[];
  }): Promise<ApiResponse<{ id: string; requestNumber: string }>> => {
    return fetch(`${API_BASE_URL}/stock-out/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }).then((res) => res.json());
  },

  updateRequest: (
    id: string,
    updates: {
      status?: string;
      requestedBy?: string;
      department?: string;
      destination?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      requiredDate?: string;
      notes?: string;
      approvedBy?: string;
      processedBy?: string;
      totalValue?: number;
      items?: {
        id?: string;
        itemCode?: string;
        itemName?: string;
        category?: string;
        quantityRequested?: number;
        unit?: string;
        estimatedValue?: number;
        quantityAllocated?: number;
        quantityDispatched?: number;
        status?: string;
        trackingNumber?: string;
        dispatchDate?: string;
      }[];
    }
  ): Promise<ApiResponse<{ message: string }>> => {
    return fetch(`${API_BASE_URL}/stock-out/requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then((res) => res.json());
  },
};

// Updated main API object
export const apiUpdated = {
  healthCheck,
  dashboard: dashboardAPI,
  products: productsAPI,
  suppliers: suppliersAPI,
  customers: customersAPI,
  bills: billsAPI,
  alerts: alertsAPI,
  purchaseOrders: purchaseOrdersAPI,
  customerOrders: customerOrdersAPI,
  reports: reportsAPI,
  qc: qcAPI,
  productionCalculator: productionCalculatorAPI,
  inbound: inboundAPI,
  outbound: outboundAPI,
  storageUtilization: storageUtilizationAPI,
  stockOut: stockOutAPI,
};
