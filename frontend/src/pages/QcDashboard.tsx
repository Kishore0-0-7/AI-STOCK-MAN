import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Legend, Tooltip as RechartsTooltip
} from 'recharts';
import {
  AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign,
  ShieldAlert, ChevronDown, ChevronUp, Search, Filter,
  Calendar, User, Settings, LogOut, RefreshCw, Eye,
  Package, CheckCircle2, XCircle
} from 'lucide-react';

// Mock data interfaces
interface DefectData {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

interface TrendData {
  date: string;
  rejectionRate: number;
  target: number;
}

interface QcHoldItem {
  id: string;
  description: string;
  quantity: number;
  defectType: string;
  dateFound: string;
  status: 'Hold' | 'Rework' | 'Scrap';
  inspector: string;
}

interface KPIData {
  rejectionRate: number;
  scrapQuantity: number;
  scrapValue: number;
  qcHoldItems: number;
  totalInspected: number;
  passedItems: number;
}

// Color schemes
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

const defectColors = {
  'Cracks': '#ef4444',
  'Porosity': '#f97316', 
  'Dimension Mismatch': '#eab308',
  'Surface Defects': '#22c55e',
  'Material Issues': '#3b82f6',
  'Contamination': '#8b5cf6',
  'Other': '#6b7280'
};

// Mock data generators
const generateDefectData = (): DefectData[] => [
  { type: 'Cracks', count: 45, percentage: 32.1, color: defectColors['Cracks'] },
  { type: 'Porosity', count: 38, percentage: 27.1, color: defectColors['Porosity'] },
  { type: 'Dimension Mismatch', count: 25, percentage: 17.9, color: defectColors['Dimension Mismatch'] },
  { type: 'Surface Defects', count: 18, percentage: 12.9, color: defectColors['Surface Defects'] },
  { type: 'Material Issues', count: 8, percentage: 5.7, color: defectColors['Material Issues'] },
  { type: 'Contamination', count: 6, percentage: 4.3, color: defectColors['Contamination'] }
];

const generateTrendData = (): TrendData[] => {
  const data: TrendData[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      rejectionRate: Math.random() * 8 + 2, // 2-10% range
      target: 5.0 // Target rejection rate
    });
  }
  return data;
};

const generateQcHoldData = (): QcHoldItem[] => [
  {
    id: 'RC-2024-001',
    description: 'Engine Block Casting - V6',
    quantity: 12,
    defectType: 'Cracks',
    dateFound: '2024-08-13',
    status: 'Hold',
    inspector: 'John Smith'
  },
  {
    id: 'RC-2024-002',
    description: 'Transmission Housing',
    quantity: 8,
    defectType: 'Porosity',
    dateFound: '2024-08-13',
    status: 'Rework',
    inspector: 'Sarah Johnson'
  },
  {
    id: 'RC-2024-003',
    description: 'Brake Caliper Casting',
    quantity: 15,
    defectType: 'Dimension Mismatch',
    dateFound: '2024-08-12',
    status: 'Hold',
    inspector: 'Mike Wilson'
  },
  {
    id: 'RC-2024-004',
    description: 'Cylinder Head - 4 Cylinder',
    quantity: 6,
    defectType: 'Surface Defects',
    dateFound: '2024-08-12',
    status: 'Scrap',
    inspector: 'Emily Davis'
  },
  {
    id: 'RC-2024-005',
    description: 'Manifold Casting',
    quantity: 20,
    defectType: 'Material Issues',
    dateFound: '2024-08-11',
    status: 'Hold',
    inspector: 'David Brown'
  }
];

const generateKPIData = (): KPIData => ({
  rejectionRate: Math.random() * 3 + 4, // 4-7%
  scrapQuantity: Math.floor(Math.random() * 50) + 100,
  scrapValue: Math.floor(Math.random() * 5000) + 15000,
  qcHoldItems: Math.floor(Math.random() * 10) + 25,
  totalInspected: Math.floor(Math.random() * 100) + 1200,
  passedItems: Math.floor(Math.random() * 50) + 1100
});

// Utility functions
const getRejectionRateColor = (rate: number): string => {
  if (rate <= 3) return 'text-green-600 bg-green-50';
  if (rate <= 5) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Hold': return 'bg-yellow-100 text-yellow-800';
    case 'Rework': return 'bg-blue-100 text-blue-800';
    case 'Scrap': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function QcDashboard() {
  // State management
  const [kpiData, setKpiData] = useState<KPIData>(generateKPIData());
  const [defectData, setDefectData] = useState<DefectData[]>(generateDefectData());
  const [trendData, setTrendData] = useState<TrendData[]>(generateTrendData());
  const [qcHoldData, setQcHoldData] = useState<QcHoldItem[]>(generateQcHoldData());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof QcHoldItem>('dateFound');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isChartsCollapsed, setIsChartsCollapsed] = useState(false);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setKpiData(generateKPIData());
      setCurrentTime(new Date());
      
      // Occasionally update other data
      if (Math.random() < 0.3) {
        setDefectData(generateDefectData());
      }
      if (Math.random() < 0.2) {
        setTrendData(generateTrendData());
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Update clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // Table filtering and sorting
  const filteredAndSortedData = qcHoldData
    .filter(item => 
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.defectType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspector.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * direction;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * direction;
      }
      return 0;
    });

  const handleSort = (field: keyof QcHoldItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const refreshData = () => {
    setKpiData(generateKPIData());
    setDefectData(generateDefectData());
    setTrendData(generateTrendData());
    setQcHoldData(generateQcHoldData());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <TooltipProvider>
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Rough Casting QC Dashboard
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>{currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">
                    {currentTime.toLocaleTimeString('en-US', { 
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={refreshData} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh dashboard data</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                        QC
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">QC Manager</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <Separator className="my-1" />
                  <DropdownMenuItem className="gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Rejection Rate */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Rejection Rate
                </CardTitle>
                <div className={`p-2 rounded-xl ${getRejectionRateColor(kpiData.rejectionRate)}`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">
                    {kpiData.rejectionRate.toFixed(1)}%
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      {kpiData.rejectionRate <= 5 ? (
                        <TrendingDown className="h-4 w-4 text-green-600 mb-1" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-600 mb-1" />
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      Target: ≤ 5.0% | Current trend: {kpiData.rejectionRate <= 5 ? 'Improving' : 'Concerning'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-gray-500">
                  Target: 5.0% | Inspected: {kpiData.totalInspected.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Scrap Quantity & Value */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Scrap Quantity & Value
                </CardTitle>
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <XCircle className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">
                    {kpiData.scrapQuantity}
                  </span>
                  <span className="text-sm text-gray-500 mb-1">units</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold text-gray-800">
                    {formatCurrency(kpiData.scrapValue)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Avg. value per unit: {formatCurrency(kpiData.scrapValue / kpiData.scrapQuantity)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* QC Hold Items */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  QC Hold Items
                </CardTitle>
                <div className="p-2 rounded-xl bg-yellow-50 text-yellow-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">
                    {kpiData.qcHoldItems}
                  </span>
                  <span className="text-sm text-gray-500 mb-1">items</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Pending Review
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  Awaiting disposition decisions
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Passed Items */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Passed Items
                </CardTitle>
                <div className="p-2 rounded-xl bg-green-50 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-gray-900">
                    {kpiData.passedItems}
                  </span>
                  <span className="text-sm text-gray-500 mb-1">units</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-semibold text-green-600">
                    {((kpiData.passedItems / kpiData.totalInspected) * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500">pass rate</span>
                </div>
                <p className="text-xs text-gray-500">
                  Quality standard maintained
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Collapsible open={!isChartsCollapsed} onOpenChange={(open) => setIsChartsCollapsed(!open)}>
          <div className="mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="gap-2 text-lg font-semibold">
                <TrendingUp className="h-5 w-5" />
                Analytics & Trends
                {isChartsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
              {/* Defect Types Chart */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Defect Distribution
                  </CardTitle>
                  <CardDescription>
                    Current defect types and their frequency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pie Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={defectData}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ percentage }) => `${percentage}%`}
                            labelLine={false}
                          >
                            {defectData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value, name) => [
                              `${value} units (${defectData.find(d => d.type === name)?.percentage}%)`,
                              name
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2">
                      {defectData.map((defect) => (
                        <div key={defect.type} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: defect.color }}
                            />
                            <span className="font-medium">{defect.type}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{defect.count}</span>
                            <span className="text-gray-500 ml-1">({defect.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Rejection Rate Trend
                  </CardTitle>
                  <CardDescription>
                    30-day rejection rate history vs target
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Rejection Rate (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <RechartsTooltip 
                          labelFormatter={(date) => formatDate(date)}
                          formatter={(value, name) => [
                            `${Number(value).toFixed(1)}%`,
                            name === 'rejectionRate' ? 'Rejection Rate' : 'Target'
                          ]}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rejectionRate" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="target" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* QC Hold Table */}
        <Collapsible open={!isTableCollapsed} onOpenChange={(open) => setIsTableCollapsed(!open)}>
          <div className="mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="gap-2 text-lg font-semibold">
                <Eye className="h-5 w-5" />
                QC Hold Items ({filteredAndSortedData.length})
                {isTableCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <CardTitle className="text-lg font-semibold">QC Hold Items</CardTitle>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                        aria-label="Search QC hold items"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filter</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('id')}
                        >
                          <div className="flex items-center gap-2">
                            Item ID
                            {sortField === 'id' && (
                              sortDirection === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('description')}
                        >
                          <div className="flex items-center gap-2">
                            Description
                            {sortField === 'description' && (
                              sortDirection === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('quantity')}
                        >
                          <div className="flex items-center gap-2">
                            Quantity
                            {sortField === 'quantity' && (
                              sortDirection === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('defectType')}
                        >
                          <div className="flex items-center gap-2">
                            Defect Type
                            {sortField === 'defectType' && (
                              sortDirection === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('dateFound')}
                        >
                          <div className="flex items-center gap-2">
                            Date Found
                            {sortField === 'dateFound' && (
                              sortDirection === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleSort('inspector')}
                        >
                          <div className="flex items-center gap-2">
                            Inspector
                            {sortField === 'inspector' && (
                              sortDirection === 'asc' ? 
                                <ChevronUp className="h-4 w-4" /> : 
                                <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No items match your search criteria' : 'No QC hold items found'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedData.map((item) => (
                          <TableRow 
                            key={item.id} 
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              {item.id}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={item.description}>
                                {item.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">
                                {item.quantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: defectColors[item.defectType as keyof typeof defectColors] || '#6b7280' }}
                                />
                                <span>{item.defectType}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(item.dateFound)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={`${getStatusColor(item.status)} border-0`}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {item.inspector}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </TooltipProvider>
    </div>
  );
}
