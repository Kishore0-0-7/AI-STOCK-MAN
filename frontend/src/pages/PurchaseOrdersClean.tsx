import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, RefreshCw, Download, Eye, Trash2 } from "lucide-react";
import api from "@/services/api";

// Interface that matches our actual API response
interface PurchaseOrder {
  id: number;
  supplier_id: number;
  supplier_name?: string;
  status: "draft" | "pending" | "approved" | "completed" | "cancelled";
  order_date?: string;
  expected_delivery?: string;
  total_amount?: number;
  notes?: string;
  created_at?: string;
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch purchase orders from API
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:4000/api/purchase-orders");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.success && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        console.warn("Unexpected API response format:", data);
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch purchase orders:", err);
      setError("Failed to load purchase orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  // Helper functions
  const getStatusColor = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter and sort orders
  const filteredAndSortedOrders = orders
    .filter((order) => filterStatus === "all" || order.status === filterStatus)
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === "date") {
        const dateA = new Date(a.order_date || a.created_at || "").getTime();
        const dateB = new Date(b.order_date || b.created_at || "").getTime();
        comparison = dateA - dateB;
      } else if (sortBy === "amount") {
        comparison = (a.total_amount || 0) - (b.total_amount || 0);
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                Purchase Orders
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track your purchase orders
              </p>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-end gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 hover:bg-green-50 hover:border-green-200"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => fetchPurchaseOrders()}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Sync</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card className="p-4 sm:p-6 bg-white/80 backdrop-blur-sm border-white/20">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "amount" | "status")
                }
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="status">Sort by Status</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
              </button>
            </div>

            <div className="text-sm text-gray-600">
              {filteredAndSortedOrders.length} order
              {filteredAndSortedOrders.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="text-red-800 text-center">
              <p className="font-medium">Error loading purchase orders</p>
              <p className="text-sm mt-1">{error}</p>
              <Button
                onClick={() => fetchPurchaseOrders()}
                variant="outline"
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && !error && (
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-white/20">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
              <p className="text-gray-600">Loading purchase orders...</p>
            </div>
          </Card>
        )}

        {/* Orders List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredAndSortedOrders.length === 0 ? (
              <Card className="p-8 bg-white/80 backdrop-blur-sm border-white/20">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No purchase orders found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {filterStatus !== "all"
                      ? `No orders with status "${filterStatus}" found.`
                      : "No purchase orders available yet."}
                  </p>
                  {filterStatus !== "all" && (
                    <Button
                      variant="outline"
                      onClick={() => setFilterStatus("all")}
                      className="hover:bg-blue-50"
                    >
                      Show All Orders
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {filteredAndSortedOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="p-4 bg-white/90 backdrop-blur-sm border-white/30 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              Order #{order.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.supplier_name || "Unknown Supplier"}
                            </p>
                          </div>
                          <Badge
                            className={`${getStatusColor(order.status)} border`}
                          >
                            {order.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Order Date</p>
                            <p className="font-medium">
                              {formatDate(order.order_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Expected Delivery</p>
                            <p className="font-medium">
                              {formatDate(order.expected_delivery)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total Amount</p>
                            <p className="font-bold text-lg text-green-600">
                              {formatCurrency(order.total_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Created</p>
                            <p className="font-medium">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                        </div>

                        {order.notes && (
                          <div>
                            <p className="text-gray-500 text-sm">Notes</p>
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                              {order.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table */}
                <Card className="hidden lg:block bg-white/80 backdrop-blur-sm border-white/20">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/80 border-b">
                        <tr>
                          <th className="text-left py-4 px-6 font-medium text-gray-700">
                            Order
                          </th>
                          <th className="text-left py-4 px-6 font-medium text-gray-700">
                            Supplier
                          </th>
                          <th className="text-left py-4 px-6 font-medium text-gray-700">
                            Status
                          </th>
                          <th className="text-left py-4 px-6 font-medium text-gray-700">
                            Order Date
                          </th>
                          <th className="text-left py-4 px-6 font-medium text-gray-700">
                            Expected Delivery
                          </th>
                          <th className="text-left py-4 px-6 font-medium text-gray-700">
                            Amount
                          </th>
                          <th className="text-left py-4 px-6 font-medium text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredAndSortedOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-medium text-gray-900">
                                  #{order.id}
                                </p>
                                {order.notes && (
                                  <p
                                    className="text-xs text-gray-500 mt-1 truncate max-w-48"
                                    title={order.notes}
                                  >
                                    {order.notes}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-gray-900">
                                {order.supplier_name || "Unknown Supplier"}
                              </p>
                            </td>
                            <td className="py-4 px-6">
                              <Badge
                                className={`${getStatusColor(
                                  order.status
                                )} border`}
                              >
                                {order.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-gray-600">
                              {formatDate(order.order_date)}
                            </td>
                            <td className="py-4 px-6 text-gray-600">
                              {formatDate(order.expected_delivery)}
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-green-600">
                                {formatCurrency(order.total_amount)}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
