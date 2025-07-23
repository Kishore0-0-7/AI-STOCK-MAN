import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

export default function PurchaseOrders() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage supplier orders and inventory restocking</p>
        </div>
        <Button variant="action" size="lg">
          <Plus className="h-4 w-4" />
          Create PO
        </Button>
      </div>
      
      <Card className="p-12 text-center shadow-soft">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Purchase Orders Coming Soon</h3>
        <p className="text-muted-foreground">Create and manage purchase orders to suppliers</p>
      </Card>
    </div>
  );
}