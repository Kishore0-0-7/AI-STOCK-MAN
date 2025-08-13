import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MoreVertical,
  Eye,
  TrendingUp,
  TrendingDown,
  Filter,
  ArrowUpDown,
  Package2,
  ShoppingCart,
  Barcode,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { productsAPI, suppliersAPI, Product, Supplier } from "@/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ProductWithSupplier extends Product {
  supplier_name?: string;
  stock_status?: "good" | "low" | "out";
  value?: number;
}

// Sample product data for demonstration
const sampleProducts: ProductWithSupplier[] = [
  {
    id: "1",
    name: "Iron Casting Blocks - Grade A",
    category: "Iron Castings",
    sku: "ICB-GA-001",
    price: 15000,
    cost: 12000,
    current_stock: 150,
    low_stock_threshold: 50,
    supplier_id: "supplier-1",
    supplier_name: "SteelWorks Industries",
    stock_status: "good",
    value: 1800000,
    description:
      "High-grade iron casting blocks for heavy machinery components",
    unit: "kg",
  },
  {
    id: "2",
    name: "Aluminum Alloy Bars - 6061",
    category: "Aluminum Castings",
    sku: "AAB-6061-001",
    price: 450,
    cost: 380,
    current_stock: 80,
    low_stock_threshold: 100,
    supplier_id: "supplier-2",
    supplier_name: "MetalCraft Co",
    stock_status: "low",
    value: 36000,
    description: "6061-T6 aluminum alloy bars for precision casting",
    unit: "kg",
  },
  {
    id: "3",
    name: "Bronze Ingots - Phosphor Bronze",
    category: "Bronze Castings",
    sku: "BI-PB-001",
    price: 850,
    cost: 720,
    current_stock: 200,
    low_stock_threshold: 80,
    supplier_id: "supplier-3",
    supplier_name: "Bronze Masters Ltd",
    stock_status: "good",
    value: 170000,
    description: "High-quality phosphor bronze ingots for marine applications",
    unit: "kg",
  },
  {
    id: "4",
    name: "Steel Billets - Carbon Steel",
    category: "Steel Castings",
    sku: "SB-CS-001",
    price: 65,
    cost: 55,
    current_stock: 0,
    low_stock_threshold: 500,
    supplier_id: "supplier-4",
    supplier_name: "Carbon Steel Works",
    stock_status: "out",
    value: 0,
    description: "Carbon steel billets for structural casting applications",
    unit: "kg",
  },
  {
    id: "5",
    name: "Brass Rods - Naval Brass",
    category: "Brass Castings",
    sku: "BR-NB-001",
    price: 720,
    cost: 600,
    current_stock: 120,
    low_stock_threshold: 60,
    supplier_id: "supplier-5",
    supplier_name: "Naval Brass Co",
    stock_status: "good",
    value: 86400,
    description: "Corrosion-resistant naval brass rods for marine fittings",
    unit: "kg",
  },
  {
    id: "6",
    name: "Cast Iron Pipes - Ductile",
    category: "Cast Iron",
    sku: "CIP-DI-001",
    price: 180,
    cost: 150,
    current_stock: 300,
    low_stock_threshold: 150,
    supplier_id: "supplier-1",
    supplier_name: "SteelWorks Industries",
    stock_status: "good",
    value: 54000,
    description: "Ductile cast iron pipes for water infrastructure",
    unit: "meters",
  },
  {
    id: "7",
    name: "Stainless Steel Sheets - 304 Grade",
    category: "Stainless Steel",
    sku: "SS-304-001",
    price: 450,
    cost: 380,
    current_stock: 85,
    low_stock_threshold: 100,
    supplier_id: "supplier-2",
    supplier_name: "MetalCraft Co",
    stock_status: "low",
    value: 38250,
    description: "High-grade 304 stainless steel sheets for food industry",
    unit: "sheets",
  },
  {
    id: "8",
    name: "Copper Wire Rods - Electrolytic",
    category: "Copper Castings",
    sku: "CWR-EL-001",
    price: 890,
    cost: 750,
    current_stock: 45,
    low_stock_threshold: 50,
    supplier_id: "supplier-3",
    supplier_name: "Bronze Masters Ltd",
    stock_status: "low",
    value: 40050,
    description: "High conductivity electrolytic copper wire rods",
    unit: "kg",
  },
  {
    id: "9",
    name: "Titanium Alloy Bars - Grade 5",
    category: "Titanium Castings",
    sku: "TAB-G5-001",
    price: 15000,
    cost: 12500,
    current_stock: 25,
    low_stock_threshold: 20,
    supplier_id: "supplier-2",
    supplier_name: "MetalCraft Co",
    stock_status: "good",
    value: 375000,
    description: "Grade 5 titanium alloy bars for aerospace applications",
    unit: "bars",
  },
  {
    id: "10",
    name: "Lead Ingots - Pure Lead",
    category: "Lead Castings",
    sku: "LI-PL-001",
    price: 220,
    cost: 190,
    current_stock: 180,
    low_stock_threshold: 100,
    supplier_id: "supplier-4",
    supplier_name: "Carbon Steel Works",
    stock_status: "good",
    value: 39600,
    description: "Pure lead ingots for radiation shielding applications",
    unit: "kg",
  },
  {
    id: "11",
    name: "Zinc Die Casting Alloy",
    category: "Zinc Castings",
    sku: "ZDC-AL-001",
    price: 350,
    cost: 290,
    current_stock: 0,
    low_stock_threshold: 80,
    supplier_id: "supplier-5",
    supplier_name: "Naval Brass Co",
    stock_status: "out",
    value: 0,
    description: "High-quality zinc die casting alloy for precision parts",
    unit: "kg",
  },
  {
    id: "12",
    name: "Magnesium Alloy Blocks",
    category: "Magnesium Castings",
    sku: "MAB-MG-001",
    price: 1200,
    cost: 1000,
    current_stock: 60,
    low_stock_threshold: 40,
    supplier_id: "supplier-1",
    supplier_name: "SteelWorks Industries",
    stock_status: "good",
    value: 72000,
    description: "Lightweight magnesium alloy blocks for automotive industry",
    unit: "blocks",
  },
  {
    id: "13",
    name: "Nickel Alloy Pipes - Inconel 625",
    category: "Nickel Alloys",
    sku: "NAP-I625-001",
    price: 8500,
    cost: 7200,
    current_stock: 15,
    low_stock_threshold: 25,
    supplier_id: "supplier-2",
    supplier_name: "MetalCraft Co",
    stock_status: "low",
    value: 127500,
    description:
      "Inconel 625 nickel alloy pipes for high-temperature applications",
    unit: "meters",
  },
  {
    id: "14",
    name: "Cobalt-Chrome Alloy Rods",
    category: "Specialty Alloys",
    sku: "CCA-CC-001",
    price: 12000,
    cost: 10200,
    current_stock: 8,
    low_stock_threshold: 15,
    supplier_id: "supplier-3",
    supplier_name: "Bronze Masters Ltd",
    stock_status: "low",
    value: 96000,
    description: "Cobalt-chrome alloy rods for medical implants",
    unit: "rods",
  },
  {
    id: "15",
    name: "Tool Steel Blocks - H13 Grade",
    category: "Tool Steel",
    sku: "TSB-H13-001",
    price: 950,
    cost: 800,
    current_stock: 0,
    low_stock_threshold: 30,
    supplier_id: "supplier-4",
    supplier_name: "Carbon Steel Works",
    stock_status: "out",
    value: 0,
    description: "H13 tool steel blocks for die casting molds",
    unit: "blocks",
  },
];

// const sampleSuppliers: Supplier[] = [
//   { id: "supplier-1", name: "SteelWorks Industries", status: "active" },
//   { id: "supplier-2", name: "MetalCraft Co", status: "active" },
//   { id: "supplier-3", name: "Bronze Masters Ltd", status: "active" },
//   { id: "supplier-4", name: "Carbon Steel Works", status: "active" },
//   { id: "supplier-5", name: "Naval Brass Co", status: "active" },
// ];

export default function EnhancedProducts() {
  const [products, setProducts] = useState<ProductWithSupplier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithSupplier | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({
    name: "",
    category: "",
    current_stock: 0,
    low_stock_threshold: 10,
    price: 0,
    cost: 0,
    supplier_id: "",
    sku: "",
    description: "",
    unit: "pcs",
    barcode: "",
  });
  const { toast } = useToast();

  const itemsPerPage = isMobile ? 6 : 12;

  // Load products from API
  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await productsAPI.getAll({
        limit: 500, // Get all products with reasonable limit
      });

      // Transform products data to include stock_status and value
      const transformedProducts = productsData.map((product: any) => ({
        ...product,
        stock_status:
          product.current_stock <= product.low_stock_threshold
            ? product.current_stock === 0
              ? "out"
              : "low"
            : "good",
        value: (product.current_stock || 0) * (product.price || 0),
        supplier_name: product.supplier?.name || "No Supplier",
      }));

      setProducts(transformedProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers from API
  const loadSuppliers = async () => {
    try {
      const suppliersData = await suppliersAPI.getAll({ limit: 500 });
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Failed to load suppliers:", error);
      toast({
        title: "Error",
        description: "Failed to load suppliers. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Initial data load
  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, []);

  // Check for mobile viewport
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, stockFilter, sortBy, sortOrder]);

  // Calculate product statistics
  const productStats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(
      (p) => (p.current_stock || 0) <= (p.low_stock_threshold || 0)
    ).length;
    const outOfStock = products.filter(
      (p) => (p.current_stock || 0) === 0
    ).length;
    const totalValue = products.reduce(
      (sum, p) => sum + (p.current_stock || 0) * (p.price || 0),
      0
    );

    return { total, lowStock, outOfStock, totalValue };
  }, [products]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];
    return ["all", ...uniqueCategories];
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" &&
          (product.current_stock || 0) <= (product.low_stock_threshold || 0)) ||
        (stockFilter === "out" && (product.current_stock || 0) === 0) ||
        (stockFilter === "good" &&
          (product.current_stock || 0) > (product.low_stock_threshold || 0));

      return matchesSearch && matchesCategory && matchesStock;
    });

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "category":
          aValue = a.category?.toLowerCase() || "";
          bValue = b.category?.toLowerCase() || "";
          break;
        case "stock":
          aValue = a.current_stock || 0;
          bValue = b.current_stock || 0;
          break;
        case "price":
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case "value":
          aValue = (a.current_stock || 0) * (a.price || 0);
          bValue = (b.current_stock || 0) * (b.price || 0);
          break;
        default:
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy, sortOrder]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  // Category distribution for pie chart
  const categoryData = useMemo(() => {
    const distribution: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category) {
        distribution[p.category] = (distribution[p.category] || 0) + 1;
      }
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      fill: `hsl(${Math.random() * 360}, 70%, 50%)`,
    }));
  }, [products]);

  // Stock status distribution
  const stockStatusData = useMemo(() => {
    const good = products.filter(
      (p) => (p.current_stock || 0) > (p.low_stock_threshold || 0)
    ).length;
    const low = products.filter(
      (p) =>
        (p.current_stock || 0) <= (p.low_stock_threshold || 0) &&
        (p.current_stock || 0) > 0
    ).length;
    const out = products.filter((p) => (p.current_stock || 0) === 0).length;

    return [
      { name: "Good Stock", value: good, fill: "#22C55E" },
      { name: "Low Stock", value: low, fill: "#F59E0B" },
      { name: "Out of Stock", value: out, fill: "#EF4444" },
    ].filter((item) => item.value > 0);
  }, [products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.category || !form.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const productData = {
        name: form.name!,
        sku: form.sku || `SKU-${Date.now()}`,
        description: form.description || "",
        category: form.category!,
        category_id: null, // We'll need to implement category lookup later
        price: Number(form.price!) || 0,
        cost: Number(form.cost || form.price! * 0.7) || 0,
        current_stock: Number(form.current_stock || 0),
        low_stock_threshold: Number(form.low_stock_threshold || 10),
        max_stock_level: 1000,
        unit: form.unit || "pcs",
        barcode: form.barcode || null,
        supplier_id: form.supplier_id || null,
        reorder_level: 0,
        reorder_quantity: 0,
        location: null,
      };

      if (selectedProduct) {
        // Update existing product
        await productsAPI.update(selectedProduct.id, productData);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        setIsEditDialogOpen(false);
      } else {
        // Create new product
        await productsAPI.create(productData);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
        setIsAddDialogOpen(false);
      }

      // Reload products from API
      await loadProducts();
      setForm({
        name: "",
        category: "",
        current_stock: 0,
        low_stock_threshold: 10,
        price: 0,
        cost: 0,
        supplier_id: "",
        sku: "",
        description: "",
        unit: "pcs",
        barcode: "",
      });
      setSelectedProduct(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);

      // Delete product via API
      await productsAPI.delete(selectedProduct.id);

      // Reload products from API
      await loadProducts();

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (product: ProductWithSupplier) => {
    setSelectedProduct(product);
    setForm({
      name: product.name || "",
      category: product.category || "",
      current_stock: product.current_stock || 0,
      low_stock_threshold: product.low_stock_threshold || 10,
      price: product.price || 0,
      cost: product.cost || 0,
      supplier_id: product.supplier_id || "",
      sku: product.sku || "",
      description: product.description || "",
      unit: product.unit || "pcs",
      barcode: product.barcode || "",
    });
    setIsEditDialogOpen(true);
  };

  const getStockStatusBadge = (product: ProductWithSupplier) => {
    const stock = product.current_stock || 0;
    const threshold = product.low_stock_threshold || 0;

    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (stock <= threshold) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          In Stock
        </Badge>
      );
    }
  };

  const exportToCSV = () => {
    const csvData = products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.category,
      "Current Stock": p.current_stock,
      "Low Stock Threshold": p.low_stock_threshold,
      "Price (₹)": p.price,
      "Cost (₹)": p.cost,
      Supplier: p.supplier_name,
      "Stock Value (₹)": (p.current_stock || 0) * (p.price || 0),
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Package2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
            <span className="break-words">Product Inventory</span>
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base mt-1">
            Manage your product catalog and inventory levels
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 text-sm"
            size="sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden xs:inline">Export</span>
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center justify-center gap-2 text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Products
              </p>
              <p className="text-lg sm:text-2xl font-bold">
                {productStats.total}
              </p>
            </div>
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Low Stock Items
              </p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                {productStats.lowStock}
              </p>
            </div>
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Out of Stock
              </p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">
                {productStats.outOfStock}
              </p>
            </div>
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Value
              </p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                ₹{(productStats.totalValue / 100000).toFixed(1)}L
              </p>
            </div>
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            Category Distribution
          </h3>
          <div className="h-48 sm:h-64">
            {typeof window !== "undefined" && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 30 : 50}
                    outerRadius={isMobile ? 60 : 80}
                    dataKey="value"
                    label={({ name, value }) =>
                      isMobile ? `${value}` : `${name}: ${value}`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            Stock Status Overview
          </h3>
          <div className="h-48 sm:h-64">
            {typeof window !== "undefined" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                  />
                  <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stockStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, categories, or SKUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:gap-2">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="good">Good Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1 sm:w-[120px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="flex-shrink-0"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="space-y-3">
            {paginatedProducts.length === 0 ? (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-1">No products found</p>
                  <p className="text-sm">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              </Card>
            ) : (
              paginatedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-semibold text-sm leading-tight mb-1 break-words">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Barcode className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{product.sku}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStockStatusBadge(product)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                      {product.supplier_name && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-20">
                            {product.supplier_name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Stock</p>
                        <p className="font-semibold text-sm">
                          {product.current_stock || 0}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Price</p>
                        <p className="font-semibold text-sm">
                          ₹{(product.price || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Value</p>
                        <p className="font-semibold text-sm text-green-600">
                          ₹
                          {(
                            (product.current_stock || 0) * (product.price || 0)
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.sku}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {product.current_stock || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Min: {product.low_stock_threshold || 0}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        ₹{(product.price || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cost: ₹{(product.cost || 0).toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-green-600">
                      ₹
                      {(
                        (product.current_stock || 0) * (product.price || 0)
                      ).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>{getStockStatusBadge(product)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditDialog(product)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 mt-6 border-t gap-4">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            Showing {paginatedProducts.length} of{" "}
            {filteredAndSortedProducts.length} products
          </div>
          {totalPages > 1 ? (
            <div className="flex flex-col xs:flex-row gap-3 items-center order-1 sm:order-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-3 py-2 hidden xs:flex"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-4 py-2 min-w-[80px]"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 min-w-[80px]"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-3 py-2 hidden xs:flex"
                >
                  Last
                </Button>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
                <span className="text-sm text-muted-foreground">Page</span>
                <span className="text-sm font-semibold min-w-[20px] text-center">
                  {currentPage}
                </span>
                <span className="text-sm text-muted-foreground">
                  of {totalPages}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md order-1 sm:order-2">
              <span className="text-sm text-muted-foreground">Page 1 of 1</span>
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedProduct(null);
            setForm({
              name: "",
              category: "",
              current_stock: 0,
              low_stock_threshold: 10,
              price: 0,
              cost: 0,
              supplier_id: "",
              sku: "",
              description: "",
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Product Name *
                </Label>
                <Input
                  id="name"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku" className="text-sm font-medium">
                  SKU
                </Label>
                <Input
                  id="sku"
                  value={form.sku || ""}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="Product SKU"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category *
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm({ ...form, category: value })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c !== "all")
                      .map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="text-sm"
                        >
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="supplier" className="text-sm font-medium">
                  Supplier
                </Label>
                <Select
                  value={form.supplier_id}
                  onValueChange={(value) =>
                    setForm({ ...form, supplier_id: value })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.id}
                        value={supplier.id.toString()}
                        className="text-sm"
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Selling Price (₹) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price || ""}
                  onChange={(e) =>
                    setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">
                  Cost Price (₹)
                </Label>
                <Input
                  id="cost"
                  type="number"
                  value={form.cost || ""}
                  onChange={(e) =>
                    setForm({ ...form, cost: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_stock" className="text-sm font-medium">
                  Current Stock
                </Label>
                <Input
                  id="current_stock"
                  type="number"
                  value={form.current_stock || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      current_stock: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  min="0"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="low_stock_threshold"
                  className="text-sm font-medium"
                >
                  Low Stock Threshold
                </Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  value={form.low_stock_threshold || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      low_stock_threshold: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="10"
                  min="0"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Product description..."
                rows={3}
                className="text-sm"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
                className="w-full sm:w-auto text-sm"
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto text-sm">
                {selectedProduct ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Product Details
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg break-words">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {selectedProduct.sku}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-muted-foreground text-sm">
                        Category:
                      </span>
                      <Badge variant="outline" className="w-fit">
                        {selectedProduct.category}
                      </Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-muted-foreground text-sm">
                        Supplier:
                      </span>
                      <span className="text-sm">
                        {selectedProduct.supplier_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 items-start sm:items-center">
                      <span className="text-muted-foreground text-sm">
                        Status:
                      </span>
                      {getStockStatusBadge(selectedProduct)}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Card className="p-3 sm:p-4">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {selectedProduct.current_stock || 0}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Current Stock
                        </div>
                      </div>
                    </Card>

                    <Card className="p-3 sm:p-4">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-orange-600">
                          {selectedProduct.low_stock_threshold || 0}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Min Stock
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Card className="p-3 sm:p-4">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">
                          ₹{(selectedProduct.price || 0).toLocaleString()}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Selling Price
                        </div>
                      </div>
                    </Card>

                    <Card className="p-3 sm:p-4">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-purple-600 break-all">
                          ₹
                          {(
                            (selectedProduct.current_stock || 0) *
                            (selectedProduct.price || 0)
                          ).toLocaleString()}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Total Value
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              {selectedProduct.description && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">
                    Description
                  </h4>
                  <p className="text-muted-foreground text-sm break-words">
                    {selectedProduct.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
