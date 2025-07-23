import { useState } from "react";
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

// Mock product data
const mockProducts = [
  {
    id: "P001",
    name: "Basmati Rice Premium",
    category: "Grains",
    quantity: 150,
    unit: "kg",
    sellingPrice: 120,
    purchasePrice: 100,
    supplier: "ABC Traders",
    lowStock: 20,
    image: "/placeholder.svg"
  },
  {
    id: "P002", 
    name: "Sunflower Oil",
    category: "Oil & Ghee",
    quantity: 8,
    unit: "L",
    sellingPrice: 180,
    purchasePrice: 150,
    supplier: "Oil Express",
    lowStock: 10,
    image: "/placeholder.svg"
  },
  {
    id: "P003",
    name: "Wheat Flour",
    category: "Flour",
    quantity: 200,
    unit: "kg", 
    sellingPrice: 45,
    purchasePrice: 35,
    supplier: "Grain Mills",
    lowStock: 30,
    image: "/placeholder.svg"
  },
  {
    id: "P004",
    name: "Sugar",
    category: "Sweeteners", 
    quantity: 75,
    unit: "kg",
    sellingPrice: 42,
    purchasePrice: 38,
    supplier: "Sweet Co",
    lowStock: 25,
    image: "/placeholder.svg"
  },
  {
    id: "P005",
    name: "Toor Dal",
    category: "Pulses",
    quantity: 5,
    unit: "kg",
    sellingPrice: 160,
    purchasePrice: 140,
    supplier: "Dal Depot",
    lowStock: 15,
    image: "/placeholder.svg"
  }
];

export default function Products() {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
              <Button variant="ghost" size="icon">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
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
          <Button variant="secondary" size="lg">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="action" size="lg">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Product Name" />
                <Input placeholder="Product ID" />
                <Input placeholder="Category" />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Quantity" type="number" />
                  <Input placeholder="Unit" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Purchase Price" type="number" />
                  <Input placeholder="Selling Price" type="number" />
                </div>
                <Input placeholder="Supplier" />
                <Input placeholder="Low Stock Level" type="number" />
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="default" className="flex-1">
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
    </div>
  );
}