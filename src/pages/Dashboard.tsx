import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  ShoppingBag,
  Calendar,
  Users
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

// Mock data for demo
const mockMetrics = {
  totalStock: 1247,
  todaySales: 15680,
  monthlySales: 456789,
  lowStockItems: 23,
  totalProducts: 342,
  activeCustomers: 89
};

const mockForecastData = {
  "7days": [
    { name: "Today", demand: 120, actual: 120 },
    { name: "Day 2", demand: 135, actual: null },
    { name: "Day 3", demand: 128, actual: null },
    { name: "Day 4", demand: 142, actual: null },
    { name: "Day 5", demand: 138, actual: null },
    { name: "Day 6", demand: 145, actual: null },
    { name: "Day 7", demand: 132, actual: null },
  ],
  "30days": [
    { name: "Week 1", demand: 850, actual: 850 },
    { name: "Week 2", demand: 920, actual: null },
    { name: "Week 3", demand: 880, actual: null },
    { name: "Week 4", demand: 960, actual: null },
  ],
  "90days": [
    { name: "Month 1", demand: 3500, actual: 3500 },
    { name: "Month 2", demand: 3800, actual: null },
    { name: "Month 3", demand: 3650, actual: null },
  ]
};

const mockTopProducts = [
  { name: "Rice Bags", sales: 45, color: "#3B82F6" },
  { name: "Cooking Oil", sales: 38, color: "#10B981" },
  { name: "Wheat Flour", sales: 32, color: "#F59E0B" },
  { name: "Sugar", sales: 28, color: "#EF4444" },
  { name: "Pulses", sales: 25, color: "#8B5CF6" },
];

const mockRecentActivity = [
  { action: "Stock Added", item: "Basmati Rice", quantity: 50, time: "2 mins ago" },
  { action: "Bill Generated", item: "Mixed Items", amount: "₹2,450", time: "5 mins ago" },
  { action: "Low Stock Alert", item: "Cooking Oil", quantity: 8, time: "10 mins ago" },
  { action: "Purchase Order", item: "Wheat Flour", quantity: 100, time: "1 hour ago" },
  { action: "Stock Added", item: "Sugar", quantity: 75, time: "2 hours ago" },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
  const [forecastPeriod, setForecastPeriod] = useState<"7days" | "30days" | "90days">("7days");

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    variant = "default" 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: "up" | "down";
    trendValue?: string;
    variant?: "default" | "success" | "warning" | "danger";
  }) => {
    const variantStyles = {
      default: "bg-gradient-primary text-primary-foreground",
      success: "bg-gradient-success text-success-foreground",
      warning: "bg-warning text-warning-foreground",
      danger: "bg-destructive text-destructive-foreground"
    };

    return (
      <Card className="p-6 shadow-soft hover:shadow-primary transition-all duration-300 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={`text-sm ${trend === "up" ? "text-success" : "text-destructive"}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${variantStyles[variant]} shadow-soft`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your warehouse overview.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg">
            <Calendar className="h-4 w-4" />
            Today
          </Button>
          <Button variant="action" size="lg">
            <Package className="h-4 w-4" />
            Quick Add Stock
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Items in Stock"
          value={mockMetrics.totalStock.toLocaleString()}
          icon={Package}
          variant="default"
        />
        <MetricCard
          title="Today's Sales"
          value={`₹${mockMetrics.todaySales.toLocaleString()}`}
          icon={DollarSign}
          trend="up"
          trendValue="12%"
          variant="success"
        />
        <MetricCard
          title="Monthly Sales"
          value={`₹${mockMetrics.monthlySales.toLocaleString()}`}
          icon={TrendingUp}
          trend="up"
          trendValue="8%"
          variant="success"
        />
        <MetricCard
          title="Low Stock Alerts"
          value={mockMetrics.lowStockItems}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Demand Forecast */}
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">AI Demand Forecast</h3>
              <p className="text-sm text-muted-foreground">Predicted demand based on historical data</p>
            </div>
            <Select value={forecastPeriod} onValueChange={(value: any) => setForecastPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7 Days</SelectItem>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockForecastData[forecastPeriod]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Actual"
              />
              <Line 
                type="monotone" 
                dataKey="demand" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicted"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Selling Products */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-lg font-semibold mb-6">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockTopProducts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="sales"
              >
                {mockTopProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <Button variant="outline">View All</Button>
        </div>
        <div className="space-y-4">
          {mockRecentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-primary rounded-full"></div>
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.item} {activity.quantity && `(${activity.quantity} units)`}
                    {activity.amount && `- ${activity.amount}`}
                  </p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{activity.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}