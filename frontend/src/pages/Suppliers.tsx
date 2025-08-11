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
  DialogDescription,
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
  RefreshCw,
  Building2,
  Phone,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { suppliersAPI } from "@/services/api";

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: "active" | "inactive";
  created_at?: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getAll();
      const supplierData = (response as any)?.suppliers || response || [];
      setSuppliers(supplierData);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      toast({
        title: "Error loading suppliers",
        description: "Failed to load suppliers. Please try again.",
        variant: "destructive",
      });
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (
    supplierId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      await suppliersAPI.updateStatus(supplierId, newStatus);
      toast({
        title: "Success",
        description: `Supplier status updated to ${newStatus}`,
      });
      await fetchSuppliers();
    } catch (error) {
      console.error("Failed to update supplier status:", error);
      toast({
        title: "Error",
        description: "Failed to update supplier status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editSupplier) {
        await suppliersAPI.update(editSupplier.id, form);
        toast({
          title: "Success",
          description: "Supplier updated successfully",
        });
        setIsEditDialogOpen(false);
      } else {
        await suppliersAPI.create(form as any);
        toast({
          title: "Success",
          description: "Supplier created successfully",
        });
        setIsAddDialogOpen(false);
      }

      setForm({
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        status: "active",
      });

      await fetchSuppliers();
    } catch (error) {
      console.error("Failed to save supplier:", error);
      toast({
        title: "Error",
        description: "Failed to save supplier. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteSupplier) return;

    try {
      await suppliersAPI.delete(deleteSupplier.id);
      toast({
        title: "Success",
        description: "Supplier deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeleteSupplier(null);
      await fetchSuppliers();
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      toast({
        title: "Error",
        description: "Failed to delete supplier. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditSupplier(supplier);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      status: supplier.status || "active",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (supplier: Supplier) => {
    setDeleteSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contact_person &&
        supplier.contact_person
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (supplier.email &&
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || supplier.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Suppliers
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your suppliers and vendors
            </p>
          </div>
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-600" />
            Suppliers
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your suppliers and vendors • {suppliers.length} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as any)}
          >
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchSuppliers}
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
                Add Supplier
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card className="p-6 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search suppliers by name, contact person, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
              <Building2 className="h-16 w-16 text-muted-foreground/60 mb-4 mx-auto" />
              <p className="text-lg font-medium text-muted-foreground mb-1">
                No suppliers found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or add a new supplier
              </p>
            </div>
          ) : (
            filteredSuppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-lg">{supplier.name}</h4>
                      <Badge
                        variant={
                          supplier.status === "active" ? "default" : "secondary"
                        }
                        className={`text-xs ${
                          supplier.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {supplier.status === "active" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {supplier.status || "active"}
                      </Badge>
                    </div>
                    {supplier.contact_person && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {supplier.contact_person}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusToggle(
                              supplier.id,
                              supplier.status || "active"
                            )
                          }
                        >
                          {supplier.status === "active" ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Set Inactive
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Set Active
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(supplier)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDeleteDialog(supplier)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {supplier.phone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {supplier.phone}
                    </p>
                  )}
                  {supplier.email && (
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {supplier.email}
                    </p>
                  )}
                  {supplier.address && (
                    <p className="text-sm text-muted-foreground">
                      {supplier.address}
                    </p>
                  )}
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
                  <TableHead className="font-semibold w-[150px] px-6 py-4 text-left">
                    Contact Person
                  </TableHead>
                  <TableHead className="font-semibold w-[120px] px-6 py-4 text-left">
                    Phone
                  </TableHead>
                  <TableHead className="font-semibold w-[200px] px-6 py-4 text-left">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold w-[200px] px-6 py-4 text-left">
                    Address
                  </TableHead>
                  <TableHead className="font-semibold w-[100px] px-6 py-4 text-left">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold w-[100px] px-6 py-4 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Building2 className="h-16 w-16 text-muted-foreground/60 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground mb-1">
                          No suppliers found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or add a new supplier
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow
                      key={supplier.id}
                      className="hover:bg-muted/30 transition-colors border-b last:border-b-0"
                    >
                      <TableCell className="font-medium px-6 py-4">
                        {supplier.name}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {supplier.contact_person || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {supplier.phone || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {supplier.email || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 truncate max-w-[200px]">
                        {supplier.address || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                            >
                              <Badge
                                variant={
                                  supplier.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                                className={`cursor-pointer ${
                                  supplier.status === "active"
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"
                                }`}
                              >
                                {supplier.status === "active" ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {supplier.status || "active"}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusToggle(
                                  supplier.id,
                                  supplier.status || "active"
                                )
                              }
                            >
                              {supplier.status === "active" ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Set Inactive
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Set Active
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(supplier)}
                            className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                            title="Edit supplier"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(supplier)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            title="Delete supplier"
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
        </div>
      </Card>

      {/* Add/Edit Supplier Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditSupplier(null);
            setForm({
              name: "",
              contact_person: "",
              email: "",
              phone: "",
              address: "",
              status: "active",
            });
          }
        }}
      >
        <DialogContent className="max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle>
              {editSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
            <DialogDescription>
              {editSupplier
                ? "Update supplier information"
                : "Add a new supplier to your directory"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Supplier Name *
              </label>
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter supplier name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Contact Person
              </label>
              <Input
                value={form.contact_person || ""}
                onChange={(e) =>
                  setForm({ ...form, contact_person: e.target.value })
                }
                placeholder="Enter contact person name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <Input
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
                type="tel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter email address"
                type="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Enter address"
                className="w-full p-2 border border-input rounded-md resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <Select
                value={form.status || "active"}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as "active" | "inactive" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Inactive
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editSupplier ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              This action will permanently remove the supplier from your system.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{deleteSupplier?.name}"? This
              action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
