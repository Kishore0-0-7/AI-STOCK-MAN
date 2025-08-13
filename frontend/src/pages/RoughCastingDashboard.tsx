import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Factory,
  Users,
  Settings,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  Home,
  Warehouse,
  Calendar,
} from "lucide-react";

// Types
interface StockItem {
  id: string;
  name: string;
  quantity: number;
  location: string;
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Reserved";
  lastUpdated: string;
  category: string;
}

interface DashboardMetrics {
  totalStock: number;
  inwardGoods: number;
  outwardGoods: number;
  pendingOrders: number;
  damagedItems: number;
  productionRate: number;
}

interface ChartData {
  name: string;
  inward?: number;
  outward?: number;
  production?: number;
}

interface Notification {
  id: string;
  type: "low-stock" | "shipment" | "damage" | "order";
  message: string;
  timestamp: string;
  priority: "high" | "medium" | "low";
}

const RoughCastingDashboard: React.FC = () => {
  // State
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStock: 0,
    inwardGoods: 0,
    outwardGoods: 0,
    pendingOrders: 0,
    damagedItems: 0,
    productionRate: 0,
  });
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [productionTrend, setProductionTrend] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock data generation
  const generateMockData = () => {
    // Metrics
    setMetrics({
      totalStock: 12847,
      inwardGoods: 2340,
      outwardGoods: 1890,
      pendingOrders: 78,
      damagedItems: 23,
      productionRate: 87.5,
    });

    // Stock items
    const mockItems: StockItem[] = [
      {
        id: "RC001",
        name: "Steel Casting Block A",
        quantity: 150,
        location: "Warehouse A-1",
        status: "In Stock",
        lastUpdated: "2025-08-13",
        category: "Raw Castings",
      },
      {
        id: "RC002",
        name: "Iron Rough Casting B",
        quantity: 45,
        location: "Warehouse A-2",
        status: "Low Stock",
        lastUpdated: "2025-08-13",
        category: "Raw Castings",
      },
      {
        id: "RC003",
        name: "Aluminum Base Plate",
        quantity: 0,
        location: "Warehouse B-1",
        status: "Out of Stock",
        lastUpdated: "2025-08-12",
        category: "Plates",
      },
      {
        id: "RC004",
        name: "Steel Pipe Section",
        quantity: 230,
        location: "Warehouse B-2",
        status: "In Stock",
        lastUpdated: "2025-08-13",
        category: "Pipes",
      },
      {
        id: "RC005",
        name: "Cast Iron Flange",
        quantity: 89,
        location: "Warehouse C-1",
        status: "Reserved",
        lastUpdated: "2025-08-13",
        category: "Flanges",
      },
      {
        id: "RC006",
        name: "Bronze Bearing Housing",
        quantity: 12,
        location: "Warehouse C-2",
        status: "Low Stock",
        lastUpdated: "2025-08-12",
        category: "Housings",
      },
      {
        id: "RC007",
        name: "Stainless Steel Valve Body",
        quantity: 67,
        location: "Warehouse D-1",
        status: "In Stock",
        lastUpdated: "2025-08-13",
        category: "Valves",
      },
      {
        id: "RC008",
        name: "Carbon Steel Gear Box",
        quantity: 34,
        location: "Warehouse D-2",
        status: "In Stock",
        lastUpdated: "2025-08-13",
        category: "Gears",
      },
      {
        id: "RC009",
        name: "Alloy Steel Connector",
        quantity: 156,
        location: "Warehouse E-1",
        status: "In Stock",
        lastUpdated: "2025-08-13",
        category: "Connectors",
      },
      {
        id: "RC010",
        name: "Brass Fitting Component",
        quantity: 78,
        location: "Warehouse E-2",
        status: "In Stock",
        lastUpdated: "2025-08-13",
        category: "Fittings",
      },
    ];
    setStockItems(mockItems);

    // Chart data for daily inward/outward
    const dailyData: ChartData[] = [
      { name: "Mon", inward: 320, outward: 280 },
      { name: "Tue", inward: 450, outward: 390 },
      { name: "Wed", inward: 380, outward: 420 },
      { name: "Thu", inward: 520, outward: 480 },
      { name: "Fri", inward: 410, outward: 350 },
      { name: "Sat", inward: 290, outward: 310 },
      { name: "Sun", inward: 180, outward: 160 },
    ];
    setChartData(dailyData);

    // Production trend data
    const trendData: ChartData[] = [
      { name: "Week 1", production: 85 },
      { name: "Week 2", production: 88 },
      { name: "Week 3", production: 82 },
      { name: "Week 4", production: 91 },
      { name: "Week 5", production: 87 },
      { name: "Week 6", production: 94 },
    ];
    setProductionTrend(trendData);

    // Notifications
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "low-stock",
        message: "Iron Rough Casting B is below minimum threshold",
        timestamp: "2 hours ago",
        priority: "high",
      },
      {
        id: "2",
        type: "shipment",
        message: "Shipment #SH-2025-001 delayed by 4 hours",
        timestamp: "3 hours ago",
        priority: "medium",
      },
      {
        id: "3",
        type: "damage",
        message: "Minor damage reported in Warehouse A-1",
        timestamp: "5 hours ago",
        priority: "low",
      },
      {
        id: "4",
        type: "order",
        message: "New urgent order received for Steel Casting Block A",
        timestamp: "1 day ago",
        priority: "high",
      },
    ];
    setNotifications(mockNotifications);

    setLoading(false);
  };

  useEffect(() => {
    generateMockData();
  }, []);

  // Filter stock items
  const filteredItems = stockItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesLocation =
      locationFilter === "all" || item.location === locationFilter;
    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-800 border-green-200";
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Out of Stock":
        return "bg-red-100 text-red-800 border-red-200";
      case "Reserved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50";
      case "low":
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "low-stock":
        return <Package className="h-4 w-4 text-red-600" />;
      case "shipment":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "damage":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "order":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Factory className="h-6 w-6 text-blue-600" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">
                    Rough Casting Warehouse
                  </h1>
                  <p className="text-sm text-gray-600">Management Dashboard</p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-lg font-bold text-gray-900">
                    RCW Dashboard
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <Button variant="outline" size="sm" onClick={generateMockData}>
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Refresh</span>
              </Button>

              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    AD
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">
                  Admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Desktop Sidebar / Mobile Bottom Nav */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white shadow-sm border-r">
          <nav className="mt-8 px-4 space-y-2">
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg"
            >
              <Home className="h-4 w-4 mr-3" />
              Dashboard
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <Package className="h-4 w-4 mr-3" />
              Inventory
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <Clock className="h-4 w-4 mr-3" />
              Orders
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <Truck className="h-4 w-4 mr-3" />
              Shipments
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <TrendingUp className="h-4 w-4 mr-3" />
              Reports
            </a>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </a>
          </nav>
        </aside>

        <main className="flex-1 lg:ml-0">
          <div className="p-4 lg:p-8 space-y-6 pb-20 lg:pb-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-blue-600" />
                    Total Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.totalStock.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500">items</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    Inward Goods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    {metrics.inwardGoods.toLocaleString()}
                  </div>
                  <p className="text-xs text-green-600">+12% vs last week</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <TrendingDown className="h-4 w-4 mr-2 text-orange-600" />
                    Outward Goods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-700">
                    {metrics.outwardGoods.toLocaleString()}
                  </div>
                  <p className="text-xs text-orange-600">-3% vs last week</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-600" />
                    Pending Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">
                    {metrics.pendingOrders}
                  </div>
                  <p className="text-xs text-blue-600">5 urgent</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                    Damaged Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">
                    {metrics.damagedItems}
                  </div>
                  <p className="text-xs text-red-600">needs attention</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Factory className="h-4 w-4 mr-2 text-purple-600" />
                    Production Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">
                    {metrics.productionRate}%
                  </div>
                  <p className="text-xs text-purple-600">efficiency</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Notifications Row */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Daily Materials Chart */}
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-blue-600" />
                    Daily Material Flow
                  </CardTitle>
                  <CardDescription>
                    Inward vs Outward materials this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Bar
                          dataKey="inward"
                          fill="#10b981"
                          name="Inward"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="outward"
                          fill="#f59e0b"
                          name="Outward"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Production Trend */}
              <Card className="xl:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Production Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={productionTrend}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip />
                        <Line
                          type="monotone"
                          dataKey="production"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="xl:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-orange-600" />
                      <span className="text-sm">Alerts</span>
                    </div>
                    <Badge variant="secondary">{notifications.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-2 max-h-64 overflow-y-auto p-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border-l-4 ${getPriorityColor(
                          notification.priority
                        )}`}
                      >
                        <div className="flex items-start space-x-2">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {notification.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stock Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Warehouse className="h-5 w-5 text-blue-600" />
                      Rough Casting Inventory
                    </CardTitle>
                    <CardDescription>
                      Current stock levels and locations
                    </CardDescription>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="In Stock">In Stock</SelectItem>
                        <SelectItem value="Low Stock">Low Stock</SelectItem>
                        <SelectItem value="Out of Stock">
                          Out of Stock
                        </SelectItem>
                        <SelectItem value="Reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Item ID</TableHead>
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold text-center">
                          Quantity
                        </TableHead>
                        <TableHead className="font-semibold">
                          Location
                        </TableHead>
                        <TableHead className="font-semibold text-center">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold">
                          Last Updated
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {item.id}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">
                                {item.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.category}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {item.quantity.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.location}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {item.lastUpdated}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center p-4 border-t">
                    <p className="text-sm text-gray-700">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredItems.length
                      )}{" "}
                      of {filteredItems.length} results
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="grid grid-cols-6 h-16">
            <button className="flex flex-col items-center justify-center space-y-1 bg-blue-50 text-blue-600">
              <Home className="h-4 w-4" />
              <span className="text-xs font-medium">Home</span>
            </button>
            <button className="flex flex-col items-center justify-center space-y-1 text-gray-600">
              <Package className="h-4 w-4" />
              <span className="text-xs">Inventory</span>
            </button>
            <button className="flex flex-col items-center justify-center space-y-1 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Orders</span>
            </button>
            <button className="flex flex-col items-center justify-center space-y-1 text-gray-600">
              <Truck className="h-4 w-4" />
              <span className="text-xs">Shipments</span>
            </button>
            <button className="flex flex-col items-center justify-center space-y-1 text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Reports</span>
            </button>
            <button className="flex flex-col items-center justify-center space-y-1 text-gray-600">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoughCastingDashboard;
