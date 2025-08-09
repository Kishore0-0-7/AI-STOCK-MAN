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
  Cell,
  Area,
  AreaChart
} from "recharts";

// Mock sales data
const mockSalesData = {
  daily: [
    { name: "Sat", revenue: 25000, orders: 15, profit: 5000 },
    { name: "Sun", revenue: 32000, orders: 22, profit: 7200 },
    { name: "Mon", revenue: 28000, orders: 18, profit: 6100 },
    { name: "Tue", revenue: 45000, orders: 31, profit: 9800 },
    { name: "Wed", revenue: 52000, orders: 28, profit: 12400 },
    { name: "Thu", revenue: 38000, orders: 25, profit: 8900 },
    { name: "Fri", revenue: 29000, orders: 19, profit: 6800 }
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

const mockRevenueData = [
  { name: "Sat", revenue: 25000, profit: 5000 },
  { name: "Sun", revenue: 32000, profit: 7200 },
  { name: "Mon", revenue: 28000, profit: 6100 },
  { name: "Tue", revenue: 45000, profit: 9800 },
  { name: "Wed", revenue: 52000, profit: 12400 },
  { name: "Thu", revenue: 38000, profit: 8900 },
  { name: "Fri", revenue: 29000, profit: 6800 }
];

const mockCategoryData = [
  { name: "Electronics", value: 35.2, color: "#8B5CF6" },
  { name: "Accessories", value: 22.8, color: "#3B82F6" },
  { name: "Storage", value: 18.5, color: "#10B981" },
  { name: "Cooling", value: 12.3, color: "#F59E0B" },
  { name: "Power", value: 8.7, color: "#EF4444" },
  { name: "Motherboard", value: 2.5, color: "#06B6D4" }
];

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

export default function SalesReports() {
  const [dateRange, setDateRange] = useState("daily");
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  const currentData = mockSalesData[dateRange] || mockSalesData.daily;
  const totalRevenue = currentData.reduce((sum, d) => sum + d.revenue, 0);
  const totalProfit = currentData.reduce((sum, d) => sum + d.profit, 0);
  const avgProfit = totalProfit / currentData.length;

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
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={shareReport}>
            <Share className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileText className="h-4 w-4" />
            Export
          </Button>
          <Button variant="default" size="sm" onClick={exportToPDF}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Report Title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Report</h2>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Revenue and Metrics */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Revenue Made Card */}
          <Card className="p-6 bg-white shadow-sm border-0">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Revenue Made</h3>
              <div className="text-3xl font-bold text-gray-900">₹1,80,000</div>
              <div className="text-sm text-green-600 font-medium">That's ₹50,000 More than Last Month</div>
            </div>
            
            {/* Daily Sales Chart */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-600">Daily Sales</h4>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={currentData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue & Profit Trend */}
          <Card className="p-6 bg-white shadow-sm border-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Revenue & Profit Trend</h3>
                <div className="flex items-center gap-4 mt-2">
                  <Select value="weekly" onValueChange={() => {}}>
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockRevenueData}>
                <defs>
                  <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `₹${(value/1000)}K`}
                />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  fill="url(#colorRevenue2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Right Column - Metrics and Category Chart */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Total Profit Card */}
          <Card className="p-6 bg-white shadow-sm border-0">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Profit</h3>
            <div className="text-3xl font-bold text-gray-900 mb-2">₹80,000</div>
            <div className="text-sm text-green-600 font-medium">That's 20% More than Last Month</div>
          </Card>

          {/* Average Profit Card */}
          <Card className="p-6 bg-white shadow-sm border-0">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Average Profit</h3>
            <div className="text-3xl font-bold text-gray-900">₹1,00,000</div>
          </Card>

          {/* Top 7 Category Chart */}
          <Card className="p-6 bg-white shadow-sm border-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top 7 Category</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">This Month</span>
                <Select value="month" onValueChange={() => {}}>
                  <SelectTrigger className="w-16 h-6 text-xs border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="relative">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mockCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {mockCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="mt-4 space-y-2">
                {mockCategoryData.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-gray-700">{category.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{category.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Top Customers & Products Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card className="p-6 bg-white shadow-sm border-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {mockTopCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <div className="font-medium text-gray-900">{customer.name}</div>
                  <div className="text-sm text-gray-500">{customer.orders} orders</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">₹{customer.revenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{customer.lastOrder}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-6 bg-white shadow-sm border-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {mockTopProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.sales} units sold</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">₹{product.revenue.toLocaleString()}</div>
                  <div className="text-xs text-green-600">+₹{product.profit.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-white shadow-sm border-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 h-9"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead className="text-gray-600 font-medium">Transaction ID</TableHead>
                <TableHead className="text-gray-600 font-medium">Date</TableHead>
                <TableHead className="text-gray-600 font-medium">Customer</TableHead>
                <TableHead className="text-gray-600 font-medium">Items</TableHead>
                <TableHead className="text-gray-600 font-medium">Amount</TableHead>
                <TableHead className="text-gray-600 font-medium">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map(txn => (
                <TableRow key={txn.id} className="border-gray-100 hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">{txn.id}</TableCell>
                  <TableCell className="text-gray-700">{new Date(txn.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-gray-700">{txn.customer}</TableCell>
                  <TableCell className="text-gray-700">{txn.items} items</TableCell>
                  <TableCell className="font-medium text-gray-900">₹{txn.amount.toLocaleString()}</TableCell>
                  <TableCell className="font-medium text-green-600">₹{txn.profit.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}