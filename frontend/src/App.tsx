import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Billing from "./pages/Billing";
import PurchaseOrders from "./pages/PurchaseOrders";
import CustomerOrders from "./pages/CustomerOrders";
import ScanBills from "./pages/ScanBills";
import SalesReports from "./pages/SalesReports";
import StockSummary from "./pages/StockSummary";
import LowStockAlerts from "./pages/LowStockAlerts";
import Settings from "./pages/Settings";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import NotFound from "./pages/NotFound";
import ApiTestComponent from "./components/ApiTestComponent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            {/* <Route path="billing" element={<Billing />} /> */}
            <Route path="purchase-orders" element={<PurchaseOrders />} />
            <Route path="customer-orders" element={<CustomerOrders />} />
            <Route path="scan-bills" element={<ScanBills />} />
            <Route path="sales-reports" element={<SalesReports />} />
            <Route path="stock-summary" element={<StockSummary />} />
            <Route path="low-stock-alerts" element={<LowStockAlerts />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="customers" element={<Customers />} />
            <Route path="settings" element={<Settings />} />
            <Route path="api-test" element={<ApiTestComponent />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
