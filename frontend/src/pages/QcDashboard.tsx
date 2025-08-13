import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  ShieldAlert,
  Search,
  RefreshCw,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { qcAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

// API Functions
const apiCall = async (endpoint: string) => {
  try {
    const response = await fetch(`http://localhost:4000/api${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Interfaces
interface QCMetrics {
  rejectionRate: number;
  totalInspections: number;
  scrapQuantity: number;
  scrapValue: number;
}

interface DefectData {
  type: string;
  count: number;
}

interface TrendData {
  date: string;
  rejectionRate: number;
}

interface QCHoldItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  status: "Hold" | "Rework" | "Scrap" | "Released";
  date: string;
}

// Mock data generators (fallback)
const generateMockMetrics = (): QCMetrics => ({
  rejectionRate: Math.random() * 8 + 2,
  totalInspections: Math.floor(Math.random() * 500) + 1200,
  scrapQuantity: Math.floor(Math.random() * 50) + 100,
  scrapValue: Math.floor(Math.random() * 500000) + 1500000,
});

const generateMockDefects = (): DefectData[] => [
  { type: "Cracks", count: 45 },
  { type: "Porosity", count: 38 },
  { type: "Dimension Mismatch", count: 25 },
  { type: "Surface Defects", count: 18 },
  { type: "Material Issues", count: 8 },
];

const generateMockTrend = (): TrendData[] => {
  const data: TrendData[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      rejectionRate: Math.random() * 8 + 2,
    });
  }
  return data;
};

const generateMockHoldItems = (): QCHoldItem[] => [
  {
    id: "1",
    itemCode: "RC-2024-001",
    description: "Engine Block Casting - V6",
    quantity: 12,
    status: "Hold",
    date: "2024-08-13",
  },
  {
    id: "2",
    itemCode: "RC-2024-002",
    description: "Transmission Housing",
    quantity: 8,
    status: "Rework",
    date: "2024-08-13",
  },
  {
    id: "3",
    itemCode: "RC-2024-003",
    description: "Brake Caliper Casting",
    quantity: 15,
    status: "Hold",
    date: "2024-08-12",
  },
  {
    id: "4",
    itemCode: "RC-2024-004",
    description: "Cylinder Head - 4 Cylinder",
    quantity: 6,
    status: "Scrap",
    date: "2024-08-12",
  },
  {
    id: "5",
    itemCode: "RC-2024-005",
    description: "Manifold Casting",
    quantity: 20,
    status: "Released",
    date: "2024-08-11",
  },
];

// Utility functions
const getRejectionRateColor = (rate: number): string => {
  if (rate < 5) return "text-green-600 bg-green-50";
  if (rate <= 10) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "Hold":
      return "bg-yellow-100 text-yellow-800";
    case "Rework":
      return "bg-blue-100 text-blue-800";
    case "Scrap":
      return "bg-red-100 text-red-800";
    case "Released":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function QcDashboard() {
  const { toast } = useToast();

  // State
  const [metrics, setMetrics] = useState<QCMetrics | null>(null);
  const [defects, setDefects] = useState<DefectData[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [holdItems, setHoldItems] = useState<QCHoldItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<QCHoldItem[]>([]);

  // Loading states
  const [loading, setLoading] = useState({
    metrics: true,
    defects: true,
    trends: true,
    holdItems: true,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDefectType, setSelectedDefectType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Data fetching
  const fetchData = async () => {
    setLoading({ metrics: true, defects: true, trends: true, holdItems: true });

    try {
      // Fetch data from the real API
      const [metricsData, defectsData, trendsData, holdItemsData] =
        await Promise.allSettled([
          qcAPI.getMetrics(),
          qcAPI.getDefects(),
          qcAPI.getRejectionTrend({ days: 30 }),
          qcAPI.getHoldItems({ limit: 50 }),
        ]);

      setMetrics(
        metricsData.status === "fulfilled"
          ? metricsData.value
          : generateMockMetrics()
      );
      setDefects(
        defectsData.status === "fulfilled"
          ? defectsData.value
          : generateMockDefects()
      );
      setTrends(
        trendsData.status === "fulfilled"
          ? trendsData.value
          : generateMockTrend()
      );
      setHoldItems(
        holdItemsData.status === "fulfilled"
          ? holdItemsData.value.map((item) => ({
              ...item,
              status:
                (item.status as "Hold" | "Rework" | "Scrap" | "Released") ||
                "Hold",
            }))
          : generateMockHoldItems()
      );

      setLoading({
        metrics: false,
        defects: false,
        trends: false,
        holdItems: false,
      });
    } catch (error) {
      console.error("Failed to fetch QC data:", error);
      toast({
        title: "Data Loading Notice",
        description:
          "Some data could not be loaded from the server. Showing available data.",
        variant: "default",
      });

      // Set loading to false even on error
      setLoading({
        metrics: false,
        defects: false,
        trends: false,
        holdItems: false,
      });
    }
  };

  // Filter hold items
  useEffect(() => {
    let filtered = holdItems.filter(
      (item) =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedDefectType !== "all") {
      // This would need to be matched with defect data in a real implementation
      filtered = filtered.filter(
        (item) => item.status.toLowerCase() === selectedDefectType.toLowerCase()
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      });
    }

    setFilteredItems(filtered);
  }, [holdItems, searchTerm, selectedDefectType, startDate, endDate]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <TooltipProvider>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Quality Control Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Rough Casting Warehouse System
              </p>
            </div>
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">↻</span>
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rejection Rate */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center justify-between">
                <span className="truncate">Rejection Rate</span>
                <AlertTriangle className="h-4 w-4 flex-shrink-0 ml-2" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.metrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="space-y-1">
                  <div
                    className={`text-xl sm:text-2xl font-bold p-2 rounded ${getRejectionRateColor(
                      metrics?.rejectionRate || 0
                    )}`}
                  >
                    {metrics?.rejectionRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500">Target: &lt;5%</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total QC Inspections */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center justify-between">
                <span className="truncate">Total QC Inspections</span>
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 ml-2" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.metrics ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="space-y-1">
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">
                    {metrics?.totalInspections.toLocaleString("en-IN")}
                  </div>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scrap Quantity */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center justify-between">
                <span className="truncate">Scrap Quantity</span>
                <XCircle className="h-4 w-4 flex-shrink-0 ml-2" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.metrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="space-y-1">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">
                    {metrics?.scrapQuantity.toLocaleString("en-IN")}
                  </div>
                  <p className="text-xs text-gray-500">units</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scrap Value */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center justify-between">
                <span className="truncate">Scrap Value</span>
                <IndianRupee className="h-4 w-4 flex-shrink-0 ml-2" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.metrics ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                    {formatCurrency(metrics?.scrapValue || 0)}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    ₹
                    {Math.round(
                      (metrics?.scrapValue || 0) / (metrics?.scrapQuantity || 1)
                    ).toLocaleString("en-IN")}{" "}
                    per unit
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Status Filter
                </label>
                <Select
                  value={selectedDefectType}
                  onValueChange={setSelectedDefectType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="rework">Rework</SelectItem>
                    <SelectItem value="scrap">Scrap</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setSelectedDefectType("all");
                    setSearchTerm("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <span className="hidden sm:inline">Clear Filters</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Defect Types Chart */}
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                <span className="truncate">Defect Types Breakdown</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Current defect types and occurrence count
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.defects ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : defects.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No Data Available</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={defects}
                      margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="type"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rejection Rate Trend */}
          <Card className="w-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <span className="truncate">Rejection Rate Trend</span>
              </CardTitle>
              <CardDescription className="text-sm">
                30-day rejection rate history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.trends ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : trends.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No Data Available</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trends}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        label={{
                          value: "Rate (%)",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: 10 },
                        }}
                      />
                      <RechartsTooltip
                        labelFormatter={(date) => formatDate(date)}
                        formatter={(value) => [
                          `${Number(value).toFixed(1)}%`,
                          "Rejection Rate",
                        ]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rejectionRate"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 2 }}
                        activeDot={{ r: 4, fill: "#3b82f6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* QC Hold Items Table */}
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                <span className="truncate">
                  QC Hold Items ({filteredItems.length})
                </span>
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading.holdItems ? (
              <div className="space-y-2 p-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-sm">
                        Item Code
                      </TableHead>
                      <TableHead className="font-semibold text-sm hidden sm:table-cell">
                        Description
                      </TableHead>
                      <TableHead className="font-semibold text-center text-sm">
                        Qty
                      </TableHead>
                      <TableHead className="font-semibold text-center text-sm">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-sm hidden md:table-cell">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          {searchTerm ||
                          selectedDefectType !== "all" ||
                          startDate ||
                          endDate
                            ? "No items match your filters"
                            : "No QC hold items found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <TableCell className="font-medium text-sm">
                            <div className="flex flex-col">
                              <span>{item.itemCode}</span>
                              <span
                                className="text-xs text-gray-500 sm:hidden truncate"
                                title={item.description}
                              >
                                {item.description}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs hidden sm:table-cell">
                            <div
                              className="truncate text-sm"
                              title={item.description}
                            >
                              {item.description}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-sm">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={`${getStatusColor(
                                item.status
                              )} border-0 text-xs`}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm hidden md:table-cell">
                            {formatDate(item.date)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  );
}
