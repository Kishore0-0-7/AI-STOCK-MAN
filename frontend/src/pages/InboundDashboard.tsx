import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  FileText
} from 'lucide-react';

// Types
interface InboundMetrics {
  totalReceivedToday: number;
  totalReceivedMonth: number;
  todayGrowth: number;
  monthGrowth: number;
}

interface SupplierData {
  name: string;
  quantity: number;
  value: number;
  color: string;
}

interface PendingShipment {
  id: string;
  poNumber: string;
  supplier: string;
  expectedDate: string;
  quantity: number;
  status: 'In Transit' | 'Delayed' | 'Confirmed' | 'Processing';
  priority: 'High' | 'Medium' | 'Low';
}

interface QualityStatus {
  status: 'Pass' | 'Fail' | 'Hold' | 'Pending';
  quantity: number;
  percentage: number;
  color: string;
}

const InboundDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<InboundMetrics>({
    totalReceivedToday: 0,
    totalReceivedMonth: 0,
    todayGrowth: 0,
    monthGrowth: 0
  });
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
  const [pendingShipments, setPendingShipments] = useState<PendingShipment[]>([]);
  const [qualityStatus, setQualityStatus] = useState<QualityStatus[]>([]);

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Load sample data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sample metrics
      setMetrics({
        totalReceivedToday: 1247,
        totalReceivedMonth: 28943,
        todayGrowth: 12.5,
        monthGrowth: 8.3
      });

      // Sample supplier data
      setSupplierData([
        { name: 'MetalCorp Industries', quantity: 450, value: 125000, color: COLORS[0] },
        { name: 'SteelWorks Ltd', quantity: 320, value: 89000, color: COLORS[1] },
        { name: 'Iron Foundry Co', quantity: 280, value: 76000, color: COLORS[2] },
        { name: 'Allied Materials', quantity: 197, value: 54000, color: COLORS[3] },
        { name: 'Prime Suppliers', quantity: 156, value: 42000, color: COLORS[4] },
        { name: 'Others', quantity: 234, value: 67000, color: COLORS[5] }
      ]);

      // Sample pending shipments
      setPendingShipments([
        {
          id: 'PO-2025-001',
          poNumber: 'PO-2025-001',
          supplier: 'MetalCorp Industries',
          expectedDate: '2025-08-15',
          quantity: 500,
          status: 'In Transit',
          priority: 'High'
        },
        {
          id: 'PO-2025-002',
          poNumber: 'PO-2025-002',
          supplier: 'SteelWorks Ltd',
          expectedDate: '2025-08-16',
          quantity: 300,
          status: 'Confirmed',
          priority: 'Medium'
        },
        {
          id: 'PO-2025-003',
          poNumber: 'PO-2025-003',
          supplier: 'Iron Foundry Co',
          expectedDate: '2025-08-14',
          quantity: 200,
          status: 'Delayed',
          priority: 'High'
        },
        {
          id: 'PO-2025-004',
          poNumber: 'PO-2025-004',
          supplier: 'Allied Materials',
          expectedDate: '2025-08-18',
          quantity: 150,
          status: 'Processing',
          priority: 'Low'
        },
        {
          id: 'PO-2025-005',
          poNumber: 'PO-2025-005',
          supplier: 'Prime Suppliers',
          expectedDate: '2025-08-17',
          quantity: 250,
          status: 'Confirmed',
          priority: 'Medium'
        }
      ]);

      // Sample quality check data
      setQualityStatus([
        { status: 'Pass', quantity: 1089, percentage: 87.3, color: '#10b981' },
        { status: 'Hold', quantity: 98, percentage: 7.9, color: '#f59e0b' },
        { status: 'Fail', quantity: 45, percentage: 3.6, color: '#ef4444' },
        { status: 'Pending', quantity: 15, percentage: 1.2, color: '#6b7280' }
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  // Utility functions
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Delayed': return 'bg-red-100 text-red-800 border-red-200';
      case 'Processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dateString: string) => {
    const expectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expectedDate < today;
  };

  // Loading Skeleton Component
  const MetricsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      {[1, 2].map((i) => (
        <Card key={i} className="rounded-xl shadow-md">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const ChartSkeleton = () => (
    <Card className="rounded-xl shadow-md">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );

  const ListSkeleton = () => (
    <Card className="rounded-xl shadow-md">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-3 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-7xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-gray-900">Inbound Dashboard</h1>
            <p className="text-sm lg:text-base text-gray-600">Material receiving and quality control</p>
          </div>
        </div>

        <MetricsSkeleton />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <ListSkeleton />
          <ListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Package className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900">Inbound Dashboard</h1>
          <p className="text-sm lg:text-base text-gray-600">Material receiving and quality control</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* Today's Received */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm lg:text-base font-medium text-gray-600">
              <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
              Total Received Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatNumber(metrics.totalReceivedToday)}
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  +{metrics.todayGrowth}% vs yesterday
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Month's Received */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm lg:text-base font-medium text-gray-600">
              <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
              Total Received This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatNumber(metrics.totalReceivedMonth)}
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  +{metrics.monthGrowth}% vs last month
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Inbound by Supplier - Bar Chart */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <Users className="h-5 w-5 text-blue-600" />
              Inbound by Supplier
            </CardTitle>
            <CardDescription>Quantity received by supplier this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierData} margin={{ top: 5, right: 10, left: 10, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip 
                    formatter={(value: number, name: string) => [
                      formatNumber(value), 
                      name === 'quantity' ? 'Quantity' : name
                    ]}
                    labelFormatter={(label) => `Supplier: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="quantity" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    name="Quantity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quality Check Status - Pie Chart */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Quality Check Status
            </CardTitle>
            <CardDescription>Current quality inspection results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) => `${status}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantity"
                  >
                    {qualityStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [formatNumber(value), 'Quantity']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Pending Inbound Shipments */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <Truck className="h-5 w-5 text-orange-600" />
              Pending Inbound Shipments
            </CardTitle>
            <CardDescription>Purchase orders awaiting receipt ({pendingShipments.length} items)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingShipments.map((shipment) => (
                <div 
                  key={shipment.id} 
                  className="p-3 lg:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm lg:text-base">{shipment.poNumber}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(shipment.priority)}>
                        {shipment.priority}
                      </Badge>
                      <Badge className={getStatusColor(shipment.status)}>
                        {shipment.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs lg:text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Supplier: {shipment.supplier}</span>
                      <span>Qty: {formatNumber(shipment.quantity)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className={isOverdue(shipment.expectedDate) ? 'text-red-600 font-medium' : ''}>
                        Expected: {new Date(shipment.expectedDate).toLocaleDateString('en-IN')}
                      </span>
                      {isOverdue(shipment.expectedDate) && (
                        <AlertCircle className="h-3 w-3 text-red-600 ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quality Status Detail */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Quality Check Details
            </CardTitle>
            <CardDescription>Detailed breakdown of inspection results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityStatus.map((status, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="font-medium text-sm lg:text-base">{status.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm lg:text-base">
                        {formatNumber(status.quantity)}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({status.percentage}%)
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={status.percentage} 
                    className="h-2"
                    style={{
                      '--progress-color': status.color
                    } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="mt-6 pt-4 border-t bg-gray-50 rounded-lg p-3">
              <div className="text-center">
                <div className="text-lg lg:text-xl font-bold text-gray-900">
                  {formatNumber(qualityStatus.reduce((sum, status) => sum + status.quantity, 0))}
                </div>
                <div className="text-xs lg:text-sm text-gray-600">Total Items Inspected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InboundDashboard;
