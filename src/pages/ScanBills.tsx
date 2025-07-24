import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ScanLine,
  Upload,
  Camera,
  Eye,
  Check,
  X,
  Edit2,
  FileText,
  AlertTriangle,
  Search
} from "lucide-react";

// Mock OCR extracted data
const mockExtractedData = {
  billNumber: "INV-2024-0156",
  supplierName: "Tech Distributors Pvt Ltd",
  date: "2024-01-20",
  items: [
    { name: "NVIDIA GTX 1660 SUPER GRAPHICS CARD", quantity: 3, price: 17000, confidence: 0.95 },
    { name: "CORSAIR 650W POWER SUPPLY UNIT", quantity: 2, price: 4800, confidence: 0.92 },
    { name: "ASUS B450 MOTHERBOARD", quantity: 1, price: 7200, confidence: 0.88 }
  ],
  totalAmount: 66600
};

const mockProcessedBills = [
  {
    id: "BILL-001",
    billNumber: "INV-2024-0156",
    supplier: "Tech Distributors",
    date: "2024-01-20",
    itemCount: 3,
    totalAmount: 66600,
    status: "Processed",
    fileName: "tech_bill_jan20.pdf"
  },
  {
    id: "BILL-002", 
    billNumber: "INV-2024-0142",
    supplier: "Power Solutions",
    date: "2024-01-18",
    itemCount: 1,
    totalAmount: 7000,
    status: "Pending Review",
    fileName: "power_bill_jan18.jpg"
  },
  {
    id: "BILL-003",
    billNumber: "INV-2024-0133",
    supplier: "Storage House",
    date: "2024-01-15",
    itemCount: 2,
    totalAmount: 40000,
    status: "Unprocessed",
    fileName: "storage_bill_jan15.pdf"
  }
];

const mockProducts = [
  { id: "P001", name: "NVIDIA GTX 1660 Super", category: "Graphics Card" },
  { id: "P002", name: "Corsair 650W PSU", category: "Power Supply" },
  { id: "P003", name: "ASUS B450 Motherboard", category: "Motherboard" },
  { id: "P004", name: "1TB Seagate HDD", category: "Storage" }
];

export default function ScanBills() {
  const [bills, setBills] = useState(mockProcessedBills);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [adjustments, setAdjustments] = useState({});
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);

    // Simulate OCR processing
    setTimeout(() => {
      setExtractedData(mockExtractedData);
      setIsProcessing(false);
      setIsPreviewOpen(true);
    }, 3000);
  };

  const handleScanFromCamera = () => {
    // In a real app, this would open camera interface
    setIsProcessing(true);
    setTimeout(() => {
      setExtractedData(mockExtractedData);
      setIsProcessing(false);
      setIsPreviewOpen(true);
    }, 2000);
  };

  const handleConfirmExtraction = () => {
    // Apply adjustments and add to inventory
    const processedBill = {
      id: `BILL-${String(bills.length + 1).padStart(3, '0')}`,
      billNumber: extractedData.billNumber,
      supplier: extractedData.supplierName,
      date: extractedData.date,
      itemCount: extractedData.items.length,
      totalAmount: extractedData.totalAmount,
      status: "Processed",
      fileName: selectedFile?.name || "camera_capture.jpg"
    };

    setBills([processedBill, ...bills]);
    setIsPreviewOpen(false);
    setExtractedData(null);
    setSelectedFile(null);
    setAdjustments({});
  };

  const updateAdjustment = (itemIndex, field, value) => {
    setAdjustments({
      ...adjustments,
      [itemIndex]: {
        ...adjustments[itemIndex],
        [field]: value
      }
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      "Processed": "success",
      "Pending Review": "secondary",
      "Unprocessed": "default"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const filteredBills = bills.filter(bill =>
    bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Scan Bills</h1>
          <p className="text-muted-foreground">OCR bill scanning and automatic stock updates</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            className="hidden"
          />
          <Button
            variant="secondary"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Upload className="h-4 w-4" />
            Upload Bill
          </Button>
          <Button
            variant="action"
            size="lg"
            onClick={handleScanFromCamera}
            disabled={isProcessing}
          >
            <Camera className="h-4 w-4" />
            {isProcessing ? "Processing..." : "Scan with Camera"}
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="p-6 text-center shadow-soft border-primary">
          <ScanLine className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">Processing Bill...</h3>
          <p className="text-muted-foreground">Using OCR to extract item data from your bill</p>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bills</p>
              <p className="text-xl font-bold">{bills.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-success rounded-lg flex items-center justify-center">
              <Check className="h-5 w-5 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processed</p>
              <p className="text-xl font-bold">{bills.filter(b => b.status === "Processed").length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-warning rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-xl font-bold">{bills.filter(b => b.status === "Pending Review").length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-accent rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-xl font-bold">₹{bills.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bills by number or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Bills Table */}
      <Card className="shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBills.map(bill => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">{bill.billNumber}</TableCell>
                <TableCell>{bill.supplier}</TableCell>
                <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                <TableCell>{bill.itemCount} items</TableCell>
                <TableCell className="font-medium">₹{bill.totalAmount.toLocaleString()}</TableCell>
                <TableCell>{getStatusBadge(bill.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{bill.fileName}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* OCR Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Review Extracted Data</DialogTitle>
          </DialogHeader>
          {extractedData && (
            <div className="space-y-6">
              {/* Bill Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Bill Number</label>
                  <Input value={extractedData.billNumber} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium">Supplier</label>
                  <Input value={extractedData.supplierName} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input value={extractedData.date} readOnly />
                </div>
              </div>

              {/* Extracted Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Extracted Items</h3>
                <div className="space-y-4">
                  {extractedData.items.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant={item.confidence > 0.9 ? "outline" : "secondary"}>
                          {Math.round(item.confidence * 100)}% confident
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm font-medium">Product Name</label>
                          <Textarea
                            value={adjustments[index]?.name || item.name}
                            onChange={(e) => updateAdjustment(index, 'name', e.target.value)}
                            className="h-20"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Quantity</label>
                          <Input
                            type="number"
                            value={adjustments[index]?.quantity || item.quantity}
                            onChange={(e) => updateAdjustment(index, 'quantity', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Price</label>
                          <Input
                            type="number"
                            value={adjustments[index]?.price || item.price}
                            onChange={(e) => updateAdjustment(index, 'price', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Map to Product</label>
                          <select className="w-full p-2 border rounded">
                            <option>Auto-match</option>
                            {mockProducts.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)} className="flex-1">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button variant="default" className="flex-1" onClick={handleConfirmExtraction}>
                  <Check className="h-4 w-4" />
                  Confirm & Add to Inventory
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}