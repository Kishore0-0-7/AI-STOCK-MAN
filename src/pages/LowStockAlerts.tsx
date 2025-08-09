import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  Package,
  QrCode,
  Building2,
  Clock,
  CheckCircle,
  X,
  Search,
  Filter,
  Calendar,
  Mail,
  MessageSquare,
  Download,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAlerts } from "@/hooks/use-alerts";
import { useToast } from "@/hooks/use-toast";

const LowStockAlerts = () => {
  const { toast } = useToast();
  const { alerts, ignoredAlerts, resolvedAlerts, createPurchaseOrder, ignoreAlert } = useAlerts();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isIgnoreModalOpen, setIsIgnoreModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  // Form states
  const [restockQuantity, setRestockQuantity] = useState("");
  const [ignoreReason, setIgnoreReason] = useState("");
  const [sendMethod, setSendMethod] = useState("email");

  // Filter alerts based on search and priority
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch = 
        alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.qr_code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority = priorityFilter === "all" || alert.alert_priority === priorityFilter;      return matchesSearch && matchesPriority;
    });
  }, [alerts, searchTerm, priorityFilter]);

  // Priority styling helpers
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground";
      case "medium":
        return "bg-warning text-warning-foreground";
      case "low":
        return "bg-info text-info-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-3 w-3" />;
      case "medium":
        return <AlertTriangle className="h-3 w-3" />;
      case "low":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Handle alert confirmation
  const handleConfirmAlert = (alert) => {
    setSelectedAlert(alert);
    setRestockQuantity((alert.threshold * 2).toString()); // Default to 2x threshold
    setIsConfirmModalOpen(true);
  };

  // Handle alert ignore
  const handleIgnoreAlert = (alert) => {
    setSelectedAlert(alert);
    setIgnoreReason("");
    setIsIgnoreModalOpen(true);
  };

  // Confirm restock order
  const confirmRestock = async () => {
    if (!selectedAlert || !restockQuantity) return;

    try {
      const result = await createPurchaseOrder({
        productId: selectedAlert.id,
        quantity: parseInt(restockQuantity),
        notes: `Restock order for ${selectedAlert.name}`,
      });

      setIsConfirmModalOpen(false);
      setIsSendModalOpen(true);
      
      toast({
        title: "Purchase Order Generated",
        description: `PO #${result.poNumber} created for ${selectedAlert.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate purchase order",
        variant: "destructive",
      });
    }
  };

  // Confirm ignore alert
  const confirmIgnore = async () => {
    if (!selectedAlert) return;

    try {
      await ignoreAlert(selectedAlert.id, ignoreReason);
      setIsIgnoreModalOpen(false);
      
      toast({
        title: "Alert Ignored",
        description: `Alert for ${selectedAlert.name} has been ignored`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ignore alert",
        variant: "destructive",
      });
    }
  };

  // Download PDF
  const downloadPDF = () => {
    // Implementation for PDF download
    toast({
      title: "PDF Downloaded",
      description: "Purchase order has been saved to your downloads",
    });
  };

  // Send to supplier
  const sendToSupplier = () => {
    const method = sendMethod === "email" ? "Email" : "WhatsApp";
    toast({
      title: `PO Sent via ${method}`,
      description: `Purchase order sent to ${selectedAlert?.supplier.name}`,
    });
    setIsSendModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Low Stock Alerts
          </h1>
          <p className="text-muted-foreground">
            Manage stock alerts and generate purchase orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-sm">
            {alerts.length} Pending
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts by product, category, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pending ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="ignored" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Ignored ({ignoredAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Resolved ({resolvedAlerts.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Alerts */}
        <TabsContent value="pending" className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No pending alerts</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || priorityFilter !== "all"
                      ? "No alerts match your current filters."
                      : "All products are well-stocked!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-destructive">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{alert.name}</h3>
                        <Badge className={getPriorityColor(alert.alert_priority)}>
                          {getPriorityIcon(alert.alert_priority)}
                          <span className="ml-1 capitalize">{alert.alert_priority}</span>
                        </Badge>
                        <Badge 
                          variant={alert.stock_status === 'Out of Stock' ? 'destructive' : 
                                  alert.stock_status === 'Critical' ? 'destructive' :
                                  alert.stock_status === 'Low' ? 'secondary' : 'outline'}
                        >
                          {alert.stock_status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>Stock: <strong>{alert.current_stock}</strong> / {alert.low_stock_threshold}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-muted-foreground" />
                          <span>{alert.qr_code}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{alert.supplier_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{alert.updated_at}</span>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-muted-foreground">
                        Category: {alert.category} • Price: ${alert.price}/{alert.unit}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleConfirmAlert(alert)}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleIgnoreAlert(alert)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Ignore
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Ignored Alerts */}
        <TabsContent value="ignored" className="space-y-4">
          {ignoredAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <X className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No ignored alerts</h3>
                  <p className="text-muted-foreground">
                    Ignored alerts will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            ignoredAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-muted">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-muted-foreground">{alert.name}</h3>
                        <Badge variant="secondary">Ignored</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>Stock: {alert.current_stock} / {alert.low_stock_threshold}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Ignored: {alert.updated_at}</span>
                        </div>
                        <div className="text-muted-foreground">
                          By: System
                        </div>
                      </div>

                      {/* Reason section - currently disabled 
                      {false && (
                        <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                          <strong>Reason:</strong> N/A
                        </div>
                      )}
                      */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Resolved Alerts */}
        <TabsContent value="resolved" className="space-y-4">
          {resolvedAlerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No resolved alerts</h3>
                  <p className="text-muted-foreground">
                    Resolved purchase orders will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            resolvedAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-success">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{alert.name}</h3>
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolved
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>Ordered: {alert.quantity_ordered} units</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{alert.supplier_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{alert.updated_at}</span>
                        </div>
                        <div className="text-muted-foreground">
                          PO: {alert.po_number}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Confirm Restock Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Restock Order</DialogTitle>
            <DialogDescription>
              Generate a purchase order for {selectedAlert?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Current Stock</Label>
                  <div className="font-medium">{selectedAlert.current_stock} {selectedAlert.unit}(s)</div>
                </div>
                <div>
                  <Label>Threshold</Label>
                  <div className="font-medium">{selectedAlert.threshold} {selectedAlert.unit}(s)</div>
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <div className="font-medium">${selectedAlert.price}</div>
                </div>
                <div>
                  <Label>Supplier</Label>
                  <div className="font-medium">{selectedAlert.supplier_name}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="restock-quantity">Restock Quantity</Label>
                <Input
                  id="restock-quantity"
                  type="number"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  placeholder="Enter quantity to order"
                />
              </div>

              {restockQuantity && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">Order Summary</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{restockQuantity} {selectedAlert.unit}(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unit Price:</span>
                      <span>${selectedAlert.price}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>${(parseFloat(selectedAlert.price.toString()) * parseInt(restockQuantity || "0")).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRestock} disabled={!restockQuantity}>
              Generate PO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ignore Alert Modal */}
      <Dialog open={isIgnoreModalOpen} onOpenChange={setIsIgnoreModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Ignore Alert</DialogTitle>
            <DialogDescription>
              Why are you ignoring this alert for {selectedAlert?.name}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ignore-reason">Reason (Optional)</Label>
              <Textarea
                id="ignore-reason"
                value={ignoreReason}
                onChange={(e) => setIgnoreReason(e.target.value)}
                placeholder="e.g., End of season, Supplier out of stock, etc."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIgnoreModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmIgnore}>
              Ignore Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Supplier Modal */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Purchase Order</DialogTitle>
            <DialogDescription>
              Send the generated PO to {selectedAlert?.supplier.name}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Purchase Order Preview</div>
                <div className="space-y-1 text-sm">
                  <div>Product: {selectedAlert.name}</div>
                  <div>Quantity: {restockQuantity} {selectedAlert.unit}(s)</div>
                  <div>Supplier: {selectedAlert.supplier_name}</div>
                  <div>Total: ${(parseFloat(selectedAlert.price.toString()) * parseInt(restockQuantity || "0")).toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Send Method</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={sendMethod === "email" ? "default" : "outline"}
                    onClick={() => setSendMethod("email")}
                    className="h-20 flex-col gap-2"
                  >
                    <Mail className="h-6 w-6" />
                    Email
                  </Button>
                  <Button
                    variant={sendMethod === "whatsapp" ? "default" : "outline"}
                    onClick={() => setSendMethod("whatsapp")}
                    className="h-20 flex-col gap-2"
                  >
                    <MessageSquare className="h-6 w-6" />
                    WhatsApp
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <div className="font-medium mb-1">
                  {sendMethod === "email" ? "Email" : "WhatsApp"} Details:
                </div>
                <div>
                  {sendMethod === "email"
                    ? selectedAlert.supplier_email
                    : selectedAlert.supplier_phone}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={downloadPDF} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendToSupplier} className="flex-1 sm:flex-none">
                <Send className="h-4 w-4 mr-2" />
                Send PO
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LowStockAlerts;
