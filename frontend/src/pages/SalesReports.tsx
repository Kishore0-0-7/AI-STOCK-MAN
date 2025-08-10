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
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Search,
  FileText,
  DollarSign,
  Package,
  Users,
  Share,
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

// Mock sales data
const mockSalesData = {
  daily: [
    { name: "Sat", revenue: 25000, orders: 15, profit: 5000 },
    { name: "Sun", revenue: 32000, orders: 22, profit: 7200 },
    { name: "Mon", revenue: 28000, orders: 18, profit: 6100 },
    { name: "Tue", revenue: 45000, orders: 31, profit: 9800 },
    { name: "Wed", revenue: 52000, orders: 28, profit: 12400 },
    { name: "Thu", revenue: 38000, orders: 25, profit: 8900 },
    { name: "Fri", revenue: 29000, orders: 19, profit: 6800 },
  ],
  monthly: [
    { name: "Jan", revenue: 450000, orders: 280, profit: 89000 },
    { name: "Feb", revenue: 520000, orders: 320, profit: 105000 },
    { name: "Mar", revenue: 480000, orders: 295, profit: 96000 },
    { name: "Apr", revenue: 680000, orders: 410, profit: 142000 },
    { name: "May", revenue: 750000, orders: 450, profit: 158000 },
    { name: "Jun", revenue: 620000, orders: 385, profit: 128000 },
  ],
};

const mockRevenueData = [
  { name: "Sat", revenue: 25000, profit: 5000 },
  { name: "Sun", revenue: 32000, profit: 7200 },
  { name: "Mon", revenue: 28000, profit: 6100 },
  { name: "Tue", revenue: 45000, profit: 9800 },
  { name: "Wed", revenue: 52000, profit: 12400 },
  { name: "Thu", revenue: 38000, profit: 8900 },
  { name: "Fri", revenue: 29000, profit: 6800 },
];

const mockCategoryData = [
  { name: "Electronics", value: 35.2, color: "#8B5CF6" },
  { name: "Accessories", value: 22.8, color: "#3B82F6" },
  { name: "Storage", value: 18.5, color: "#10B981" },
  { name: "Cooling", value: 12.3, color: "#F59E0B" },
  { name: "Power", value: 8.7, color: "#EF4444" },
  { name: "Motherboard", value: 2.5, color: "#06B6D4" },
];

const mockTopProducts = [
  { name: "NVIDIA GTX 1660 Super", sales: 45, revenue: 832500, profit: 67500 },
  { name: "Corsair 650W PSU", sales: 32, revenue: 166400, profit: 12800 },
  { name: "ASUS B450 Motherboard", sales: 28, revenue: 218400, profit: 22400 },
  { name: "1TB Seagate HDD", sales: 24, revenue: 76800, profit: 7200 },
  { name: "AMD Ryzen 5 CPU", sales: 18, revenue: 234000, profit: 27000 },
];

const mockTopCustomers = [
  {
    name: "Rajesh Computers",
    orders: 15,
    revenue: 187500,
    lastOrder: "2024-01-20",
  },
  {
    name: "Tech Solutions Ltd",
    orders: 12,
    revenue: 156000,
    lastOrder: "2024-01-18",
  },
  {
    name: "Digital World",
    orders: 10,
    revenue: 134500,
    lastOrder: "2024-01-19",
  },
  { name: "PC Masters", orders: 8, revenue: 98750, lastOrder: "2024-01-17" },
  { name: "Future Tech", orders: 6, revenue: 87200, lastOrder: "2024-01-16" },
];

const mockTransactions = [
  {
    id: "TXN-001",
    date: "2024-01-20",
    customer: "Rajesh Computers",
    items: 3,
    amount: 45600,
    profit: 8900,
  },
  {
    id: "TXN-002",
    date: "2024-01-20",
    customer: "Tech Solutions",
    items: 1,
    amount: 18500,
    profit: 1500,
  },
  {
    id: "TXN-003",
    date: "2024-01-19",
    customer: "Digital World",
    items: 2,
    amount: 32400,
    profit: 5200,
  },
  {
    id: "TXN-004",
    date: "2024-01-19",
    customer: "PC Masters",
    items: 4,
    amount: 67800,
    profit: 12300,
  },
  {
    id: "TXN-005",
    date: "2024-01-18",
    customer: "Future Tech",
    items: 2,
    amount: 28900,
    profit: 4800,
  },
];

export default function SalesReports() {
  const [dateRange, setDateRange] = useState("daily");
  const [searchTerm, setSearchTerm] = useState("");

  const currentData = mockSalesData[dateRange] || mockSalesData.daily;

  const exportToPDF = () => console.log("Exporting sales report to PDF");
  const exportToExcel = () => console.log("Exporting sales report to Excel");
  const shareReport = () => console.log("Sharing sales report");

  const filteredTransactions = mockTransactions.filter(
    (txn) =>
      txn.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Force chart recalculation on mount to prevent alignment issues
  useEffect(() => {
    const handleResize = () => window.dispatchEvent(new Event("resize"));
    const timer1 = setTimeout(handleResize, 100);
    const timer2 = setTimeout(handleResize, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      <div className="space-y-4 sm:space-y-6 p-1 sm:p-0">
        {/* Header - Fully Responsive */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
              Sales Reports
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Track revenue, analyze trends, and monitor performance
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 lg:shrink-0">
            <Button
              variant="outline"
              onClick={shareReport}
              className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
            >
              <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="truncate">Share</span>
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
              className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="truncate">Export</span>
            </Button>
            <Button
              onClick={exportToPDF}
              className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="truncate">Download</span>
            </Button>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center py-2">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
            Sales Report
          </h2>
        </div>

        {/* Main Content Grid - Mobile First */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
          {/* Left Column - Revenue and Metrics */}
          <div className="col-span-1 xl:col-span-8 space-y-3 sm:space-y-4 lg:space-y-6 min-w-0">
            {/* Revenue Made Card */}
            <Card className="p-3 sm:p-4 lg:p-6 shadow-sm border overflow-hidden">
              <div className="mb-3 sm:mb-4 lg:mb-6">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1">
                  Revenue Made
                </h3>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  ₹1,80,000
                </div>
                <div className="text-xs sm:text-sm text-green-600 font-medium">
                  That's ₹50,000 More than Last Month
                </div>
              </div>

              {/* Daily Sales Chart - Mobile Optimized */}
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Daily Sales
                  </h4>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-full sm:w-28 h-7 sm:h-8 text-xs border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full overflow-hidden rounded-lg">
                  <ResponsiveContainer
                    width="100%"
                    height={120}
                    key={`chart-${dateRange}`}
                  >
                    <AreaChart
                      data={currentData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 9,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value) => [
                          `₹${value.toLocaleString()}`,
                          "Revenue",
                        ]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                          fontSize: "10px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={1.5}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            {/* Revenue & Profit Trend */}
            <Card className="p-3 sm:p-4 lg:p-6 shadow-sm border overflow-hidden">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                <div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">
                    Revenue & Profit Trend
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Select value="weekly" onValueChange={() => {}}>
                      <SelectTrigger className="w-20 sm:w-24 h-6 sm:h-7 text-xs border">
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

              <div className="w-full overflow-hidden rounded-lg">
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart
                    data={mockRevenueData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue2"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#F59E0B"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#F59E0B"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 9,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 8,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickFormatter={(value) => `₹${value / 1000}K`}
                    />
                    <Tooltip
                      formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "10px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#F59E0B"
                      strokeWidth={1.5}
                      fill="url(#colorRevenue2)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Right Column - Metrics and Category Chart */}
          <div className="col-span-1 xl:col-span-4 space-y-3 sm:space-y-4 lg:space-y-6 min-w-0">
            {/* Total Profit Card */}
            <Card className="p-3 sm:p-4 lg:p-6 shadow-sm border overflow-hidden">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">
                Total Profit
              </h3>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                ₹80,000
              </div>
              <div className="text-xs sm:text-sm text-green-600 font-medium">
                That's 20% More than Last Month
              </div>
            </Card>

            {/* Average Profit Card */}
            <Card className="p-3 sm:p-4 lg:p-6 shadow-sm border overflow-hidden">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">
                Average Profit
              </h3>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                ₹1,00,000
              </div>
            </Card>

            {/* Top 7 Category Chart */}
            <Card className="p-3 sm:p-4 lg:p-6 shadow-sm border overflow-hidden">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">
                  Top 7 Category
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    This Month
                  </span>
                  <Select value="month" onValueChange={() => {}}>
                    <SelectTrigger className="w-14 sm:w-16 h-5 sm:h-6 text-xs border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={mockCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
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
                <div className="mt-3 space-y-1 sm:space-y-2">
                  {mockCategoryData.map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-foreground truncate">
                          {category.name}
                        </span>
                      </div>
                      <span className="font-medium text-foreground ml-2">
                        {category.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Top Customers & Products Tables - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Top Customers */}
          <Card className="p-3 sm:p-4 lg:p-6 shadow-sm border overflow-hidden">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-3 sm:mb-4">
              Top Customers
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {mockTopCustomers.map((customer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground text-xs sm:text-sm truncate">
                      {customer.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {customer.orders} orders
                    </div>
                  </div>
                  <div className="text-right ml-2 sm:ml-4 shrink-0">
                    <div className="font-semibold text-foreground text-xs sm:text-sm">
                      ₹{customer.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {customer.lastOrder}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Products */}
          <Card className="p-3 sm:p-4 lg:p-6 shadow-sm border overflow-hidden">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-3 sm:mb-4">
              Top Products
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {mockTopProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground text-xs sm:text-sm truncate">
                      {product.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {product.sales} units sold
                    </div>
                  </div>
                  <div className="text-right ml-2 sm:ml-4 shrink-0">
                    <div className="font-semibold text-foreground text-xs sm:text-sm">
                      ₹{product.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600">
                      +₹{product.profit.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Transactions - Mobile Responsive */}
        <Card className="shadow-sm border overflow-hidden">
          <div className="p-3 sm:p-4 lg:p-6 border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm sm:text-base lg:text-xl font-semibold text-foreground">
                Recent Transactions
              </h3>
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 w-full sm:w-64 h-8 sm:h-9 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Mobile-first Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground font-medium text-xs px-2 sm:px-4">
                    Transaction ID
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs px-2 sm:px-4 hidden sm:table-cell">
                    Date
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs px-2 sm:px-4">
                    Customer
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs px-2 sm:px-4 hidden md:table-cell">
                    Items
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs px-2 sm:px-4">
                    Amount
                  </TableHead>
                  <TableHead className="text-muted-foreground font-medium text-xs px-2 sm:px-4 hidden lg:table-cell">
                    Profit
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground text-xs px-2 sm:px-4">
                      {txn.id}
                    </TableCell>
                    <TableCell className="text-foreground text-xs px-2 sm:px-4 hidden sm:table-cell">
                      {new Date(txn.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-foreground text-xs px-2 sm:px-4 max-w-20 sm:max-w-none truncate">
                      {txn.customer}
                    </TableCell>
                    <TableCell className="text-foreground text-xs px-2 sm:px-4 hidden md:table-cell">
                      {txn.items} items
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-xs px-2 sm:px-4">
                      ₹{txn.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-green-600 text-xs px-2 sm:px-4 hidden lg:table-cell">
                      ₹{txn.profit.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
