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
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Search,
  FileText,
  DollarSign,
  Package,
  Users,
  Share
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
  Cell
} from "recharts";

// Mock sales data
const mockSalesData = {
  daily: [
    { name: "Mon", revenue: 25000, orders: 15, profit: 5000 },
    { name: "Tue", revenue: 32000, orders: 22, profit: 7200 },
    { name: "Wed", revenue: 28000, orders: 18, profit: 6100 },
    { name: "Thu", revenue: 45000, orders: 31, profit: 9800 },
    { name: "Fri", revenue: 52000, orders: 28, profit: 12400 },
    { name: "Sat", revenue: 38000, orders: 25, profit: 8900 },
    { name: "Sun", revenue: 29000, orders: 19, profit: 6800 }
  ],
  monthly: [
    { name: "Jan", revenue: 450000, orders: 280, profit: 89000 },
    { name: "Feb", revenue: 520000, orders: 320, profit: 105000 },
    { name: "Mar", revenue: 480000, orders: 295, profit: 96000 },
    { name: "Apr", revenue: 680000, orders: 410, profit: 142000 },
    { name: "May", revenue: 750000, orders: 450, profit: 158000 },
    { name: "Jun", revenue: 620000, orders: 385, profit: 128000 }
  ]
};

const mockTopProducts = [
  { name: "NVIDIA GTX 1660 Super", sales: 45, revenue: 832500, profit: 67500 },
  { name: "Corsair 650W PSU", sales: 32, revenue: 166400, profit: 12800 },
  { name: "ASUS B450 Motherboard", sales: 28, revenue: 218400, profit: 22400 },
  { name: "1TB Seagate HDD", sales: 24, revenue: 76800, profit: 7200 },
  { name: "AMD Ryzen 5 CPU", sales: 18, revenue: 234000, profit: 27000 }
];

const mockTopCustomers = [
  { name: "Rajesh Computers", orders: 15, revenue: 187500, lastOrder: "2024-01-20" },
  { name: "Tech Solutions Ltd", orders: 12, revenue: 156000, lastOrder: "2024-01-18" },
  { name: "Digital World", orders: 10, revenue: 134500, lastOrder: "2024-01-19" },
  { name: "PC Masters", orders: 8, revenue: 98750, lastOrder: "2024-01-17" },
  { name: "Future Tech", orders: 6, revenue: 87200, lastOrder: "2024-01-16" }
];

const mockTransactions = [
  { id: "TXN-001", date: "2024-01-20", customer: "Rajesh Computers", items: 3, amount: 45600, profit: 8900 },
  { id: "TXN-002", date: "2024-01-20", customer: "Tech Solutions", items: 1, amount: 18500, profit: 1500 },
  { id: "TXN-003", date: "2024-01-19", customer: "Digital World", items: 2, amount: 32400, profit: 5200 },
  { id: "TXN-004", date: "2024-01-19", customer: "PC Masters", items: 4, amount: 67800, profit: 12300 },
  { id: "TXN-005", date: "2024-01-18", customer: "Future Tech", items: 2, amount: 28900, profit: 4800 }
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function SalesReports() {
  const [dateRange, setDateRange] = useState("daily");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  const currentData = mockSalesData[dateRange] || mockSalesData.daily;

  const exportToPDF = () => {
    console.log("Exporting sales report to PDF");
  };

  const exportToExcel = () => {
    console.log("Exporting sales report to Excel");
  };

  const shareReport = () => {
    console.log("Sharing sales report");
  };

  const filteredTransactions = mockTransactions.filter(txn =>
    txn.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Reports</h1>
          <p className="text-muted-foreground">Analyze sales performance and generate reports</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={shareReport}>
            <Share className="h-4 w-4" />
            Share
          </Button>
          <Button variant="secondary" size="lg" onClick={exportToExcel}>
            <FileText className="h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="action" size="lg" onClick={exportToPDF}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">₹{currentData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-success rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p className="text-xl font-bold">₹{currentData.reduce((sum, d) => sum + d.profit, 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-accent rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-xl font-bold">{currentData.reduce((sum, d) => sum + d.orders, 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-xl font-bold">{mockTopCustomers.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Profit Trend */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Revenue & Profit Trend</h3>
              <p className="text-sm text-muted-foreground">Track financial performance over time</p>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, ""]} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name="Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Products */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-6">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockTopProducts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, sales, x, y, textAnchor }) => (
                  <text
                    x={x}
                    y={y}
                    textAnchor={textAnchor}
                    fontSize={10}
                    fill="#333"
                    dominantBaseline="central"
                  >
                    {`${name.split(' ')[0]}: ${sales}`}
                  </text>
                )}
                outerRadius={80}
                fill="#8884d8"
                dataKey="sales"
              >
                {mockTopProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} units`, "Sales"]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Customers & Products Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopCustomers.map((customer, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.orders}</TableCell>
                  <TableCell>₹{customer.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Top Products */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTopProducts.map((product, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sales}</TableCell>
                  <TableCell>₹{product.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {mockTopCustomers.map(customer => (
                <SelectItem key={customer.name} value={customer.name}>{customer.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {mockTopProducts.map(product => (
                <SelectItem key={product.name} value={product.name}>{product.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card className="shadow-soft">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map(txn => (
              <TableRow key={txn.id}>
                <TableCell className="font-medium">{txn.id}</TableCell>
                <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                <TableCell>{txn.customer}</TableCell>
                <TableCell>{txn.items} items</TableCell>
                <TableCell className="font-medium">₹{txn.amount.toLocaleString()}</TableCell>
                <TableCell className="font-medium text-success">₹{txn.profit.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}