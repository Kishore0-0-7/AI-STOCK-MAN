import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PurchaseOrder } from "@/services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  Calendar,
  User
} from "lucide-react";

// Mock data
const mockPurchaseOrders = [
  {
    id: "PO-001",
    supplier: "Tech Distributors",
    date: "2024-01-15",
    items: [
      { name: "NVIDIA GTX 1660 Super", quantity: 5, price: 17000 },
      { name: "Corsair 650W PSU", quantity: 3, price: 4800 }
    ],
    totalAmount: 99400,
    status: "Pending",
    deliveryDate: "2024-01-22"
  },
  {
    id: "PO-002", 
    supplier: "Power Solutions",
    date: "2024-01-18",
    items: [
      { name: "UPS 1KVA", quantity: 2, price: 3500 }
    ],
    totalAmount: 7000,
    status: "Ordered",
    deliveryDate: "2024-01-25"
  },
  {
    id: "PO-003",
    supplier: "Storage House", 
    date: "2024-01-20",
    items: [
      { name: "1TB Seagate HDD", quantity: 10, price: 2900 },
      { name: "256GB SSD", quantity: 5, price: 2200 }
    ],
    totalAmount: 40000,
    status: "Received",
    deliveryDate: "2024-01-27"
  }
];

const mockProducts = [
  { id: "P001", name: "NVIDIA GTX 1660 Super", category: "Graphics Card", currentStock: 10, lowStock: 3, supplier: "Tech Distributors" },
  { id: "P002", name: "Corsair 650W PSU", category: "Power Supply", currentStock: 2, lowStock: 5, supplier: "Power Solutions" },
  { id: "P003", name: "1TB Seagate HDD", category: "Storage", currentStock: 5, lowStock: 8, supplier: "Storage House" },
  { id: "P004", name: "ASUS B450 Motherboard", category: "Motherboard", currentStock: 3, lowStock: 4, supplier: "Motherboard Mart" }
];

const suppliers = ["Tech Distributors", "Power Solutions", "Storage House", "Motherboard Mart", "Cooler World"];

export default function PurchaseOrders() {
  const [purchaseOrders, setPurchaseOrders] = useState(mockPurchaseOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [newPO, setNewPO] = useState({
    supplier: "",
    items: [{ productId: "", quantity: 0, price: 0 }],
    deliveryDate: ""
  });

  // Fetch real low stock count from API
  useEffect(() => {
    fetch('http://localhost:4000/api/alerts/low-stock')
      .then(res => res.json())
      .then(data => {
        setLowStockCount(data.length);
      })
      .catch(err => {
        console.error('Failed to fetch low stock alerts:', err);
        setLowStockCount(0);
      });
  }, []);

  const lowStockProducts = mockProducts.filter(p => p.currentStock <= p.lowStock);

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      "Pending": "default",
      "Ordered": "secondary", 
      "Received": "outline"
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || "default"}>{status}</Badge>;
  };

  const handleCreatePO = () => {
    const totalAmount = newPO.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const newOrder = {
      id: `PO-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      supplier: newPO.supplier,
      date: new Date().toISOString().split('T')[0],
      items: newPO.items.map(item => ({
        name: mockProducts.find(p => p.id === item.productId)?.name || "Unknown Product",
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount,
      status: "Pending",
      deliveryDate: newPO.deliveryDate
    };
    
    setPurchaseOrders([...purchaseOrders, newOrder]);
    setIsCreateDialogOpen(false);
    setNewPO({ supplier: "", items: [{ productId: "", quantity: 0, price: 0 }], deliveryDate: "" });
  };

  const addItemToNewPO = () => {
    setNewPO({
      ...newPO,
      items: [...newPO.items, { productId: "", quantity: 0, price: 0 }]
    });
  };

  const updatePOItem = (index: number, field: string, value: string | number) => {
    const updatedItems = [...newPO.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewPO({ ...newPO, items: updatedItems });
  };

  const exportToPDF = (order: PurchaseOrder) => {
    // In a real app, this would generate and download a PDF
    console.log("Exporting PO to PDF:", order.id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage supplier orders and inventory restocking</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="action" size="lg">
              <Plus className="h-4 w-4" />
              Create PO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Supplier</label>
                  <Select value={newPO.supplier} onValueChange={(value) => setNewPO({...newPO, supplier: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Delivery Date</label>
                  <Input
                    type="date"
                    value={newPO.deliveryDate}
                    onChange={(e) => setNewPO({...newPO, deliveryDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Items</label>
                  <Button variant="outline" size="sm" onClick={addItemToNewPO}>
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                {newPO.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <Select value={item.productId} onValueChange={(value) => updatePOItem(index, 'productId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity || ""}
                      onChange={(e) => updatePOItem(index, 'quantity', Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.price || ""}
                      onChange={(e) => updatePOItem(index, 'price', Number(e.target.value))}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const filteredItems = newPO.items.filter((_, i) => i !== index);
                        setNewPO({...newPO, items: filteredItems});
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="default" className="flex-1" onClick={handleCreatePO}>
                  Create PO
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total POs</p>
              <p className="text-xl font-bold">{purchaseOrders.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-warning rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-xl font-bold text-warning">{lowStockCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-success rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
              <p className="text-xl font-bold">{purchaseOrders.filter(po => po.status === "Pending").length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-accent rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-xl font-bold">₹{purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="p-4 border-warning shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-semibold text-warning">Auto-Suggested Items (Low Stock)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map(product => (
              <Badge key={product.id} variant="outline" className="border-warning text-warning">
                {product.name} (Stock: {product.currentStock}, Need: {product.lowStock - product.currentStock + 2})
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search purchase orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Ordered">Ordered</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Purchase Orders Table */}
      <Card className="shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map(order => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.supplier}</TableCell>
                <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-sm">
                        {item.name} ({item.quantity} pcs)
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-medium">₹{order.totalAmount.toLocaleString()}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{new Date(order.deliveryDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => exportToPDF(order)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}