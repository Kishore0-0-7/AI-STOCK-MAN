import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Download } from "lucide-react";

export default function SalesReports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sales Reports</h1>
          <p className="text-muted-foreground">Analyze sales performance and generate reports</p>
        </div>
        <Button variant="action" size="lg">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>
      
      <Card className="p-12 text-center shadow-soft">
        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sales Analytics Coming Soon</h3>
        <p className="text-muted-foreground">Detailed sales reports with charts and export options</p>
      </Card>
    </div>
  );
}