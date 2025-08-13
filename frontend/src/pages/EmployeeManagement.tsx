import React, { useState, useEffect } from "react";
import { useAuth, Permission, UserRole } from "@/contexts/AuthContext";
import { authApi, User, Employee } from "@/services/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Shield,
  Mail,
  Phone,
  Building,
  Calendar,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ProtectedRoute from "@/components/ProtectedRoute";

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { user, hasPermission } = useAuth();

  // Form state
  const [formData, setFormData] = useState<Employee>({
    email: "",
    password: "",
    fullName: "",
    role: "viewer",
    department: "",
    phone: "",
    status: "active",
  });

  // Load employees
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await authApi.getEmployees();
      setEmployees(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      fullName: "",
      role: "viewer",
      department: "",
      phone: "",
      status: "active",
    });
    setShowPassword(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.email ||
      !formData.password ||
      !formData.fullName ||
      !formData.role
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.createEmployee(formData);
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      loadEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't update password if empty
      }

      await authApi.updateEmployee(selectedEmployee.id, updateData);
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      resetForm();
      loadEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (employee: User) => {
    if (employee.id === user?.id) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete ${employee.fullName}? This action cannot be undone.`
      )
    ) {
      try {
        await authApi.deleteEmployee(employee.id);
        toast({
          title: "Success",
          description: "Employee deleted successfully",
        });
        loadEmployees();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete employee",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleStatus = async (employee: User) => {
    if (employee.id === user?.id) {
      toast({
        title: "Error",
        description: "You cannot deactivate your own account",
        variant: "destructive",
      });
      return;
    }

    try {
      await authApi.toggleEmployeeStatus(employee.id);
      toast({
        title: "Success",
        description: `Employee ${
          employee.status === "active" ? "deactivated" : "activated"
        } successfully`,
      });
      loadEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (employee: User) => {
    setSelectedEmployee(employee);
    setFormData({
      email: employee.email,
      password: "", // Don't pre-fill password
      fullName: employee.fullName,
      role: employee.role,
      department: employee.department,
      phone: employee.phone || "",
      status: employee.status,
    });
    setIsEditDialogOpen(true);
  };

  // Filter employees
  const filteredEmployees = Array.isArray(employees)
    ? employees.filter((employee) => {
        const matchesSearch =
          employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole =
          filterRole === "all" || employee.role === filterRole;
        return matchesSearch && matchesRole;
      })
    : [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "warehouse_manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "inventory_manager":
        return "bg-green-100 text-green-800 border-green-200";
      case "quality_controller":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "production_supervisor":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "logistics_coordinator":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "purchase_manager":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "store_keeper":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatRoleName = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const departmentOptions = [
    "Administration",
    "Management",
    "Inventory",
    "Quality Control",
    "Production",
    "Logistics",
    "Procurement",
    "Storage",
    "General",
  ];

  return (
    <ProtectedRoute requiredPermissions={[Permission.VIEW_EMPLOYEES]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Employee Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage warehouse staff accounts and permissions
            </p>
          </div>
          {hasPermission(Permission.MANAGE_EMPLOYEES) && (
            <Button
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {formatRoleName(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employees ({filteredEmployees.length})
            </CardTitle>
            <CardDescription>
              Manage employee accounts, roles, and access permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No employees found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={employee.avatar} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                  {employee.fullName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {employee.fullName}
                                  {employee.id === user?.id && (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      You
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {employee.email}
                                </div>
                                {employee.phone && (
                                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {employee.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getRoleColor(
                                employee.role
                              )} border`}
                            >
                              <Shield className="mr-1 h-3 w-3" />
                              {formatRoleName(employee.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              {employee.department}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                employee.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {employee.status === "active" ? (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              ) : (
                                <XCircle className="mr-1 h-3 w-3" />
                              )}
                              {employee.status === "active"
                                ? "Active"
                                : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {employee.lastLogin
                                ? new Date(
                                    employee.lastLogin
                                  ).toLocaleDateString()
                                : "Never"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {hasPermission(Permission.MANAGE_EMPLOYEES) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(employee)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(employee)}
                                    disabled={employee.id === user?.id}
                                  >
                                    {employee.status === "active" ? (
                                      <>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(employee)}
                                    className="text-red-600"
                                    disabled={employee.id === user?.id}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Employee Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Create a new employee account with role-based permissions
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email Address *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="employee@warehouse.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="create-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-name">Full Name *</Label>
                  <Input
                    id="create-name"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {formatRoleName(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-phone">Phone Number</Label>
                  <Input
                    id="create-phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Employee"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update employee information and permissions
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Leave blank to keep current password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to keep the current password
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                    disabled={selectedEmployee?.id === user?.id} // Prevent changing own role
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {formatRoleName(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedEmployee?.id === user?.id && (
                    <p className="text-xs text-muted-foreground">
                      You cannot change your own role
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData({ ...formData, status: value })
                    }
                    disabled={selectedEmployee?.id === user?.id} // Prevent deactivating own account
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedEmployee?.id === user?.id && (
                    <p className="text-xs text-muted-foreground">
                      You cannot deactivate your own account
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Employee"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default EmployeeManagement;
