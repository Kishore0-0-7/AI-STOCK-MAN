import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  Truck,
  Users,
  ShieldAlert,
  Calculator,
  PackageOpen,
  PackageCheck,
  Warehouse,
} from "lucide-react";

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const location = useLocation();

  // Fetch low stock count for the badge
  useEffect(() => {
    fetch("http://localhost:5000/api/v1/products/low-stock")
      .then((res) => res.json())
      .then((data) => {
        setLowStockCount(Array.isArray(data) ? data.length : 0);
      })
      .catch((err) => {
        console.error("Failed to fetch low stock alerts for navigation:", err);
        setLowStockCount(0);
      });
  }, []);

  const navigationItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Package },
    { name: "QC Dashboard", href: "/qc-dashboard", icon: ShieldAlert },
    {
      name: "Production Calculator",
      href: "/production-calculator",
      icon: Calculator,
    },
    {
      name: "Inbound Dashboard",
      href: "/inbound-dashboard",
      icon: PackageOpen,
    },
    {
      name: "Outbound Dashboard",
      href: "/outbound-dashboard",
      icon: PackageCheck,
    },
    {
      name: "Storage Utilization",
      href: "/storage-utilization",
      icon: Warehouse,
    },
    {
      name: "Stock Out Management",
      href: "/stock-out",
      icon: PackageX,
    },
    { name: "Suppliers", href: "/suppliers", icon: Truck },
    // { name: "Customers", href: "/customers", icon: Users },
    // { name: "Billing", href: "/billing", icon: ShoppingCart },
    { name: "Purchase Orders", href: "/purchase-orders", icon: FileText },
    // { name: "Customer Orders", href: "/customer-orders", icon: ShoppingCart },
    // { name: "Scan Bills", href: "/scan-bills", icon: ScanLine },
    // { name: "Sales Reports", href: "/sales-reports", icon: TrendingUp },
    { name: "Stock Summary", href: "/stock-summary", icon: Archive },
    {
      name: "Low Stock Alerts",
      href: "/low-stock-alerts",
      icon: AlertTriangle,
      badge: lowStockCount,
    },
    // { name: "API Test", href: "/api-test", icon: Settings, badge: "DEV" },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

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
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="rounded-full"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
          <div className="flex flex-col flex-1 bg-card border-r shadow-soft overflow-hidden">
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
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
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <nav className="fixed top-16 left-0 bottom-0 w-64 bg-card border-r shadow-soft overflow-hidden">
              <div className="px-4 py-6 space-y-2 h-full overflow-y-auto overflow-x-hidden">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
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
