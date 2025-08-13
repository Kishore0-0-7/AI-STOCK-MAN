import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import {
  AlertTriangle, TrendingUp, IndianRupee,
  ShieldAlert, Search, RefreshCw, 
  Package, CheckCircle2, XCircle, Loader2
} from 'lucide-react';

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
  status: 'Hold' | 'Rework' | 'Scrap' | 'Released';
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
  { type: 'Cracks', count: 45 },
  { type: 'Porosity', count: 38 },
  { type: 'Dimension Mismatch', count: 25 },
  { type: 'Surface Defects', count: 18 },
  { type: 'Material Issues', count: 8 },
];

const generateMockTrend = (): TrendData[] => {
  const data: TrendData[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      rejectionRate: Math.random() * 8 + 2,
    });
  }
  return data;
};

const generateMockHoldItems = (): QCHoldItem[] => [
  {
    id: '1',
    itemCode: 'RC-2024-001',
    description: 'Engine Block Casting - V6',
    quantity: 12,
    status: 'Hold',
    date: '2024-08-13',
  },
  {
    id: '2',
    itemCode: 'RC-2024-002',
    description: 'Transmission Housing',
    quantity: 8,
    status: 'Rework',
    date: '2024-08-13',
  },
  {
    id: '3',
    itemCode: 'RC-2024-003',
    description: 'Brake Caliper Casting',
    quantity: 15,
    status: 'Hold',
    date: '2024-08-12',
  },
  {
    id: '4',
    itemCode: 'RC-2024-004',
    description: 'Cylinder Head - 4 Cylinder',
    quantity: 6,
    status: 'Scrap',
    date: '2024-08-12',
  },
  {
    id: '5',
    itemCode: 'RC-2024-005',
    description: 'Manifold Casting',
    quantity: 20,
    status: 'Released',
    date: '2024-08-11',
  },
];

// Utility functions
const getRejectionRateColor = (rate: number): string => {
  if (rate < 5) return 'text-green-600 bg-green-50';
  if (rate <= 10) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Hold': return 'bg-yellow-100 text-yellow-800';
    case 'Rework': return 'bg-blue-100 text-blue-800';
    case 'Scrap': return 'bg-red-100 text-red-800';
    case 'Released': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export default function QcDashboard() {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDefectType, setSelectedDefectType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data fetching
  const fetchData = async () => {
    setLoading({ metrics: true, defects: true, trends: true, holdItems: true });
    
    try {
      // Try to fetch from API, fallback to mock data
      const [metricsData, defectsData, trendsData, holdItemsData] = await Promise.allSettled([
        apiCall('/qc/metrics').catch(() => generateMockMetrics()),
        apiCall('/qc/defects').catch(() => generateMockDefects()),
        apiCall('/qc/rejection-trend').catch(() => generateMockTrend()),
        apiCall('/qc/hold-items').catch(() => generateMockHoldItems()),
      ]);

      setMetrics(metricsData.status === 'fulfilled' ? metricsData.value : generateMockMetrics());
      setDefects(defectsData.status === 'fulfilled' ? defectsData.value : generateMockDefects());
      setTrends(trendsData.status === 'fulfilled' ? trendsData.value : generateMockTrend());
      setHoldItems(holdItemsData.status === 'fulfilled' ? holdItemsData.value : generateMockHoldItems());
      
      setLoading({ metrics: false, defects: false, trends: false, holdItems: false });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Use mock data as fallback
      setMetrics(generateMockMetrics());
      setDefects(generateMockDefects());
      setTrends(generateMockTrend());
      setHoldItems(generateMockHoldItems());
      setLoading({ metrics: false, defects: false, trends: false, holdItems: false });
    }
  };

  // Filter hold items
  useEffect(() => {
    let filtered = holdItems.filter(item => 
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedDefectType !== 'all') {
      // This would need to be matched with defect data in a real implementation
      filtered = filtered.filter(item => 
        item.status.toLowerCase() === selectedDefectType.toLowerCase()
      );
    }

    if (startDate && endDate) {
      filtered = filtered.filter(item => {
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
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <TooltipProvider>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quality Control Dashboard</h1>
              <p className="text-sm text-gray-600">Rough Casting Warehouse System</p>
            </div>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rejection Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Rejection Rate
                <AlertTriangle className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.metrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="space-y-1">
                  <div className={`text-2xl font-bold p-2 rounded ${getRejectionRateColor(metrics?.rejectionRate || 0)}`}>
                    {metrics?.rejectionRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500">
                    Target: &lt;5%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total QC Inspections */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Total QC Inspections
                <CheckCircle2 className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.metrics ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics?.totalInspections.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scrap Quantity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Scrap Quantity
                <XCircle className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.metrics ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">
                    {metrics?.scrapQuantity.toLocaleString('en-IN')}
                  </div>
                  <p className="text-xs text-gray-500">units</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scrap Value */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center justify-between">
                Scrap Value
                <IndianRupee className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading.metrics ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(metrics?.scrapValue || 0)}
                  </div>
                  <p className="text-xs text-gray-500">
                    ₹{((metrics?.scrapValue || 0) / (metrics?.scrapQuantity || 1)).toLocaleString('en-IN')} per unit
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status Filter</label>
                <Select value={selectedDefectType} onValueChange={setSelectedDefectType}>
                  <SelectTrigger>
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
                <Button onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedDefectType('all');
                  setSearchTerm('');
                }} variant="outline" className="w-full">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Defect Types Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Defect Types Breakdown
              </CardTitle>
              <CardDescription>Current defect types and occurrence count</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.defects ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : defects.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No Data Available
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={defects}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="type" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rejection Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Rejection Rate Trend
              </CardTitle>
              <CardDescription>30-day rejection rate history</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.trends ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : trends.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No Data Available
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <RechartsTooltip 
                        labelFormatter={(date) => formatDate(date)}
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Rejection Rate']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rejectionRate" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* QC Hold Items Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                QC Hold Items ({filteredItems.length})
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading.holdItems ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          {searchTerm || selectedDefectType !== 'all' || startDate || endDate
                            ? 'No items match your filters'
                            : 'No QC hold items found'
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{item.itemCode}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={item.description}>
                              {item.description}
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(item.status)} border-0`}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(item.date)}</TableCell>
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
