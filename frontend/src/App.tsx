import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Permission } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import PurchaseOrders from "./pages/PurchaseOrders";
import SupplierDetails from "./pages/SupplierDetails";
import StockSummary from "./pages/StockSummary";
import LowStockAlerts from "./pages/LowStockAlerts";
import Settings from "./pages/Settings";
import Suppliers from "./pages/Suppliers";
import QcDashboard from "./pages/QcDashboard";
import ProductionCalculator from "./pages/ProductionCalculator";
import InboundDashboard from "./pages/InboundDashboard";
import OutboundDashboard from "./pages/OutboundDashboard";
import StorageUtilizationDashboard from "./pages/StorageUtilizationDashboard";
import StockOutManagement from "./pages/StockOutManagement";
import EmployeeManagement from "./pages/EmployeeManagement";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route
                path="products"
                element={
                  <ProtectedRoute
                    requiredPermissions={[Permission.VIEW_PRODUCTS]}
                  >
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="qc-dashboard"
                element={
                  <ProtectedRoute requiredPermissions={[Permission.VIEW_QC]}>
                    <QcDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="production-calculator"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      Permission.VIEW_PRODUCTION_CALCULATOR,
                    ]}
                  >
                    <ProductionCalculator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="inbound-dashboard"
                element={
                  <ProtectedRoute
                    requiredPermissions={[Permission.VIEW_INBOUND]}
                  >
                    <InboundDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="outbound-dashboard"
                element={
                  <ProtectedRoute
                    requiredPermissions={[Permission.VIEW_OUTBOUND]}
                  >
                    <OutboundDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="storage-utilization"
                element={
                  <ProtectedRoute
                    requiredPermissions={[Permission.VIEW_STORAGE_UTILIZATION]}
                  >
                    <StorageUtilizationDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="stock-out"
                element={
                  <ProtectedRoute requiredPermissions={[Permission.VIEW_STOCK]}>
                    <StockOutManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="purchase-orders"
                element={
                  <ProtectedRoute
                    requiredPermissions={[Permission.VIEW_INBOUND]}
                  >
                    <PurchaseOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/suppliers/:id"
                element={
                  <ProtectedRoute
                    requiredPermissions={[Permission.VIEW_SUPPLIERS]}
                  >
                    <SupplierDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="stock-summary"
                element={
                  <ProtectedRoute requiredPermissions={[Permission.VIEW_STOCK]}>
                    <StockSummary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="low-stock-alerts"
                element={
                  <ProtectedRoute
                    requiredPermissions={[Permission.VIEW_ALERTS]}
                  >
                    <LowStockAlerts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="suppliers"
                element={
                  <ProtectedRoute
                    requiredPermissions={[Permission.VIEW_SUPPLIERS]}
                  >
                    <Suppliers />
                  </ProtectedRoute>
                }
              />
              <Route path="profile" element={<Profile />} />
              <Route
                path="settings"
                element={
                  <ProtectedRoute
                    requiredPermissions={[Permission.MANAGE_SETTINGS]}
                  >
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute
                    requiredPermissions={[Permission.VIEW_EMPLOYEES]}
                  >
                    <EmployeeManagement />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
