import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Eye,
  Filter,
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  Users,
  Phone,
  Mail,
  MapPin,
  Building2,
  Star,
  TrendingUp,
  ShoppingCart,
  Package,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Supplier, SupplierDetails } from "@/types/supplier";
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

interface EnhancedSupplier
  extends Omit<
    SupplierDetails,
    "contract" | "recentPurchases" | "currentPurchaseOrders"
  > {
  totalOrders?: number;
  totalValue?: number;
  avgRating?: number;
  lastOrderDate?: string;
  productsSupplied?: number;
  payment_terms?: string;
  notes?: string;
}

// Enhanced sample suppliers data
const Suppliers: EnhancedSupplier[] = [
  {
    id: "1",
    name: "SteelWorks Industries",
    category: "Steel & Iron",
    contact_person: "Arjun Patel",
    email: "arjun@steelworks.com",
    phone: "+91 98765 43210",
    address: "Industrial Zone 5, Bhilai, Chhattisgarh 490026",
    products: [
      "Iron Casting Blocks",
      "Steel Billets",
      "Cast Iron Pipes",
      "Steel Plates",
    ],
    currentOrders: 8,
    status: "active",
    totalOrders: 152,
    totalValue: 8750000,
    avgRating: 4.8,
    lastOrderDate: "2024-01-20",
    productsSupplied: 15,
    payment_terms: "NET_45",
    notes:
      "Premium steel and iron supplier. Excellent quality control and timely deliveries.",
  },
  {
    id: "2",
    name: "MetalCraft Co",
    category: "Aluminum & Alloys",
    contact_person: "Kavita Menon",
    email: "kavita@metalcraft.com",
    phone: "+91 98765 43211",
    address: "Aluminum Park, Hosur, Tamil Nadu 635109",
    products: [
      "Aluminum Bars",
      "Alloy Rods",
      "Aluminum Sheets",
      "Precision Castings",
    ],
    currentOrders: 5,
    status: "active",
    totalOrders: 89,
    totalValue: 3200000,
    avgRating: 4.5,
    lastOrderDate: "2024-01-18",
    productsSupplied: 12,
    payment_terms: "NET_30",
    notes:
      "Specialized in aluminum alloys. Good for precision casting requirements.",
  },
  {
    id: "3",
    name: "Bronze Masters Ltd",
    category: "Bronze & Copper",
    contact_person: "Ramesh Iyer",
    email: "ramesh@bronzemasters.com",
    phone: "+91 98765 43212",
    address: "Copper Industrial Estate, Coimbatore, Tamil Nadu 641045",
    products: [
      "Bronze Ingots",
      "Copper Sheets",
      "Brass Rods",
      "Phosphor Bronze",
    ],
    currentOrders: 4,
    status: "active",
    totalOrders: 67,
    totalValue: 2150000,
    avgRating: 4.6,
    lastOrderDate: "2024-01-15",
    productsSupplied: 8,
    payment_terms: "NET_30",
    notes:
      "Premier bronze and copper alloy supplier. Excellent for marine applications.",
  },
  {
    id: "4",
    name: "Carbon Steel Works",
    category: "Carbon Steel",
    contact_person: "Sanjay Gupta",
    email: "sanjay@carbonsteel.com",
    phone: "+91 98765 43213",
    address: "Steel City Complex, Jamshedpur, Jharkhand 831001",
    products: [
      "Carbon Steel Billets",
      "Steel Rods",
      "Steel Plates",
      "Structural Steel",
    ],
    currentOrders: 6,
    status: "active",
    totalOrders: 94,
    totalValue: 5200000,
    avgRating: 4.3,
    lastOrderDate: "2024-01-12",
    productsSupplied: 11,
    payment_terms: "NET_45",
    notes: "Reliable carbon steel supplier. Good for structural applications.",
  },
  {
    id: "5",
    name: "Naval Brass Co",
    category: "Marine Alloys",
    contact_person: "Captain Vijay Kumar",
    email: "vijay@navalbrass.com",
    phone: "+91 98765 43214",
    address: "Marine Industrial Zone, Kochi, Kerala 682037",
    products: [
      "Naval Brass",
      "Marine Bronze",
      "Corrosion-resistant Alloys",
      "Ship Fittings",
    ],
    currentOrders: 3,
    status: "active",
    totalOrders: 45,
    totalValue: 1680000,
    avgRating: 4.9,
    lastOrderDate: "2024-01-19",
    productsSupplied: 7,
    payment_terms: "NET_30",
    notes: "Specialized marine alloys supplier with naval certifications.",
  },
  {
    id: "6",
    name: "Foundry Equipment Co",
    category: "Foundry Tools",
    contact_person: "Prakash Sharma",
    email: "prakash@foundryequip.com",
    phone: "+91 98765 43215",
    address: "Foundry Industrial Park, Rajkot, Gujarat 360005",
    products: [
      "Casting Molds",
      "Foundry Tools",
      "Furnace Equipment",
      "Sand Casting Supplies",
    ],
    currentOrders: 2,
    status: "active",
    totalOrders: 28,
    totalValue: 890000,
    avgRating: 4.2,
    lastOrderDate: "2024-01-10",
    productsSupplied: 6,
    payment_terms: "NET_30",
    notes:
      "Foundry equipment specialist. Good for casting setup and maintenance.",
  },
];

// Export the suppliers data for use in other components
export const dummySuppliers = Suppliers;

export default function EnhancedSuppliers() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [suppliers, setSuppliers] = useState<EnhancedSupplier[]>(Suppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] =
    useState<EnhancedSupplier | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [form, setForm] = useState<Partial<EnhancedSupplier>>({
    name: "",
    category: "General",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    payment_terms: "NET_30",
    notes: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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

  // Get unique categories from suppliers
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      suppliers.map((s) => s.category || "General")
    );
    return ["all", ...Array.from(uniqueCategories)];
  }, [suppliers]);

  // Calculate supplier statistics
  const supplierStats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.status === "active").length;
    const inactive = suppliers.filter((s) => s.status === "inactive").length;
    const totalValue = suppliers.reduce(
      (sum, s) => sum + (s.totalValue || 0),
      0
    );
    const totalOrders = suppliers.reduce(
      (sum, s) => sum + (s.totalOrders || 0),
      0
    );
    const avgRating =
      suppliers.reduce((sum, s) => sum + (s.avgRating || 0), 0) / total;

    return { total, active, inactive, totalValue, totalOrders, avgRating };
  }, [suppliers]);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.contact_person &&
          supplier.contact_person
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (supplier.email &&
          supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        categoryFilter === "all" ||
        (supplier.category || "General") === categoryFilter;

      const matchesStatus =
        statusFilter === "all" || supplier.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [suppliers, searchTerm, categoryFilter, statusFilter]);

  // Paginated suppliers
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  // Category distribution for chart
  const categoryData = useMemo(() => {
    const distribution: Record<string, number> = {};
    suppliers.forEach((s) => {
      const category = s.category || "General";
      distribution[category] = (distribution[category] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value], index) => ({
      name,
      value,
      fill: `hsl(${index * 60}, 70%, 50%)`,
    }));
  }, [suppliers]);

  // Top suppliers by value
  const topSuppliersData = useMemo(() => {
    return suppliers
      .filter((s) => s.totalValue && s.totalValue > 0)
      .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
      .slice(0, 6)
      .map((s) => ({
        name: s.name.length > 20 ? s.name.substring(0, 20) + "..." : s.name,
        value: s.totalValue || 0,
        orders: s.totalOrders || 0,
      }));
  }, [suppliers]);

  const handleNavigate = (supplierId: string) => {
    navigate(`/suppliers/${supplierId}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const supplierData: EnhancedSupplier = {
        id: selectedSupplier?.id || `supplier-${Date.now()}`,
        name: form.name!,
        category: form.category || "General",
        contact_person: form.contact_person,
        email: form.email!,
        phone: form.phone,
        address: form.address,
        status: (form.status as "active" | "inactive") || "active",
        payment_terms: form.payment_terms,
        notes: form.notes,
        products: [],
        currentOrders: selectedSupplier?.currentOrders || 0,
        totalOrders: selectedSupplier?.totalOrders || 0,
        totalValue: selectedSupplier?.totalValue || 0,
        avgRating: selectedSupplier?.avgRating || 4.0,
        lastOrderDate:
          selectedSupplier?.lastOrderDate ||
          new Date().toISOString().split("T")[0],
        productsSupplied: selectedSupplier?.productsSupplied || 0,
      };

      if (selectedSupplier) {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === selectedSupplier.id ? supplierData : s))
        );
        toast({
          title: "Success",
          description: "Supplier updated successfully",
        });
        setIsEditDialogOpen(false);
      } else {
        setSuppliers((prev) => [...prev, supplierData]);
        toast({
          title: "Success",
          description: "Supplier created successfully",
        });
        setIsAddDialogOpen(false);
      }

      // Reset form
      setForm({
        name: "",
        category: "General",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        status: "active",
        payment_terms: "NET_30",
        notes: "",
      });
      setSelectedSupplier(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save supplier",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (!selectedSupplier) return;

    setSuppliers((prev) => prev.filter((s) => s.id !== selectedSupplier.id));
    toast({ title: "Success", description: "Supplier deleted successfully" });
    setIsDeleteDialogOpen(false);
    setSelectedSupplier(null);
  };

  const openEditDialog = (supplier: EnhancedSupplier) => {
    setSelectedSupplier(supplier);
    setForm({
      name: supplier.name,
      category: supplier.category,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      status: supplier.status,
      payment_terms: supplier.payment_terms,
      notes: supplier.notes,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const exportToCSV = () => {
    const csvData = suppliers.map((s) => ({
      Name: s.name,
      Category: s.category,
      Contact: s.contact_person,
      Email: s.email,
      Phone: s.phone,
      Status: s.status,
      "Total Orders": s.totalOrders,
      "Total Value (₹)": s.totalValue,
      "Average Rating": s.avgRating,
      "Products Supplied": s.productsSupplied,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suppliers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
            <span className="break-words">Supplier Management</span>
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base mt-1">
            Manage your supplier network and partnerships
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
            <span>Add Supplier</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Suppliers
              </p>
              <p className="text-lg sm:text-2xl font-bold">
                {supplierStats.total}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {supplierStats.active} active, {supplierStats.inactive} inactive
              </p>
            </div>
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Orders
              </p>
              <p className="text-lg sm:text-2xl font-bold">
                {supplierStats.totalOrders}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across all suppliers
              </p>
            </div>
            <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Value
              </p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                ₹{(supplierStats.totalValue / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Procurement value
              </p>
            </div>
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Avg Rating
              </p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                {supplierStats.avgRating.toFixed(1)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {getRatingStars(supplierStats.avgRating)}
              </div>
            </div>
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            Supplier Categories
          </h3>
          <div className="h-48 sm:h-64">
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
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">
            Top Suppliers by Value
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSuppliersData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={isMobile ? 60 : 100}
                  tick={{ fontSize: isMobile ? 8 : 10 }}
                />
                <Tooltip
                  formatter={(value) => [
                    `₹${(value as number).toLocaleString()}`,
                    "Total Value",
                  ]}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4 mb-4 sm:mb-6">
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, contact, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="space-y-4">
            {paginatedSuppliers.length === 0 ? (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-1">No suppliers found</p>
                  <p className="text-sm">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              </Card>
            ) : (
              paginatedSuppliers.map((supplier) => (
                <Card key={supplier.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {supplier.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {supplier.contact_person || "No contact person"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {getStatusBadge(supplier.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSupplier(supplier);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleNavigate(supplier.id)}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            View Products
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openEditDialog(supplier)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSupplier(supplier);
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
                        {supplier.category || "General"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getRatingStars(supplier.avgRating || 0)}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({supplier.avgRating?.toFixed(1) || "0.0"})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Orders</p>
                        <p className="font-medium">
                          {supplier.totalOrders || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Value</p>
                        <p className="font-medium text-green-600">
                          ₹{((supplier.totalValue || 0) / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      {supplier.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
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
                <TableHead>Supplier</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-1">
                        No suppliers found
                      </p>
                      <p className="text-sm">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {supplier.contact_person || "No contact person"}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {supplier.category || "General"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {supplier.email && (
                          <div className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          {getRatingStars(supplier.avgRating || 0)}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({supplier.avgRating?.toFixed(1) || "0.0"})
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div>Orders: {supplier.totalOrders || 0}</div>
                          <div className="text-green-600">
                            ₹{((supplier.totalValue || 0) / 1000).toFixed(0)}K
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>

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
                              setSelectedSupplier(supplier);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleNavigate(supplier.id)}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            View Products
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openEditDialog(supplier)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSupplier(supplier);
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedSuppliers.length} of {filteredSuppliers.length}{" "}
              suppliers
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Page</span>
                <span className="text-sm font-medium">{currentPage}</span>
                <span className="text-sm text-muted-foreground">
                  of {totalPages}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Supplier Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedSupplier(null);
            setForm({
              name: "",
              category: "General",
              contact_person: "",
              email: "",
              phone: "",
              address: "",
              status: "active",
              payment_terms: "NET_30",
              notes: "",
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Company Name *
                </Label>
                <Input
                  id="name"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter company name"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
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

              <div className="space-y-2">
                <Label htmlFor="contact_person" className="text-sm font-medium">
                  Contact Person
                </Label>
                <Input
                  id="contact_person"
                  value={form.contact_person || ""}
                  onChange={(e) =>
                    setForm({ ...form, contact_person: e.target.value })
                  }
                  placeholder="Primary contact name"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@company.com"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms" className="text-sm font-medium">
                  Payment Terms
                </Label>
                <Select
                  value={form.payment_terms}
                  onValueChange={(value) =>
                    setForm({ ...form, payment_terms: value })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NET_7" className="text-sm">
                      NET 7 Days
                    </SelectItem>
                    <SelectItem value="NET_15" className="text-sm">
                      NET 15 Days
                    </SelectItem>
                    <SelectItem value="NET_30" className="text-sm">
                      NET 30 Days
                    </SelectItem>
                    <SelectItem value="NET_45" className="text-sm">
                      NET 45 Days
                    </SelectItem>
                    <SelectItem value="NET_60" className="text-sm">
                      NET 60 Days
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({ ...form, status: value as "active" | "inactive" })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-sm">
                      Active
                    </SelectItem>
                    <SelectItem value="inactive" className="text-sm">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Address
              </Label>
              <Textarea
                id="address"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Company address..."
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={form.notes || ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes about the supplier..."
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
                {selectedSupplier ? "Update Supplier" : "Create Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Supplier Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Supplier Details
            </DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg break-words">
                      {selectedSupplier.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {selectedSupplier.category}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {selectedSupplier.contact_person && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm break-words">
                          {selectedSupplier.contact_person}
                        </span>
                      </div>
                    )}
                    {selectedSupplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm break-all">
                          {selectedSupplier.email}
                        </span>
                      </div>
                    )}
                    {selectedSupplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">
                          {selectedSupplier.phone}
                        </span>
                      </div>
                    )}
                    {selectedSupplier.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm break-words">
                          {selectedSupplier.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Card className="p-3 sm:p-4">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {selectedSupplier.totalOrders || 0}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Total Orders
                        </div>
                      </div>
                    </Card>

                    <Card className="p-3 sm:p-4">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-green-600 break-all">
                          ₹
                          {((selectedSupplier.totalValue || 0) / 1000).toFixed(
                            0
                          )}
                          K
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Total Value
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-muted-foreground text-sm">
                        Rating:
                      </span>
                      <div className="flex items-center gap-1">
                        {getRatingStars(selectedSupplier.avgRating || 0)}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({selectedSupplier.avgRating?.toFixed(1) || "0.0"})
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-muted-foreground text-sm">
                        Status:
                      </span>
                      {getStatusBadge(selectedSupplier.status)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <span className="text-muted-foreground text-sm">
                        Payment Terms:
                      </span>
                      <span className="text-sm">
                        {selectedSupplier.payment_terms || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedSupplier.products &&
                selectedSupplier.products.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">
                      Products Supplied
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSupplier.products.map((product, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {selectedSupplier.notes && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">
                    Notes
                  </h4>
                  <p className="text-muted-foreground text-sm break-words">
                    {selectedSupplier.notes}
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
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSupplier?.name}"? This
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
