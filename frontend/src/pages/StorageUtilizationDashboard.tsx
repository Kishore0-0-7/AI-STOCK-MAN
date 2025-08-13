import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Warehouse,
  TrendingUp,
  Activity,
  Gauge,
  MapPin,
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Zap,
} from "lucide-react";

// Types
interface RackUtilization {
  rackId: string;
  capacity: number;
  occupied: number;
  status: "available" | "near-full" | "overfilled";
  location: string;
  utilizationPercentage: number;
}

interface HeatMapCell {
  x: number;
  y: number;
  utilization: number;
  rackId: string;
}

interface TrendData {
  date: string;
  inbound: number;
  outbound: number;
}

interface ForecastData {
  period: string;
  predictedUtilization: number;
  confidence: number;
}

interface KPIData {
  averageUtilization: number;
  underutilizedRacks: number;
  storageEfficiency: number;
}

// Occupancy Gauge Component
const OccupancyGauge: React.FC<{
  totalCapacity: number;
  currentOccupied: number;
}> = ({ totalCapacity, currentOccupied }) => {
  const occupancyPercentage = Math.round(
    (currentOccupied / totalCapacity) * 100
  );

  const getGaugeColor = (percentage: number) => {
    if (percentage >= 90)
      return { bg: "bg-red-500", text: "text-red-600", ring: "ring-red-200" };
    if (percentage >= 75)
      return {
        bg: "bg-yellow-500",
        text: "text-yellow-600",
        ring: "ring-yellow-200",
      };
    if (percentage >= 50)
      return {
        bg: "bg-blue-500",
        text: "text-blue-600",
        ring: "ring-blue-200",
      };
    return {
      bg: "bg-green-500",
      text: "text-green-600",
      ring: "ring-green-200",
    };
  };

  const colors = getGaugeColor(occupancyPercentage);

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Gauge className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          Warehouse Occupancy
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {/* Circular Progress */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32">
          <div
            className={`absolute inset-0 rounded-full ${colors.ring} ring-8`}
          >
            <div
              className={`w-full h-full rounded-full ${colors.bg} flex items-center justify-center`}
              style={{
                background: `conic-gradient(${colors.bg.replace(
                  "bg-",
                  ""
                )} 0deg, ${colors.bg.replace("bg-", "")} ${
                  occupancyPercentage * 3.6
                }deg, #e5e7eb ${occupancyPercentage * 3.6}deg)`,
              }}
            >
              <div className="bg-white w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center">
                <span
                  className={`text-lg sm:text-2xl font-bold ${colors.text}`}
                >
                  {occupancyPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-1">
          <div className="text-sm text-gray-600">
            {currentOccupied.toLocaleString()} /{" "}
            {totalCapacity.toLocaleString()} units
          </div>
          <div className="text-xs text-gray-500">
            {(totalCapacity - currentOccupied).toLocaleString()} available
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Rack Utilization Table Component
const RackUtilizationTable: React.FC<{ data: RackUtilization[] }> = ({
  data,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200";
      case "near-full":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "overfilled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-3 w-3" />;
      case "near-full":
        return <AlertTriangle className="h-3 w-3" />;
      case "overfilled":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          Rack Utilization
        </CardTitle>
        <CardDescription>
          Current storage capacity by rack location
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-xs sm:text-sm">
                  Rack ID
                </TableHead>
                <TableHead className="font-semibold text-center text-xs sm:text-sm">
                  Capacity
                </TableHead>
                <TableHead className="font-semibold text-center text-xs sm:text-sm">
                  Occupied
                </TableHead>
                <TableHead className="font-semibold text-center text-xs sm:text-sm">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-center text-xs sm:text-sm hidden sm:table-cell">
                  %
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((rack) => (
                <TableRow key={rack.rackId} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-xs sm:text-sm">
                    <div>
                      <div>{rack.rackId}</div>
                      <div className="text-xs text-gray-500">
                        {rack.location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs sm:text-sm">
                    {rack.capacity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-xs sm:text-sm font-semibold">
                    {rack.occupied.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      className={`${getStatusColor(
                        rack.status
                      )} text-xs flex items-center gap-1 justify-center`}
                    >
                      {getStatusIcon(rack.status)}
                      <span className="hidden sm:inline">{rack.status}</span>
                      <span className="sm:hidden">
                        {rack.utilizationPercentage}%
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-xs sm:text-sm font-semibold hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={rack.utilizationPercentage}
                        className="h-2 flex-1"
                      />
                      <span className="text-xs w-10">
                        {rack.utilizationPercentage}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// Warehouse Heat Map Component
const WarehouseHeatMap: React.FC<{ heatMap: HeatMapCell[] }> = ({
  heatMap,
}) => {
  const getHeatColor = (utilization: number) => {
    if (utilization >= 90) return "bg-red-500";
    if (utilization >= 75) return "bg-red-400";
    if (utilization >= 60) return "bg-yellow-500";
    if (utilization >= 40) return "bg-yellow-400";
    if (utilization >= 20) return "bg-green-400";
    if (utilization > 0) return "bg-green-300";
    return "bg-gray-200";
  };

  // Grid dimensions
  const maxX = Math.max(...heatMap.map((cell) => cell.x)) + 1;
  const maxY = Math.max(...heatMap.map((cell) => cell.y)) + 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          Warehouse Heat Map
        </CardTitle>
        <CardDescription>Storage utilization by floor location</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Heat Map Grid */}
          <div className="overflow-x-auto">
            <div
              className="grid gap-1 min-w-fit mx-auto"
              style={{
                gridTemplateColumns: `repeat(${maxX}, minmax(20px, 1fr))`,
                gridTemplateRows: `repeat(${maxY}, minmax(20px, 1fr))`,
              }}
            >
              {Array.from({ length: maxY }, (_, y) =>
                Array.from({ length: maxX }, (_, x) => {
                  const cell = heatMap.find((c) => c.x === x && c.y === y);
                  const utilization = cell?.utilization || 0;

                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`
                        w-6 h-6 sm:w-8 sm:h-8 rounded ${getHeatColor(
                          utilization
                        )} 
                        border border-gray-300 flex items-center justify-center
                        hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer
                        relative group
                      `}
                      title={cell ? `${cell.rackId}: ${utilization}%` : "Empty"}
                    >
                      {cell && (
                        <span className="text-xs font-bold text-white drop-shadow">
                          {utilization > 0 ? Math.round(utilization) : ""}
                        </span>
                      )}

                      {/* Tooltip */}
                      {cell && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {cell.rackId}: {utilization}% utilized
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span>Empty</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-300 rounded"></div>
              <span>0-20%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span>20-40%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span>40-60%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>60-75%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span>75-90%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>90%+</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Inventory Trends Chart Component
const InventoryTrendsChart: React.FC<{
  inboundData: TrendData[];
  outboundData: TrendData[];
}> = ({ inboundData, outboundData }) => {
  // Combine inbound and outbound data
  const combinedData = inboundData.map((item, index) => ({
    date: item.date,
    inbound: item.inbound,
    outbound: outboundData[index]?.outbound || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          Inventory Trends (30 Days)
        </CardTitle>
        <CardDescription>Inbound vs Outbound movement patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
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
              <Line
                type="monotone"
                dataKey="inbound"
                stroke="#10b981"
                strokeWidth={2}
                name="Inbound"
                dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="outbound"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Outbound"
                dot={{ fill: "#f59e0b", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// KPI Cards Component
const KPICards: React.FC<{ kpiData: KPIData }> = ({ kpiData }) => {
  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            Avg Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-blue-700">
            {kpiData.averageUtilization}%
          </div>
          <p className="text-xs text-gray-500">This month</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Underutilized
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-yellow-700">
            {kpiData.underutilizedRacks}%
          </div>
          <p className="text-xs text-gray-500">of racks</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-600" />
            Efficiency Index
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-green-700">
            {kpiData.storageEfficiency}
          </div>
          <p className="text-xs text-gray-500">optimization score</p>
        </CardContent>
      </Card>
    </>
  );
};

// Forecast Panel Component
const ForecastPanel: React.FC<{ forecast: ForecastData[] }> = ({
  forecast,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          Storage Forecast
        </CardTitle>
        <CardDescription>Predicted utilization trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {forecast.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-lg gap-2"
            >
              <div>
                <div className="font-medium text-sm">{item.period}</div>
                <div className="text-xs text-gray-600">
                  Confidence: {item.confidence}%
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Progress
                  value={item.predictedUtilization}
                  className="h-2 flex-1 sm:w-24"
                />
                <span className="text-sm font-semibold w-12 text-right">
                  {item.predictedUtilization}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const StorageUtilizationDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    overview: any;
    rackUtilization: RackUtilization[];
    heatMap: HeatMapCell[];
    inboundData: TrendData[];
    outboundData: TrendData[];
    kpiData: KPIData;
    forecast: ForecastData[];
  }>({
    overview: { totalCapacity: 0, currentOccupied: 0 },
    rackUtilization: [],
    heatMap: [],
    inboundData: [],
    outboundData: [],
    kpiData: {
      averageUtilization: 0,
      underutilizedRacks: 0,
      storageEfficiency: 0,
    },
    forecast: [],
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // Load all data in parallel
        const [
          overviewResponse,
          rackResponse,
          heatMapResponse,
          trendsResponse,
          kpisResponse,
          forecastResponse,
        ] = await Promise.all([
          api.storageUtilization.getOverview(),
          api.storageUtilization.getRackUtilization(),
          api.storageUtilization.getHeatMap(),
          api.storageUtilization.getTrends(),
          api.storageUtilization.getKPIs(),
          api.storageUtilization.getForecast(),
        ]);

        setData({
          overview: overviewResponse,
          rackUtilization: rackResponse,
          heatMap: heatMapResponse,
          inboundData: trendsResponse.inboundData,
          outboundData: trendsResponse.outboundData,
          kpiData: kpisResponse,
          forecast: forecastResponse,
        });
      } catch (error) {
        console.error("Error loading storage utilization data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6 max-w-7xl">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Warehouse className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <span className="truncate">Storage Utilization</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Monitor warehouse capacity and storage efficiency
          </p>
        </div>
        <Button
          onClick={() => setLoading(true)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OccupancyGauge
          totalCapacity={data.overview.totalCapacity}
          currentOccupied={data.overview.currentOccupied}
        />
        <KPICards kpiData={data.kpiData} />
      </div>

      {/* Charts and Heat Map Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryTrendsChart
          inboundData={data.inboundData}
          outboundData={data.outboundData}
        />
        <WarehouseHeatMap heatMap={data.heatMap} />
      </div>

      {/* Table and Forecast Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RackUtilizationTable data={data.rackUtilization} />
        </div>
        <div>
          <ForecastPanel forecast={data.forecast} />
        </div>
      </div>
    </div>
  );
};

export default StorageUtilizationDashboard;
