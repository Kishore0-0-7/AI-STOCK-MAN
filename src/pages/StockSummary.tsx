import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  X
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
  Bar
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
      { date: "2024-01-15", type: "Sale", quantity: -3, balance: 7 }
    ]
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
      { date: "2024-01-10", type: "Purchase", quantity: +8, balance: 5 }
    ]
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
      { date: "2024-01-12", type: "Purchase", quantity: +6, balance: 6 }
    ]
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
      { date: "2024-01-14", type: "Sale", quantity: -5, balance: 13 }
    ]
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
      { date: "2024-01-05", type: "Purchase", quantity: +15, balance: 13 }
    ]
  }
];

// Mock demand forecast data
const mockForecastData = [
  { name: "Week 1", predicted: 35, actual: 32 },
  { name: "Week 2", predicted: 42, actual: 38 },
  { name: "Week 3", predicted: 38, actual: 35 },
  { name: "Week 4", predicted: 45, actual: null },
  { name: "Week 5", predicted: 40, actual: null },
  { name: "Week 6", predicted: 48, actual: null }
];

export default function StockSummary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForecast, setShowForecast] = useState(false);

  const categories = ["all", ...Array.from(new Set(mockStockData.map(p => p.category)))];
  
  const filteredStock = mockStockData.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStockLevel = stockFilter === "all" ||
      (stockFilter === "low" && product.currentStock <= product.reorderLevel) ||
      (stockFilter === "out" && product.currentStock === 0) ||
      (stockFilter === "normal" && product.currentStock > product.reorderLevel);
    return matchesSearch && matchesCategory && matchesStockLevel;
  });

  const lowStockItems = mockStockData.filter(p => p.currentStock <= p.reorderLevel);
  const outOfStockItems = mockStockData.filter(p => p.currentStock === 0);
  const expiringItems = mockStockData.filter(p => {
    if (!p.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(p.expiryDate);
    const daysDiff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30; // Expiring within 30 days
  });

  const totalStockValue = mockStockData.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);

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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Stock Summary</h1>
          <p className="text-muted-foreground">Complete inventory overview and stock levels</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setShowForecast(!showForecast)}
          >
            <BarChart3 className="h-4 w-4" />
            {showForecast ? "Hide" : "Show"} Forecast
          </Button>
          <Button variant="action" size="lg" onClick={exportSummary}>
            <Download className="h-4 w-4" />
            Export Summary
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-xl font-bold">{mockStockData.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-warning rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-xl font-bold text-warning">{lowStockItems.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-destructive rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-destructive-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-xl font-bold text-destructive">{outOfStockItems.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-accent rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <p className="text-xl font-bold">{expiringItems.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-success rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-xl font-bold">₹{totalStockValue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Demand Forecast */}
      {showForecast && (
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">AI Demand Forecast (Prophet ML)</h3>
              <p className="text-sm text-muted-foreground">Predicted inventory demand for next 6 weeks</p>
            </div>
            <Badge variant="secondary">
              Prophet Model v2.1
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockForecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Actual Demand"
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted Demand"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lowStockItems.length > 0 && (
            <Card className="p-4 border-warning shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="font-semibold text-warning">Low Stock Alert</h3>
              </div>
              <div className="space-y-2">
                {lowStockItems.map(product => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="text-sm">{product.name}</span>
                    <Badge variant="outline" className="border-warning text-warning">
                      {product.currentStock} / {product.reorderLevel}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {expiringItems.length > 0 && (
            <Card className="p-4 border-destructive shadow-soft">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Expiring Soon</h3>
              </div>
              <div className="space-y-2">
                {expiringItems.map(product => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="text-sm">{product.name}</span>
                    <Badge variant="outline" className="border-destructive text-destructive">
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
      <Card className="p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category} className="capitalize">
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-48">
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
      </Card>

      {/* Stock Table */}
      <Card className="shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Reorder Level</TableHead>
              <TableHead>Stock %</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Last Restocked</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStock.map(product => (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">{product.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{product.category}</Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {product.currentStock} {product.unit}
                </TableCell>
                <TableCell>{getStockBadge(product)}</TableCell>
                <TableCell>{product.reorderLevel}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          getStockPercentage(product) <= 20 ? "bg-destructive" :
                          getStockPercentage(product) <= 40 ? "bg-warning" : "bg-success"
                        }`}
                        style={{ width: `${getStockPercentage(product)}%` }}
                      />
                    </div>
                    <span className="text-sm">{getStockPercentage(product)}%</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  ₹{(product.currentStock * product.costPrice).toLocaleString()}
                </TableCell>
                <TableCell>{new Date(product.lastRestocked).toLocaleDateString()}</TableCell>
                <TableCell>
                  {product.expiryDate ? (
                    <span className={`text-sm ${
                      expiringItems.includes(product) ? "text-destructive font-medium" : ""
                    }`}>
                      {new Date(product.expiryDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Stock Movement History Modal */}
      {selectedProduct && (
        <Card className="fixed inset-4 z-50 bg-card shadow-2xl rounded-lg max-w-2xl mx-auto overflow-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground">Stock Movement History</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedProduct(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProduct.movements.map((movement, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(movement.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={movement.type === "Purchase" ? "outline" : "secondary"}>
                        {movement.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={movement.quantity > 0 ? "text-success" : "text-destructive"}>
                      {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                    </TableCell>
                    <TableCell className="font-medium">{movement.balance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}