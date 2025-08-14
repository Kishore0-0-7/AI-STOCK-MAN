import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth, Permission, UserRole } from "@/contexts/AuthContext";
import { ConditionalRender } from "@/components/ProtectedRoute";
import NotificationCenter from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Package,
  PackageX,
  ShoppingCart,
  FileText,
  ScanLine,
  TrendingUp,
  Archive,
  AlertTriangle,
  Menu,
  X,
  Truck,
  Users,
  ShieldAlert,
  Calculator,
  PackageOpen,
  PackageCheck,
  Warehouse,
  LogOut,
  User,
  Shield,
} from "lucide-react";

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Helper function to get API base URL
  const getApiBaseUrl = () => {
    if (import.meta.env.DEV || window.location.hostname === "localhost") {
      return "https://api.artechnology.pro/api/v1";
    }
    return "https://api.artechnology.pro/api/v1";
  };

  // Fetch low stock count for the badge
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/products/low-stock`)
      .then((res) => res.json())
      .then((data) => {
        setLowStockCount(Array.isArray(data) ? data.length : 0);
      })
      .catch((err) => {
        console.error("Failed to fetch low stock alerts for navigation:", err);
        setLowStockCount(0);
      });
  }, []);

  // Role-based navigation items
  const navigationItems: Array<{
    name: string;
    href: string;
    icon: any;
    requiredPermissions?: Permission[];
    requiredRoles?: UserRole[];
    badge?: number | string;
  }> = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      // Dashboard should be accessible to all authenticated users
    },
    {
      name: "Products",
      href: "/products",
      icon: Package,
      requiredPermissions: [Permission.VIEW_PRODUCTS],
    },
    {
      name: "QC Dashboard",
      href: "/qc-dashboard",
      icon: ShieldAlert,
      requiredPermissions: [Permission.VIEW_QC],
    },
    {
      name: "Production Calculator",
      href: "/production-calculator",
      icon: Calculator,
      requiredPermissions: [Permission.VIEW_PRODUCTION_CALCULATOR],
    },
    {
      name: "Inbound Dashboard",
      href: "/inbound-dashboard",
      icon: PackageOpen,
      requiredPermissions: [Permission.VIEW_INBOUND],
    },
    {
      name: "Outbound Dashboard",
      href: "/outbound-dashboard",
      icon: PackageCheck,
      requiredPermissions: [Permission.VIEW_OUTBOUND],
    },
    {
      name: "Storage Utilization",
      href: "/storage-utilization",
      icon: Warehouse,
      requiredPermissions: [Permission.VIEW_STORAGE_UTILIZATION],
    },
    {
      name: "Stock Out Management",
      href: "/stock-out",
      icon: PackageX,
      requiredPermissions: [
        Permission.VIEW_STOCK,
        Permission.CREATE_STOCK_OUT_REQUEST,
      ],
    },
    {
      name: "Suppliers",
      href: "/suppliers",
      icon: Truck,
      requiredPermissions: [Permission.VIEW_SUPPLIERS],
    },
    {
      name: "Purchase Orders",
      href: "/purchase-orders",
      icon: FileText,
      requiredPermissions: [Permission.VIEW_INBOUND],
    },
    {
      name: "Stock Summary",
      href: "/stock-summary",
      icon: Archive,
      requiredPermissions: [Permission.VIEW_STOCK],
    },
    {
      name: "Low Stock Alerts",
      href: "/low-stock-alerts",
      icon: AlertTriangle,
      badge: lowStockCount,
      requiredPermissions: [Permission.VIEW_ALERTS],
    },
    {
      name: "Employees",
      href: "/employees",
      icon: Users,
      requiredPermissions: [Permission.VIEW_EMPLOYEES],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-soft sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
            <Link to="/" className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Stock Management System
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* User Profile Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 py-1 h-auto"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {user.fullName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium">{user.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.role?.replace(/_/g, " ").toUpperCase()}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {user.role.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Notification Center */}
            <NotificationCenter />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
          <div className="flex flex-col h-full bg-card border-r shadow-soft">
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
              {navigationItems.map((item) => (
                <ConditionalRender
                  key={item.name}
                  requiredPermissions={item.requiredPermissions}
                  requiredRoles={item.requiredRoles}
                >
                  <Link
                    to={item.href}
                    className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-gradient-primary text-primary-foreground shadow-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </div>
                    {item.badge &&
                      (typeof item.badge === "number"
                        ? item.badge > 0
                        : true) && (
                        <Badge
                          variant={
                            typeof item.badge === "string"
                              ? "secondary"
                              : "destructive"
                          }
                          className="h-5 min-w-5 text-xs px-1.5 flex items-center justify-center"
                        >
                          {item.badge}
                        </Badge>
                      )}
                  </Link>
                </ConditionalRender>
              ))}
            </nav>

            {/* User info at bottom of sidebar */}
            {user && (
              <div className="flex-shrink-0 p-4 border-t bg-muted/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {user.fullName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.department}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user.role.replace(/_/g, " ").toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <nav className="fixed top-16 left-0 bottom-0 w-64 bg-card border-r shadow-soft flex flex-col">
              <div className="px-4 py-6 space-y-2 overflow-y-auto flex-1 min-h-0">
                {navigationItems.map((item) => (
                  <ConditionalRender
                    key={item.name}
                    requiredPermissions={item.requiredPermissions}
                    requiredRoles={item.requiredRoles}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive(item.href)
                          ? "bg-gradient-primary text-primary-foreground shadow-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </div>
                      {item.badge &&
                        (typeof item.badge === "number"
                          ? item.badge > 0
                          : true) && (
                          <Badge
                            variant={
                              typeof item.badge === "string"
                                ? "secondary"
                                : "destructive"
                            }
                            className="h-5 min-w-5 text-xs px-1.5 flex items-center justify-center"
                          >
                            {item.badge}
                          </Badge>
                        )}
                    </Link>
                  </ConditionalRender>
                ))}
              </div>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-64">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
