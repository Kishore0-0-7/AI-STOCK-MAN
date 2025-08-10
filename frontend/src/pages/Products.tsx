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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  Download,
  Grid3x3,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { productsAPI, suppliersAPI } from "@/services/api";

interface Product {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  low_stock_threshold: number;
  price: number;
  supplier_id: string;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
}

interface ProductWithSupplier extends Product {
  supplier_name?: string;
}

function exportProductsToCSV(products: ProductWithSupplier[]) {
  const headers = [
    "ID",
    "Name",
    "Category",
    "Current Stock",
    "Price",
    "Low Stock Threshold",
    "Supplier",
    "Stock Status",
    "Barcode",
  ];

  const rows = products.map((p) => [
    p.id,
    `"${p.name}"`,
    `"${p.category}"`,
    p.current_stock,
    p.price,
    p.low_stock_threshold,
    `"${p.supplier_name || "N/A"}"`,
    p.current_stock <= p.low_stock_threshold ? "Low Stock" : "In Stock",
    p.barcode || "",
  ]);

  const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Products() {
  const [products, setProducts] = useState<ProductWithSupplier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    category: "",
    current_stock: 0,
    low_stock_threshold: 10,
    price: 0,
    supplier_id: "",
    barcode: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, suppliersData] = await Promise.allSettled([
        productsAPI.getAll(),
        suppliersAPI.getAll(),
      ]);

      const products =
        productsData.status === "fulfilled"
          ? (productsData.value as any)?.products || productsData.value || []
          : [];
      const suppliers =
        suppliersData.status === "fulfilled"
          ? (suppliersData.value as any)?.suppliers || suppliersData.value || []
          : [];

      const productsWithSuppliers = (products || []).map((product: any) => {
        const supplier = (suppliers || []).find(
          (s: any) => s.id === product.supplier_id
        );
        return {
          ...product,
          supplier_name: supplier?.name || "Unknown",
        };
      });

      setProducts(productsWithSuppliers);
      setSuppliers(suppliers || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error loading data",
        description: "Failed to load products or suppliers. Please try again.",
        variant: "destructive",
      });
      setProducts([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.category || !form.supplier_id) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editProduct) {
        await productsAPI.update(editProduct.id, form);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        setIsEditDialogOpen(false);
      } else {
        await productsAPI.create(form as any);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
        setIsAddDialogOpen(false);
      }

      setForm({
        name: "",
        category: "",
        current_stock: 0,
        low_stock_threshold: 10,
        price: 0,
        supplier_id: "",
        barcode: "",
      });

      await fetchData();
    } catch (error) {
      console.error("Failed to save product:", error);
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    try {
      await productsAPI.delete(deleteProduct.id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeleteProduct(null);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      current_stock: product.current_stock,
      low_stock_threshold: product.low_stock_threshold,
      price: product.price,
      supplier_id: product.supplier_id,
      barcode: product.barcode || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setDeleteProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.supplier_name &&
        product.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map((p) => p.category))];
  const lowStockProducts = products.filter(
    (p) => p.current_stock <= p.low_stock_threshold
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Products
            </h1>
            <p className="text-muted-foreground mt-1">
              Loading your product inventory...
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Products
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your inventory • {products.length} products •{" "}
            {lowStockProducts.length} low stock
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => exportProductsToCSV(filteredProducts)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={fetchData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="relative p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-blue-50/50 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Products
              </p>
              <p className="text-3xl font-bold text-foreground">
                {products.length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
        </Card>

        <Card className="relative p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-red-50/50 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Low Stock
              </p>
              <p className="text-3xl font-bold text-foreground">
                {lowStockProducts.length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
        </Card>

        <Card className="relative p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-green-50/50 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Categories
              </p>
              <p className="text-3xl font-bold text-foreground">
                {categories.length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <Grid3x3 className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
        </Card>

        <Card className="relative p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-background to-purple-50/50 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Value
              </p>
              <p className="text-3xl font-bold text-foreground">
                $
                {products
                  .reduce(
                    (sum, product) =>
                      sum + product.price * product.current_stock,
                    0
                  )
                  .toFixed(0)}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
        </Card>
      </div>
      {/* Filters */}
      <Card className="p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products by name, category, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </Card>
      {/* Products Table */}
      <Card className="shadow-lg">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Products Inventory</h3>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md md:hidden"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden px-4 pb-4 space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground/60 mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-1">
                No products found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search filters
              </p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="p-4 border hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{product.name}</h4>
                    <Badge
                      variant="outline"
                      className="mt-1 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {product.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">
                      ${product.price?.toFixed(2)}
                    </p>
                    <Badge
                      variant={
                        product.current_stock <= product.low_stock_threshold
                          ? "destructive"
                          : "default"
                      }
                      className={
                        product.current_stock <= product.low_stock_threshold
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }
                    >
                      {product.current_stock <= product.low_stock_threshold
                        ? "Low Stock"
                        : "In Stock"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Stock</p>
                    <p
                      className={`font-semibold ${
                        product.current_stock <= product.low_stock_threshold
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {product.current_stock}{" "}
                      {product.current_stock <= product.low_stock_threshold && (
                        <AlertTriangle className="inline h-4 w-4 ml-1" />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Supplier</p>
                    <p className="font-medium">
                      {product.supplier_name || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditProduct(product);
                      setForm(product);
                      setIsEditDialogOpen(true);
                    }}
                    className="hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeleteProduct(product);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Stock</TableHead>
                <TableHead className="font-semibold">Price</TableHead>
                <TableHead className="font-semibold">Supplier</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Package className="h-16 w-16 text-muted-foreground/60 mb-4" />
                      <p className="text-lg font-medium text-muted-foreground mb-1">
                        No products found
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            product.current_stock <= product.low_stock_threshold
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {product.current_stock}
                        </span>
                        {product.current_stock <=
                          product.low_stock_threshold && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell>{product.supplier_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.current_stock <= product.low_stock_threshold
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          product.current_stock <= product.low_stock_threshold
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }
                      >
                        {product.current_stock <= product.low_stock_threshold
                          ? "Low Stock"
                          : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(product)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(product)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>{" "}
      {/* Add/Edit Product Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditProduct(null);
            setForm({
              name: "",
              category: "",
              current_stock: 0,
              low_stock_threshold: 10,
              price: 0,
              supplier_id: "",
              barcode: "",
            });
          }
        }}
      >
        <DialogContent className="max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {editProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Product name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <Input
                value={form.category || ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Product category"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Current Stock
                </label>
                <Input
                  type="number"
                  value={form.current_stock || 0}
                  onChange={(e) =>
                    setForm({ ...form, current_stock: Number(e.target.value) })
                  }
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Low Stock Alert
                </label>
                <Input
                  type="number"
                  value={form.low_stock_threshold || 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      low_stock_threshold: Number(e.target.value),
                    })
                  }
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <Input
                type="number"
                step="0.01"
                value={form.price || 0}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Supplier *
              </label>
              <Select
                value={form.supplier_id?.toString() || ""}
                onValueChange={(value) =>
                  setForm({ ...form, supplier_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem
                      key={supplier.id}
                      value={supplier.id.toString()}
                    >
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Barcode</label>
              <Input
                value={form.barcode || ""}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Product barcode"
              />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
                className="hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
              >
                {editProduct ? "Update" : "Create"} Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-600">
              Delete Product
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="font-medium">
                  Are you sure you want to delete this product?
                </p>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            {deleteProduct && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{deleteProduct.name}</p>
                <p className="text-sm text-muted-foreground">
                  Category: {deleteProduct.category}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md"
            >
              Delete Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
