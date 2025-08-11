import { useState, useEffect } from "react";
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
} from "recharts";

// Mock stock data with movement history
const mockStockData = [
  {
    id: "P001",
    name: "NVIDIA GTX 1660 Super",
    category: "Graphics Card",
    currentStock: 10,
    reorderLevel: 3,
    maxStock: 50,
    unit: "pcs",
    costPrice: 17000,
    sellingPrice: 18500,
    supplier: "Tech Distributors",
    lastRestocked: "2024-01-15",
    expiryDate: null,
    movements: [
      { date: "2024-01-20", type: "Sale", quantity: -2, balance: 10 },
      { date: "2024-01-18", type: "Purchase", quantity: +5, balance: 12 },
      { date: "2024-01-15", type: "Sale", quantity: -3, balance: 7 },
    ],
  },
  {
    id: "P002",
    name: "Corsair 650W PSU",
    category: "Power Supply",
    currentStock: 2,
    reorderLevel: 5,
    maxStock: 30,
    unit: "pcs",
    costPrice: 4800,
    sellingPrice: 5200,
    supplier: "Power Solutions",
    lastRestocked: "2024-01-10",
    expiryDate: null,
    movements: [
      { date: "2024-01-19", type: "Sale", quantity: -1, balance: 2 },
      { date: "2024-01-17", type: "Sale", quantity: -2, balance: 3 },
      { date: "2024-01-10", type: "Purchase", quantity: +8, balance: 5 },
    ],
  },
  {
    id: "P003",
    name: "ASUS B450 Motherboard",
    category: "Motherboard",
    currentStock: 3,
    reorderLevel: 4,
    maxStock: 25,
    unit: "pcs",
    costPrice: 7000,
    sellingPrice: 7800,
    supplier: "Motherboard Mart",
    lastRestocked: "2024-01-12",
    expiryDate: null,
    movements: [
      { date: "2024-01-20", type: "Sale", quantity: -1, balance: 3 },
      { date: "2024-01-16", type: "Sale", quantity: -2, balance: 4 },
      { date: "2024-01-12", type: "Purchase", quantity: +6, balance: 6 },
    ],
  },
  {
    id: "P004",
    name: "1TB Seagate HDD",
    category: "Storage",
    currentStock: 25,
    reorderLevel: 8,
    maxStock: 100,
    unit: "pcs",
    costPrice: 2900,
    sellingPrice: 3200,
    supplier: "Storage House",
    lastRestocked: "2024-01-18",
    expiryDate: null,
    movements: [
      { date: "2024-01-19", type: "Sale", quantity: -3, balance: 25 },
      { date: "2024-01-18", type: "Purchase", quantity: +15, balance: 28 },
      { date: "2024-01-14", type: "Sale", quantity: -5, balance: 13 },
    ],
  },
  {
    id: "P005",
    name: "Thermal Paste",
    category: "Accessories",
    currentStock: 8,
    reorderLevel: 10,
    maxStock: 50,
    unit: "tubes",
    costPrice: 150,
    sellingPrice: 200,
    supplier: "Cooler World",
    lastRestocked: "2024-01-05",
    expiryDate: "2025-06-30",
    movements: [
      { date: "2024-01-19", type: "Sale", quantity: -2, balance: 8 },
      { date: "2024-01-15", type: "Sale", quantity: -3, balance: 10 },
      { date: "2024-01-05", type: "Purchase", quantity: +15, balance: 13 },
    ],
  },
];

// Mock demand forecast data
const mockForecastData = [
  { name: "Week 1", predicted: 35, actual: 32 },
  { name: "Week 2", predicted: 42, actual: 38 },
  { name: "Week 3", predicted: 38, actual: 35 },
  { name: "Week 4", predicted: 45, actual: null },
  { name: "Week 5", predicted: 40, actual: null },
  { name: "Week 6", predicted: 48, actual: null },
];

export default function StockSummary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForecast, setShowForecast] = useState(false);
  const [stockData, setStockData] = useState(mockStockData);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Fetch real low stock count from API
  useEffect(() => {
    fetch("http://localhost:4000/api/alerts/low-stock")
      .then((res) => res.json())
      .then((data) => {
        setLowStockCount(data.length);
      })
      .catch((err) => {
        console.error("Failed to fetch low stock alerts:", err);
        setLowStockCount(0);
      });
  }, []);

  const categories = [
    "all",
    ...Array.from(new Set(stockData.map((p) => p.category))),
  ];

  const filteredStock = stockData.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStockLevel =
      stockFilter === "all" ||
      (stockFilter === "low" && product.currentStock <= product.reorderLevel) ||
      (stockFilter === "out" && product.currentStock === 0) ||
      (stockFilter === "normal" && product.currentStock > product.reorderLevel);
    return matchesSearch && matchesCategory && matchesStockLevel;
  });

  const lowStockItems = stockData.filter(
    (p) => p.currentStock <= p.reorderLevel
  );
  const outOfStockItems = stockData.filter((p) => p.currentStock === 0);
  const expiringItems = stockData.filter((p) => {
    if (!p.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(p.expiryDate);
    const daysDiff = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 30; // Expiring within 30 days
  });

  const totalStockValue = stockData.reduce(
    (sum, p) => sum + p.currentStock * p.costPrice,
    0
  );

  const getStockBadge = (product) => {
    if (product.currentStock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (product.currentStock <= product.reorderLevel) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="outline">In Stock</Badge>;
    }
  };

  const getStockPercentage = (product) => {
    return Math.round((product.currentStock / product.maxStock) * 100);
  };

  const exportSummary = () => {
    console.log("Exporting stock summary");
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold truncate">
              Stock Summary
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Complete inventory overview and stock levels
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForecast(!showForecast)}
              className="md:size-lg w-full sm:w-auto"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="sm:inline">
                {showForecast ? "Hide" : "Show"} Forecast
              </span>
            </Button>
            {/* <Button
              variant="action"
              size="sm"
              onClick={exportSummary}
              className="md:size-lg w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="sm:inline">Export Summary</span>
            </Button> */}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
          <Card className="p-3 md:p-4 shadow-soft">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Total Products
                </p>
                <p className="text-lg md:text-xl font-bold">
                  {mockStockData.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 shadow-soft">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-warning rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-warning-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Low Stock
                </p>
                <p className="text-lg md:text-xl font-bold text-warning">
                  {lowStockCount}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 shadow-soft">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-destructive rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-destructive-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Out of Stock
                </p>
                <p className="text-lg md:text-xl font-bold text-destructive">
                  {outOfStockItems.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 shadow-soft">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-accent-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Expiring Soon
                </p>
                <p className="text-lg md:text-xl font-bold">
                  {expiringItems.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 shadow-soft col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-success rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-success-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Total Value
                </p>
                <p className="text-lg md:text-xl font-bold">
                  ₹{totalStockValue.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Demand Forecast */}
        {showForecast && (
          <Card className="p-4 md:p-6 shadow-soft">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold">
                  Demand Forecast (ML)
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Predicted inventory demand for next 6 weeks
                </p>
              </div>
              <Badge variant="secondary" className="self-start md:self-auto">
                Forecast Model v2.1
              </Badge>
            </div>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={250} minWidth={300}>
                <LineChart data={mockForecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Actual Demand"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Predicted Demand"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Alerts */}
        {(lowStockItems.length > 0 || expiringItems.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {lowStockItems.length > 0 && (
              <Card className="p-3 md:p-4 border-warning shadow-soft">
                <div className="flex items-center gap-2 md:gap-3 mb-3">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-warning flex-shrink-0" />
                  <h3 className="font-semibold text-warning text-sm md:text-base">
                    Low Stock Alert
                  </h3>
                </div>
                <div className="space-y-2">
                  {lowStockItems.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center gap-2"
                    >
                      <span className="text-xs md:text-sm truncate flex-1">
                        {product.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-warning text-warning text-xs flex-shrink-0"
                      >
                        {product.currentStock} / {product.reorderLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {expiringItems.length > 0 && (
              <Card className="p-3 md:p-4 border-destructive shadow-soft">
                <div className="flex items-center gap-2 md:gap-3 mb-3">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-destructive flex-shrink-0" />
                  <h3 className="font-semibold text-destructive text-sm md:text-base">
                    Expiring Soon
                  </h3>
                </div>
                <div className="space-y-2">
                  {expiringItems.map((product) => (
                    <div
                      key={product.id}
                      className="flex justify-between items-center gap-2"
                    >
                      <span className="text-xs md:text-sm truncate flex-1">
                        {product.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-destructive text-destructive text-xs flex-shrink-0"
                      >
                        {new Date(product.expiryDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Filters */}
        <Card className="p-3 md:p-4 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="capitalize"
                    >
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Levels</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                  <SelectItem value="normal">Normal Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Stock Table */}
        <Card className="shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Product</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Category
                  </TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Stock Level
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Reorder Level
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Stock %
                  </TableHead>
                  <TableHead className="hidden xl:table-cell text-right">
                    Value
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Last Restocked
                  </TableHead>
                  <TableHead className="hidden 2xl:table-cell">
                    Expiry
                  </TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm truncate max-w-[150px]">
                          {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {product.category}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      <div>
                        <span>
                          {product.currentStock} {product.unit}
                        </span>
                        <div className="md:hidden">
                          {getStockBadge(product)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getStockBadge(product)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {product.reorderLevel}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-12 lg:w-16 h-2 bg-muted rounded-full">
                          <div
                            className={`h-2 rounded-full ${
                              getStockPercentage(product) <= 20
                                ? "bg-destructive"
                                : getStockPercentage(product) <= 40
                                ? "bg-warning"
                                : "bg-success"
                            }`}
                            style={{ width: `${getStockPercentage(product)}%` }}
                          />
                        </div>
                        <span className="text-xs">
                          {getStockPercentage(product)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell font-medium text-sm text-right">
                      ₹
                      {(
                        product.currentStock * product.costPrice
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm">
                      {new Date(product.lastRestocked).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell">
                      {product.expiryDate ? (
                        <span
                          className={`text-xs ${
                            expiringItems.includes(product)
                              ? "text-destructive font-medium"
                              : ""
                          }`}
                        >
                          {new Date(product.expiryDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          N/A
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedProduct(product)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Stock Movement History Modal */}
        {selectedProduct && (
          <Card className="fixed inset-4 z-50 bg-card shadow-2xl rounded-lg max-w-2xl mx-auto overflow-hidden">
            <div className="p-4 md:p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base md:text-lg font-semibold truncate">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Stock Movement History
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 md:p-6 max-h-96 overflow-y-auto">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">Date</TableHead>
                      <TableHead className="text-sm">Type</TableHead>
                      <TableHead className="text-sm">Quantity</TableHead>
                      <TableHead className="text-sm">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProduct.movements.map((movement, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs md:text-sm">
                          {new Date(movement.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              movement.type === "Purchase"
                                ? "outline"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`font-medium text-sm ${
                            movement.quantity > 0
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {movement.quantity > 0 ? "+" : ""}
                          {movement.quantity}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {movement.balance}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
