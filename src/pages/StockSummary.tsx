import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Archive, Download } from "lucide-react";

export default function StockSummary() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Stock Summary</h1>
          <p className="text-muted-foreground">Complete inventory overview and stock levels</p>
        </div>
        <Button variant="action" size="lg">
          <Download className="h-4 w-4" />
          Export Summary
        </Button>
      </div>
      
      <Card className="p-12 text-center shadow-soft">
        <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Stock Analytics Coming Soon</h3>
        <p className="text-muted-foreground">Comprehensive stock summary with expiry alerts and history</p>
      </Card>
    </div>
  );
}