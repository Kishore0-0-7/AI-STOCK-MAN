import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  Calendar,
  Users,
  LucideIcon,
  BarChart,
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
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { dashboardAPI, productsAPI, alertsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  total_products?: number;
  low_stock_products?: number;
  active_suppliers?: number;
  pending_orders?: number;
  monthly_procurement?: number;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  user_name: string;
  created_at: string;
}

interface TrendData {
  month: string;
  total_quantity_sold: number;
  unique_products_sold: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({});
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load dashboard overview data
      const [overviewRes, activityRes, trendsRes, alertsRes, productsRes] =
        await Promise.allSettled([
          dashboardAPI.getOverview(),
          dashboardAPI.getActivity(),
          dashboardAPI.getTrends(),
          alertsAPI.getAll({ limit: 5, status: "active" }),
          productsAPI.getAll(),
        ]);

      if (overviewRes.status === "fulfilled") {
        setStats(overviewRes.value || {});
      } else {
        console.error("Failed to load overview:", overviewRes.reason);
        // Fallback to individual API calls
        await loadFallbackStats();
      }

      if (activityRes.status === "fulfilled") {
        setActivities(
          Array.isArray(activityRes.value) ? activityRes.value : []
        );
      }

      if (trendsRes.status === "fulfilled") {
        setTrends(Array.isArray(trendsRes.value) ? trendsRes.value : []);
      }

      if (alertsRes.status === "fulfilled") {
        setAlerts(Array.isArray(alertsRes.value) ? alertsRes.value : []);
      }

      if (productsRes.status === "fulfilled") {
        setProducts(Array.isArray(productsRes.value) ? productsRes.value : []);
      }
    } catch (error) {
      console.error("Dashboard data loading error:", error);
      toast({
        title: "Error loading dashboard data",
        description: "Some data may be incomplete. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackStats = async () => {
    try {
      const [productsRes, lowStockRes] = await Promise.allSettled([
        productsAPI.getAll(),
        productsAPI.getLowStock(),
      ]);

      const totalProducts =
        productsRes.status === "fulfilled"
          ? Array.isArray(productsRes.value)
            ? productsRes.value.length
            : 0
          : 0;

      const lowStockCount =
        lowStockRes.status === "fulfilled"
          ? Array.isArray(lowStockRes.value)
            ? lowStockRes.value.length
            : 0
          : 0;

      setStats((prev) => ({
        ...prev,
        total_products: totalProducts,
        low_stock_products: lowStockCount,
        active_suppliers: prev.active_suppliers || 0,
        pending_orders: prev.pending_orders || 0,
        monthly_procurement: prev.monthly_procurement || 0,
      }));
    } catch (error) {
      console.error("Fallback stats loading error:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
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
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 bg-gradient-to-br from-background to-blue-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center lg:justify-start gap-3 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
            <BarChart className="h-8 md:h-9 w-8 md:w-9 text-blue-500" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">
            Welcome back! Here's your business overview
          </p>
        </div>
        <div className="flex justify-center lg:justify-end">
          <Button
            onClick={loadDashboardData}
            variant="outline"
            className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh Data</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Products"
          value={stats.total_products || 0}
          icon={Package}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.low_stock_products || 0}
          icon={AlertTriangle}
          color="red"
          trend={{ value: 8, isPositive: false }}
        />
        <StatCard
          title="Active Suppliers"
          value={stats.active_suppliers || 0}
          icon={Users}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pending_orders || 0}
          icon={ShoppingCart}
          color="purple"
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Stock Levels Chart */}
        <Card className="p-4 md:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
            <h3 className="text-lg font-semibold text-center sm:text-left">
              Stock Levels Overview
            </h3>
            <Badge variant="secondary" className="w-fit mx-auto sm:mx-0">
              {(products || []).length} products tracked
            </Badge>
          </div>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={(products || []).slice(0, 10)}
                margin={{ top: 20, right: 10, left: 10, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                  fontSize={10}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="current_stock"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="low_stock_threshold"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4 md:p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`p-2 rounded-full flex-shrink-0 ${
                    activity.activity_type === "low_stock"
                      ? "bg-red-100 text-red-600"
                      : activity.activity_type === "new_order"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {activity.activity_type === "low_stock" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : activity.activity_type === "new_order" ? (
                    <ShoppingCart className="h-4 w-4" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground break-words">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean } | null;
  color: "blue" | "red" | "green" | "purple";
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: StatCardProps) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 shadow-blue-500/25",
    red: "from-red-500 to-red-600 shadow-red-500/25",
    green: "from-green-500 to-green-600 shadow-green-500/25",
    purple: "from-purple-500 to-purple-600 shadow-purple-500/25",
  };

  return (
    <Card className="relative p-6 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-muted/30">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div
          className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}
        >
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
      <div
        className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${colorClasses[color]}`}
      ></div>
    </Card>
  );
};

export default Dashboard;
