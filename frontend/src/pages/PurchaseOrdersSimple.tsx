import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, RefreshCw, Download, Eye, Trash2 } from "lucide-react";

interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  status: "pending" | "approved" | "completed" | "cancelled";
  order_date?: string;
  expected_delivery?: string;
  total_amount?: number;
  notes?: string;
  created_at?: string;
}

// Mock data - always available
const mockOrders: PurchaseOrder[] = [
  {
    id: "PO-2024-001",
    supplier_id: "SUP-001",
    supplier_name: "Tech Supply Co",
    status: "pending",
    order_date: "2024-08-09",
    expected_delivery: "2024-08-16",
    total_amount: 1250.0,
    notes: "Urgent order for electronic components",
    created_at: "2024-08-09T10:30:00Z",
  },
  {
    id: "PO-2024-002",
    supplier_id: "SUP-002",
    supplier_name: "Office Depot Plus",
    status: "approved",
    order_date: "2024-08-08",
    expected_delivery: "2024-08-12",
    total_amount: 890.5,
    notes: "Monthly office supplies order",
    created_at: "2024-08-08T14:15:00Z",
  },
  {
    id: "PO-2024-003",
    supplier_id: "SUP-003",
    supplier_name: "Industrial Materials Inc",
    status: "completed",
    order_date: "2024-08-05",
    expected_delivery: "2024-08-10",
    total_amount: 2100.75,
    notes: "Safety equipment and tools",
    created_at: "2024-08-05T09:00:00Z",
  },
  {
    id: "PO-2024-004",
    supplier_id: "SUP-001",
    supplier_name: "Tech Supply Co",
    status: "cancelled",
    order_date: "2024-08-03",
    expected_delivery: "2024-08-08",
    total_amount: 450.25,
    notes: "Cancelled due to supplier unavailability",
    created_at: "2024-08-03T16:20:00Z",
  },
];

export default function PurchaseOrders() {
  console.log("PurchaseOrders component rendering...");

  const [orders, setOrders] = useState<PurchaseOrder[]>(mockOrders);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("PurchaseOrders useEffect running...");
    // Simulate loading
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log("Mock data loaded:", mockOrders);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "approved":
        return "secondary";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  console.log("Rendering orders:", orders.length);

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 bg-gradient-to-br from-background to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center lg:justify-start gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
            <FileText className="h-8 md:h-9 w-8 md:w-9 text-blue-500" />
            Purchase Orders
          </h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">
            {orders.length} total orders •{" "}
            {orders.filter((o) => o.status === "pending").length} pending
            approval
          </p>
        </div>
        <div className="flex flex-wrap justify-center lg:justify-end gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2 hover:bg-green-50 hover:border-green-200"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Sync</span>
          </Button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Orders ({orders.length})</h2>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/60 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-1">
              No purchase orders found
            </p>
            <p className="text-sm text-muted-foreground">
              Create a new order to get started
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg font-mono">
                        {order.id}
                      </h3>
                      <Badge variant={getStatusColor(order.status) as any}>
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {order.supplier_name}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span>
                        Order Date:{" "}
                        {order.order_date
                          ? new Date(order.order_date).toLocaleDateString()
                          : "N/A"}
                      </span>
                      <span>
                        Expected:{" "}
                        {order.expected_delivery
                          ? new Date(
                              order.expected_delivery
                            ).toLocaleDateString()
                          : "TBD"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${(order.total_amount || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {order.notes}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
