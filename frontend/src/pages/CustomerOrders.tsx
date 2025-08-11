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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  RefreshCw,
  ShoppingCart,
  Eye,
  User,
  Calendar,
  IndianRupee,
  Filter,
  MoreVertical,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { customerOrdersAPI, customersAPI, productsAPI } from "@/services/api";
import type { CustomerOrder, Customer, Product } from "@/services/api";

const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmed: { color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  preparing: { color: "bg-purple-100 text-purple-700", icon: Package },
  ready: { color: "bg-orange-100 text-orange-700", icon: Truck },
  completed: { color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { color: "bg-red-100 text-red-700", icon: XCircle },
};

const paymentStatusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-700" },
  paid: { color: "bg-green-100 text-green-700" },
  failed: { color: "bg-red-100 text-red-700" },
  partial: { color: "bg-blue-100 text-blue-700" },
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form and selection states
  const [editOrder, setEditOrder] = useState<CustomerOrder | null>(null);
  const [viewOrder, setViewOrder] = useState<CustomerOrder | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<CustomerOrder | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Form state for creating/editing orders
  const [form, setForm] = useState<{
    customer_id: string;
    order_date: string;
    delivery_date: string;
    status:
      | "pending"
      | "confirmed"
      | "preparing"
      | "ready"
      | "completed"
      | "cancelled";
    payment_method: "cash" | "card" | "upi" | "bank_transfer" | "cheque";
    payment_status: "pending" | "paid" | "failed" | "partial";
    notes: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>;
  }>({
    customer_id: "",
    order_date: new Date().toISOString().split("T")[0],
    delivery_date: "",
    status: "pending",
    payment_method: "cash",
    payment_status: "pending",
    notes: "",
    items: [{ product_id: "", quantity: 1, unit_price: 0 }],
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchProducts();
  }, [currentPage, statusFilter, customerFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        customer_id: customerFilter !== "all" ? customerFilter : undefined,
      };

      const response = await customerOrdersAPI.getAll(params);
      setOrders(response.orders || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total_items || 0);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast({
        title: "Error loading orders",
        description: "Failed to load customer orders. Please try again.",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const customers = await customersAPI.getAll();
      setCustomers(customers);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const products = await productsAPI.getAll();
      setProducts(products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Specific validation with detailed error messages
    if (!form.customer_id) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for this order",
        variant: "destructive",
      });
      return;
    }

    if (!form.order_date) {
      toast({
        title: "Order Date Required",
        description: "Please specify the order date",
        variant: "destructive",
      });
      return;
    }

    // Validate order items
    const invalidItems = form.items
      .map((item, index) => {
        const errors = [];
        if (!item.product_id) errors.push("product");
        if (!item.quantity || item.quantity <= 0) errors.push("quantity");
        if (!item.unit_price || item.unit_price <= 0) errors.push("unit price");
        return errors.length > 0 ? { index: index + 1, errors } : null;
      })
      .filter(Boolean);

    if (invalidItems.length > 0) {
      const firstInvalidItem = invalidItems[0];
      toast({
        title: "Item Validation Error",
        description: `Item ${
          firstInvalidItem.index
        }: Please fill in ${firstInvalidItem.errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    try {
      if (editOrder) {
        // Prepare the update data without items for now
        const updateData = {
          customer_id: parseInt(form.customer_id),
          order_date: form.order_date,
          delivery_date: form.delivery_date,
          status: form.status,
          payment_method: form.payment_method,
          payment_status: form.payment_status,
          notes: form.notes,
        };
        await customerOrdersAPI.update(editOrder.id.toString(), updateData);
        toast({
          title: "Success",
          description: "Customer order updated successfully",
        });
        setIsEditDialogOpen(false);
      } else {
        await customerOrdersAPI.create(form);
        toast({
          title: "Success",
          description: "Customer order created successfully",
        });
        setIsAddDialogOpen(false);
      }

      resetForm();
      await fetchOrders();
    } catch (error) {
      console.error("Failed to save order:", error);

      // Extract specific error message from the response
      let errorMessage = "Failed to save customer order. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = (error as any).message;
      }

      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteOrder) return;

    try {
      await customerOrdersAPI.delete(deleteOrder.id.toString());
      toast({
        title: "Success",
        description: "Customer order deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeleteOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await customerOrdersAPI.updateStatus(orderId, newStatus);
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
      await fetchOrders();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = async (orderId: string) => {
    try {
      const order = await customerOrdersAPI.getById(orderId);
      setViewOrder(order);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (order: CustomerOrder) => {
    try {
      // Load full order details with items
      const fullOrder = await customerOrdersAPI.getById(order.id.toString());
      setEditOrder(fullOrder);

      // Pre-populate form with existing order data
      setForm({
        customer_id: fullOrder.customer_id.toString(),
        order_date: fullOrder.order_date,
        delivery_date: fullOrder.delivery_date || "",
        status: fullOrder.status,
        payment_method: fullOrder.payment_method,
        payment_status: fullOrder.payment_status,
        notes: fullOrder.notes || "",
        items:
          fullOrder.items && fullOrder.items.length > 0
            ? fullOrder.items.map((item) => ({
                product_id: item.product_id.toString(),
                quantity: item.quantity,
                unit_price: item.unit_price,
              }))
            : [{ product_id: "", quantity: 1, unit_price: 0 }],
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Failed to load order details:", error);
      toast({
        title: "Error",
        description:
          "Failed to load order details for editing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (order: CustomerOrder) => {
    setDeleteOrder(order);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setForm({
      customer_id: "",
      order_date: new Date().toISOString().split("T")[0],
      delivery_date: "",
      status: "pending",
      payment_method: "cash",
      payment_status: "pending",
      notes: "",
      items: [{ product_id: "", quantity: 1, unit_price: 0 }],
    });
    setEditOrder(null);
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { product_id: "", quantity: 1, unit_price: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (form.items.length > 1) {
      setForm({
        ...form,
        items: form.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = form.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setForm({ ...form, items: updatedItems });
  };

  const getStatusIcon = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (config?.icon) {
      const IconComponent = config.icon;
      return <IconComponent className="h-3 w-3 mr-1" />;
    }
    return null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getCustomerName = (customerId: string | number) => {
    const customer = customers.find(
      (c) => c.id.toString() === customerId.toString()
    );
    return customer?.name || "Unknown Customer";
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id.toString() === productId);
    return product?.name || "Unknown Product";
  };

  if (loading && orders.length === 0) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Customer Orders
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage customer orders and fulfillment
            </p>
          </div>
        </div>
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-blue-600" />
            Customer Orders
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage customer orders and fulfillment • {totalItems} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={fetchOrders}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={customerFilter}
            onValueChange={(value) => {
              setCustomerFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="shadow-lg">
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Orders</h3>
        </div>

        {/* Mobile Cards View */}
        <div className="block lg:hidden px-4 pb-4 space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/60 mb-4 mx-auto" />
              <p className="text-lg font-medium text-muted-foreground mb-1">
                No orders found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or create a new order
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg">
                        {order.order_number}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={
                          statusConfig[
                            order.status as keyof typeof statusConfig
                          ]?.color
                        }
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {order.customer_name ||
                        getCustomerName(order.customer_id)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewOrder(order.id.toString())}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(order)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(order)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      Total: {formatCurrency(order.total_amount)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={
                        paymentStatusConfig[
                          order.payment_status as keyof typeof paymentStatusConfig
                        ]?.color
                      }
                    >
                      {order.payment_status}
                    </Badge>
                  </div>
                  <p className="text-sm flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    Order: {new Date(order.order_date).toLocaleDateString()}
                    {order.delivery_date && (
                      <span className="text-muted-foreground">
                        | Delivery:{" "}
                        {new Date(order.delivery_date).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b hover:bg-muted/50">
                  <TableHead className="font-semibold px-6 py-4">
                    Order #
                  </TableHead>
                  <TableHead className="font-semibold px-6 py-4">
                    Customer
                  </TableHead>
                  <TableHead className="font-semibold px-6 py-4">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold px-6 py-4">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold px-6 py-4">
                    Payment
                  </TableHead>
                  <TableHead className="font-semibold px-6 py-4">
                    Total
                  </TableHead>
                  <TableHead className="font-semibold px-6 py-4 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <ShoppingCart className="h-16 w-16 text-muted-foreground/60 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground mb-1">
                          No orders found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your filters or create a new order
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="hover:bg-muted/30 transition-colors border-b last:border-b-0"
                    >
                      <TableCell className="font-medium px-6 py-4">
                        {order.order_number}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="font-medium">
                            {order.customer_name ||
                              getCustomerName(order.customer_id)}
                          </div>
                          {order.customer_email && (
                            <div className="text-sm text-muted-foreground">
                              {order.customer_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="text-sm">
                            Order:{" "}
                            {new Date(order.order_date).toLocaleDateString()}
                          </div>
                          {order.delivery_date && (
                            <div className="text-sm text-muted-foreground">
                              Delivery:{" "}
                              {new Date(
                                order.delivery_date
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                            >
                              <Badge
                                variant="secondary"
                                className={`cursor-pointer ${
                                  statusConfig[
                                    order.status as keyof typeof statusConfig
                                  ]?.color
                                }`}
                              >
                                {getStatusIcon(order.status)}
                                {order.status}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  order.id.toString(),
                                  "pending"
                                )
                              }
                            >
                              Set Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  order.id.toString(),
                                  "confirmed"
                                )
                              }
                            >
                              Set Confirmed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  order.id.toString(),
                                  "preparing"
                                )
                              }
                            >
                              Set Preparing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id.toString(), "ready")
                              }
                            >
                              Set Ready
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  order.id.toString(),
                                  "completed"
                                )
                              }
                            >
                              Set Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  order.id.toString(),
                                  "cancelled"
                                )
                              }
                            >
                              Set Cancelled
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              paymentStatusConfig[
                                order.payment_status as keyof typeof paymentStatusConfig
                              ]?.color
                            }`}
                          >
                            {order.payment_status}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {order.payment_method}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 font-medium">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewOrder(order.id.toString())}
                            className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(order)}
                            className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                            title="Edit order"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(order)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            title="Delete order"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              orders
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Order Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle>
              {editOrder ? "Edit Customer Order" : "Create New Customer Order"}
            </DialogTitle>
            <DialogDescription>
              {editOrder
                ? "Update the customer order details and items below."
                : "Fill in the details to create a new customer order."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Customer *
                </label>
                <Select
                  value={form.customer_id}
                  onValueChange={(value) =>
                    setForm({ ...form, customer_id: value })
                  }
                  disabled={!!editOrder} // Disable when editing
                >
                  <SelectTrigger
                    className={editOrder ? "opacity-60 cursor-not-allowed" : ""}
                  >
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer.id}
                        value={customer.id.toString()}
                      >
                        {customer.name}{" "}
                        {customer.email && `(${customer.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editOrder && (
                  <p className="text-xs text-gray-500 mt-1">
                    Customer cannot be changed when editing an existing order
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Order Date *
                </label>
                <Input
                  type="date"
                  value={form.order_date}
                  onChange={(e) =>
                    setForm({ ...form, order_date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Delivery Date
                </label>
                <Input
                  type="date"
                  value={form.delivery_date}
                  onChange={(e) =>
                    setForm({ ...form, delivery_date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({ ...form, status: value as typeof form.status })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Method
                </label>
                <Select
                  value={form.payment_method}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      payment_method: value as typeof form.payment_method,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Status
                </label>
                <Select
                  value={form.payment_status}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      payment_status: value as typeof form.payment_status,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes or special instructions"
                className="w-full p-2 border border-input rounded-md resize-none"
                rows={3}
              />
            </div>

            {/* Order Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium">
                  Order Items *
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Product *
                      </label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => {
                          const product = products.find(
                            (p) => p.id.toString() === value
                          );
                          updateItem(index, "product_id", value);
                          if (product) {
                            updateItem(index, "unit_price", product.price);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem
                              key={product.id}
                              value={product.id.toString()}
                            >
                              {product.name} - ₹{product.price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Quantity *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Unit Price *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "unit_price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                          Subtotal
                        </label>
                        <Input
                          value={formatCurrency(
                            item.quantity * item.unit_price
                          )}
                          disabled
                        />
                      </div>
                      {form.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="ml-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-right">
                  <span className="text-lg font-semibold">
                    Total:{" "}
                    {formatCurrency(
                      form.items.reduce(
                        (sum, item) => sum + item.quantity * item.unit_price,
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editOrder ? "Update Order" : "Create Order"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Order Details Dialog */}
      <Sheet open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>
              Complete information about the customer order
            </SheetDescription>
          </SheetHeader>

          {viewOrder && (
            <div className="mt-6 space-y-6">
              {/* Order Header */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Order Number
                  </label>
                  <p className="font-semibold">{viewOrder.order_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <Badge
                    variant="secondary"
                    className={`${
                      statusConfig[
                        viewOrder.status as keyof typeof statusConfig
                      ]?.color
                    } mt-1`}
                  >
                    {getStatusIcon(viewOrder.status)}
                    {viewOrder.status}
                  </Badge>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Name
                    </label>
                    <p>
                      {viewOrder.customer_name ||
                        getCustomerName(viewOrder.customer_id)}
                    </p>
                  </div>
                  {viewOrder.customer_email && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Email
                      </label>
                      <p>{viewOrder.customer_email}</p>
                    </div>
                  )}
                  {viewOrder.customer_phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Phone
                      </label>
                      <p>{viewOrder.customer_phone}</p>
                    </div>
                  )}
                  {viewOrder.customer_address && (
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Address
                      </label>
                      <p>{viewOrder.customer_address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Dates */}
              <div>
                <h3 className="font-semibold mb-3">Order Timeline</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Order Date
                    </label>
                    <p>{new Date(viewOrder.order_date).toLocaleDateString()}</p>
                  </div>
                  {viewOrder.delivery_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Delivery Date
                      </label>
                      <p>
                        {new Date(viewOrder.delivery_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="font-semibold mb-3">Payment Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Method
                    </label>
                    <p className="capitalize">
                      {viewOrder.payment_method.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <Badge
                      variant="secondary"
                      className={`${
                        paymentStatusConfig[
                          viewOrder.payment_status as keyof typeof paymentStatusConfig
                        ]?.color
                      } mt-1`}
                    >
                      {viewOrder.payment_status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Total Amount
                    </label>
                    <p className="font-semibold text-lg">
                      {formatCurrency(viewOrder.total_amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {viewOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.product_name || getProductName(item.product_id)}
                        </p>
                        {item.product_sku && (
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.product_sku}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.quantity} × {formatCurrency(item.unit_price)} ={" "}
                          {formatCurrency(item.subtotal)}
                        </p>
                        {item.available_stock !== undefined && (
                          <p className="text-sm text-muted-foreground">
                            Stock: {item.available_stock}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {viewOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-3">Notes</h3>
                  <p className="text-muted-foreground">{viewOrder.notes}</p>
                </div>
              )}

              {/* Order Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => openEditDialog(viewOrder)}
                  className="flex-1"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    openDeleteDialog(viewOrder);
                  }}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Order
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle>Delete Customer Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order "{deleteOrder?.order_number}
              "? This action cannot be undone and will restore any allocated
              stock.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
