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
  RefreshCw,
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
import { reportsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

// Interfaces for type safety
interface SalesOverview {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  profitGrowth: number; // Add profit growth field
  profitMargin: number; // Add profit margin field
  period: string;
}

interface TrendData {
  name: string;
  period: string;
  revenue: number;
  profit: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  revenue: number;
  orders: number;
  profit: number;
  color: string;
  percentage: number;
}

interface TopCustomer {
  name: string;
  email: string;
  orders: number;
  revenue: number;
  last_order: string;
  total_profit: number;
}

interface TopProduct {
  name: string;
  category: string;
  price: number;
  sales: number;
  revenue: number;
  profit: number;
}

interface Transaction {
  id: string;
  date: string;
  customer: string;
  items: number;
  amount: number;
  profit: number;
  status: string;
}

// Helper function for consistent category colors
const getColorForCategory = (category: string, index: number): string => {
  const colorMap: { [key: string]: string } = {
    Electronics: "#ef4444", // Red
    "Office Supplies": "#22c55e", // Green
    Components: "#3b82f6", // Blue
    Industrial: "#f59e0b", // Orange
    elec: "#8b5cf6", // Purple
  };
  return colorMap[category] || `hsl(${index * 72}, 70%, 60%)`;
};

export default function SalesReports() {
  // State management
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("daily");
  const [days, setDays] = useState("7");
  const [categoryPeriod, setCategoryPeriod] = useState("30"); // Category period in days
  const [searchTerm, setSearchTerm] = useState("");

  // Data states
  const [salesOverview, setSalesOverview] = useState<SalesOverview | null>(
    null
  );
  const [trendsData, setTrendsData] = useState<TrendData[]>([]);
  const [categoriesData, setCategoriesData] = useState<CategoryData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const { toast } = useToast();

  // Fetch all sales data
  const fetchSalesData = async () => {
    try {
      setLoading(true);

      const [
        overviewRes,
        trendsRes,
        categoriesRes,
        customersRes,
        productsRes,
        transactionsRes,
      ] = await Promise.allSettled([
        reportsAPI.getSalesOverview({ period: dateRange, days }),
        reportsAPI.getSalesTrends({ period: dateRange, days }),
        reportsAPI.getCategoryBreakdown({ days: categoryPeriod }),
        reportsAPI.getTopCustomers({ days, limit: "5" }),
        reportsAPI.getTopProducts({ days, limit: "5" }),
        reportsAPI.getRecentTransactions({ limit: "10" }),
      ]);

      if (overviewRes.status === "fulfilled") {
        setSalesOverview(overviewRes.value);
      }

      if (trendsRes.status === "fulfilled") {
        // Handle both array format and object with trends property
        const trendsData = trendsRes.value?.trends || trendsRes.value || [];
        setTrendsData(Array.isArray(trendsData) ? trendsData : []);
      }

      if (categoriesRes.status === "fulfilled") {
        // Handle the categories response structure { categories: [...] }
        const categoriesData = categoriesRes.value?.categories || [];

        // Calculate total revenue for percentage calculation (only from categories with revenue > 0)
        const totalRevenue = categoriesData.reduce(
          (sum: number, cat: any) => sum + (parseFloat(cat.revenue) || 0),
          0
        );

        const formattedCategories = categoriesData.map(
          (cat: any, index: number) => {
            const revenue = parseFloat(cat.revenue) || 0;
            const percentage =
              totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

            return {
              name: cat.category || "Unknown",
              value: revenue > 0 ? revenue : totalRevenue * 0.001, // Use 0.1% of total for zero categories
              revenue: revenue,
              orders: cat.orders || 0,
              profit: parseFloat(cat.profit) || 0,
              percentage: parseFloat(percentage.toFixed(1)),
              totalProducts: cat.total_products || 0,
              color: getColorForCategory(cat.category || "Unknown", index),
            };
          }
        ); // Show ALL categories, including those with 0 revenue

        setCategoriesData(formattedCategories);
      }

      if (customersRes.status === "fulfilled") {
        setTopCustomers(
          Array.isArray(customersRes.value) ? customersRes.value : []
        );
      }

      if (productsRes.status === "fulfilled") {
        setTopProducts(
          Array.isArray(productsRes.value) ? productsRes.value : []
        );
      }

      if (transactionsRes.status === "fulfilled") {
        setTransactions(
          Array.isArray(transactionsRes.value) ? transactionsRes.value : []
        );
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      toast({
        title: "Error loading sales data",
        description: "Failed to load sales reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSalesData();
  }, [dateRange, days, categoryPeriod]);

  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setDateRange(newPeriod);
    if (newPeriod === "daily") {
      setDays("7");
    } else if (newPeriod === "weekly") {
      setDays("28"); // 4 weeks
    } else if (newPeriod === "monthly") {
      setDays("365"); // 12 months
    } else if (newPeriod === "yearly") {
      setDays("1095"); // 3 years
    }
  };

  const exportToPDF = async () => {
    try {
      const result = await reportsAPI.exportSalesReport({
        format: "json",
        period: dateRange,
        days,
      });
      console.log("Exporting sales report to PDF", result);
      toast({
        title: "Export initiated",
        description: "Sales report export has been started",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export sales report",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = async () => {
    try {
      const result = await reportsAPI.exportSalesReport({
        format: "csv",
        period: dateRange,
        days,
      });
      console.log("Exporting sales report to Excel", result);
      toast({
        title: "Export initiated",
        description: "Sales report export has been started",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export sales report",
        variant: "destructive",
      });
    }
  };

  const shareReport = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Sales report link copied to clipboard",
    });
  };

  const filteredTransactions = transactions.filter(
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

  if (loading) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden">
        <div className="space-y-4 sm:space-y-6 p-1 sm:p-0">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                Sales Reports
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Loading sales data...
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
                  ₹{salesOverview?.totalRevenue?.toLocaleString() || "0"}
                </div>
                <div
                  className={`text-xs sm:text-sm font-medium ${
                    (salesOverview?.revenueGrowth || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  That's{" "}
                  {Math.abs(salesOverview?.revenueGrowth || 0).toFixed(1)}%{" "}
                  {(salesOverview?.revenueGrowth || 0) >= 0 ? "More" : "Less"}{" "}
                  than Last Period
                </div>
              </div>

              {/* Daily Sales Chart - Mobile Optimized */}
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Sales Trends
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={fetchSalesData}
                      className="h-7 px-2 text-xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Select
                      value={dateRange}
                      onValueChange={handlePeriodChange}
                    >
                      <SelectTrigger className="w-full sm:w-28 h-7 sm:h-8 text-xs border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="w-full overflow-hidden rounded-lg">
                  <ResponsiveContainer
                    width="100%"
                    height={180}
                    key={`chart-${dateRange}`}
                  >
                    <AreaChart
                      data={trendsData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
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
                            stopColor="#3B82F6"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3B82F6"
                            stopOpacity={0.1}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        tickFormatter={(value) =>
                          `₹${(value / 1000).toFixed(0)}K`
                        }
                      />
                      <Tooltip
                        formatter={(value) => [
                          `₹${Number(value).toLocaleString()}`,
                          "Revenue",
                        ]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        fill="url(#colorRevenue)"
                        dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#1D4ED8" }}
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
                    <Select
                      value={dateRange}
                      onValueChange={handlePeriodChange}
                    >
                      <SelectTrigger className="w-20 sm:w-24 h-6 sm:h-7 text-xs border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="w-full overflow-hidden rounded-lg">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart
                    data={trendsData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
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
                          stopColor="#10B981"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorProfit"
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
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickFormatter={(value) =>
                        `₹${(value / 1000).toFixed(0)}K`
                      }
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `₹${Number(value).toLocaleString()}`,
                        name === "revenue" ? "Revenue" : "Profit",
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#10B981"
                      strokeWidth={2}
                      fill="url(#colorRevenue2)"
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, fill: "#059669" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stackId="2"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      fill="url(#colorProfit)"
                      dot={{ fill: "#F59E0B", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, fill: "#D97706" }}
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
                ₹{salesOverview?.totalProfit?.toLocaleString() || "0"}
              </div>
              <div
                className={`text-xs sm:text-sm font-medium ${
                  (salesOverview?.profitGrowth || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                That's {Math.abs(salesOverview?.profitGrowth || 0).toFixed(1)}%{" "}
                {(salesOverview?.profitGrowth || 0) >= 0 ? "More" : "Less"} than
                Last Period
              </div>
            </Card>

            {/* Average Order Card */}
            <Card className="p-3 sm:p-4 lg:p-6 shadow-sm border overflow-hidden">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">
                Average Order
              </h3>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                ₹{salesOverview?.avgOrderValue?.toLocaleString() || "0"}
              </div>
            </Card>

            {/* Top 7 Category Chart */}
            <Card className="p-3 sm:p-4 lg:p-6 shadow-sm border overflow-hidden">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground">
                  Top Categories
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {categoryPeriod === "7"
                      ? "This Week"
                      : categoryPeriod === "30"
                      ? "This Month"
                      : "This Year"}
                  </span>
                  <Select
                    value={categoryPeriod}
                    onValueChange={(value) => setCategoryPeriod(value)}
                  >
                    <SelectTrigger className="w-16 sm:w-18 h-5 sm:h-6 text-xs border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Week</SelectItem>
                      <SelectItem value="30">Month</SelectItem>
                      <SelectItem value="365">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative min-w-0 overflow-hidden">
                {categoriesData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No category data available</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={categoriesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoriesData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name, props) => {
                            const data = props.payload;
                            return [
                              [
                                `₹${Number(data.revenue).toLocaleString()}`,
                                "Revenue",
                              ],
                              [`${data.orders} orders`, "Orders"],
                              [`${data.totalProducts} products`, "Products"],
                            ];
                          }}
                          labelFormatter={(label) => `${label} Category`}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="mt-3 space-y-1 sm:space-y-2">
                      {categoriesData.map((category) => (
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
                          <div className="text-right ml-2">
                            <div className="font-medium text-foreground">
                              {category.revenue > 0
                                ? `${category.percentage}%`
                                : "0%"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ₹{category.revenue.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
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
              {topCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No customer data available</p>
                </div>
              ) : (
                topCustomers.map((customer, index) => (
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
                        {customer.last_order}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Top Products */}
          <Card className="p-3 sm:p-4 lg:p-6 shadow-sm border overflow-hidden">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-3 sm:mb-4">
              Top Products
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No product data available</p>
                </div>
              ) : (
                topProducts.map((product, index) => (
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
                ))
              )}
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
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {searchTerm
                          ? "No transactions found matching your search"
                          : "No transactions available"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((txn) => (
                    <TableRow key={txn.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground text-xs px-2 sm:px-4">
                        {txn.id}
                      </TableCell>
                      <TableCell className="text-foreground text-xs px-2 sm:px-4 hidden sm:table-cell">
                        {txn.date
                          ? new Date(txn.date).toLocaleDateString()
                          : "N/A"}
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
