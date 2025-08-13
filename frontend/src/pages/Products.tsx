import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Grid3x3,
  DollarSign,
  RefreshCw,
  ChevronDown,
  FileImage,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { productsAPI, suppliersAPI, Product, Supplier } from "@/services/api";

interface ProductWithSupplier extends Product {
  supplier_name?: string;
}

// Export functions
function exportProductsToCSV(products: ProductWithSupplier[]) {
  const headers = [
    "ID",
    "SKU",
    "Name",
    "Category",
    "Current Stock",
    "Price",
    "Cost",
    "Low Stock Threshold",
    "Supplier",
    "Stock Status",
    "Created Date",
  ];

  const rows = products.map((p) => [
    p.id,
    p.sku || "",
    `"${p.name}"`,
    `"${p.category}"`,
    p.stock || p.current_stock || 0,
    p.price || 0,
    p.cost || 0,
    p.minStock || p.low_stock_threshold || 0,
    `"${p.supplier?.name || p.supplier_name || "N/A"}"`,
    (p.stock || p.current_stock || 0) <=
    (p.minStock || p.low_stock_threshold || 0)
      ? "Low Stock"
      : "In Stock",
    p.createdAt || p.created_at || "",
  ]);

  const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadFile(blob, `products-${new Date().toISOString().split("T")[0]}.csv`);
}

function exportProductsToJSON(products: ProductWithSupplier[]) {
  const exportData = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    stock: p.stock || p.current_stock || 0,
    price: p.price || 0,
    cost: p.cost || 0,
    minStock: p.minStock || p.low_stock_threshold || 0,
    supplier: p.supplier?.name || p.supplier_name,
    status:
      (p.stock || p.current_stock || 0) <=
      (p.minStock || p.low_stock_threshold || 0)
        ? "Low Stock"
        : "In Stock",
    createdAt: p.createdAt || p.created_at,
  }));

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  });
  downloadFile(blob, `products-${new Date().toISOString().split("T")[0]}.json`);
}

function exportProductsToExcel(products: ProductWithSupplier[]) {
  const headers = [
    "ID",
    "SKU",
    "Name",
    "Category",
    "Stock",
    "Price",
    "Cost",
    "Min Stock",
    "Supplier",
    "Status",
  ];
  const rows = products.map((p) => [
    p.id,
    p.sku || "",
    p.name,
    p.category,
    p.stock || p.current_stock || 0,
    p.price || 0,
    p.cost || 0,
    p.minStock || p.low_stock_threshold || 0,
    p.supplier?.name || p.supplier_name || "N/A",
    (p.stock || p.current_stock || 0) <=
    (p.minStock || p.low_stock_threshold || 0)
      ? "Low Stock"
      : "In Stock",
  ]);

  // Simple Excel format (tab-separated values)
  const excelContent = [headers, ...rows]
    .map((row) => row.join("\t"))
    .join("\n");
  const blob = new Blob([excelContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  downloadFile(blob, `products-${new Date().toISOString().split("T")[0]}.xls`);
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// PDF Export function
function exportProductsToPDF(products: ProductWithSupplier[]) {
  // Create PDF content as HTML string
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2563eb; margin-bottom: 5px; }
        .header p { color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background-color: #f8fafc; font-weight: bold; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .status-low { color: #dc2626; font-weight: bold; }
        .status-ok { color: #16a34a; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; color: #64748b; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Products Inventory Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Total Products: ${products.length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Price</th>
            <th>Cost</th>
            <th>Supplier</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${products
            .map(
              (p) => `
            <tr>
              <td>${p.sku || "N/A"}</td>
              <td>${p.name}</td>
              <td>${p.category}</td>
              <td>${p.stock || p.current_stock || 0}</td>
              <td>₹${(p.price || 0).toFixed(2)}</td>
              <td>₹${(p.cost || 0).toFixed(2)}</td>
              <td>${p.supplier?.name || p.supplier_name || "N/A"}</td>
              <td class="${
                (p.stock || p.current_stock || 0) <=
                (p.minStock || p.low_stock_threshold || 0)
                  ? "status-low"
                  : "status-ok"
              }">
                ${
                  (p.stock || p.current_stock || 0) <=
                  (p.minStock || p.low_stock_threshold || 0)
                    ? "Low Stock"
                    : "In Stock"
                }
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      
      <div class="footer">
        <p>AI Stock Management System - Products Report</p>
      </div>
    </body>
    </html>
  `;

  // Convert HTML to PDF using window.print
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Set up print styles
    const style = printWindow.document.createElement("style");
    style.textContent = `
      @media print {
        @page { margin: 0.5in; }
        body { -webkit-print-color-adjust: exact; }
      }
    `;
    printWindow.document.head.appendChild(style);

    // Trigger print dialog
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
}

// Import function with proper API integration
async function importProductsFromCSV(
  file: File,
  onSuccess: () => void,
  onError: (error: string) => void
) {
  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  if (!["csv", "json", "xls", "xlsx"].includes(fileExtension || "")) {
    onError("Unsupported file format. Please use CSV, Excel, or JSON files.");
    return;
  }

  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const fileData = e.target?.result;
      let products: any[] = [];

      const normalizeHeader = (h: string) =>
        h.trim().replace(/"/g, "").toLowerCase();

      if (fileExtension === "json") {
        // JSON import
        const jsonData = JSON.parse(fileData as string);
        products = Array.isArray(jsonData) ? jsonData : [jsonData];

        console.log("----------------------------------------");
        console.log("Importing data from JSON file:");
        console.log("Number of products:", products.length);
        console.log("Sample of imported data:", products.slice(0, 2));
        console.log("----------------------------------------");
      } else if (["xls", "xlsx"].includes(fileExtension)) {
        // Excel import using SheetJS
        const workbook = XLSX.read(fileData, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Read as arrays first to handle messy headers
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });
        const headers = rows[0].map(normalizeHeader);
        const dataRows = rows.slice(1);

        console.log("----------------------------------------");
        console.log(`Importing data from ${fileExtension.toUpperCase()} file:`);
        console.log("Detected headers:", headers);
        console.log("Total rows to process:", dataRows.length);
        console.log("----------------------------------------");

        products = dataRows.map((row) => {
          const product: any = {};
          headers.forEach((h, index) => {
            const val = (row[index] || "").toString().trim();
            switch (h) {
              case "name":
              case "product name":
                product.name = val;
                break;
              case "category":
                product.category = val;
                break;
              case "price":
                product.price = parseFloat(val) || 0;
                break;
              case "cost":
                product.cost = parseFloat(val) || 0;
                break;
              case "current stock":
              case "stock":
              case "stock quantity":
                product.stock = parseInt(val) || 0;
                break;
              case "low stock threshold":
              case "min stock":
              case "minstock":
              case "minimum stock":
                product.minStock = parseInt(val) || 10;
                break;
              case "sku":
              case "barcode":
                product.sku = val;
                break;
              case "supplier":
              case "supplier_name":
              case "supplier name":
                product.supplier_name = val;
                break;
              case "status":
                product.status = val;
                break;
            }
          });
          return product;
        });
      } else {
        // CSV / TSV import
        const text = fileData as string;
        const delimiter = text.includes("\t") ? "\t" : ",";
        const lines = text.split("\n").filter((l) => l.trim());
        const headers = lines[0].split(delimiter).map(normalizeHeader);

        console.log("----------------------------------------");
        console.log(`Importing data from ${fileExtension.toUpperCase()} file:`);
        console.log("Detected headers:", headers);
        console.log("Total rows to process:", lines.length - 1);
        console.log("----------------------------------------");

        products = lines.slice(1).map((line) => {
          const values = line
            .split(delimiter)
            .map((v) => v.trim().replace(/"/g, ""));
          const product: any = {};

          headers.forEach((h, index) => {
            const value = values[index] || "";
            switch (h) {
              case "name":
              case "product name":
                product.name = value;
                break;
              case "category":
                product.category = value;
                break;
              case "price":
                product.price = parseFloat(value) || 0;
                break;
              case "cost":
                product.cost = parseFloat(value) || 0;
                break;
              case "current stock":
              case "stock":
              case "stock quantity":
                product.stock = parseInt(value) || 0;
                break;
              case "low stock threshold":
              case "min stock":
              case "minstock":
              case "minimum stock":
                product.minStock = parseInt(value) || 10;
                break;
              case "sku":
              case "barcode":
                product.sku = value;
                break;
              case "supplier":
              case "supplier_name":
              case "supplier name":
                product.supplier_name = value;
                break;
              case "status":
                product.status = value;
                break;
            }
          });
          return product;
        });
      }

      // Validate
      const validProducts = products.filter(
        (p) => p.name && p.category && p.price != null
      );

      if (validProducts.length === 0) {
        onError(
          "No valid products found. Make sure your file has Name, Category, and Price columns."
        );
        return;
      }

      // Send to API
      try {
        const response = await productsAPI.bulkCreate(validProducts);
        if (response.results) {
          const { success, failed, errors } = response.results;
          if (success > 0) {
            onSuccess();
            const message =
              failed > 0
                ? `${success} products imported successfully, ${failed} failed.`
                : `All ${success} products imported successfully!`;
            console.log(message);
            if (errors && errors.length > 0) {
              console.log("Import errors:", errors);
            }
          } else {
            onError(
              "Failed to import any products. Please check your file format and data."
            );
          }
        }
      } catch (apiError: any) {
        console.error("API Error:", apiError);
        onError(
          `Failed to import products: ${
            apiError.message || "Unknown API error"
          }`
        );
      }
    } catch (error) {
      console.error("Import error:", error);
      onError(
        "Failed to parse file. Please check the file format and try again."
      );
    }
  };

  reader.readAsText(file);
}

export default function Products() {
  const [products, setProducts] = useState<ProductWithSupplier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const itemsPerPage = 15;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
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
          (s: any) =>
            s.id === product.supplier_id || s.id === product.supplier?.id
        );

        const mappedProduct = {
          ...product,
          // Map backend fields to frontend fields for consistency
          current_stock: product.stock || product.current_stock || 0,
          low_stock_threshold:
            product.minStock || product.low_stock_threshold || 10,
          supplier_name:
            supplier?.name ||
            product.supplier?.name ||
            product.supplier_name ||
            "N/A",
        };

        // Debug logging for first few products
        if (products.indexOf(product) < 3) {
          console.log(`Product ${product.name}:`, {
            originalStock: product.stock,
            originalCurrentStock: product.current_stock,
            mappedCurrentStock: mappedProduct.current_stock,
            originalSupplier: product.supplier,
            supplierFromList: supplier,
            mappedSupplierName: mappedProduct.supplier_name,
          });
        }

        return mappedProduct;
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

    if (!form.name || !form.category || !form.price) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (name, category, price)",
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
        const productData = {
          sku: form.barcode || `SKU-${Date.now()}`,
          name: form.name,
          category: form.category,
          price: form.price,
          cost: form.price * 0.7, // Assume 30% margin if cost not provided
          stock: form.current_stock || 0,
          minStock: form.low_stock_threshold || 10,
          supplierId: form.supplier_id || null,
          description: `${form.name} - ${form.category}`,
        };

        await productsAPI.create(productData as any);
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

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
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => exportProductsToCSV(filteredProducts)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportProductsToExcel(filteredProducts)}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportProductsToJSON(filteredProducts)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportProductsToPDF(filteredProducts)}
              >
                <FileImage className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Import Button */}
          <Dialog
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
          </Dialog>

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
                ₹
                {products
                  .reduce(
                    (sum, product) =>
                      sum +
                      (product.price || 0) *
                        (product.stock || product.current_stock || 0),
                    0
                  )
                  .toLocaleString("en-IN", { maximumFractionDigits: 0 })}
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
                      ₹{product.price?.toFixed(2)}
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
        <div className="hidden md:block">
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b hover:bg-muted/50">
                  <TableHead className="font-semibold w-[200px] px-6 py-4 text-left">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold w-[120px] px-6 py-4 text-left">
                    Category
                  </TableHead>
                  <TableHead className="font-semibold w-[80px] px-6 py-4 text-center">
                    Stock
                  </TableHead>
                  <TableHead className="font-semibold w-[100px] px-6 py-4 text-right">
                    Price
                  </TableHead>
                  <TableHead className="font-semibold w-[150px] px-6 py-4 text-left">
                    Supplier
                  </TableHead>
                  <TableHead className="font-semibold w-[100px] px-6 py-4 text-center">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold w-[100px] px-6 py-4 text-right">
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
                  paginatedProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="hover:bg-muted/30 transition-colors border-b last:border-b-0"
                    >
                      <TableCell className="font-medium px-6 py-4">
                        {product.name}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`font-medium ${
                              product.current_stock <=
                              product.low_stock_threshold
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
                      <TableCell className="font-medium text-right px-6 py-4">
                        ₹{product.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="truncate px-6 py-4">
                        {product.supplier_name}
                      </TableCell>
                      <TableCell className="text-center px-6 py-4">
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
                      <TableCell className="text-right px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(product)}
                            className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                            title="Edit product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            title="Delete product"
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
          {/* Pagination Controls */}
          {filteredProducts.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredProducts.length)} of{" "}
                {filteredProducts.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 2 &&
                        pageNumber <= currentPage + 2)
                    ) {
                      return (
                        <Button
                          key={pageNumber}
                          variant={
                            currentPage === pageNumber ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`h-8 w-8 p-0 ${
                            currentPage === pageNumber
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }`}
                        >
                          {pageNumber}
                        </Button>
                      );
                    } else if (
                      pageNumber === currentPage - 3 ||
                      pageNumber === currentPage + 3
                    ) {
                      return (
                        <span key={pageNumber} className="px-1">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Import Products
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Supported Formats
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• CSV files (.csv)</li>
                <li>• Excel files (.xlsx, .xls)</li>
                <li>• JSON files (.json)</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">
                Required Columns
              </h4>
              <p className="text-sm text-yellow-800">
                Name, Category, Price (required)
                <br />
                Stock, Min Stock, SKU (optional)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Select File
              </label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setImportFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (importFile) {
                    importProductsFromCSV(
                      importFile,
                      () => {
                        toast({
                          title: "Success",
                          description: "Products imported successfully",
                        });
                        setIsImportDialogOpen(false);
                        setImportFile(null);
                        fetchData();
                      },
                      (error) => {
                        toast({
                          title: "Import Error",
                          description: error,
                          variant: "destructive",
                        });
                      }
                    );
                  }
                }}
                disabled={!importFile}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Products
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
