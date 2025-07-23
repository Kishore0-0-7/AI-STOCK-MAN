import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, Upload, Plus } from "lucide-react";

export default function ScanBills() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Scan Bills</h1>
          <p className="text-muted-foreground">OCR bill scanning and automatic stock updates</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="lg">
            <Upload className="h-4 w-4" />
            Upload Bill
          </Button>
          <Button variant="action" size="lg">
            <ScanLine className="h-4 w-4" />
            Scan Now
          </Button>
        </div>
      </div>
      
      <Card className="p-12 text-center shadow-soft">
        <ScanLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">OCR Bill Scanning Coming Soon</h3>
        <p className="text-muted-foreground">Upload or scan supplier bills to automatically detect and add inventory</p>
      </Card>
    </div>
  );
}