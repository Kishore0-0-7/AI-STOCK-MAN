import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  User,
  Package,
  ShoppingCart,
  FileText,
  Clock,
  Box,
} from "lucide-react";

import type { Supplier, SupplierDetails } from "@/types/supplier";
import { dummySuppliers } from "./Suppliers";

// Extended dummy data for the selected supplier
const getDummySupplierDetails = (id: string): SupplierDetails | null => {
  const supplier = dummySuppliers.find(s => s.id === id);
  if (!supplier) return null;

  return {
    ...supplier,
    email: "contact@example.com",
    phone: "+1 234-567-8900",
    address: "123 Business Street, Industry Park, City, Country",
    contract: {
      startDate: "2023-01-01",
      endDate: "2024-12-31",
      type: "Annual Contract",
    },
    recentPurchases: [
      {
        id: "PO001",
        date: "2023-08-01",
        items: ["Product A", "Product B"],
        amount: 5000,
        status: "completed",
      },
      {
        id: "PO002",
        date: "2023-07-15",
        items: ["Product C"],
        amount: 2500,
        status: "completed",
      },
    ],
    currentPurchaseOrders: [
      {
        id: "PO003",
        date: "2023-08-10",
        items: ["Product D", "Product E"],
        amount: 7500,
        status: "pending",
      },
      {
        id: "PO004",
        date: "2023-08-05",
        items: ["Product F"],
        amount: 3000,
        status: "processing",
      },
    ],
  };
};

export default function SupplierDetails() {
  const { id } = useParams();
  const supplier = id ? getDummySupplierDetails(id) : null;

  if (!supplier) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-muted-foreground mb-1">
            Supplier not found
          </p>
          <p className="text-sm text-muted-foreground">
            The requested supplier could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {supplier.name}
            </h1>
            <p className="text-muted-foreground">
              {supplier.category || "General"}
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Contact Person:</span>
              <span>{supplier.contact_person}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span>{supplier.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Phone:</span>
              <span>{supplier.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Address:</span>
              <span>{supplier.address}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">Contract Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Contract Type:</span>
              <span>{supplier.contract.type}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
              <span>{supplier.contract.startDate} to {supplier.contract.endDate}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Products and Orders */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Products</h2>
          </div>
          <div className="space-y-2">
            {supplier.products?.map((product, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/40"
              >
                <Box className="h-4 w-4 text-muted-foreground" />
                <span>{product}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Current Orders</h2>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {supplier.currentOrders || 0}
          </div>
        </Card>
      </div>

      {/* Purchase History */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Purchases</h2>
        <div className="space-y-4">
          {supplier.recentPurchases.map((purchase) => (
            <div
              key={purchase.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div>
                <div className="font-medium">{purchase.id}</div>
                <div className="text-sm text-muted-foreground">
                  {purchase.date} • {purchase.items.join(", ")}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">₹{purchase.amount.toLocaleString('en-IN')}</div>
                <div className="text-sm">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    purchase.status === "completed"
                      ? "bg-green-50 text-green-700"
                      : purchase.status === "processing"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-orange-50 text-orange-700"
                  }`}>
                    {purchase.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Current Purchase Orders */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Current Purchase Orders</h2>
        <div className="space-y-4">
          {supplier.currentPurchaseOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div>
                <div className="font-medium">{order.id}</div>
                <div className="text-sm text-muted-foreground">
                  {order.date} • {order.items.join(", ")}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">₹{order.amount.toLocaleString('en-IN')}</div>
                <div className="text-sm">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    order.status === "completed"
                      ? "bg-green-50 text-green-700"
                      : order.status === "processing"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-orange-50 text-orange-700"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
