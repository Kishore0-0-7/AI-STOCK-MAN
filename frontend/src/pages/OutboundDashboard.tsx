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
  Clock,
  Calendar,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  FileText
} from 'lucide-react';

// Types
interface OutboundMetrics {
  totalDispatchedToday: number;
  totalDispatchedMonth: number;
  todayGrowth: number;
  monthGrowth: number;
  onTimeRate: number;
}

interface CustomerDispatch {
  name: string;
  quantity: number;
  value: number;
  color: string;
  type: 'Customer' | 'Work Order';
}

interface PendingOrder {
  id: string;
  orderNumber: string;
  customer: string;
  dueDate: string;
  quantity: number;
  status: 'Ready' | 'Processing' | 'Delayed' | 'Quality Check';
  priority: 'High' | 'Medium' | 'Low';
  orderType: 'Customer Order' | 'Work Order' | 'Transfer Order';
}

interface OnTimeMetrics {
  period: string;
  onTime: number;
  delayed: number;
  rate: number;
}

const OutboundDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<OutboundMetrics>({
    totalDispatchedToday: 0,
    totalDispatchedMonth: 0,
    todayGrowth: 0,
    monthGrowth: 0,
    onTimeRate: 0
  });
  const [customerData, setCustomerData] = useState<CustomerDispatch[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [onTimeData, setOnTimeData] = useState<OnTimeMetrics[]>([]);

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
        totalDispatchedToday: 892,
        totalDispatchedMonth: 23456,
        todayGrowth: 15.2,
        monthGrowth: 11.7,
        onTimeRate: 92.3
      });

      // Sample customer/work order data
      setCustomerData([
        { name: 'Tata Motors', quantity: 320, value: 890000, color: COLORS[0], type: 'Customer' },
        { name: 'Bajaj Auto', quantity: 280, value: 720000, color: COLORS[1], type: 'Customer' },
        { name: 'WO-2025-045', quantity: 190, value: 580000, color: COLORS[2], type: 'Work Order' },
        { name: 'Mahindra & Mahindra', quantity: 145, value: 420000, color: COLORS[3], type: 'Customer' },
        { name: 'WO-2025-032', quantity: 120, value: 340000, color: COLORS[4], type: 'Work Order' },
        { name: 'Others', quantity: 89, value: 245000, color: COLORS[5], type: 'Customer' }
      ]);

      // Sample pending orders
      setPendingOrders([
        {
          id: 'SO-2025-156',
          orderNumber: 'SO-2025-156',
          customer: 'Hero MotoCorp',
          dueDate: '2025-08-15',
          quantity: 450,
          status: 'Ready',
          priority: 'High',
          orderType: 'Customer Order'
        },
        {
          id: 'WO-2025-078',
          orderNumber: 'WO-2025-078',
          customer: 'Internal Production',
          dueDate: '2025-08-16',
          quantity: 200,
          status: 'Processing',
          priority: 'Medium',
          orderType: 'Work Order'
        },
        {
          id: 'SO-2025-149',
          orderNumber: 'SO-2025-149',
          customer: 'TVS Motor Company',
          dueDate: '2025-08-14',
          quantity: 300,
          status: 'Delayed',
          priority: 'High',
          orderType: 'Customer Order'
        },
        {
          id: 'TO-2025-023',
          orderNumber: 'TO-2025-023',
          customer: 'Warehouse B Transfer',
          dueDate: '2025-08-17',
          quantity: 150,
          status: 'Quality Check',
          priority: 'Low',
          orderType: 'Transfer Order'
        },
        {
          id: 'SO-2025-161',
          orderNumber: 'SO-2025-161',
          customer: 'Royal Enfield',
          dueDate: '2025-08-18',
          quantity: 250,
          status: 'Ready',
          priority: 'Medium',
          orderType: 'Customer Order'
        },
        {
          id: 'WO-2025-081',
          orderNumber: 'WO-2025-081',
          customer: 'Assembly Line 3',
          dueDate: '2025-08-15',
          quantity: 180,
          status: 'Processing',
          priority: 'High',
          orderType: 'Work Order'
        }
      ]);

      // Sample on-time metrics
      setOnTimeData([
        { period: 'Week 1', onTime: 89, delayed: 11, rate: 89.0 },
        { period: 'Week 2', onTime: 94, delayed: 6, rate: 94.0 },
        { period: 'Week 3', onTime: 91, delayed: 9, rate: 91.0 },
        { period: 'Week 4', onTime: 93, delayed: 7, rate: 93.0 },
        { period: 'Current', onTime: 92, delayed: 8, rate: 92.3 }
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
      case 'Ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delayed': return 'bg-red-100 text-red-800 border-red-200';
      case 'Quality Check': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'Customer Order': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Work Order': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Transfer Order': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getDaysUntilDue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Loading Skeleton Components
  const MetricsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {[1, 2, 3].map((i) => (
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
          <div className="p-2 bg-green-100 rounded-lg">
            <Truck className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-gray-900">Outbound Dashboard</h1>
            <p className="text-sm lg:text-base text-gray-600">Material dispatch and delivery tracking</p>
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
        <div className="p-2 bg-green-100 rounded-lg">
          <Truck className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900">Outbound Dashboard</h1>
          <p className="text-sm lg:text-base text-gray-600">Material dispatch and delivery tracking</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Today's Dispatched */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm lg:text-base font-medium text-gray-600">
              <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
              Total Dispatched Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatNumber(metrics.totalDispatchedToday)}
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

        {/* Month's Dispatched */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm lg:text-base font-medium text-gray-600">
              <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
              Total Dispatched This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                {formatNumber(metrics.totalDispatchedMonth)}
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

        {/* On-Time Dispatch Rate */}
        <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm lg:text-base font-medium text-gray-600">
              <Target className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600" />
              On-Time Dispatch Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                {metrics.onTimeRate}%
              </div>
              <Progress 
                value={metrics.onTimeRate} 
                className="h-3"
              />
              <div className="text-xs text-gray-600">
                Target: 95% | Current: Excellent
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Dispatch by Customer/Work Order - Bar Chart */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <Users className="h-5 w-5 text-green-600" />
              Dispatch by Customer / Work Order
            </CardTitle>
            <CardDescription>Quantity dispatched by customer and work orders this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerData} margin={{ top: 5, right: 10, left: 10, bottom: 45 }}>
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
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="quantity" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    name="Quantity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* On-Time Rate Trend */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <Target className="h-5 w-5 text-purple-600" />
              On-Time Rate Trend
            </CardTitle>
            <CardDescription>Weekly on-time dispatch performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={onTimeData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip 
                    formatter={(value: number, name: string) => [
                      name === 'rate' ? `${value}%` : formatNumber(value), 
                      name === 'onTime' ? 'On Time' : name === 'delayed' ? 'Delayed' : 'Rate'
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="onTime" 
                    stackId="a" 
                    fill="#10b981" 
                    name="On Time"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar 
                    dataKey="delayed" 
                    stackId="a" 
                    fill="#ef4444" 
                    name="Delayed"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Pending Dispatch Orders */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <Package className="h-5 w-5 text-orange-600" />
              Pending Dispatch Orders
            </CardTitle>
            <CardDescription>Orders scheduled for dispatch ({pendingOrders.length} items)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingOrders.map((order) => {
                const daysUntilDue = getDaysUntilDue(order.dueDate);
                const isUrgent = daysUntilDue <= 1;
                
                return (
                  <div 
                    key={order.id} 
                    className={`p-3 lg:p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                      isUrgent ? 'border-red-300 bg-red-50' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm lg:text-base">{order.orderNumber}</span>
                        {isUrgent && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <Badge className={getOrderTypeColor(order.orderType)} variant="outline">
                        {order.orderType}
                      </Badge>
                    </div>
                    
                    <div className="text-xs lg:text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Customer: {order.customer}</span>
                        <span>Qty: {formatNumber(order.quantity)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className={isOverdue(order.dueDate) ? 'text-red-600 font-medium' : ''}>
                            Due: {new Date(order.dueDate).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          daysUntilDue < 0 ? 'bg-red-100 text-red-800' :
                          daysUntilDue === 0 ? 'bg-orange-100 text-orange-800' :
                          daysUntilDue === 1 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                           daysUntilDue === 0 ? 'Due today' :
                           daysUntilDue === 1 ? 'Due tomorrow' :
                           `${daysUntilDue} days left`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dispatch Performance Summary */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Dispatch Performance
            </CardTitle>
            <CardDescription>Weekly performance metrics and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Week Summary */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {metrics.onTimeRate}%
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Current On-Time Rate</div>
                  <Progress value={metrics.onTimeRate} className="h-2 mb-2" />
                  <div className="text-xs text-gray-500">
                    {metrics.onTimeRate >= 95 ? 'Excellent Performance' :
                     metrics.onTimeRate >= 90 ? 'Good Performance' :
                     metrics.onTimeRate >= 80 ? 'Needs Improvement' : 'Critical'}
                  </div>
                </div>
              </div>

              {/* Weekly Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Weekly Breakdown:</h4>
                {onTimeData.slice(0, 4).map((week, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium">{week.period}</div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{week.rate}%</div>
                      <div className="text-xs text-gray-600">
                        {week.onTime} on-time, {week.delayed} delayed
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {formatNumber(metrics.totalDispatchedToday)}
                  </div>
                  <div className="text-xs text-gray-600">Today's Dispatch</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {pendingOrders.filter(o => getDaysUntilDue(o.dueDate) <= 1).length}
                  </div>
                  <div className="text-xs text-gray-600">Urgent Orders</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OutboundDashboard;
