export interface Supplier {
  id: string;
  name: string;
  category?: string;
  products?: string[];
  currentOrders?: number;
  contact_person?: string;
  status?: "active" | "inactive";
}

export interface Purchase {
  id: string;
  date: string;
  items: string[];
  amount: number;
  status: "completed" | "pending" | "processing";
}

export interface SupplierDetails extends Supplier {
  email: string;
  phone: string;
  address: string;
  contract: {
    startDate: string;
    endDate: string;
    type: string;
  };
  recentPurchases: Purchase[];
  currentPurchaseOrders: Purchase[];
}
