import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Cell
} from 'recharts';
import {
  PackageX,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Truck,
  Calendar,
  Clock,
  User,
  MapPin,
  Barcode,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  FileText,
  Target,
  TrendingDown,
  Package
} from 'lucide-react';

// Types
interface StockOutItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  quantityRequested: number;
  quantityAllocated: number;
  quantityDispatched: number;
  unit: string;
  status: 'pending' | 'allocated' | 'dispatched' | 'partially-dispatched' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestDate: string;
  requiredDate: string;
  dispatchDate?: string;
  destination: string;
  requestedBy: string;
  notes?: string;
  trackingNumber?: string;
  estimatedValue: number;
}

interface StockOutRequest {
  id: string;
  requestNumber: string;
  requestDate: string;
  requiredDate: string;
  requestedBy: string;
  department: string;
  destination: string;
  status: 'draft' | 'submitted' | 'approved' | 'processing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalItems: number;
  totalValue: number;
  items: StockOutItem[];
  approvedBy?: string;
  processedBy?: string;
  notes?: string;
}

interface StockOutMetrics {
  totalRequestsToday: number;
  totalItemsDispatched: number;
  totalValueDispatched: number;
  pendingRequests: number;
  completionRate: number;
  averageProcessingTime: number;
}

interface DashboardData {
  categoryBreakdown: { name: string; value: number; count: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  dispatchTrends: { date: string; dispatched: number; value: number }[];
  topDestinations: { name: string; count: number; value: number }[];
}

const StockOutManagement: React.FC = () => {
  // State management
  const [stockOutRequests, setStockOutRequests] = useState<StockOutRequest[]>([]);
  const [metrics, setMetrics] = useState<StockOutMetrics>({
    totalRequestsToday: 0,
    totalItemsDispatched: 0,
    totalValueDispatched: 0,
    pendingRequests: 0,
    completionRate: 0,
    averageProcessingTime: 0
  });
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    categoryBreakdown: [],
    statusDistribution: [],
    dispatchTrends: [],
    topDestinations: []
  });
  const [loading, setLoading] = useState({ requests: false, metrics: false, creating: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('requests');
  const [selectedRequest, setSelectedRequest] = useState<StockOutRequest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRequest, setNewRequest] = useState<Partial<StockOutRequest>>({
    requestedBy: '',
    department: '',
    destination: '',
    priority: 'medium',
    requiredDate: '',
    notes: '',
    items: []
  });

  const itemsPerPage = 10;
  const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Mock data generation
  const generateMockData = () => {
    setLoading(prev => ({ ...prev, requests: true, metrics: true }));
    
    setTimeout(() => {
      // Generate mock stock out requests
      const mockRequests: StockOutRequest[] = [
        {
          id: 'SOD-2025-001',
          requestNumber: 'SOD-2025-001',
          requestDate: '2025-08-13',
          requiredDate: '2025-08-15',
          requestedBy: 'John Doe',
          department: 'Production',
          destination: 'Factory Floor A',
          status: 'processing',
          priority: 'high',
          totalItems: 3,
          totalValue: 125000,
          approvedBy: 'Manager Smith',
          items: [
            {
              id: 'item-1',
              itemCode: 'STL-001',
              itemName: 'Steel Rod 12mm',
              category: 'Raw Materials',
              quantityRequested: 100,
              quantityAllocated: 100,
              quantityDispatched: 50,
              unit: 'pcs',
              status: 'partially-dispatched',
              priority: 'high',
              requestDate: '2025-08-13',
              requiredDate: '2025-08-15',
              destination: 'Factory Floor A',
              requestedBy: 'John Doe',
              estimatedValue: 50000,
              trackingNumber: 'TRK-001'
            },
            {
              id: 'item-2',
              itemCode: 'CEM-002',
              itemName: 'Cement Bag 50kg',
              category: 'Building Materials',
              quantityRequested: 50,
              quantityAllocated: 50,
              quantityDispatched: 0,
              unit: 'bags',
              status: 'allocated',
              priority: 'medium',
              requestDate: '2025-08-13',
              requiredDate: '2025-08-15',
              destination: 'Factory Floor A',
              requestedBy: 'John Doe',
              estimatedValue: 25000
            }
          ]
        },
        {
          id: 'SOD-2025-002',
          requestNumber: 'SOD-2025-002',
          requestDate: '2025-08-12',
          requiredDate: '2025-08-14',
          requestedBy: 'Jane Smith',
          department: 'Maintenance',
          destination: 'Warehouse B',
          status: 'completed',
          priority: 'medium',
          totalItems: 2,
          totalValue: 75000,
          approvedBy: 'Manager Brown',
          processedBy: 'Operator Wilson',
          items: [
            {
              id: 'item-3',
              itemCode: 'BLT-003',
              itemName: 'Bolt M12x50',
              category: 'Hardware',
              quantityRequested: 200,
              quantityAllocated: 200,
              quantityDispatched: 200,
              unit: 'pcs',
              status: 'dispatched',
              priority: 'medium',
              requestDate: '2025-08-12',
              requiredDate: '2025-08-14',
              dispatchDate: '2025-08-13',
              destination: 'Warehouse B',
              requestedBy: 'Jane Smith',
              estimatedValue: 40000,
              trackingNumber: 'TRK-002'
            }
          ]
        },
        {
          id: 'SOD-2025-003',
          requestNumber: 'SOD-2025-003',
          requestDate: '2025-08-13',
          requiredDate: '2025-08-16',
          requestedBy: 'Mike Johnson',
          department: 'Quality Control',
          destination: 'QC Lab',
          status: 'submitted',
          priority: 'urgent',
          totalItems: 1,
          totalValue: 15000,
          items: [
            {
              id: 'item-4',
              itemCode: 'TST-004',
              itemName: 'Testing Equipment',
              category: 'Equipment',
              quantityRequested: 1,
              quantityAllocated: 0,
              quantityDispatched: 0,
              unit: 'unit',
              status: 'pending',
              priority: 'urgent',
              requestDate: '2025-08-13',
              requiredDate: '2025-08-16',
              destination: 'QC Lab',
              requestedBy: 'Mike Johnson',
              estimatedValue: 15000
            }
          ]
        }
      ];

      setStockOutRequests(mockRequests);

      // Generate metrics
      const mockMetrics: StockOutMetrics = {
        totalRequestsToday: 5,
        totalItemsDispatched: 450,
        totalValueDispatched: 2850000,
        pendingRequests: 8,
        completionRate: 87.5,
        averageProcessingTime: 2.4
      };

      setMetrics(mockMetrics);

      // Generate dashboard data
      const mockDashboardData: DashboardData = {
        categoryBreakdown: [
          { name: 'Raw Materials', value: 1200000, count: 15 },
          { name: 'Building Materials', value: 800000, count: 12 },
          { name: 'Hardware', value: 450000, count: 8 },
          { name: 'Equipment', value: 300000, count: 5 },
          { name: 'Tools', value: 100000, count: 3 }
        ],
        statusDistribution: [
          { name: 'Completed', value: 45, color: '#10b981' },
          { name: 'Processing', value: 25, color: '#3b82f6' },
          { name: 'Pending', value: 20, color: '#f59e0b' },
          { name: 'Cancelled', value: 10, color: '#ef4444' }
        ],
        dispatchTrends: [
          { date: '2025-08-07', dispatched: 120, value: 480000 },
          { date: '2025-08-08', dispatched: 150, value: 520000 },
          { date: '2025-08-09', dispatched: 90, value: 380000 },
          { date: '2025-08-10', dispatched: 200, value: 650000 },
          { date: '2025-08-11', dispatched: 175, value: 590000 },
          { date: '2025-08-12', dispatched: 220, value: 720000 },
          { date: '2025-08-13', dispatched: 180, value: 610000 }
        ],
        topDestinations: [
          { name: 'Factory Floor A', count: 25, value: 850000 },
          { name: 'Warehouse B', count: 18, value: 620000 },
          { name: 'Production Line 1', count: 15, value: 480000 },
          { name: 'QC Lab', count: 12, value: 380000 },
          { name: 'Maintenance Shop', count: 10, value: 320000 }
        ]
      };

      setDashboardData(mockDashboardData);
      setLoading({ requests: false, metrics: false, creating: false });
    }, 1500);
  };

  // Load data on component mount
  useEffect(() => {
    generateMockData();
  }, []);

  // Filter requests
  const filteredRequests = stockOutRequests.filter(request => {
    const matchesSearch = request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'allocated': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dispatched': return 'bg-green-100 text-green-800 border-green-200';
      case 'partially-dispatched': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'dispatched': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
      case 'allocated': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
      case 'submitted': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Create new request
  const handleCreateRequest = () => {
    setLoading(prev => ({ ...prev, creating: true }));
    setTimeout(() => {
      const newRequestData: StockOutRequest = {
        id: `SOD-2025-${String(stockOutRequests.length + 1).padStart(3, '0')}`,
        requestNumber: `SOD-2025-${String(stockOutRequests.length + 1).padStart(3, '0')}`,
        requestDate: new Date().toISOString().split('T')[0],
        requiredDate: newRequest.requiredDate || '',
        requestedBy: newRequest.requestedBy || '',
        department: newRequest.department || '',
        destination: newRequest.destination || '',
        status: 'draft',
        priority: newRequest.priority || 'medium',
        totalItems: 0,
        totalValue: 0,
        items: [],
        notes: newRequest.notes
      };

      setStockOutRequests(prev => [newRequestData, ...prev]);
      setShowCreateDialog(false);
      setNewRequest({
        requestedBy: '',
        department: '',
        destination: '',
        priority: 'medium',
        requiredDate: '',
        notes: '',
        items: []
      });
      setLoading(prev => ({ ...prev, creating: false }));
    }, 1000);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <PackageX className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
            <span className="truncate">Stock Out Management</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Manage inventory dispatch and outbound logistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateMockData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Request</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Stock Out Request</DialogTitle>
                <DialogDescription>
                  Create a new request for inventory dispatch
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Requested By</Label>
                    <Input
                      value={newRequest.requestedBy || ''}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, requestedBy: e.target.value }))}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select 
                      value={newRequest.department || ''} 
                      onValueChange={(value) => setNewRequest(prev => ({ ...prev, department: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Quality Control">Quality Control</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Destination</Label>
                    <Input
                      value={newRequest.destination || ''}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, destination: e.target.value }))}
                      placeholder="e.g., Factory Floor A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select 
                      value={newRequest.priority || 'medium'} 
                      onValueChange={(value: any) => setNewRequest(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Required Date</Label>
                    <Input
                      type="date"
                      value={newRequest.requiredDate || ''}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, requiredDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newRequest.notes || ''}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or special instructions..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRequest} disabled={loading.creating}>
                  {loading.creating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Request'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="truncate">Today's Requests</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-blue-700">
                  {metrics.totalRequestsToday}
                </div>
                <p className="text-xs text-gray-500">requests</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              <span className="truncate">Items Dispatched</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-green-700">
                  {metrics.totalItemsDispatched.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">units</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="truncate">Value Dispatched</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="space-y-1">
                <div className="text-lg sm:text-2xl font-bold text-orange-700 truncate">
                  {formatCurrency(metrics.totalValueDispatched)}
                </div>
                <p className="text-xs text-gray-500">total value</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="truncate">Pending</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-yellow-700">
                  {metrics.pendingRequests}
                </div>
                <p className="text-xs text-gray-500">requests</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="truncate">Completion Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-purple-700">
                  {metrics.completionRate}%
                </div>
                <p className="text-xs text-gray-500">efficiency</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-600" />
              <span className="truncate">Avg Processing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-bold text-indigo-700">
                  {metrics.averageProcessingTime}h
                </div>
                <p className="text-xs text-gray-500">avg time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
          <TabsTrigger value="requests" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Requests</span>
            <span className="sm:hidden">Req</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            <BarChart className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="tracking" className="text-xs sm:text-sm">
            <MapPin className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Tracking</span>
            <span className="sm:hidden">Track</span>
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Filter Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                    }}
                    variant="outline" 
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Out Requests ({filteredRequests.length})</CardTitle>
              <CardDescription>Manage and track inventory dispatch requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading.requests ? (
                <div className="space-y-2 p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold text-xs sm:text-sm">Request #</TableHead>
                        <TableHead className="font-semibold text-xs sm:text-sm">Requested By</TableHead>
                        <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">Destination</TableHead>
                        <TableHead className="font-semibold text-center text-xs sm:text-sm">Items</TableHead>
                        <TableHead className="font-semibold text-center text-xs sm:text-sm hidden md:table-cell">Value</TableHead>
                        <TableHead className="font-semibold text-center text-xs sm:text-sm">Priority</TableHead>
                        <TableHead className="font-semibold text-center text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="font-semibold text-center text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            No stock out requests found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRequests.map((request) => (
                          <TableRow key={request.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-xs sm:text-sm">
                              <div>
                                <div>{request.requestNumber}</div>
                                <div className="text-xs text-gray-500">{formatDate(request.requestDate)}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <div>
                                <div className="font-medium">{request.requestedBy}</div>
                                <div className="text-xs text-gray-500">{request.department}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="truncate max-w-32">{request.destination}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs sm:text-sm font-semibold">
                              {request.totalItems}
                            </TableCell>
                            <TableCell className="text-center text-xs sm:text-sm font-semibold hidden md:table-cell">
                              {formatCurrency(request.totalValue)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={`${getPriorityColor(request.priority)} text-xs`}>
                                {request.priority}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={`${getStatusColor(request.status)} text-xs flex items-center gap-1 justify-center`}>
                                {getStatusIcon(request.status)}
                                <span className="hidden sm:inline">{request.status}</span>
                                <span className="sm:hidden">{request.status.slice(0, 3)}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedRequest(request)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t">
                  <p className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} results
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-600" />
                  Category Breakdown
                </CardTitle>
                <CardDescription>Dispatch value by item category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.categoryBreakdown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Value']}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Status Distribution
                </CardTitle>
                <CardDescription>Request status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => [`${value}%`, 'Percentage']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Dispatch Trends */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  Dispatch Trends (Last 7 Days)
                </CardTitle>
                <CardDescription>Daily dispatch volume and value trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.dispatchTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        labelFormatter={(value) => formatDate(value)}
                        formatter={(value: number, name: string) => [
                          name === 'value' ? formatCurrency(value) : value,
                          name === 'value' ? 'Value' : 'Items'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="dispatched" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="dispatched"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="value"
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Top Destinations
              </CardTitle>
              <CardDescription>Most frequent dispatch locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.topDestinations.map((destination, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{destination.name}</div>
                        <div className="text-sm text-gray-600">{destination.count} dispatches</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(destination.value)}</div>
                      <div className="text-sm text-gray-600">total value</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Request Details - {selectedRequest.requestNumber}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">Requested By</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{selectedRequest.requestedBy}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">Department</Label>
                  <span>{selectedRequest.department}</span>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">Destination</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{selectedRequest.destination}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">Request Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(selectedRequest.requestDate)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">Required Date</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{formatDate(selectedRequest.requiredDate)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Items Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Requested Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="text-center">Requested</TableHead>
                        <TableHead className="text-center">Allocated</TableHead>
                        <TableHead className="text-center">Dispatched</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequest.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.itemCode}</TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell className="text-center">{item.quantityRequested} {item.unit}</TableCell>
                          <TableCell className="text-center">{item.quantityAllocated} {item.unit}</TableCell>
                          <TableCell className="text-center">{item.quantityDispatched} {item.unit}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedRequest.notes && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Notes</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                      {selectedRequest.notes}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StockOutManagement;
