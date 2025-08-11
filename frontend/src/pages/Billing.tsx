import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/dialog";
import {
  Plus,
  Minus,
  Search,
  Download,
  Printer,
  Share,
  Calculator,
  User,
  Package,
  Trash2,
  AlertTriangle,
  Receipt,
  RefreshCw,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { productsAPI, customersAPI, billsAPI } from "@/services/api";

interface Product {
  id: string;
  name: string;
  price: number;
  current_stock: number;
  category: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  available_stock: number;
}

interface Bill {
  id?: string;
  customer_id: string;
  customer_name?: string;
  total_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  items: CartItem[];
  notes?: string;
  created_at?: string;
}

export default function Billing() {
  const { toast } = useToast();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Billing states
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [billNotes, setBillNotes] = useState("");
  const [billPreviewOpen, setBillPreviewOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const billRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [productsRes, customersRes] = await Promise.allSettled([
        productsAPI.getAll(),
        customersAPI.getAll(),
      ]);

      if (productsRes.status === "fulfilled") {
        setProducts(
          (productsRes.value as any)?.products || productsRes.value || []
        );
      } else {
        console.error("Failed to load products:", productsRes.reason);
        setProducts([]);
      }

      if (customersRes.status === "fulfilled") {
        setCustomers(
          (customersRes.value as any)?.customers || customersRes.value || []
        );
      } else {
        console.error("Failed to load customers:", customersRes.reason);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
      toast({
        title: "Error",
        description: "Failed to load billing data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.current_stock) {
        toast({
          title: "Stock Limit Reached",
          description: `Only ${product.current_stock} units available`,
          variant: "destructive",
        });
        return;
      }
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        )
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price,
          available_stock: product.current_stock,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    const product = products.find((p) => p.id === id);
    if (product && quantity > product.current_stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.current_stock} units available`,
        variant: "destructive",
      });
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity, total: quantity * item.price }
          : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // const clearCart = () => {
  //   setCartItems([]);
  //   setSelectedCustomer("");
  //   setDiscount(0);
  //   setBillNotes("");
  // };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = gstEnabled ? (taxableAmount * 18) / 100 : 0;
  const totalAmount = taxableAmount + taxAmount;

  const generateBill = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before generating a bill.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer before generating a bill.",
        variant: "destructive",
      });
      return;
    }

    try {
      const customer = customers.find((c) => c.id === selectedCustomer);
      const billData = {
        customer_id: selectedCustomer,
        customer_name: customer?.name || "Unknown Customer",
        total_amount: totalAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        items: cartItems,
        notes: billNotes,
      };

      // Simulate bill creation with local ID
      const newBillId = `BILL-${Date.now()}`;

      setCurrentBill({
        ...billData,
        id: newBillId,
        created_at: new Date().toISOString(),
      });

      setBillPreviewOpen(true);

      toast({
        title: "Bill Generated",
        description: `Bill ${newBillId} has been created successfully.`,
      });

      // // Clear cart after successful bill generation
      // clearCart();
    } catch (error) {
      console.error("Error generating bill:", error);
      toast({
        title: "Error",
        description: "Failed to generate bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadBillPDF = async () => {
    if (!billRef.current || !currentBill) return;

    try {
      const canvas = await html2canvas(billRef.current, {
        useCORS: true,
        allowTaint: true,
        width: billRef.current.scrollWidth,
        height: billRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`bill-${currentBill.id}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: "Bill has been downloaded as PDF.",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const printBill = () => {
    if (!billRef.current) return;

    const printContent = billRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = `
      <html>
        <head>
          <title>Print Bill</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .mt-4 { margin-top: 16px; }
            .border-t { border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `;

    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const filteredProducts = Array.isArray(products)
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
          product.category.toLowerCase().includes(searchProduct.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Billing</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-background to-green-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center lg:justify-start gap-3 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 bg-clip-text text-transparent">
            <Receipt className="h-8 md:h-9 w-8 md:w-9 text-green-500" />
            Billing System
          </h1>
          <p className="text-muted-foreground mt-2 text-base md:text-lg">
            Create and manage customer bills
          </p>
        </div>
        <div className="flex flex-wrap justify-center lg:justify-end gap-3">
          <Button
            onClick={fetchData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Sync</span>
          </Button>
            {/* <Button
              onClick={clearCart}
              variant="outline"
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Cart</span>
              <span className="sm:hidden">Clear</span>
            </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Product Selection */}
        <div className="xl:col-span-2 space-y-4 md:space-y-6">
          {/* Customer Selection */}
          <Card className="p-4 md:p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </h3>
            <Select
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone && `- ${customer.phone}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Product Search */}
          <Card className="p-4 md:p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Selection
            </h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="pl-10 text-sm md:text-base"
              />
            </div>

            {/* Mobile-responsive product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="col-span-2 text-center text-gray-500 py-8">
                  No products found
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="p-3 cursor-pointer hover:bg-gray-50 border transition-all hover:shadow-md"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm truncate pr-2">
                        {product.name}
                      </h4>
                      <Badge
                        variant={
                          product.current_stock > 10
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {product.current_stock}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 truncate">
                      {product.category}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-600 text-sm md:text-base">
                        ₹{product.price.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Cart & Billing Summary - Mobile responsive */}
        <div className="space-y-4 md:space-y-6">
          <Card className="p-4 md:p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cart Summary
            </h3>

            {cartItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₹{item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2 justify-between sm:justify-end">
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="h-7 w-7 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="h-7 w-7 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-semibold text-green-600 min-w-[4rem] text-right">
                          ₹{item.total.toFixed(2)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm md:text-base">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="text-sm md:text-base">
                      Discount (%):
                    </label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full sm:w-20 h-8 text-center"
                      min="0"
                      max="100"
                    />
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm md:text-base text-red-600">
                      <span>Discount:</span>
                      <span className="font-semibold">
                        -₹{discountAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="text-sm md:text-base">
                      Include GST (18%):
                    </label>
                    <input
                      type="checkbox"
                      checked={gstEnabled}
                      onChange={(e) => setGstEnabled(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </div>

                  {gstEnabled && (
                    <div className="flex justify-between text-sm md:text-base">
                      <span>Tax:</span>
                      <span className="font-semibold">
                        ₹{taxAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg md:text-xl font-bold bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
                    <span>Total:</span>
                    <span className="text-green-600">
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="block text-sm md:text-base font-medium">
                    Notes:
                  </label>
                  <textarea
                    placeholder="Add notes to the bill..."
                    value={billNotes}
                    onChange={(e) => setBillNotes(e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none text-sm md:text-base"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={generateBill}
                  className="w-full mt-4 h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  disabled={!selectedCustomer || cartItems.length === 0}
                >
                  <Receipt className="h-5 w-5 mr-2" />
                  Generate Bill
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Bill Preview Dialog - Mobile Responsive */}
      <Dialog open={billPreviewOpen} onOpenChange={setBillPreviewOpen}>
        <DialogContent className="max-w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto m-2 sm:m-6">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">
              Bill Preview
            </DialogTitle>
          </DialogHeader>

          {currentBill && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-end gap-2 mb-4">
                <Button
                  onClick={printBill}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button
                  onClick={downloadBillPDF}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </Button>
              </div>

              <div ref={billRef} className="bg-white p-4 sm:p-8 border rounded">
                <div className="text-center mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold">
                    AI Stock Management
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Sales Invoice
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Bill ID: {currentBill.id}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Date:{" "}
                    {currentBill.created_at
                      ? new Date(currentBill.created_at).toLocaleDateString()
                      : new Date().toLocaleDateString()}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">
                    Bill To:
                  </h3>
                  <div className="text-sm sm:text-base">
                    <p>{currentBill.customer_name}</p>
                    {customers.find((c) => c.id === currentBill.customer_id)
                      ?.phone && (
                      <p>
                        Phone:{" "}
                        {
                          customers.find(
                            (c) => c.id === currentBill.customer_id
                          )?.phone
                        }
                      </p>
                    )}
                    {customers.find((c) => c.id === currentBill.customer_id)
                      ?.email && (
                      <p>
                        Email:{" "}
                        {
                          customers.find(
                            (c) => c.id === currentBill.customer_id
                          )?.email
                        }
                      </p>
                    )}
                  </div>
                </div>

                {/* Mobile responsive table */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentBill.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.price.toFixed(2)}</TableCell>
                          <TableCell>₹{item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card view */}
                <div className="block sm:hidden space-y-3">
                  {currentBill.items.map((item, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <span className="font-bold text-green-600">
                          ₹{item.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Qty: {item.quantity}</span>
                        <span>Price: ₹{item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {currentBill.discount_amount &&
                      currentBill.discount_amount > 0 && (
                        <div className="flex justify-between text-red-600 text-sm sm:text-base">
                          <span>Discount:</span>
                          <span>
                            -₹{currentBill.discount_amount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    {currentBill.tax_amount && currentBill.tax_amount > 0 && (
                      <div className="flex justify-between text-sm sm:text-base">
                        <span>Tax (18%):</span>
                        <span>₹{currentBill.tax_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-base sm:text-lg font-bold">
                        <span>Total Amount:</span>
                        <span className="text-green-600">
                          ₹{currentBill.total_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {currentBill.notes && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2 text-sm sm:text-base">
                      Notes:
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {currentBill.notes}
                    </p>
                  </div>
                )}

                <div className="text-center mt-8 pt-4 border-t">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Thank you for your business!
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
