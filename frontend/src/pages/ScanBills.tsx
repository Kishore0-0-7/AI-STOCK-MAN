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
  Search,
} from "lucide-react";

// Mock OCR extracted data
const mockExtractedData = {
  billNumber: "INV-2024-0156",
  supplierName: "Tech Distributors Pvt Ltd",
  date: "2024-01-20",
  items: [
    {
      name: "NVIDIA GTX 1660 SUPER GRAPHICS CARD",
      quantity: 3,
      price: 17000,
      confidence: 0.95,
    },
    {
      name: "CORSAIR 650W POWER SUPPLY UNIT",
      quantity: 2,
      price: 4800,
      confidence: 0.92,
    },
    {
      name: "ASUS B450 MOTHERBOARD",
      quantity: 1,
      price: 7200,
      confidence: 0.88,
    },
  ],
  totalAmount: 66600,
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
    fileName: "tech_bill_jan20.pdf",
  },
  {
    id: "BILL-002",
    billNumber: "INV-2024-0142",
    supplier: "Power Solutions",
    date: "2024-01-18",
    itemCount: 1,
    totalAmount: 7000,
    status: "Pending Review",
    fileName: "power_bill_jan18.jpg",
  },
  {
    id: "BILL-003",
    billNumber: "INV-2024-0133",
    supplier: "Storage House",
    date: "2024-01-15",
    itemCount: 2,
    totalAmount: 40000,
    status: "Unprocessed",
    fileName: "storage_bill_jan15.pdf",
  },
];

const mockProducts = [
  { id: "P001", name: "NVIDIA GTX 1660 Super", category: "Graphics Card" },
  { id: "P002", name: "Corsair 650W PSU", category: "Power Supply" },
  { id: "P003", name: "ASUS B450 Motherboard", category: "Motherboard" },
  { id: "P004", name: "1TB Seagate HDD", category: "Storage" },
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
      id: `BILL-${String(bills.length + 1).padStart(3, "0")}`,
      billNumber: extractedData.billNumber,
      supplier: extractedData.supplierName,
      date: extractedData.date,
      itemCount: extractedData.items.length,
      totalAmount: extractedData.totalAmount,
      status: "Processed",
      fileName: selectedFile?.name || "camera_capture.jpg",
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
        [field]: value,
      },
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      Processed: "success",
      "Pending Review": "secondary",
      Unprocessed: "default",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold truncate">
              Scan Bills
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              OCR bill scanning and automatic stock updates
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="md:size-lg w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="sm:inline">Upload Bill</span>
            </Button>
            <Button
              variant="action"
              size="sm"
              onClick={handleScanFromCamera}
              disabled={isProcessing}
              className="md:size-lg w-full sm:w-auto"
            >
              <Camera className="h-4 w-4 mr-2" />
              <span className="sm:inline">
                {isProcessing ? "Processing..." : "Scan with Camera"}
              </span>
            </Button>
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <Card className="p-4 md:p-6 text-center shadow-soft border-primary">
            <ScanLine className="h-8 w-8 md:h-12 md:w-12 text-primary mx-auto mb-3 md:mb-4 animate-pulse" />
            <h3 className="text-base md:text-lg font-semibold mb-2">
              Processing Bill...
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Using OCR to extract item data from your bill
            </p>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card className="p-3 md:p-4 shadow-soft">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Total Bills
                </p>
                <p className="text-lg md:text-xl font-bold">{bills.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 shadow-soft">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-success rounded-lg flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 md:h-5 md:w-5 text-success-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Processed
                </p>
                <p className="text-lg md:text-xl font-bold">
                  {bills.filter((b) => b.status === "Processed").length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 shadow-soft">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-warning rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-warning-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Pending Review
                </p>
                <p className="text-lg md:text-xl font-bold">
                  {bills.filter((b) => b.status === "Pending Review").length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4 shadow-soft">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-accent rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-accent-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Total Value
                </p>
                <p className="text-lg md:text-xl font-bold">
                  ₹
                  {bills
                    .reduce((sum, b) => sum + b.totalAmount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-3 md:p-4 shadow-soft">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bills by number or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </Card>

        {/* Bills Table */}
        <Card className="shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Bill Number</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Supplier
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    File Name
                  </TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium text-sm">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {bill.supplier}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {new Date(bill.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {bill.itemCount} items
                    </TableCell>
                    <TableCell className="font-medium text-sm text-right">
                      ₹{bill.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {getStatusBadge(bill.status)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[150px] truncate">
                      {bill.fileName}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hidden sm:flex"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* OCR Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto mx-4">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">
                Review Extracted Data
              </DialogTitle>
            </DialogHeader>
            {extractedData && (
              <div className="space-y-4 md:space-y-6">
                {/* Bill Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <h3 className="text-base md:text-lg font-semibold mb-4">
                    Extracted Items
                  </h3>
                  <div className="space-y-4">
                    {extractedData.items.map((item, index) => (
                      <Card key={index} className="p-3 md:p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge
                            variant={
                              item.confidence > 0.9 ? "outline" : "secondary"
                            }
                          >
                            {Math.round(item.confidence * 100)}% confident
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="md:col-span-2 lg:col-span-1">
                            <label className="text-sm font-medium">
                              Product Name
                            </label>
                            <Textarea
                              value={adjustments[index]?.name || item.name}
                              onChange={(e) =>
                                updateAdjustment(index, "name", e.target.value)
                              }
                              className="h-16 md:h-20 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Quantity
                            </label>
                            <Input
                              type="number"
                              value={
                                adjustments[index]?.quantity || item.quantity
                              }
                              onChange={(e) =>
                                updateAdjustment(
                                  index,
                                  "quantity",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Price</label>
                            <Input
                              type="number"
                              value={adjustments[index]?.price || item.price}
                              onChange={(e) =>
                                updateAdjustment(
                                  index,
                                  "price",
                                  Number(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Map to Product
                            </label>
                            <select className="w-full p-2 border rounded text-sm">
                              <option>Auto-match</option>
                              {mockProducts.map((product) => (
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

                <div className="flex flex-col md:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsPreviewOpen(false)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleConfirmExtraction}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirm & Add to Inventory
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
