import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Package,
  QrCode,
  Building2,
  Clock,
  CheckCircle,
  X,
  Search,
  Filter,
  Calendar,
  Mail,
  MessageSquare,
  Download,
  Send,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { alertsAPI, productsAPI, purchaseOrdersAPI } from "@/services/api1";

interface Alert {
  id: string;
  type: "low_stock" | "system" | "manual";
  priority: "low" | "medium" | "high";
  status: "active" | "acknowledged" | "resolved";
  message: string;
  created_at: string;
  product_id?: string;
  product_name?: string;
  current_stock?: number;
  low_stock_threshold?: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  low_stock_threshold: number;
  price: string | number; // API returns string, but could be number
  supplier_id: string;
  supplier_name?: string;
  supplier?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const LowStockAlerts = () => {
  const { toast } = useToast();

  // Data states
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("alerts");

  // Dialog states
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<LowStockProduct | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(50);
  const [orderNotes, setOrderNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [alertsRes, lowStockRes] = await Promise.allSettled([
        alertsAPI.getAll({ type: "low_stock", status: "active" }),
        productsAPI.getLowStock(),
      ]);

      if (alertsRes.status === "fulfilled") {
        setAlerts(alertsRes.value || []);
      } else {
        console.error("Failed to load alerts:", alertsRes.reason);
        setAlerts([]);
      }

      if (lowStockRes.status === "fulfilled") {
        setLowStockProducts(lowStockRes.value || []);
      } else {
        console.error("Failed to load low stock products:", lowStockRes.reason);
        setLowStockProducts([]);
      }
    } catch (error) {
      console.error("Error fetching alert data:", error);
      toast({
        title: "Error",
        description: "Failed to load alert data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIgnoreAlert = async (alertId: string) => {
    try {
      await alertsAPI.updateStatus(alertId, "acknowledged");
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been marked as acknowledged.",
      });
      await fetchData();
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await alertsAPI.updateStatus(alertId, "resolved");
      toast({
        title: "Alert Resolved",
        description: "The alert has been marked as resolved.",
      });
      await fetchData();
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast({
        title: "Error",
        description: "Failed to resolve alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openOrderDialog = (product: LowStockProduct) => {
    setSelectedProduct(product);
    setOrderQuantity(Math.max(50, product.low_stock_threshold * 2));
    setOrderNotes(`Restock ${product.name} due to low inventory`);
    setIsOrderDialogOpen(true);
  };

  const handleCreatePurchaseOrder = async () => {
    if (!selectedProduct) return;

    try {
      const orderNumber = `PO-${Date.now()}`;
      const orderData = {
        orderNumber,
        supplierId: selectedProduct.supplier_id,
        orderDate: new Date().toISOString(),
        expectedDeliveryDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        notes: orderNotes,
        items: [
          {
            productId: selectedProduct.id,
            quantity: orderQuantity,
            unitPrice: selectedProduct.price,
          },
        ],
      };

      await (purchaseOrdersAPI.create as any)(orderData);

      toast({
        title: "Purchase Order Created",
        description: `Purchase order ${orderNumber} for ${orderQuantity} units of ${selectedProduct.name} has been created.`,
      });

      setIsOrderDialogOpen(false);
      setSelectedProduct(null);
      setOrderQuantity(50);
      setOrderNotes("");

      await fetchData();
    } catch (error) {
      console.error("Error creating purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStockLevelColor = (current: number, threshold: number) => {
    const percentage = (current / threshold) * 100;
    if (percentage <= 50) return "text-red-600";
    if (percentage <= 100) return "text-yellow-600";
    return "text-green-600";
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.product_name &&
        alert.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority =
      priorityFilter === "all" || alert.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const filteredProducts = lowStockProducts.filter((product) => {
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportAlertsToCSV = () => {
    const headers = [
      "Alert ID",
      "Message",
      "Priority",
      "Status",
      "Product",
      "Created At",
    ];
    const rows = filteredAlerts.map((alert) => [
      alert.id,
      `"${alert.message}"`,
      alert.priority,
      alert.status,
      `"${alert.product_name || "N/A"}"`,
      formatDate(alert.created_at),
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `low-stock-alerts-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 bg-gradient-to-br from-background to-orange-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center lg:justify-start gap-3 bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 bg-clip-text text-transparent">
            <AlertTriangle className="h-8 md:h-9 w-8 md:w-9 text-orange-500" />
            Low Stock Alerts
          </h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">
            {alerts.length} active alerts • {lowStockProducts.length} products
            need attention
          </p>
        </div>

        <div className="flex flex-wrap justify-center lg:justify-end gap-3">
          <Button
            onClick={exportAlertsToCSV}
            variant="outline"
            className="flex items-center gap-2 hover:bg-green-50 hover:border-green-200"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button
            onClick={fetchData}
            variant="outline"
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Sync</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="relative p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-red-50/50 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Critical Alerts
              </p>
              <p className="text-3xl font-bold text-foreground">
                {alerts.filter((a) => a.priority === "high").length}
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
        </Card>

        <Card className="relative p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-yellow-50/50 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Products Low Stock
              </p>
              <p className="text-3xl font-bold text-foreground">
                {lowStockProducts.length}
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
        </Card>

        <Card className="relative p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-blue-50/50 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg. Response Time
              </p>
              <p className="text-3xl font-bold text-foreground">2.5h</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search alerts or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="alerts">
            Active Alerts ({filteredAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            Low Stock Products ({filteredProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
              <p className="text-gray-600">
                All stock levels are currently adequate.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        className={`h-5 w-5 mt-1 ${
                          alert.priority === "high"
                            ? "text-red-500"
                            : alert.priority === "medium"
                            ? "text-yellow-500"
                            : "text-blue-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getPriorityColor(alert.priority)}>
                            {alert.priority} priority
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(alert.created_at)}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">
                          {alert.message}
                        </p>
                        {alert.product_name && (
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {alert.product_name}
                            </span>
                            {alert.current_stock !== undefined &&
                              alert.low_stock_threshold !== undefined && (
                                <span
                                  className={`flex items-center gap-1 ${getStockLevelColor(
                                    alert.current_stock,
                                    alert.low_stock_threshold
                                  )}`}
                                >
                                  Stock: {alert.current_stock} /{" "}
                                  {alert.low_stock_threshold}
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                        className="text-green-600 border-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIgnoreAlert(alert.id)}
                        className="text-gray-600 border-gray-300"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {filteredProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Low Stock Products
              </h3>
              <p className="text-gray-600">
                All products have adequate inventory levels.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-gray-600">
                          {product.category}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Low Stock
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Stock:</span>
                        <span
                          className={getStockLevelColor(
                            product.current_stock,
                            product.low_stock_threshold
                          )}
                        >
                          {product.current_stock}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Threshold:</span>
                        <span>{product.low_stock_threshold}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Unit Price:</span>
                        <span>${parseFloat(product.price.toString()).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          product.current_stock <=
                          product.low_stock_threshold * 0.5
                            ? "bg-red-500"
                            : product.current_stock <=
                              product.low_stock_threshold
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.max(
                            5,
                            Math.min(
                              100,
                              (product.current_stock /
                                (product.low_stock_threshold * 2)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>

                    <Button
                      onClick={() => openOrderDialog(product)}
                      className="w-full"
                      size="sm"
                    >
                      Create Purchase Order
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Purchase Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Order Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Number(e.target.value))}
                min="1"
              />
              <p className="text-sm text-gray-600 mt-1">
                Estimated cost: $
                {(parseFloat(selectedProduct?.price?.toString() || '0') * orderQuantity).toFixed(2)}
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={3}
                placeholder="Add any special instructions or notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOrderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePurchaseOrder}>
              <Send className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LowStockAlerts;
