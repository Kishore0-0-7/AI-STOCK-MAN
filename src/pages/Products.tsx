import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  ScanLine,
  Upload,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { productsAPI, suppliersAPI, Product, Supplier } from "@/services/api";

// CSV export helper
function exportProductsToCSV(products: Product[]) {
  const headers = [
    "ID",
    "Name",
    "Category",
    "Current Stock",
    "Unit",
    "Price",
    "Low Stock Threshold",
    "Supplier",
    "Stock Status",
    "QR Code"
  ];
  const rows = products.map(p => [
    p.id,
    p.name,
    p.category,
    p.current_stock,
    'unit', // Add unit field to Product interface if needed
    p.price,
    p.low_stock_threshold,
    'supplier.name', // Update based on actual supplier data structure
    'stock_status', // Add stock_status calculation if needed
    p.barcode || ''
  ]);
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});
  const [lowStockCount, setLowStockCount] = useState(0);
  const { toast } = useToast();

  // Fetch products and suppliers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, suppliersData] = await Promise.all([
          productsAPI.getAll(),
          suppliersAPI.getAll()
        ]);
        setProducts(productsData);
        setSuppliers(suppliersData);
        
        // Fetch real low stock count
        fetch('http://localhost:4000/api/alerts/low-stock')
          .then(res => res.json())
          .then(data => {
            setLowStockCount(data.length);
          })
          .catch(err => {
            console.error('Failed to fetch low stock alerts:', err);
            setLowStockCount(0);
          });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handlers for CRUD
  const handleAddProduct = async () => {
    if (!form.name || !form.category || !form.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const newProduct = await productsAPI.create({
        name: form.name,
        category: form.category,
        price: parseFloat(form.price),
        currentStock: parseInt(form.currentStock) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
        maxStockLevel: parseInt(form.maxStockLevel) || 1000,
        reorderPoint: parseInt(form.reorderPoint) || 0,
        unit: form.unit || 'piece',
        qrCode: form.qrCode || null,
        supplierId: form.supplierId || null,
      });

      // Refresh products list
      const updatedProducts = await productsAPI.getAll();
      setProducts(updatedProducts);
      
      setIsAddDialogOpen(false);
      setForm({});
      
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to add product: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = async () => {
    if (!form.name || !form.category || !form.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await productsAPI.update(editProduct.id, {
        name: form.name,
        category: form.category,
        price: parseFloat(form.price),
        currentStock: parseInt(form.currentStock),
        lowStockThreshold: parseInt(form.lowStockThreshold),
        maxStockLevel: parseInt(form.maxStockLevel),
        reorderPoint: parseInt(form.reorderPoint),
        unit: form.unit,
        qrCode: form.qrCode,
        supplierId: form.supplierId,
      });

      // Refresh products list
      const updatedProducts = await productsAPI.getAll();
      setProducts(updatedProducts);
      
      setIsEditDialogOpen(false);
      setEditProduct(null);
      setForm({});
      
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to update product: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async () => {
    try {
      await productsAPI.delete(deleteProduct.id);
      
      // Refresh products list
      const updatedProducts = await productsAPI.getAll();
      setProducts(updatedProducts);
      
      setIsDeleteDialogOpen(false);
      setDeleteProduct(null);
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to delete product: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      currentStock: product.currentStock,
      lowStockThreshold: product.lowStockThreshold,
      maxStockLevel: product.maxStockLevel,
      reorderPoint: product.reorderPoint,
      unit: product.unit,
      qrCode: product.qrCode,
      supplierId: product.supplier.id,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setDeleteProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toString().includes(searchTerm.toLowerCase()) ||
                         product.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.qrCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatusBadge = (product: Product) => {
    const currentStock = product.current_stock || product.currentStock || 0;
    const threshold = product.low_stock_threshold || product.lowStockThreshold || 0;
    
    if (currentStock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (currentStock <= threshold) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else if (currentStock <= threshold * 1.5) {
      return <Badge variant="outline">Low</Badge>;
    } else if (currentStock >= threshold * 3) {
      return <Badge variant="default">High</Badge>;
    } else {
      return <Badge variant="outline">Normal</Badge>;
    }
  };

  const lowStockProducts = products.filter(p => p.currentStock <= p.lowStockThreshold);

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="p-4 shadow-soft hover:shadow-primary transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-muted-foreground">ID: {product.id}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {product.category}
                </Badge>
                {getStockStatusBadge(product)}
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(product)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Stock:</span>
              <span className={`ml-2 font-medium ${
                (product.current_stock || product.currentStock || 0) <= (product.low_stock_threshold || product.lowStockThreshold || 0) ? 'text-destructive' : 'text-success'
              }`}>
                {product.current_stock || product.currentStock || 0} {product.unit || 'units'}
                {((product.current_stock || product.currentStock || 0) <= (product.low_stock_threshold || product.lowStockThreshold || 0)) && (
                  <AlertTriangle className="inline h-4 w-4 ml-1" />
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Price:</span>
              <span className="ml-2 font-medium">${product.price}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Supplier:</span>
              <span className="ml-2 font-medium">{product.supplier?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Threshold:</span>
              <span className="ml-2 font-medium">{product.low_stock_threshold || product.lowStockThreshold || 0}</span>
            </div>
          </div>
          {(product.barcode || product.qrCode) && (
            <div className="mt-2 text-xs text-muted-foreground">
              QR: {product.barcode || product.qrCode}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return <div className="p-8 text-center">Loading products...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your warehouse inventory</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg">
            <ScanLine className="h-4 w-4" />
            Scan Barcode
          </Button>
          <Button variant="secondary" size="lg" onClick={() => exportProductsToCSV(products)}>
            <Upload className="h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (open) setForm({});
          }}>
            <DialogTrigger asChild>
              <Button variant="action" size="lg" onClick={() => setForm({})}>
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input 
                  placeholder="Product Name *" 
                  value={form.name || ""} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                />
                <Input 
                  placeholder="Category *" 
                  value={form.category || ""} 
                  onChange={e => setForm({ ...form, category: e.target.value })} 
                />
                <Input 
                  placeholder="Price *" 
                  type="number" 
                  step="0.01"
                  value={form.price || ""} 
                  onChange={e => setForm({ ...form, price: e.target.value })} 
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    placeholder="Current Stock" 
                    type="number" 
                    value={form.currentStock || ""} 
                    onChange={e => setForm({ ...form, currentStock: e.target.value })} 
                  />
                  <Input 
                    placeholder="Unit" 
                    value={form.unit || "piece"} 
                    onChange={e => setForm({ ...form, unit: e.target.value })} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    placeholder="Low Stock Threshold" 
                    type="number" 
                    value={form.lowStockThreshold || ""} 
                    onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })} 
                  />
                  <Input 
                    placeholder="Max Stock Level" 
                    type="number" 
                    value={form.maxStockLevel || ""} 
                    onChange={e => setForm({ ...form, maxStockLevel: e.target.value })} 
                  />
                </div>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={form.supplierId || ""} 
                  onChange={e => setForm({ ...form, supplierId: e.target.value })}
                >
                  <option value="">Select Supplier (Optional)</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <Input 
                  placeholder="QR Code (Optional)" 
                  value={form.qrCode || ""} 
                  onChange={e => setForm({ ...form, qrCode: e.target.value })} 
                />
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="default" className="flex-1" onClick={handleAddProduct}>
                    Add Product
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-xl font-bold">{products.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-xl font-bold">{categories.length - 1}</p>
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
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-xl font-bold">₹{products.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="p-4 border-warning shadow-soft">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h3 className="font-semibold text-warning">Low Stock Alert</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map(product => (
              <Badge key={product.id} variant="outline" className="border-warning text-warning">
                {product.name} ({product.currentStock} {product.unit})
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="p-12 text-center shadow-soft">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
          <Button variant="outline">Clear Filters</Button>
        </Card>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Product Name *" 
              value={form.name || ""} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
            />
            <Input 
              placeholder="Category *" 
              value={form.category || ""} 
              onChange={e => setForm({ ...form, category: e.target.value })} 
            />
            <Input 
              placeholder="Price *" 
              type="number" 
              step="0.01"
              value={form.price || ""} 
              onChange={e => setForm({ ...form, price: e.target.value })} 
            />
            <div className="grid grid-cols-2 gap-4">
              <Input 
                placeholder="Current Stock" 
                type="number" 
                value={form.currentStock || ""} 
                onChange={e => setForm({ ...form, currentStock: e.target.value })} 
              />
              <Input 
                placeholder="Unit" 
                value={form.unit || ""} 
                onChange={e => setForm({ ...form, unit: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                placeholder="Low Stock Threshold" 
                type="number" 
                value={form.lowStockThreshold || ""} 
                onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })} 
              />
              <Input 
                placeholder="Max Stock Level" 
                type="number" 
                value={form.maxStockLevel || ""} 
                onChange={e => setForm({ ...form, maxStockLevel: e.target.value })} 
              />
            </div>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={form.supplierId || ""} 
              onChange={e => setForm({ ...form, supplierId: e.target.value })}
            >
              <option value="">Select Supplier (Optional)</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <Input 
              placeholder="QR Code (Optional)" 
              value={form.qrCode || ""} 
              onChange={e => setForm({ ...form, qrCode: e.target.value })} 
            />
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="default" className="flex-1" onClick={handleEditProduct}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">Are you sure you want to delete <b>{deleteProduct?.name}</b>?</div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteProduct}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}