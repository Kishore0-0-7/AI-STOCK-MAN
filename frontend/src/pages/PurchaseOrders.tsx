import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Eye,
  RefreshCw,
  Calendar,
  Truck,
  Check,
  X,
  Clock,
  AlertCircle,
  Filter,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  purchaseOrdersAPI,
  suppliersAPI,
  productsAPI,
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  Product,
} from "@/services/api";

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewLoading, setViewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("total_amount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    orderId: string;
    newStatus: string;
    oldStatus: string;
  } | null>(null);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] =
    useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    supplier_id: "",
    status: "pending" as const,
    items: [] as Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [purchaseOrders, searchTerm, selectedStatuses, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, suppliersResponse, productsResponse] =
        await Promise.all([
          purchaseOrdersAPI.getAll(),
          suppliersAPI.getAll(),
          productsAPI.getAll(),
        ]);

      setPurchaseOrders(
        (ordersResponse as any)?.orders || ordersResponse || []
      );
      setSuppliers(
        (suppliersResponse as any)?.suppliers || suppliersResponse || []
      );
      console.log(
        "Loaded suppliers:",
        (suppliersResponse as any)?.suppliers || suppliersResponse || []
      );
      setProducts(
        (productsResponse as any)?.products || productsResponse || []
      );
      console.log(
        "Loaded products:",
        (productsResponse as any)?.products || productsResponse || []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase orders data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = purchaseOrders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.supplier?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((order) =>
        selectedStatuses.includes(order.status)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "supplier":
          aValue = (a.supplier?.name || a.supplier_name || "").toLowerCase();
          bValue = (b.supplier?.name || b.supplier_name || "").toLowerCase();
          break;
        case "total_amount":
          aValue = a.totalAmount || a.total_amount || 0;
          bValue = b.totalAmount || b.total_amount || 0;
          break;
        case "id":
          aValue = Number(a.id) || 0;
          bValue = Number(b.id) || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredOrders(sorted);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", icon: Clock },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-blue-100 text-blue-800", icon: Check },
      shipped: { color: "bg-purple-100 text-purple-800", icon: Truck },
      received: { color: "bg-green-100 text-green-800", icon: Package },
      completed: { color: "bg-green-100 text-green-800", icon: Check },
      cancelled: { color: "bg-red-100 text-red-800", icon: X },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getNextStatus = (
    currentStatus: string
  ): { nextStatus: string; buttonText: string } | null => {
    const statusFlow = {
      pending: { nextStatus: "approved", buttonText: "Approve" },
      approved: { nextStatus: "shipped", buttonText: "Mark as Shipped" },
      shipped: { nextStatus: "received", buttonText: "Mark as Received" },
      received: { nextStatus: "completed", buttonText: "Mark as Completed" },
      completed: null,
      cancelled: null,
    };

    return statusFlow[currentStatus as keyof typeof statusFlow] || null;
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_id || formData.items.length === 0) {
      toast({
        title: "Error",
        description: "Please select a supplier and add items",
        variant: "destructive",
      });
      return;
    }

    // Check if all items have valid product_id and quantities
    const invalidItems = formData.items.some(
      (item) =>
        !item.product_id ||
        !item.quantity ||
        item.quantity <= 0 ||
        !item.unit_price ||
        item.unit_price <= 0
    );

    if (invalidItems) {
      toast({
        title: "Error",
        description:
          "Please ensure all items have valid products, quantities, and prices",
        variant: "destructive",
      });
      return;
    }

    try {
      const total_amount = formData.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      // Format data according to backend API expectations
      const orderData = {
        supplierId: formData.supplier_id,
        expectedDate: null, // Optional field
        notes: null, // Optional field
        items: formData.items.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
        })),
      };

      console.log("Sending order data:", orderData);

      await purchaseOrdersAPI.create(orderData);

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      setIsCreateDialogOpen(false);
      setIsCreateSheetOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error creating purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    }
  };

  const handleStatusChangeRequest = (orderId: string, newStatus: string) => {
    const order = purchaseOrders.find((o) => o.id === orderId);
    if (order) {
      setPendingStatusChange({
        orderId,
        newStatus,
        oldStatus: order.status,
      });
      setIsStatusChangeDialogOpen(true);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    try {
      await purchaseOrdersAPI.updateStatus(
        pendingStatusChange.orderId,
        pendingStatusChange.newStatus
      );
      toast({
        title: "Success",
        description: `Order status updated to ${pendingStatusChange.newStatus}`,
      });
      fetchData();
      setIsStatusChangeDialogOpen(false);
      setPendingStatusChange(null);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await purchaseOrdersAPI.updateStatus(orderId, newStatus);
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) {
      return;
    }

    try {
      await purchaseOrdersAPI.delete(orderId);
      toast({
        title: "Success",
        description: "Purchase order deleted successfully",
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = async (order: PurchaseOrder) => {
    try {
      setViewLoading(true);
      console.log("Fetching order details for:", order.id);
      const orderDetails = await purchaseOrdersAPI.getById(order.id);
      console.log("Order details received:", orderDetails);
      setSelectedOrder(orderDetails);
      setOrderItems(orderDetails.items || []);

      // Better responsive handling - use media query instead of window.innerWidth
      const isMobile = window.matchMedia("(max-width: 640px)").matches;
      if (isMobile) {
        setIsViewSheetOpen(true);
      } else {
        setIsViewDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    } finally {
      setViewLoading(false);
    }
  };

  const addOrderItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { product_id: "", quantity: 1, unit_price: 0 }],
    }));
  };

  const removeOrderItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Helper function to close all view dialogs/sheets
  const closeViewDialogs = () => {
    setIsViewDialogOpen(false);
    setIsViewSheetOpen(false);
    setSelectedOrder(null);
    setOrderItems([]);
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      status: "pending",
      items: [],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading purchase orders...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="space-y-3 sm:space-y-6 p-3 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              Purchase Orders
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Manage supplier orders and procurement
            </p>
          </div>

          {/* Mobile and Desktop Create Button */}
          <div className="w-full sm:w-auto">
            {/* Desktop Dialog */}
            <div className="hidden sm:block">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    New Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Purchase Order</DialogTitle>
                    <DialogDescription>
                      Create a new purchase order for supplier procurement
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrder} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Supplier
                        </label>
                        <Select
                          value={formData.supplier_id}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              supplier_id: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers && suppliers.length > 0 ? (
                              suppliers.map((supplier) => (
                                <SelectItem
                                  key={supplier.id}
                                  value={String(supplier.id)}
                                >
                                  {supplier.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No suppliers available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Status
                        </label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              status: value as any,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">
                          Order Items
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOrderItem}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {formData.items.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end p-3 border rounded"
                          >
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Product
                              </label>
                              <Select
                                value={item.product_id}
                                onValueChange={(value) =>
                                  updateOrderItem(index, "product_id", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products && products.length > 0 ? (
                                    products.map((product) => (
                                      <SelectItem
                                        key={product.id}
                                        value={String(product.id)}
                                      >
                                        {product.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="" disabled>
                                      No products available
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Quantity
                              </label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateOrderItem(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Unit Price
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updateOrderItem(
                                    index,
                                    "unit_price",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                min="0"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOrderItem(index)}
                              className="w-full sm:w-auto"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="ml-1 sm:hidden">Remove</span>
                            </Button>
                          </div>
                        ))}
                      </div>

                      {formData.items.length > 0 && (
                        <div className="mt-2 p-3 bg-gray-50 rounded">
                          <strong className="text-lg">
                            Total: ₹
                            {formData.items
                              .reduce(
                                (sum, item) =>
                                  sum + item.quantity * item.unit_price,
                                0
                              )
                              .toFixed(2)}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          resetForm();
                        }}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="w-full sm:w-auto">
                        Create Order
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Mobile Sheet */}
            <div className="sm:hidden">
              <Sheet
                open={isCreateSheetOpen}
                onOpenChange={setIsCreateSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    New Order
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="h-[90vh] overflow-y-auto"
                >
                  <SheetHeader>
                    <SheetTitle>Create New Purchase Order</SheetTitle>
                    <SheetDescription>
                      Create a new purchase order for supplier procurement
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={handleCreateOrder} className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Supplier
                        </label>
                        <Select
                          value={formData.supplier_id}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              supplier_id: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers && suppliers.length > 0 ? (
                              suppliers.map((supplier) => (
                                <SelectItem
                                  key={supplier.id}
                                  value={String(supplier.id)}
                                >
                                  {supplier.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No suppliers available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Status
                        </label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              status: value as any,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">
                          Order Items
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOrderItem}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {formData.items.map((item, index) => (
                          <div
                            key={index}
                            className="space-y-2 p-3 border rounded"
                          >
                            <div>
                              <label className="block text-xs font-medium mb-1">
                                Product
                              </label>
                              <Select
                                value={item.product_id}
                                onValueChange={(value) =>
                                  updateOrderItem(index, "product_id", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products && products.length > 0 ? (
                                    products.map((product) => (
                                      <SelectItem
                                        key={product.id}
                                        value={String(product.id)}
                                      >
                                        {product.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="" disabled>
                                      No products available
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-medium mb-1">
                                  Quantity
                                </label>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateOrderItem(
                                      index,
                                      "quantity",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">
                                  Unit Price
                                </label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) =>
                                    updateOrderItem(
                                      index,
                                      "unit_price",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  min="0"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOrderItem(index)}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove Item
                            </Button>
                          </div>
                        ))}
                      </div>

                      {formData.items.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <strong className="text-lg">
                            Total: ₹
                            {formData.items
                              .reduce(
                                (sum, item) =>
                                  sum + item.quantity * item.unit_price,
                                0
                              )
                              .toFixed(2)}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 pt-4">
                      <Button type="submit" className="w-full">
                        Create Order
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateSheetOpen(false);
                          resetForm();
                        }}
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto justify-start"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="truncate">
                      {selectedStatuses.length === 0
                        ? "All Statuses"
                        : selectedStatuses.length === 1
                        ? `${
                            selectedStatuses[0].charAt(0).toUpperCase() +
                            selectedStatuses[0].slice(1)
                          }`
                        : `${selectedStatuses.length} selected`}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {[
                    { value: "draft", label: "Draft" },
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "shipped", label: "Shipped" },
                    { value: "received", label: "Received" },
                    { value: "completed", label: "Completed" },
                    { value: "cancelled", label: "Cancelled" },
                  ].map((status) => (
                    <DropdownMenuItem
                      key={status.value}
                      className="flex items-center space-x-2 cursor-pointer"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Checkbox
                        checked={selectedStatuses.includes(status.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStatuses([
                              ...selectedStatuses,
                              status.value,
                            ]);
                          } else {
                            setSelectedStatuses(
                              selectedStatuses.filter((s) => s !== status.value)
                            );
                          }
                        }}
                      />
                      <span>{status.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto justify-start"
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <span className="truncate">
                      {(() => {
                        const currentValue = `${sortBy}_${sortOrder}`;
                        switch (currentValue) {
                          case "supplier_asc":
                            return "Supplier: A-Z";
                          case "supplier_desc":
                            return "Supplier: Z-A";
                          case "id_asc":
                            return "ID: Low-High";
                          case "id_desc":
                            return "ID: High-Low";
                          case "total_amount_asc":
                            return "Amount: Low-High";
                          case "total_amount_desc":
                            return "Amount: High-Low";
                          default:
                            return "Sort by";
                        }
                      })()}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("total_amount");
                      setSortOrder("asc");
                    }}
                    className="cursor-pointer"
                  >
                    Amount: Low to High
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("total_amount");
                      setSortOrder("desc");
                    }}
                    className="cursor-pointer"
                  >
                    Amount: High to Low
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("supplier");
                      setSortOrder("asc");
                    }}
                    className="cursor-pointer"
                  >
                    Supplier: A-Z
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("supplier");
                      setSortOrder("desc");
                    }}
                    className="cursor-pointer"
                  >
                    Supplier: Z-A
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("id");
                      setSortOrder("asc");
                    }}
                    className="cursor-pointer"
                  >
                    Order ID: Low to High
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSortBy("id");
                      setSortOrder("desc");
                    }}
                    className="cursor-pointer"
                  >
                    Order ID: High to Low
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="w-full sm:w-auto justify-center"
              >
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Orders Table - Desktop */}
        <div className="hidden md:block">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort("id")}
                    >
                      <div className="flex items-center justify-between">
                        Order ID
                        {getSortIcon("id")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort("supplier")}
                    >
                      <div className="flex items-center justify-between">
                        Supplier
                        {getSortIcon("supplier")}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 select-none"
                      onClick={() => handleSort("total_amount")}
                    >
                      <div className="flex items-center justify-between">
                        Total Amount
                        {getSortIcon("total_amount")}
                      </div>
                    </TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">
                          No purchase orders found
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{String(order.id).slice(-8)}
                        </TableCell>
                        <TableCell>
                          {order.supplier?.name ||
                            order.supplier_name ||
                            "Unknown Supplier"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(newStatus) =>
                              handleStatusChangeRequest(order.id, newStatus)
                            }
                          >
                            <SelectTrigger className="w-[140px] h-9 border-2">
                              <SelectValue>
                                <div className="flex items-center">
                                  {getStatusBadge(order.status)}
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="draft"
                                className="cursor-pointer"
                              >
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge("draft")}
                                  <span className="text-sm">Draft</span>
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="pending"
                                className="cursor-pointer"
                              >
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge("pending")}
                                  <span className="text-sm">Pending</span>
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="approved"
                                className="cursor-pointer"
                              >
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge("approved")}
                                  <span className="text-sm">Approved</span>
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="shipped"
                                className="cursor-pointer"
                              >
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge("shipped")}
                                  <span className="text-sm">Shipped</span>
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="received"
                                className="cursor-pointer"
                              >
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge("received")}
                                  <span className="text-sm">Received</span>
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="completed"
                                className="cursor-pointer"
                              >
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge("completed")}
                                  <span className="text-sm">Completed</span>
                                </div>
                              </SelectItem>
                              <SelectItem
                                value="cancelled"
                                className="cursor-pointer"
                              >
                                <div className="flex items-center space-x-2">
                                  {getStatusBadge("cancelled")}
                                  <span className="text-sm">Cancelled</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="mr-1">₹</span>
                            {(
                              order.totalAmount ||
                              order.total_amount ||
                              0
                            ).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(
                              order.created_at || order.createdAt
                            ).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOrder(order)}
                              disabled={viewLoading}
                            >
                              {viewLoading ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>

                            {(() => {
                              const nextStatus = getNextStatus(order.status);
                              if (nextStatus) {
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateStatus(
                                        order.id,
                                        nextStatus.nextStatus
                                      )
                                    }
                                    title={nextStatus.buttonText}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                );
                              }
                              return null;
                            })()}

                            {(order.status === "pending" ||
                              order.status === "approved") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Orders Cards - Mobile */}
        <div className="md:hidden space-y-2">
          {filteredOrders.length === 0 ? (
            <Card className="p-6 text-center">
              <Package className="h-6 w-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">No purchase orders found</p>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="p-3">
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        PO-{String(order.id).padStart(6, "0")}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {order.supplier?.name ||
                          order.supplier_name ||
                          "Unknown Supplier"}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Details - Compact */}
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center">
                      <span className="mr-1 text-gray-400">₹</span>
                      <span className="font-medium">
                        {(order.totalAmount || order.total_amount || 0).toFixed(
                          0
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      <span>
                        {new Date(
                          order.created_at || order.createdAt
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions - Compact */}
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                      disabled={viewLoading}
                      className="flex-1 text-xs h-7"
                    >
                      {viewLoading ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </>
                      )}
                    </Button>
                    {(() => {
                      const nextStatus = getNextStatus(order.status);
                      if (nextStatus) {
                        return (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              handleUpdateStatus(
                                order.id,
                                nextStatus.nextStatus
                              )
                            }
                            className="flex-1 text-xs h-7"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            {nextStatus.buttonText
                              .replace("Mark as ", "")
                              .replace("Mark ", "")}
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* View Order Dialog - Desktop */}
        <div className="hidden sm:block">
          <Dialog
            open={isViewDialogOpen}
            onOpenChange={(open) => {
              if (!open) closeViewDialogs();
            }}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Purchase Order Details</DialogTitle>
                <DialogDescription>
                  {selectedOrder && (
                    <>
                      Order #
                      {selectedOrder.orderNumber ||
                        `PO-${String(selectedOrder.id).padStart(6, "0")}`}{" "}
                      -{" "}
                      {selectedOrder?.supplier?.name ||
                        selectedOrder?.supplier_name ||
                        "Unknown Supplier"}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              {viewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading order details...</span>
                </div>
              ) : selectedOrder ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Order Information</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>ID:</strong> {selectedOrder.id}
                        </p>
                        <p>
                          <strong>Supplier:</strong>{" "}
                          {selectedOrder.supplier?.name ||
                            selectedOrder.supplier_name ||
                            "Unknown Supplier"}
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          {getStatusBadge(selectedOrder.status)}
                        </p>
                        <p>
                          <strong>Created:</strong>{" "}
                          {new Date(
                            selectedOrder.created_at || selectedOrder.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Financial Summary</h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Total Amount:</strong> ₹
                          {(
                            selectedOrder.totalAmount ||
                            selectedOrder.total_amount ||
                            0
                          ).toFixed(2)}
                        </p>
                        <p>
                          <strong>Items Count:</strong> {orderItems.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {orderItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Order Items</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Unit Price</TableHead>
                              <TableHead>Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orderItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {item.product?.name ||
                                        item.product_name ||
                                        "Unknown Product"}
                                    </div>
                                    {item.product?.sku && (
                                      <div className="text-sm text-gray-500">
                                        SKU: {item.product.sku}
                                      </div>
                                    )}
                                    {item.product?.category && (
                                      <div className="text-sm text-gray-500">
                                        {item.product.category}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  ₹
                                  {(
                                    item.unitPrice ||
                                    item.unit_price ||
                                    0
                                  ).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  ₹
                                  {(
                                    item.totalPrice ||
                                    item.subtotal ||
                                    item.quantity *
                                      (item.unitPrice || item.unit_price || 0)
                                  ).toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      {(() => {
                        const nextStatus = getNextStatus(selectedOrder.status);
                        if (nextStatus) {
                          return (
                            <Button
                              onClick={() => {
                                handleUpdateStatus(
                                  selectedOrder.id,
                                  nextStatus.nextStatus
                                );
                                closeViewDialogs();
                              }}
                            >
                              {nextStatus.buttonText}
                            </Button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => closeViewDialogs()}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <AlertCircle className="h-8 w-8 text-gray-400 mr-2" />
                  <span className="text-gray-500">No order selected</span>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* View Order Sheet - Mobile */}
        <div className="sm:hidden">
          <Sheet
            open={isViewSheetOpen}
            onOpenChange={(open) => {
              if (!open) closeViewDialogs();
            }}
          >
            <SheetContent
              side="bottom"
              className="h-[85vh] max-h-[85vh] overflow-y-auto"
            >
              <SheetHeader className="pb-3">
                <SheetTitle className="text-lg">
                  Purchase Order Details
                </SheetTitle>
                <SheetDescription className="text-sm">
                  {selectedOrder && (
                    <>
                      Order #
                      {selectedOrder.orderNumber ||
                        `PO-${String(selectedOrder.id).padStart(6, "0")}`}{" "}
                      -{" "}
                      {selectedOrder?.supplier?.name ||
                        selectedOrder?.supplier_name ||
                        "Unknown Supplier"}
                    </>
                  )}
                </SheetDescription>
              </SheetHeader>

              {viewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading order details...</span>
                </div>
              ) : selectedOrder ? (
                <div className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Order Information</h4>
                      <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ID:</span>
                          <span className="font-mono">{selectedOrder.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Supplier:</span>
                          <span>
                            {selectedOrder.supplier?.name ||
                              selectedOrder.supplier_name ||
                              "Unknown Supplier"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Status:</span>
                          {getStatusBadge(selectedOrder.status)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span>
                            {new Date(
                              selectedOrder.created_at ||
                                selectedOrder.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Financial Summary</h4>
                      <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-semibold text-lg">
                            ₹
                            {(
                              selectedOrder.totalAmount ||
                              selectedOrder.total_amount ||
                              0
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Items Count:</span>
                          <span>{orderItems.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {orderItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Order Items</h4>
                      <div className="space-y-3">
                        {orderItems.map((item) => (
                          <div key={item.id} className="bg-gray-50 p-3 rounded">
                            <div className="mb-2">
                              <div className="font-medium">
                                {item.product?.name ||
                                  item.product_name ||
                                  "Unknown Product"}
                              </div>
                              {item.product?.sku && (
                                <div className="text-sm text-gray-500">
                                  SKU: {item.product.sku}
                                </div>
                              )}
                              {item.product?.category && (
                                <div className="text-sm text-gray-500">
                                  Category: {item.product.category}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <div className="text-gray-600">Quantity</div>
                                <div className="font-medium">
                                  {item.quantity}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600">Unit Price</div>
                                <div className="font-medium">
                                  ₹
                                  {(
                                    item.unitPrice ||
                                    item.unit_price ||
                                    0
                                  ).toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-600">Total</div>
                                <div className="font-medium">
                                  ₹
                                  {(
                                    item.totalPrice ||
                                    item.subtotal ||
                                    item.quantity *
                                      (item.unitPrice || item.unit_price || 0)
                                  ).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col space-y-2 pt-4">
                    {(() => {
                      const nextStatus = getNextStatus(selectedOrder.status);
                      if (nextStatus) {
                        return (
                          <Button
                            onClick={() => {
                              handleUpdateStatus(
                                selectedOrder.id,
                                nextStatus.nextStatus
                              );
                              setIsViewSheetOpen(false);
                            }}
                            className="w-full"
                          >
                            {nextStatus.buttonText}
                          </Button>
                        );
                      }
                      return null;
                    })()}
                    <Button
                      variant="outline"
                      onClick={() => closeViewDialogs()}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 mt-4">
                  <AlertCircle className="h-8 w-8 text-gray-400 mr-2" />
                  <span className="text-gray-500">No order selected</span>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>

        {/* Status Change Confirmation Dialog */}
        <Dialog
          open={isStatusChangeDialogOpen}
          onOpenChange={setIsStatusChangeDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Status Change</DialogTitle>
              <DialogDescription>
                Are you sure you want to change the order status from{" "}
                <span className="font-semibold">
                  {pendingStatusChange?.oldStatus}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {pendingStatusChange?.newStatus}
                </span>
                ?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-between items-center mt-6">
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-gray-500">From:</span>{" "}
                  {pendingStatusChange &&
                    getStatusBadge(pendingStatusChange.oldStatus)}
                </div>
                <ArrowUp className="h-4 w-4 text-gray-400" />
                <div className="text-sm">
                  <span className="text-gray-500">To:</span>{" "}
                  {pendingStatusChange &&
                    getStatusBadge(pendingStatusChange.newStatus)}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsStatusChangeDialogOpen(false);
                  setPendingStatusChange(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStatusChange}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm Change
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PurchaseOrders;
