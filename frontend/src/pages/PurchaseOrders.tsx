import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DollarSign,
  Truck,
  Check,
  X,
  Clock,
  AlertCircle,
  Filter,
  MoreVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { purchaseOrdersAPI, suppliersAPI, productsAPI, PurchaseOrder, PurchaseOrderItem, Supplier, Product } from "@/services/api";

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  
  // Form states
  const [formData, setFormData] = useState({
    supplier_id: "",
    status: "pending" as const,
    items: [] as Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [purchaseOrders, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, suppliersResponse, productsResponse] = await Promise.all([
        purchaseOrdersAPI.getAll(),
        suppliersAPI.getAll(),
        productsAPI.getAll()
      ]);
      
      setPurchaseOrders(ordersResponse || []);
      setSuppliers(suppliersResponse || []);
      setProducts(productsResponse || []);
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

  const filterOrders = () => {
    let filtered = purchaseOrders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-blue-100 text-blue-800", icon: Check },
      shipped: { color: "bg-purple-100 text-purple-800", icon: Truck },
      received: { color: "bg-green-100 text-green-800", icon: Package },
      cancelled: { color: "bg-red-100 text-red-800", icon: X }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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

    try {
      const total_amount = formData.items.reduce(
        (sum, item) => sum + (item.quantity * item.unit_price),
        0
      );

      // Create order without items first, as the API expects items to be added separately
      const orderData = {
        supplier_id: formData.supplier_id,
        status: formData.status,
        total_amount,
      };

      await purchaseOrdersAPI.create(orderData);

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      setIsCreateDialogOpen(false);
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
      const orderDetails = await purchaseOrdersAPI.getById(order.id);
      setSelectedOrder(orderDetails);
      setOrderItems(orderDetails.items || []);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    }
  };

  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: "", quantity: 1, unit_price: 0 }]
    }));
  };

  const removeOrderItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      status: "pending",
      items: []
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage supplier orders and procurement
          </p>
        </div>
        
        {/* Mobile and Desktop Create Button */}
        <div className="w-full sm:w-auto">
          {/* Desktop Dialog */}
          <div className="hidden sm:block">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
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
                          setFormData(prev => ({ ...prev, supplier_id: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
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
                          setFormData(prev => ({ ...prev, status: value as any }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
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
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end p-3 border rounded">
                          <div>
                            <label className="block text-xs font-medium mb-1">Product</label>
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
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Quantity</label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateOrderItem(index, "quantity", parseInt(e.target.value) || 0)
                              }
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Unit Price</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateOrderItem(index, "unit_price", parseFloat(e.target.value) || 0)
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
                          Total: ${formData.items.reduce(
                            (sum, item) => sum + (item.quantity * item.unit_price),
                            0
                          ).toFixed(2)}
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
                    <Button type="submit" className="w-full sm:w-auto">Create Order</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile Sheet */}
          <div className="sm:hidden">
            <Sheet open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <SheetTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
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
                          setFormData(prev => ({ ...prev, supplier_id: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
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
                          setFormData(prev => ({ ...prev, status: value as any }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
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
                        <div key={index} className="space-y-2 p-3 border rounded">
                          <div>
                            <label className="block text-xs font-medium mb-1">Product</label>
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
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium mb-1">Quantity</label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateOrderItem(index, "quantity", parseInt(e.target.value) || 0)
                                }
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1">Unit Price</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updateOrderItem(index, "unit_price", parseFloat(e.target.value) || 0)
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
                          Total: ${formData.items.reduce(
                            (sum, item) => sum + (item.quantity * item.unit_price),
                            0
                          ).toFixed(2)}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 pt-4">
                    <Button type="submit" className="w-full">Create Order</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
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
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData} className="whitespace-nowrap">
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
                  <TableHead>Order ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500">No purchase orders found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.id.slice(-8)}
                      </TableCell>
                      <TableCell>{order.supplier_name || "Unknown Supplier"}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {order.total_amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {order.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {(order.status === "pending" || order.status === "approved") && (
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
      <div className="md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No purchase orders found</p>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-lg">#{order.id.slice(-8)}</div>
                    <div className="text-sm text-gray-500">{order.supplier_name || "Unknown Supplier"}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(order.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {order.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "approved")}>
                            <Check className="h-4 w-4 mr-2" />
                            Approve Order
                          </DropdownMenuItem>
                        )}
                        {(order.status === "pending" || order.status === "approved") && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Order
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                    <span className="font-medium">${order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewOrder(order)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  {order.status === "pending" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleUpdateStatus(order.id, "approved")}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* View Order Dialog - Desktop */}
      <div className="hidden sm:block">
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Purchase Order Details</DialogTitle>
              <DialogDescription>
                Order #{selectedOrder?.id.slice(-8)} - {selectedOrder?.supplier_name}
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Order Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>ID:</strong> {selectedOrder.id}</p>
                      <p><strong>Supplier:</strong> {selectedOrder.supplier_name}</p>
                      <p><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                      <p><strong>Created:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Financial Summary</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Total Amount:</strong> ${selectedOrder.total_amount.toFixed(2)}</p>
                      <p><strong>Items Count:</strong> {orderItems.length}</p>
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
                              <TableCell>{item.product_name || "Unknown Product"}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                              <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    {selectedOrder.status === "pending" && (
                      <Button
                        onClick={() => {
                          handleUpdateStatus(selectedOrder.id, "approved");
                          setIsViewDialogOpen(false);
                        }}
                      >
                        Approve Order
                      </Button>
                    )}
                    {selectedOrder.status === "approved" && (
                      <Button
                        onClick={() => {
                          handleUpdateStatus(selectedOrder.id, "shipped");
                          setIsViewDialogOpen(false);
                        }}
                      >
                        Mark as Shipped
                      </Button>
                    )}
                    {selectedOrder.status === "shipped" && (
                      <Button
                        onClick={() => {
                          handleUpdateStatus(selectedOrder.id, "received");
                          setIsViewDialogOpen(false);
                        }}
                      >
                        Mark as Received
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* View Order Sheet - Mobile */}
      <div className="sm:hidden">
        <Sheet open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Purchase Order Details</SheetTitle>
              <SheetDescription>
                Order #{selectedOrder?.id.slice(-8)} - {selectedOrder?.supplier_name}
              </SheetDescription>
            </SheetHeader>
            
            {selectedOrder && (
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
                        <span>{selectedOrder.supplier_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        {getStatusBadge(selectedOrder.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Financial Summary</h4>
                    <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-semibold text-lg">${selectedOrder.total_amount.toFixed(2)}</span>
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
                          <div className="font-medium mb-2">{item.product_name || "Unknown Product"}</div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <div className="text-gray-600">Quantity</div>
                              <div className="font-medium">{item.quantity}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Unit Price</div>
                              <div className="font-medium">${item.unit_price.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Subtotal</div>
                              <div className="font-medium">${item.subtotal.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-2 pt-4">
                  {selectedOrder.status === "pending" && (
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedOrder.id, "approved");
                        setIsViewDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      Approve Order
                    </Button>
                  )}
                  {selectedOrder.status === "approved" && (
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedOrder.id, "shipped");
                        setIsViewDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      Mark as Shipped
                    </Button>
                  )}
                  {selectedOrder.status === "shipped" && (
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedOrder.id, "received");
                        setIsViewDialogOpen(false);
                      }}
                      className="w-full"
                    >
                      Mark as Received
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default PurchaseOrders;
