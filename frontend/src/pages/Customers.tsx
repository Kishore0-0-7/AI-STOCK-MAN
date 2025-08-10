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
  RefreshCw,
  Users,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { customersAPI } from "@/services/api";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      const customerData = (response as any)?.customers || response || [];
      setCustomers(customerData);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({
        title: "Error loading customers",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name) {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editCustomer) {
        await customersAPI.update(editCustomer.id, form);
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
        setIsEditDialogOpen(false);
      } else {
        await customersAPI.create(form as any);
        toast({
          title: "Success",
          description: "Customer created successfully",
        });
        setIsAddDialogOpen(false);
      }

      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
      });

      await fetchCustomers();
    } catch (error) {
      console.error("Failed to save customer:", error);
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteCustomer) return;

    try {
      await customersAPI.delete(deleteCustomer.id);
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setDeleteCustomer(null);
      await fetchCustomers();
    } catch (error) {
      console.error("Failed to delete customer:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditCustomer(customer);
    setForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (customer: Customer) => {
    setDeleteCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  // Filter customers
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email &&
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone &&
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Customers
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your customers and clients
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
            <Users className="h-7 w-7 text-green-600" />
            Customers
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your customers and clients • {customers.length} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={fetchCustomers}
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
                Add Customer
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
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="shadow-lg">
        <div className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Directory</h3>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden px-4 pb-4 space-y-4">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground/60 mb-4 mx-auto" />
              <p className="text-lg font-medium text-muted-foreground mb-1">
                No customers found
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or add a new customer
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{customer.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {customer.id}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(customer)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDeleteDialog(customer)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {customer.phone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {customer.phone}
                    </p>
                  )}
                  {customer.email && (
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {customer.email}
                    </p>
                  )}
                  {customer.address && (
                    <p className="text-sm flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {customer.address}
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Member since:{" "}
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
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
                  <TableHead className="font-semibold w-[200px] px-6 py-4 text-left">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold w-[120px] px-6 py-4 text-left">
                    Phone
                  </TableHead>
                  <TableHead className="font-semibold w-[200px] px-6 py-4 text-left">
                    Address
                  </TableHead>
                  <TableHead className="font-semibold w-[120px] px-6 py-4 text-left">
                    Member Since
                  </TableHead>
                  <TableHead className="font-semibold w-[100px] px-6 py-4 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <Users className="h-16 w-16 text-muted-foreground/60 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground mb-1">
                          No customers found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or add a new customer
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="hover:bg-muted/30 transition-colors border-b last:border-b-0"
                    >
                      <TableCell className="font-medium px-6 py-4">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {customer.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {customer.email || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        {customer.phone || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 truncate max-w-[200px]">
                        {customer.address || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(customer)}
                            className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                            title="Edit customer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteDialog(customer)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            title="Delete customer"
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

      {/* Add/Edit Customer Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
            setEditCustomer(null);
            setForm({
              name: "",
              email: "",
              phone: "",
              address: "",
            });
          }
        }}
      >
        <DialogContent className="max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle>
              {editCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Customer Name *
              </label>
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter customer name"
                required
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
              <label className="block text-sm font-medium mb-2">Phone</label>
              <Input
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Enter phone number"
                type="tel"
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
                {editCustomer ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete "{deleteCustomer?.name}"? This
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
