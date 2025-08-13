import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dialog";
import {
  Archive,
  Download,
  Search,
  Filter,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  Eye,
  BarChart3,
  X,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  Warehouse,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { useToast } from "@/hooks/use-toast";

interface StockMovement {
  date: string;
  type: "Purchase" | "Sale" | "Adjustment" | "Return";
  quantity: number;
  balance: number;
  reference?: string;
}

interface StockItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  maxStock: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  lastRestocked: string;
  expiryDate?: string;
  location: string;
  movements: StockMovement[];
  stockValue: number;
  stockTurnover: number;
  daysSinceLastMovement: number;
}

// Enhanced sample stock data
const stockData: StockItem[] = [
  {
    id: "P001",
    name: "Iron Casting Blocks - Grade A",
    category: "Iron Castings",
    sku: "ICB-GA-001",
    currentStock: 120,
    reorderLevel: 50,
    maxStock: 300,
    unit: "kg",
    costPrice: 12000,
    sellingPrice: 15000,
    supplier: "SteelWorks Industries",
    lastRestocked: "2024-01-18",
    location: "Warehouse-A-01",
    stockValue: 1440000,
    stockTurnover: 8.5,
    daysSinceLastMovement: 2,
    movements: [
      {
        date: "2024-01-22",
        type: "Sale",
        quantity: -30,
        balance: 120,
        reference: "INV-2024-001",
      },
      {
        date: "2024-01-20",
        type: "Sale",
        quantity: -20,
        balance: 150,
        reference: "INV-2024-002",
      },
      {
        date: "2024-01-18",
        type: "Purchase",
        quantity: +100,
        balance: 170,
        reference: "PO-2024-003",
      },
      {
        date: "2024-01-15",
        type: "Sale",
        quantity: -50,
        balance: 70,
        reference: "INV-2024-003",
      },
    ],
  },
  {
    id: "P002",
    name: "Aluminum Alloy Bars - 6061",
    category: "Aluminum Castings",
    sku: "AAB-6061-001",
    currentStock: 80,
    reorderLevel: 100,
    maxStock: 200,
    unit: "kg",
    costPrice: 380,
    sellingPrice: 450,
    supplier: "MetalCraft Co",
    lastRestocked: "2024-01-10",
    location: "Warehouse-B-02",
    stockValue: 30400,
    stockTurnover: 12.3,
    daysSinceLastMovement: 1,
    movements: [
      {
        date: "2024-01-23",
        type: "Sale",
        quantity: -20,
        balance: 80,
        reference: "INV-2024-004",
      },
      {
        date: "2024-01-21",
        type: "Sale",
        quantity: -30,
        balance: 100,
        reference: "INV-2024-005",
      },
      {
        date: "2024-01-10",
        type: "Purchase",
        quantity: +150,
        balance: 130,
        reference: "PO-2024-001",
      },
    ],
  },
  {
    id: "P003",
    name: "Bronze Ingots - Phosphor Bronze",
    category: "Bronze Castings",
    sku: "BI-PB-001",
    currentStock: 200,
    reorderLevel: 80,
    maxStock: 400,
    unit: "kg",
    costPrice: 720,
    sellingPrice: 850,
    supplier: "Bronze Masters Ltd",
    lastRestocked: "2024-01-16",
    location: "Warehouse-C-01",
    stockValue: 144000,
    stockTurnover: 6.2,
    daysSinceLastMovement: 4,
    movements: [
      {
        date: "2024-01-20",
        type: "Sale",
        quantity: -50,
        balance: 200,
        reference: "INV-2024-006",
      },
      {
        date: "2024-01-16",
        type: "Purchase",
        quantity: +100,
        balance: 250,
        reference: "PO-2024-002",
      },
      {
        date: "2024-01-14",
        type: "Sale",
        quantity: -80,
        balance: 150,
        reference: "INV-2024-007",
      },
    ],
  },
  {
    id: "P004",
    name: "Steel Billets - Carbon Steel",
    category: "Steel Castings",
    sku: "SB-CS-001",
    currentStock: 0,
    reorderLevel: 500,
    maxStock: 2000,
    unit: "kg",
    costPrice: 55,
    sellingPrice: 65,
    supplier: "Carbon Steel Works",
    lastRestocked: "2024-01-05",
    location: "Warehouse-D-03",
    stockValue: 0,
    stockTurnover: 15.8,
    daysSinceLastMovement: 1,
    movements: [
      {
        date: "2024-01-23",
        type: "Sale",
        quantity: -300,
        balance: 0,
        reference: "INV-2024-008",
      },
      {
        date: "2024-01-22",
        type: "Sale",
        quantity: -200,
        balance: 300,
        reference: "INV-2024-009",
      },
      {
        date: "2024-01-05",
        type: "Purchase",
        quantity: +1000,
        balance: 500,
        reference: "PO-2024-004",
      },
    ],
  },
  {
    id: "P005",
    name: "Brass Rods - Naval Brass",
    category: "Brass Castings",
    sku: "BR-NB-001",
    currentStock: 120,
    reorderLevel: 60,
    maxStock: 250,
    unit: "kg",
    costPrice: 600,
    sellingPrice: 720,
    supplier: "Naval Brass Co",
    lastRestocked: "2024-01-19",
    location: "Warehouse-E-01",
    stockValue: 72000,
    stockTurnover: 9.7,
    daysSinceLastMovement: 3,
    movements: [
      {
        date: "2024-01-21",
        type: "Sale",
        quantity: -40,
        balance: 120,
        reference: "INV-2024-010",
      },
      {
        date: "2024-01-19",
        type: "Purchase",
        quantity: +80,
        balance: 160,
        reference: "PO-2024-005",
      },
      {
        date: "2024-01-17",
        type: "Sale",
        quantity: -20,
        balance: 80,
        reference: "INV-2024-011",
      },
    ],
  },
  {
    id: "P006",
    name: "Cast Iron Pipes - Ductile",
    category: "Cast Iron",
    sku: "CIP-DI-001",
    currentStock: 300,
    reorderLevel: 150,
    maxStock: 500,
    unit: "meters",
    costPrice: 150,
    sellingPrice: 180,
    supplier: "SteelWorks Industries",
    lastRestocked: "2024-01-14",
    location: "Warehouse-F-02",
    stockValue: 45000,
    stockTurnover: 4.2,
    daysSinceLastMovement: 5,
    movements: [
      {
        date: "2024-01-19",
        type: "Sale",
        quantity: -100,
        balance: 300,
        reference: "INV-2024-012",
      },
      {
        date: "2024-01-14",
        type: "Purchase",
        quantity: +200,
        balance: 400,
        reference: "PO-2024-006",
      },
    ],
  },
];

export default function StockSummary() {
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"summary" | "movements">("summary");

  const itemsPerPage = 10;

  // Calculate stock statistics
  const stockStats = useMemo(() => {
    const total = stockData.length;
    const inStock = stockData.filter(
      (item) => item.currentStock > item.reorderLevel
    ).length;
    const lowStock = stockData.filter(
      (item) => item.currentStock > 0 && item.currentStock <= item.reorderLevel
    ).length;
    const outOfStock = stockData.filter(
      (item) => item.currentStock === 0
    ).length;
    const totalValue = stockData.reduce(
      (sum, item) => sum + item.stockValue,
      0
    );
    const avgTurnover =
      stockData.reduce((sum, item) => sum + item.stockTurnover, 0) / total;

    return { total, inStock, lowStock, outOfStock, totalValue, avgTurnover };
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(stockData.map((item) => item.category)),
    ];
    return ["all", ...uniqueCategories];
  }, []);

  // Filter and sort stock data
  const filteredAndSortedStock = useMemo(() => {
    let filtered = stockData.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in_stock" && item.currentStock > item.reorderLevel) ||
        (stockFilter === "low_stock" &&
          item.currentStock > 0 &&
          item.currentStock <= item.reorderLevel) ||
        (stockFilter === "out_of_stock" && item.currentStock === 0);

      return matchesSearch && matchesCategory && matchesStock;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "stock":
          aValue = a.currentStock;
          bValue = b.currentStock;
          break;
        case "value":
          aValue = a.stockValue;
          bValue = b.stockValue;
          break;
        case "turnover":
          aValue = a.stockTurnover;
          bValue = b.stockTurnover;
          break;
        case "lastMovement":
          aValue = a.daysSinceLastMovement;
          bValue = b.daysSinceLastMovement;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stockData, searchTerm, categoryFilter, stockFilter, sortBy, sortOrder]);

  // Paginated data
  const paginatedStock = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedStock.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedStock, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedStock.length / itemsPerPage);

  // Stock level distribution for pie chart
  const stockDistribution = useMemo(() => {
    return [
      { name: "In Stock", value: stockStats.inStock, fill: "#10B981" },
      { name: "Low Stock", value: stockStats.lowStock, fill: "#F59E0B" },
      { name: "Out of Stock", value: stockStats.outOfStock, fill: "#EF4444" },
    ].filter((item) => item.value > 0);
  }, [stockStats]);

  // Category value distribution
  const categoryValueData = useMemo(() => {
    const categoryValues: Record<string, number> = {};
    stockData.forEach((item) => {
      categoryValues[item.category] =
        (categoryValues[item.category] || 0) + item.stockValue;
    });

    return Object.entries(categoryValues)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, []);

  // Stock movement trends (last 30 days)
  const movementTrends = useMemo(() => {
    const trends: Record<string, { in: number; out: number; date: string }> =
      {};

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      trends[dateStr] = { in: 0, out: 0, date: dateStr };
    }

    // Aggregate movements
    stockData.forEach((item) => {
      item.movements.forEach((movement) => {
        if (trends[movement.date]) {
          if (movement.quantity > 0) {
            trends[movement.date].in += movement.quantity;
          } else {
            trends[movement.date].out += Math.abs(movement.quantity);
          }
        }
      });
    });

    return Object.values(trends).map((trend) => ({
      date: new Date(trend.date).toLocaleDateString("en", { weekday: "short" }),
      stockIn: trend.in,
      stockOut: trend.out,
      net: trend.in - trend.out,
    }));
  }, []);

  const getStockStatus = (item: StockItem) => {
    if (item.currentStock === 0) {
      return { status: "Out of Stock", color: "destructive", icon: X };
    } else if (item.currentStock <= item.reorderLevel) {
      return {
        status: "Low Stock",
        color: "secondary",
        className: "bg-yellow-100 text-yellow-800",
        icon: AlertTriangle,
      };
    } else {
      return {
        status: "In Stock",
        color: "secondary",
        className: "bg-green-100 text-green-800",
        icon: Package,
      };
    }
  };

  const exportToCSV = () => {
    const csvData = stockData.map((item) => ({
      SKU: item.sku,
      Name: item.name,
      Category: item.category,
      "Current Stock": item.currentStock,
      "Reorder Level": item.reorderLevel,
      "Max Stock": item.maxStock,
      Unit: item.unit,
      "Cost Price (₹)": item.costPrice,
      "Selling Price (₹)": item.sellingPrice,
      Supplier: item.supplier,
      "Stock Value (₹)": item.stockValue,
      "Turnover Ratio": item.stockTurnover,
      Location: item.location,
      "Last Restocked": item.lastRestocked,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-summary-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-background via-blue-50/10 to-purple-50/10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Warehouse className="h-8 w-8 text-blue-500" />
            Stock Summary
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive inventory overview and movement analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Items
              </p>
              <p className="text-2xl font-bold">{stockStats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">In inventory</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Stock Alerts
              </p>
              <p className="text-2xl font-bold text-red-600">
                {stockStats.lowStock + stockStats.outOfStock}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Need attention
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Value
              </p>
              <p className="text-2xl font-bold text-green-600">
                ₹{(stockStats.totalValue / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Inventory worth
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg Turnover
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {stockStats.avgTurnover.toFixed(1)}x
              </p>
              <p className="text-xs text-muted-foreground mt-1">Annual ratio</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Stock Status Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Value Distribution */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Value by Category</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryValueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value) => [
                    `₹${(value as number).toLocaleString()}`,
                    "Value",
                  ]}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Movement Trends */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Stock Movement Trends (Last 7 Days)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={movementTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="stockIn"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Stock In"
              />
              <Area
                type="monotone"
                dataKey="stockOut"
                stackId="2"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.6}
                name="Stock Out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="stock">Stock Level</SelectItem>
                <SelectItem value="value">Stock Value</SelectItem>
                <SelectItem value="turnover">Turnover</SelectItem>
                <SelectItem value="lastMovement">Last Movement</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3"
            >
              {sortOrder === "asc" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Stock Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Details</TableHead>
                <TableHead>Stock Levels</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStock.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-1">
                        No stock items found
                      </p>
                      <p className="text-sm">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStock.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const Icon = stockStatus.icon;

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.sku}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {item.currentStock} {item.unit}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Min: {item.reorderLevel} | Max: {item.maxStock}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                item.currentStock === 0
                                  ? "bg-red-500"
                                  : item.currentStock <= item.reorderLevel
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  (item.currentStock / item.maxStock) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Cost:</span>
                            <br />₹{item.costPrice.toLocaleString()}
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            <span className="text-muted-foreground text-xs">
                              Selling:
                            </span>
                            <br />₹{item.sellingPrice.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-green-600">
                            ₹{item.stockValue.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Turnover: {item.stockTurnover}x
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last move: {item.daysSinceLastMovement}d ago
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {item.location}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.supplier}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Restocked:{" "}
                            {new Date(item.lastRestocked).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <Badge
                            variant={stockStatus.color as any}
                            className={stockStatus.className}
                          >
                            {stockStatus.status}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedStock.length} of {filteredAndSortedStock.length}{" "}
              items
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
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
        )}
      </Card>

      {/* Item Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedItem.name}
                    </h3>
                    <p className="text-muted-foreground">{selectedItem.sku}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedItem.currentStock}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Current Stock
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ₹{selectedItem.stockValue.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Value
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="outline">{selectedItem.category}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier:</span>
                      <span>{selectedItem.supplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{selectedItem.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Reorder Level:
                      </span>
                      <span>
                        {selectedItem.reorderLevel} {selectedItem.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Turnover Ratio:
                      </span>
                      <span>{selectedItem.stockTurnover}x</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Movements */}
              <div>
                <h4 className="font-semibold mb-4">Recent Stock Movements</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedItem.movements.map((movement, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(movement.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                movement.type === "Purchase"
                                  ? "secondary"
                                  : "outline"
                              }
                              className={
                                movement.type === "Purchase"
                                  ? "bg-green-100 text-green-800"
                                  : movement.type === "Sale"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {movement.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                movement.quantity > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {movement.quantity > 0 ? "+" : ""}
                              {movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell>{movement.balance}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {movement.reference || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
