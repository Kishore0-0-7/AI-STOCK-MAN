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
import { saveAs } from "file-saver";

// No more mockProducts; data will be fetched from backend

// CSV export helper
function exportProductsToCSV(products: any[]) {
  const headers = [
    "ID",
    "Name",
    "Category",
    "Quantity",
    "Unit",
    "Selling Price",
    "Purchase Price",
    "Supplier",
    "Low Stock"
  ];
  const rows = products.map(p => [
    p.id,
    p.name,
    p.category,
    p.quantity,
    p.unit,
    p.sellingPrice,
    p.purchasePrice,
    p.supplier,
    p.lowStock
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:4000/api/products')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handlers for CRUD
  const handleAddProduct = () => {
    if (!form.name || !form.id) return;
    setProducts([
      ...products,
      { ...form, unit: "pcs", quantity: Number(form.quantity), sellingPrice: Number(form.sellingPrice), purchasePrice: Number(form.purchasePrice), lowStock: Number(form.lowStock) }
    ]);
    setIsAddDialogOpen(false);
    setForm({});
  };

  const handleEditProduct = () => {
    setProducts(products.map(p =>
      p.id === editProduct.id
        ? { ...editProduct, ...form, unit: "pcs", quantity: Number(form.quantity), sellingPrice: Number(form.sellingPrice), purchasePrice: Number(form.purchasePrice), lowStock: Number(form.lowStock) }
        : p
    ));
    setIsEditDialogOpen(false);
    setEditProduct(null);
    setForm({});
  };

  const handleDeleteProduct = () => {
    setProducts(products.filter(p => p.id !== deleteProduct.id));
    setIsDeleteDialogOpen(false);
    setDeleteProduct(null);
  };

  const openEditDialog = (product: any) => {
    setEditProduct(product);
    setForm(product);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: any) => {
    setDeleteProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(p => p.quantity <= p.lowStock);

  const ProductCard = ({ product }: { product: any }) => (
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
              <Badge variant="outline" className="mt-1">
                {product.category}
              </Badge>
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
                product.quantity <= product.lowStock ? 'text-destructive' : 'text-success'
              }`}>
                {product.quantity} {product.unit}
                {product.quantity <= product.lowStock && (
                  <AlertTriangle className="inline h-4 w-4 ml-1" />
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Selling Price:</span>
              <span className="ml-2 font-medium">₹{product.sellingPrice}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Supplier:</span>
              <span className="ml-2 font-medium">{product.supplier}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Margin:</span>
              <span className="ml-2 font-medium text-success">
                {((product.sellingPrice - product.purchasePrice) / product.purchasePrice * 100).toFixed(1)}%
              </span>
            </div>
          </div>
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
                <Input placeholder="Product Name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Product ID" value={form.id || ""} onChange={e => setForm({ ...form, id: e.target.value })} />
                <Input placeholder="Category" value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Quantity" type="number" value={form.quantity || ""} onChange={e => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Purchase Price" type="number" value={form.purchasePrice || ""} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
                  <Input placeholder="Selling Price" type="number" value={form.sellingPrice || ""} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} />
                </div>
                <Input placeholder="Supplier" value={form.supplier || ""} onChange={e => setForm({ ...form, supplier: e.target.value })} />
                <Input placeholder="Low Stock Level" type="number" value={form.lowStock || ""} onChange={e => setForm({ ...form, lowStock: e.target.value })} />
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
              <p className="text-xl font-bold text-warning">{lowStockProducts.length}</p>
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
                {product.name} ({product.quantity} {product.unit})
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
            <Input placeholder="Product Name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Product ID" value={form.id || ""} onChange={e => setForm({ ...form, id: e.target.value })} disabled />
            <Input placeholder="Category" value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Quantity" type="number" value={form.quantity || ""} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Purchase Price" type="number" value={form.purchasePrice || ""} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
              <Input placeholder="Selling Price" type="number" value={form.sellingPrice || ""} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} />
            </div>
            <Input placeholder="Supplier" value={form.supplier || ""} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            <Input placeholder="Low Stock Level" type="number" value={form.lowStock || ""} onChange={e => setForm({ ...form, lowStock: e.target.value })} />
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