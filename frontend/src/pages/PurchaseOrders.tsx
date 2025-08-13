import { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Truck,
  Check,
  X,
  Clock,
  AlertCircle,
  Filter,
  MoreVertical,
  ShoppingCart,
  Package,
  DollarSign,
  FileText,
  Download,
  Building,
  User,
  Star,
  TrendingUp,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Types
interface PurchaseOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_name: string;
  total_amount: number;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status: "pending" | "approved" | "shipped" | "received" | "cancelled";
  priority: "low" | "medium" | "high";
  notes?: string;
  items: PurchaseOrderItem[];
  created_by?: string;
}

// Sample data
const samplePurchaseOrders: PurchaseOrder[] = [
  {
    id: "po-001",
    order_number: "PO-2024-001",
    supplier_id: "sup-001",
    supplier_name: "SteelWorks Industries",
    total_amount: 1800000,
    order_date: "2024-01-20",
    expected_delivery_date: "2024-01-27",
    status: "approved",
    priority: "high",
    notes: "Urgent requirement for iron casting blocks",
    created_by: "Manufacturing Manager",
    items: [
      {
        id: "item-001",
        product_id: "prod-001",
        product_name: "Iron Casting Blocks - Grade A",
        quantity: 120,
        unit_price: 15000,
        total_price: 1800000,
      },
    ],
  },
  {
    id: "po-002",
    order_number: "PO-2024-002",
    supplier_id: "sup-002",
    supplier_name: "MetalCraft Co",
    total_amount: 36000,
    order_date: "2024-01-18",
    expected_delivery_date: "2024-01-25",
    actual_delivery_date: "2024-01-24",
    status: "received",
    priority: "medium",
    notes: "Monthly aluminum alloy restocking",
    created_by: "Procurement Team",
    items: [
      {
        id: "item-002",
        product_id: "prod-002",
        product_name: "Aluminum Alloy Bars - 6061",
        quantity: 80,
        unit_price: 450,
        total_price: 36000,
      },
    ],
  },
  {
    id: "po-003",
    order_number: "PO-2024-003",
    supplier_id: "sup-003",
    supplier_name: "Bronze Masters Ltd",
    total_amount: 170000,
    order_date: "2024-01-22",
    expected_delivery_date: "2024-01-29",
    status: "shipped",
    priority: "medium",
    notes: "Bronze ingots for marine applications",
    created_by: "Marine Projects Lead",
    items: [
      {
        id: "item-003",
        product_id: "prod-003",
        product_name: "Bronze Ingots - Phosphor Bronze",
        quantity: 200,
        unit_price: 850,
        total_price: 170000,
      },
    ],
  },
  {
    id: "po-004",
    order_number: "PO-2024-004",
    supplier_id: "sup-004",
    supplier_name: "Carbon Steel Works",
    total_amount: 27500,
    order_date: "2024-01-15",
    expected_delivery_date: "2024-01-22",
    status: "pending",
    priority: "low",
    notes: "Quarterly steel billets stock replenishment",
    created_by: "Steel Department Head",
    items: [
      {
        id: "item-004",
        product_id: "prod-004",
        product_name: "Steel Billets - Carbon Steel",
        quantity: 500,
        unit_price: 55,
        total_price: 27500,
      },
    ],
  },
  {
    id: "po-005",
    order_number: "PO-2024-005",
    supplier_id: "sup-005",
    supplier_name: "Naval Brass Co",
    total_amount: 86400,
    order_date: "2024-01-19",
    expected_delivery_date: "2024-01-26",
    status: "cancelled",
    priority: "medium",
    notes: "Cancelled due to specification change",
    created_by: "Marine Engineering",
    items: [
      {
        id: "item-005",
        product_id: "prod-005",
        product_name: "Brass Rods - Naval Brass",
        quantity: 120,
        unit_price: 720,
        total_price: 86400,
      },
    ],
  },
];

const sampleSuppliers = [
  { id: "sup-001", name: "SteelWorks Industries" },
  { id: "sup-002", name: "MetalCraft Co" },
  { id: "sup-003", name: "Bronze Masters Ltd" },
  { id: "sup-004", name: "Carbon Steel Works" },
  { id: "sup-005", name: "Naval Brass Co" },
];

const sampleProducts = [
  { id: "prod-001", name: "Iron Casting Blocks - Grade A", price: 15000 },
  { id: "prod-002", name: "Aluminum Alloy Bars - 6061", price: 450 },
  { id: "prod-003", name: "Bronze Ingots - Phosphor Bronze", price: 850 },
  { id: "prod-004", name: "Steel Billets - Carbon Steel", price: 55 },
  { id: "prod-005", name: "Brass Rods - Naval Brass", price: 720 },
];

export default function PurchaseOrders() {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // State management
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState<Partial<PurchaseOrder>>({
    supplier_id: "",
    expected_delivery_date: "",
    priority: "medium",
    notes: "",
    items: [],
  });

  const itemsPerPage = isMobile ? 8 : 12;

  // Load purchase orders from API
  useEffect(() => {
    const loadPurchaseOrders = async () => {
      try {
        setLoading(true);
        console.log("🛒 Loading Purchase Orders from API...");
        
        const response = await api.purchaseOrders.getAll({
          page: 1,
          limit: 100, // Load all orders for now
          search: "",
          status: "all",
          priority: "all",
          supplier: "all",
          sortBy: "order_date",
          sortOrder: "desc"
        });

        console.log("✅ Purchase Orders API response:", response);
        
        // Handle direct response (not wrapped in success/data)
        if (response && response.orders) {
          console.log("✅ Purchase Orders loaded:", response.orders);
          setPurchaseOrders(response.orders || []);
          
          toast({
            title: "Success",
            description: `Loaded ${response.orders?.length || 0} purchase orders`,
          });
        } else {
          console.error("❌ Failed to load purchase orders: Invalid response structure", response);
          toast({
            title: "Error",
            description: "Invalid response from server",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("❌ Error loading purchase orders:", error);
        toast({
          title: "Error",
          description: "Failed to connect to server",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPurchaseOrders();
  }, [toast]);

  // Statistics calculations
  const orderStats = useMemo(() => {
    const total = purchaseOrders.length;
    const pending = purchaseOrders.filter(po => po.status === "pending").length;
    const approved = purchaseOrders.filter(po => po.status === "approved").length;
    const shipped = purchaseOrders.filter(po => po.status === "shipped").length;
    const received = purchaseOrders.filter(po => po.status === "received").length;
    const cancelled = purchaseOrders.filter(po => po.status === "cancelled").length;
    const totalValue = purchaseOrders
      .filter(po => po.status !== "cancelled")
      .reduce((sum, po) => sum + po.total_amount, 0);
    const avgOrderValue = totalValue / Math.max(total - cancelled, 1);

    return {
      total,
      pending,
      approved,
      shipped,
      received,
      cancelled,
      totalValue,
      avgOrderValue,
      activeOrders: approved + shipped,
      completedOrders: received,
    };
  }, [purchaseOrders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return purchaseOrders
      .filter(order => {
        const matchesSearch = 
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.notes?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
  }, [purchaseOrders, searchTerm, statusFilter, priorityFilter]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Chart data
  const statusDistribution = useMemo(() => {
    const colors = {
      pending: "#f59e0b",
      approved: "#3b82f6", 
      shipped: "#8b5cf6",
      received: "#10b981",
      cancelled: "#ef4444",
    };

    return Object.entries(orderStats)
      .filter(([key]) => ["pending", "approved", "shipped", "received", "cancelled"].includes(key))
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count as number,
        fill: colors[status as keyof typeof colors],
      }))
      .filter(item => item.value > 0);
  }, [orderStats]);

  const monthlyTrends = useMemo(() => {
    const monthlyData: Record<string, { orders: number; value: number }> = {};

    purchaseOrders.forEach(order => {
      const month = new Date(order.order_date).toLocaleString("default", { month: "short" });
      if (!monthlyData[month]) {
        monthlyData[month] = { orders: 0, value: 0 };
      }
      monthlyData[month].orders++;
      if (order.status !== "cancelled") {
        monthlyData[month].value += order.total_amount;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      orders: data.orders,
      value: Math.round(data.value / 1000),
    }));
  }, [purchaseOrders]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      approved: { variant: "default" as const, className: "bg-blue-100 text-blue-800 border-blue-200" },
      shipped: { variant: "secondary" as const, className: "bg-purple-100 text-purple-800 border-purple-200" },
      received: { variant: "secondary" as const, className: "bg-green-100 text-green-800 border-green-200" },
      cancelled: { variant: "destructive" as const, className: "" },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      low: { className: "bg-gray-100 text-gray-800 border-gray-200" },
      medium: { className: "bg-blue-100 text-blue-800 border-blue-200" },
      high: { className: "bg-red-100 text-red-800 border-red-200" },
    };

    const config = configs[priority as keyof typeof configs] || configs.medium;

    return (
      <Badge variant="secondary" className={config.className}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      approved: <Check className="h-4 w-4" />,
      shipped: <Truck className="h-4 w-4" />,
      received: <Package className="h-4 w-4" />,
      cancelled: <X className="h-4 w-4" />,
    };
    return icons[status as keyof typeof icons] || <AlertCircle className="h-4 w-4" />;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  // Event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.supplier_id || !form.items || form.items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier and add at least one item",
        variant: "destructive",
      });
      return;
    }

    const orderData: PurchaseOrder = {
      id: selectedOrder?.id || `po-${Date.now()}`,
      order_number: selectedOrder?.order_number || `PO-2024-${String(purchaseOrders.length + 1).padStart(3, "0")}`,
      supplier_id: form.supplier_id!,
      supplier_name: sampleSuppliers.find(s => s.id === form.supplier_id)?.name || "Unknown Supplier",
      total_amount: form.items?.reduce((sum, item) => sum + item.total_price, 0) || 0,
      order_date: selectedOrder?.order_date || new Date().toISOString().split("T")[0],
      expected_delivery_date: form.expected_delivery_date,
      status: selectedOrder?.status || "pending",
      priority: form.priority as "low" | "medium" | "high",
      notes: form.notes,
      items: form.items,
      created_by: "Current User",
    };

    try {
      if (selectedOrder) {
        setPurchaseOrders(prev => prev.map(po => po.id === selectedOrder.id ? orderData : po));
        toast({ title: "Success", description: "Purchase order updated successfully" });
        setIsEditDialogOpen(false);
      } else {
        setPurchaseOrders(prev => [...prev, orderData]);
        toast({ title: "Success", description: "Purchase order created successfully" });
        setIsCreateDialogOpen(false);
      }

      setForm({
        supplier_id: "",
        expected_delivery_date: "",
        priority: "medium",
        notes: "",
        items: [],
      });
      setSelectedOrder(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save purchase order",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (!selectedOrder) return;

    setPurchaseOrders(prev => prev.filter(po => po.id !== selectedOrder.id));
    toast({ title: "Success", description: "Purchase order deleted successfully" });
    setIsDeleteDialogOpen(false);
    setSelectedOrder(null);
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setPurchaseOrders(prev =>
      prev.map(po =>
        po.id === orderId
          ? {
              ...po,
              status: newStatus as any,
              actual_delivery_date: newStatus === "received" 
                ? new Date().toISOString().split("T")[0] 
                : po.actual_delivery_date,
            }
          : po
      )
    );
    toast({ title: "Success", description: `Order status updated to ${newStatus}` });
  };

  const openEditDialog = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setForm({
      supplier_id: order.supplier_id,
      expected_delivery_date: order.expected_delivery_date,
      priority: order.priority,
      notes: order.notes,
      items: order.items,
    });
    setIsEditDialogOpen(true);
  };

  const exportToCSV = () => {
    const csvData = purchaseOrders.map(po => ({
      "Order Number": po.order_number,
      "Supplier": po.supplier_name,
      "Order Date": po.order_date,
      "Expected Delivery": po.expected_delivery_date || "",
      "Status": po.status,
      "Priority": po.priority,
      "Total Amount (₹)": po.total_amount,
      "Items Count": po.items.length,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `purchase-orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="text-muted-foreground">Loading purchase orders...</p>
          </div>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!loading && (
        <>
          {/* Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                <span className="break-words">Purchase Orders</span>
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base mt-1">
                Manage purchase orders and supplier relationships • {orderStats.total} orders total
              </p>
            </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 text-sm"
            size="sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden xs:inline">Export</span>
          </Button>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center justify-center gap-2 text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </Button>
        </div>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-amber-600">{orderStats.pending}</p>
                <div className="p-1 bg-amber-100 rounded-full">
                  <Clock className="h-3 w-3 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Need approval</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-blue-600">{orderStats.activeOrders}</p>
                <div className="p-1 bg-blue-100 rounded-full">
                  <Truck className="h-3 w-3 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Value</p>
              <div className="flex items-center space-x-2">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(orderStats.totalValue)}
                </p>
                <div className="p-1 bg-green-100 rounded-full">
                  <DollarSign className="h-3 w-3 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-purple-600">{orderStats.completedOrders}</p>
                <div className="p-1 bg-purple-100 rounded-full">
                  <Package className="h-3 w-3 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Received</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10">
          <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
          <TabsTrigger value="orders" className="text-sm">Orders</TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-6">
          {/* Quick Actions */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-3"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-6 w-6 text-blue-500" />
                <span className="text-sm font-medium">Create Order</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-3"
                onClick={() => setActiveTab("orders")}
              >
                <Eye className="h-6 w-6 text-green-500" />
                <span className="text-sm font-medium">View Orders</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-3"
                onClick={exportToCSV}
              >
                <Download className="h-6 w-6 text-purple-500" />
                <span className="text-sm font-medium">Export Data</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-3"
                onClick={() => setActiveTab("analytics")}
              >
                <TrendingUp className="h-6 w-6 text-amber-500" />
                <span className="text-sm font-medium">Analytics</span>
              </Button>
            </div>
          </Card>

          {/* Recent Orders */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Orders</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("orders")}
                className="text-blue-500"
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-4">
              {purchaseOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground truncate">
                        {order.order_number}
                      </h4>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{order.supplier_name}</p>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsViewDialogOpen(true);
                    }}
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4 sm:space-y-6 mt-6">
          {/* Search and Filters */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders by number, supplier, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Filter by Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Orders Grid/List */}
          <div className="grid gap-4 sm:gap-6">
            {paginatedOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No orders found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Order
                </Button>
              </Card>
            ) : (
              paginatedOrders.map((order) => (
                <Card key={order.id} className="p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(order.status)}
                          <h4 className="text-lg font-semibold truncate">
                            {order.order_number}
                          </h4>
                          {order.priority === "high" && (
                            <Star className="h-4 w-4 text-red-500 fill-current flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-2">{order.supplier_name}</p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.status)}
                          {getPriorityBadge(order.priority)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(order)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Order
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {order.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() => updateOrderStatus(order.id, "approved")}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {order.status === "approved" && (
                            <DropdownMenuItem
                              onClick={() => updateOrderStatus(order.id, "shipped")}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Ship
                            </DropdownMenuItem>
                          )}
                          {order.status === "shipped" && (
                            <DropdownMenuItem
                              onClick={() => updateOrderStatus(order.id, "received")}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Receive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Amount and Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(order.total_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Items</p>
                        <p className="text-lg font-semibold">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg per Item</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(Math.round(order.total_amount / order.items.length))}
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Order Date</p>
                        <p className="font-medium">{new Date(order.order_date).toLocaleDateString()}</p>
                      </div>
                      {order.expected_delivery_date && (
                        <div>
                          <p className="text-muted-foreground mb-1">Expected Delivery</p>
                          <p className="font-medium">
                            {new Date(order.expected_delivery_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {order.actual_delivery_date && (
                        <div>
                          <p className="text-muted-foreground mb-1">Actual Delivery</p>
                          <p className="font-medium text-green-600">
                            {new Date(order.actual_delivery_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        Created by: {order.created_by || "Unknown"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsViewDialogOpen(true);
                        }}
                        className="text-primary"
                      >
                        View Details
                        <ArrowUpRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {paginatedOrders.length} of {filteredOrders.length} orders
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

         {/* Analytics Tab */}
         <TabsContent value="analytics" className="space-y-4 mt-4">
           {/* Status Distribution Chart */}
           <Card className="p-4">
             <h3 className="text-sm font-semibold text-slate-900 mb-4">Order Status Distribution</h3>
             <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={statusDistribution}
                     cx="50%"
                     cy="50%"
                     innerRadius={30}
                     outerRadius={60}
                     dataKey="value"
                     label={false}
                   >
                     {statusDistribution.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(value, name) => [`${value} orders`, name]} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="grid grid-cols-2 gap-2 mt-4">
               {statusDistribution.map((item) => (
                 <div key={item.name} className="flex items-center gap-2 text-xs">
                   <div
                     className="w-3 h-3 rounded-full"
                     style={{ backgroundColor: item.fill }}
                   />
                   <span className="text-slate-600">{item.name}:</span>
                   <span className="font-medium">{item.value}</span>
                 </div>
               ))}
             </div>
           </Card>

           {/* Monthly Trends */}
           <Card className="p-4">
             <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Trends</h3>
             <div className="h-48">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={monthlyTrends}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                   <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
                   <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                   <Tooltip 
                     formatter={(value, name) => [
                       name === "value" ? `₹${value}K` : value,
                       name === "value" ? "Value" : "Orders"
                     ]}
                     contentStyle={{
                       backgroundColor: "white",
                       border: "1px solid #e2e8f0",
                       borderRadius: "8px",
                     }}
                   />
                   <Line
                     type="monotone"
                     dataKey="orders"
                     stroke="#3b82f6"
                     strokeWidth={2}
                     dot={{ r: 4 }}
                   />
                   <Line
                     type="monotone"
                     dataKey="value"
                     stroke="#10b981"
                     strokeWidth={2}
                     dot={{ r: 4 }}
                   />
                 </LineChart>
               </ResponsiveContainer>
             </div>
             <div className="flex justify-center gap-4 mt-4 text-xs">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500" />
                 <span className="text-slate-600">Orders</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-green-500" />
                 <span className="text-slate-600">Value (K)</span>
               </div>
             </div>
           </Card>

           {/* Key Metrics */}
           <div className="grid grid-cols-2 gap-3">
             <Card className="p-4 text-center">
               <div className="text-2xl font-bold text-blue-600 mb-1">
                 {formatCurrency(orderStats.avgOrderValue)}
               </div>
               <div className="text-xs text-slate-600">Average Order Value</div>
               <div className="flex items-center justify-center gap-1 mt-1">
                 <ArrowUpRight className="h-3 w-3 text-green-500" />
                 <span className="text-xs text-green-600">+12%</span>
               </div>
             </Card>

             <Card className="p-4 text-center">
               <div className="text-2xl font-bold text-green-600 mb-1">
                 {Math.round((orderStats.received / orderStats.total) * 100)}%
               </div>
               <div className="text-xs text-slate-600">Completion Rate</div>
               <div className="flex items-center justify-center gap-1 mt-1">
                 <ArrowUpRight className="h-3 w-3 text-green-500" />
                 <span className="text-xs text-green-600">+5%</span>
               </div>
             </Card>
           </div>
         </TabsContent>
       </Tabs>

     {/* Create/Edit Order Dialog */}
     <Dialog
       open={isCreateDialogOpen || isEditDialogOpen}
       onOpenChange={(open) => {
         if (!open) {
           setIsCreateDialogOpen(false);
           setIsEditDialogOpen(false);
           setSelectedOrder(null);
           setForm({
             supplier_id: "",
             expected_delivery_date: "",
             priority: "medium",
             notes: "",
             items: [],
           });
         }
       }}
     >
       <DialogContent className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>
             {selectedOrder ? "Edit Purchase Order" : "Create Purchase Order"}
           </DialogTitle>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="supplier">Supplier *</Label>
               <Select
                 value={form.supplier_id}
                 onValueChange={(value) => setForm({ ...form, supplier_id: value })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select supplier" />
                 </SelectTrigger>
                 <SelectContent>
                   {sampleSuppliers.map((supplier) => (
                     <SelectItem key={supplier.id} value={supplier.id}>
                       <div className="flex items-center gap-2">
                         <Building className="h-4 w-4" />
                         {supplier.name}
                       </div>
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="space-y-2">
               <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
               <Input
                 id="expected_delivery_date"
                 type="date"
                 value={form.expected_delivery_date || ""}
                 onChange={(e) =>
                   setForm({ ...form, expected_delivery_date: e.target.value })
                 }
               />
             </div>

             <div className="space-y-2">
               <Label htmlFor="priority">Priority</Label>
               <Select
                 value={form.priority}
                 onValueChange={(value) =>
                   setForm({ ...form, priority: value as "low" | "medium" | "high" })
                 }
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="low">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-gray-400" />
                       Low Priority
                     </div>
                   </SelectItem>
                   <SelectItem value="medium">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-400" />
                       Medium Priority
                     </div>
                   </SelectItem>
                   <SelectItem value="high">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-red-400" />
                       High Priority
                     </div>
                   </SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <div className="space-y-2">
               <Label htmlFor="notes">Notes</Label>
               <Textarea
                 id="notes"
                 value={form.notes || ""}
                 onChange={(e) => setForm({ ...form, notes: e.target.value })}
                 placeholder="Additional notes for this order..."
                 rows={3}
               />
             </div>

             {/* Simplified Items Section */}
             <div className="space-y-2">
               <Label>Order Items</Label>
               <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
                 <Package className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                 <p className="text-sm text-slate-600 mb-2">Add items to your order</p>
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={() => {
                     toast({
                       title: "Coming Soon",
                       description: "Item management will be available in the next update",
                     });
                   }}
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Add Items
                 </Button>
               </div>
             </div>
           </div>

           <DialogFooter className="flex gap-2">
             <Button
               type="button"
               variant="outline"
               onClick={() => {
                 setIsCreateDialogOpen(false);
                 setIsEditDialogOpen(false);
               }}
               className="flex-1"
             >
               Cancel
             </Button>
             <Button type="submit" className="flex-1">
               {selectedOrder ? "Update" : "Create"}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>

     {/* View Order Dialog */}
     <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
       <DialogContent className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Order Details</DialogTitle>
         </DialogHeader>
         {selectedOrder && (
           <div className="space-y-4">
             {/* Header Info */}
             <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
               <h3 className="text-lg font-bold text-slate-900">{selectedOrder.order_number}</h3>
               <p className="text-sm text-slate-600">{selectedOrder.supplier_name}</p>
               <div className="flex items-center justify-center gap-2 mt-2">
                 {getStatusBadge(selectedOrder.status)}
                 {getPriorityBadge(selectedOrder.priority)}
               </div>
             </div>

             {/* Amount */}
             <div className="text-center p-4 border rounded-lg">
               <div className="text-2xl font-bold text-green-600 mb-1">
                 {formatCurrency(selectedOrder.total_amount)}
               </div>
               <div className="text-sm text-slate-600">
                 {selectedOrder.items.length} item{selectedOrder.items.length !== 1 ? "s" : ""} • 
                 Avg {formatCurrency(Math.round(selectedOrder.total_amount / selectedOrder.items.length))}
               </div>
             </div>

             {/* Dates */}
             <div className="space-y-3">
               <div className="flex justify-between py-2 border-b">
                 <span className="text-sm text-slate-600">Order Date:</span>
                 <span className="text-sm font-medium">
                   {new Date(selectedOrder.order_date).toLocaleDateString()}
                 </span>
               </div>
               {selectedOrder.expected_delivery_date && (
                 <div className="flex justify-between py-2 border-b">
                   <span className="text-sm text-slate-600">Expected Delivery:</span>
                   <span className="text-sm font-medium">
                     {new Date(selectedOrder.expected_delivery_date).toLocaleDateString()}
                   </span>
                 </div>
               )}
               {selectedOrder.actual_delivery_date && (
                 <div className="flex justify-between py-2 border-b">
                   <span className="text-sm text-slate-600">Actual Delivery:</span>
                   <span className="text-sm font-medium text-green-600">
                     {new Date(selectedOrder.actual_delivery_date).toLocaleDateString()}
                   </span>
                 </div>
               )}
               {selectedOrder.created_by && (
                 <div className="flex justify-between py-2 border-b">
                   <span className="text-sm text-slate-600">Created By:</span>
                   <span className="text-sm font-medium">{selectedOrder.created_by}</span>
                 </div>
               )}
             </div>

             {/* Items */}
             <div className="space-y-2">
               <h4 className="font-medium text-slate-900">Order Items</h4>
               <div className="space-y-2">
                 {selectedOrder.items.map((item) => (
                   <div key={item.id} className="p-3 bg-slate-50 rounded-lg">
                     <div className="flex justify-between items-start mb-2">
                       <div className="font-medium text-sm text-slate-900 flex-1">
                         {item.product_name}
                       </div>
                       <div className="text-sm font-bold text-green-600 ml-2">
                         {formatCurrency(item.total_price)}
                       </div>
                     </div>
                     <div className="flex justify-between text-xs text-slate-600">
                       <span>Qty: {item.quantity}</span>
                       <span>Unit: {formatCurrency(item.unit_price)}</span>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             {/* Notes */}
             {selectedOrder.notes && (
               <div className="space-y-2">
                 <h4 className="font-medium text-slate-900">Notes</h4>
                 <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                   {selectedOrder.notes}
                 </p>
               </div>
             )}

             {/* Actions */}
             <div className="flex gap-2 pt-4">
               <Button
                 variant="outline"
                 onClick={() => openEditDialog(selectedOrder)}
                 className="flex-1"
               >
                 <Edit2 className="h-4 w-4 mr-2" />
                 Edit
               </Button>
               {selectedOrder.status === "pending" && (
                 <Button
                   onClick={() => {
                     updateOrderStatus(selectedOrder.id, "approved");
                     setIsViewDialogOpen(false);
                   }}
                   className="flex-1"
                 >
                   <Check className="h-4 w-4 mr-2" />
                   Approve
                 </Button>
               )}
               {selectedOrder.status === "approved" && (
                 <Button
                   onClick={() => {
                     updateOrderStatus(selectedOrder.id, "shipped");
                     setIsViewDialogOpen(false);
                   }}
                   className="flex-1"
                 >
                   <Truck className="h-4 w-4 mr-2" />
                   Ship
                 </Button>
               )}
               {selectedOrder.status === "shipped" && (
                 <Button
                   onClick={() => {
                     updateOrderStatus(selectedOrder.id, "received");
                     setIsViewDialogOpen(false);
                   }}
                   className="flex-1"
                 >
                   <Package className="h-4 w-4 mr-2" />
                   Receive
                 </Button>
               )}
             </div>
           </div>
         )}
       </DialogContent>
     </Dialog>

     {/* Delete Confirmation Dialog */}
     <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
       <AlertDialogContent className="mx-4">
         <AlertDialogHeader>
           <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
           <AlertDialogDescription>
             Are you sure you want to delete purchase order "{selectedOrder?.order_number}"? 
             This action cannot be undone.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel>Cancel</AlertDialogCancel>
           <AlertDialogAction
             onClick={handleDelete}
             className="bg-red-600 hover:bg-red-700"
           >
             Delete
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
        </>
      )}
    </div>
  );
}