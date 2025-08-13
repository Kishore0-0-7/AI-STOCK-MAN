import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Eye, Filter } from "lucide-react";

// Define supplier data structure
interface Supplier {
  id: string;
  name: string;
  category?: string;
  products?: string[];
  currentOrders?: number;
  contact_person?: string;
  status?: "active" | "inactive";
}

// Sample suppliers data for demonstration
const dummySuppliers: Supplier[] = [
  {
    id: "1",
    name: "Tech Components Ltd",
    category: "Electronics",
    products: ["Processors", "Memory Modules", "Graphics Cards"],
    currentOrders: 5,
    status: "active",
  },
  {
    id: "2",
    name: "Office Solutions Inc",
    category: "Office Supplies",
    products: ["Paper", "Printers", "Ink Cartridges", "Staplers"],
    currentOrders: 3,
    status: "active",
  },
  {
    id: "3",
    name: "Global Foods Co",
    category: "Food & Beverages",
    products: ["Coffee", "Tea", "Snacks", "Beverages"],
    currentOrders: 8,
    status: "inactive",
  },
  {
    id: "4",
    name: "Industrial Tools & Co",
    category: "Industrial",
    products: ["Power Tools", "Hand Tools", "Safety Equipment"],
    currentOrders: 2,
    status: "active",
  },
];

export default function Suppliers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const handleNavigate = (supplierId: string) => {
    navigate(`/suppliers/${supplierId}`);
  };

  // Get unique categories from suppliers
  const categories = useMemo(() => {
    const uniqueCategories = new Set(dummySuppliers.map(s => s.category || "General"));
    return ["all", ...Array.from(uniqueCategories)];
  }, []);

  // Filter dummy suppliers
  const filteredSuppliers = dummySuppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contact_person &&
        supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = 
      categoryFilter === "all" || 
      (supplier.category || "General") === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // No loading state needed for dummy data

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            Suppliers Directory
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {categoryFilter === "all" 
              ? `Showing all ${filteredSuppliers.length} suppliers`
              : `Showing ${filteredSuppliers.length} suppliers in ${categoryFilter}`}
          </p>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {categoryFilter === "all" ? "All Categories" : categoryFilter}
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Suppliers Table */}
      <Card className="shadow-lg">
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Suppliers Directory</h3>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden px-4 pb-4 space-y-4">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-muted-foreground mb-1">
                No suppliers found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search term
              </p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="p-4"
              >
                <div className="mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{supplier.name}</h4>
                    {supplier.contact_person && (
                      <p className="text-sm text-muted-foreground">
                        {supplier.contact_person}
                      </p>
                    )}
                  </div>
                  <div className="text-sm mt-2">
                    Status: {supplier.status || "active"}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm">
                    Category: {supplier.category || "General"}
                  </div>

                  <div className="text-sm">
                    <div className="font-medium mb-1">Products:</div>
                    {supplier.products ? (
                      supplier.products.slice(0, 2).map((product, index) => (
                        <span key={index} className="block">
                          {product}
                        </span>
                      ))
                    ) : (
                      "No products"
                    )}
                    {(supplier.products?.length || 0) > 2 && (
                      <span className="text-sm text-muted-foreground">
                        +{supplier.products!.length - 2} more products
                      </span>
                    )}
                  </div>

                  <div className="border-t pt-3 mt-3 flex justify-between items-center">
                    <div className="text-sm">
                      Current Orders: {supplier.currentOrders || 0}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleNavigate(supplier.id)}
                      className="hover:text-blue-600 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="rounded-lg border border-border/50 overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 border-b">
                  <TableHead className="font-medium text-xs uppercase tracking-wider w-[250px] px-6 py-4 text-left text-gray-500">
                    Company Name
                  </TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider w-[150px] px-6 py-4 text-left text-gray-500">
                    Category
                  </TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider w-[200px] px-6 py-4 text-left text-gray-500">
                    Products
                  </TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider w-[150px] px-6 py-4 text-center text-gray-500">
                    Orders
                  </TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider w-[100px] px-6 py-4 text-left text-gray-500">
                    Status
                  </TableHead>
                  <TableHead className="font-medium text-xs uppercase tracking-wider w-[80px] px-6 py-4 text-right text-gray-500">
                    View
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <p className="text-lg font-medium text-muted-foreground mb-1">
                          No suppliers found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search term
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow
                      key={supplier.id}
                      className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="font-medium text-gray-900">{supplier.name}</div>
                          {supplier.contact_person && (
                            <div className="text-sm text-gray-500">{supplier.contact_person}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {supplier.category || "General"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          {supplier.products ? (
                            supplier.products.slice(0, 2).map((product, index) => (
                              <div key={index} className="text-gray-600">
                                • {product}
                              </div>
                            ))
                          ) : (
                            <div className="text-gray-500">No products</div>
                          )}
                          {(supplier.products?.length || 0) > 2 && (
                            <div className="text-xs text-gray-400">
                              +{supplier.products!.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-center">
                          <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-sm font-medium text-orange-700">
                            {supplier.currentOrders || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          supplier.status === 'active' 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {supplier.status || "active"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleNavigate(supplier.id)}
                          className="hover:text-blue-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* No dialogs needed for dummy data display */}
    </div>
  );
}
