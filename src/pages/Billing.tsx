import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  AlertTriangle
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Product, Customer } from "@/services/api";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  unit?: string;
}

export default function Billing() {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [gstEnabled, setGstEnabled] = useState(true);
  const [billPreviewOpen, setBillPreviewOpen] = useState(false);
  const billRef = useRef<HTMLDivElement>(null);

  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [customerError, setCustomerError] = useState(null);

  const { toast } = useToast();

  // Fetch customers from backend
  useEffect(() => {
    setCustomerLoading(true);
    fetch('http://localhost:4000/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        setCustomerLoading(false);
      })
      .catch(err => {
        setCustomerError(err.message);
        setCustomerLoading(false);
      });
  }, []);

  // CRUD operations
  const addCustomer = () => {
    fetch('http://localhost:4000/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerForm)
    })
      .then(res => res.json())
      .then(newCustomer => {
        setCustomers([...customers, newCustomer]);
        setCustomerForm({ name: "", phone: "", email: "", address: "" });
        setEditingCustomer(null);
        toast({ title: 'Customer added successfully!' });
      })
      .catch(err => {
        toast({ 
          title: 'Error', 
          description: 'Failed to add customer', 
          variant: 'destructive' 
        });
      });
  };
  const updateCustomer = () => {
    fetch(`http://localhost:4000/api/customers/${editingCustomer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerForm)
    })
      .then(res => res.json())
      .then(updated => {
        setCustomers(customers.map(c => c.id === updated.id ? updated : c));
        setEditingCustomer(null);
        setCustomerForm({ name: "", phone: "", email: "", address: "" });
        toast({ title: 'Customer updated successfully!' });
      })
      .catch(err => {
        toast({ 
          title: 'Error', 
          description: 'Failed to update customer', 
          variant: 'destructive' 
        });
      });
  };
  const deleteCustomer = (id) => {
    fetch(`http://localhost:4000/api/customers/${id}`, { method: 'DELETE' })
      .then(() => {
        setCustomers(customers.filter(c => c.id !== id));
        toast({ title: 'Customer deleted successfully!' });
      })
      .catch(err => {
        toast({ 
          title: 'Error', 
          description: 'Failed to delete customer', 
          variant: 'destructive' 
        });
      });
  };

  const mockProducts: Product[] = [
    { id: "P001", name: "NVIDIA GTX 1660 Super", price: 18500, current_stock: 10, unit: "pcs", category: "GPU", low_stock_threshold: 5, supplier_id: "S001" },
    { id: "P002", name: "Corsair 650W Power Supply", price: 5200, current_stock: 18, unit: "pcs", category: "PSU", low_stock_threshold: 5, supplier_id: "S002" },
    { id: "P003", name: "ASUS B450 Motherboard", price: 7800, current_stock: 12, unit: "pcs", category: "Motherboard", low_stock_threshold: 3, supplier_id: "S003" },
    { id: "P004", name: "1TB Seagate HDD", price: 3200, current_stock: 25, unit: "pcs", category: "Storage", low_stock_threshold: 8, supplier_id: "S004" },
    { id: "P005", name: "Cooler Master CPU Cooler", price: 2100, current_stock: 20, unit: "pcs", category: "Cooling", low_stock_threshold: 5, supplier_id: "S005" }
  ];

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      const newCartItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price,
        unit: product.unit
      };
      setCartItems([...cartItems, newCartItem]);
    }
    setSearchProduct("");
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gstAmount = gstEnabled ? subtotal * 0.18 : 0;
  const total = subtotal + gstAmount;

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearch)) ||
    (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  // Bill preview handler
  const handleGenerateBill = () => {
    setBillPreviewOpen(true);
  };

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!billRef.current) return;
    const canvas = await html2canvas(billRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("bill.pdf");
  };

  // Print bill
  const handlePrint = () => {
    if (!billRef.current) return;
    const printContents = billRef.current.innerHTML;
    const win = window.open("", "Print-Window");
    if (win) {
      win.document.open();
      win.document.write(`<html><body onload='window.print()'>${printContents}</body></html>`);
      win.document.close();
      setTimeout(() => win.close(), 10);
    }
  };

  // Share bill
  const handleShare = async () => {
    if (!billRef.current) return;
    const canvas = await html2canvas(billRef.current);
    canvas.toBlob(async (blob) => {
      if (navigator.share && blob) {
        const file = new File([blob], "bill.png", { type: "image/png" });
        try {
          await navigator.share({
            files: [file],
            title: "Bill",
            text: "Here is your bill."
          });
        } catch (e) {
          alert("Share cancelled or failed.");
        }
      } else if (blob) {
        // Fallback: WhatsApp and Gmail links
        const url = URL.createObjectURL(blob);
        window.open(`https://wa.me/?text=See%20your%20bill%20image%3A%20${encodeURIComponent(url)}`);
        // For Gmail, you can prefill subject/body but not attach files directly
        window.open(`mailto:?subject=Your%20Bill&body=See%20your%20bill%20image%3A%20${encodeURIComponent(url)}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Show loading state */}
      {customerLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading billing page...</p>
          </div>
        </div>
      )}

      {/* Show error state */}
      {customerError && (
        <Card className="p-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-4">
              Unable to connect to the backend server. Please ensure the server is running on port 4000.
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Main content - only show when not loading and no error */}
      {!customerLoading && !customerError && (
        <>
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Billing</h1>
              <p className="text-muted-foreground">Create bills and manage sales</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={() => setGstEnabled(!gstEnabled)}>
                {gstEnabled ? "GST: ON" : "GST: OFF"}
              </Button>
            </div>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection & Cart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Customer Information</h3>
            </div>
            <div className="mb-2">
              <Input
                placeholder="Search customers..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
              />
            </div>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                {filteredCustomers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => { setEditingCustomer('add'); setCustomerForm({ name: '', phone: '', email: '', address: '' }); }}>Add New</Button>
              {editingCustomer && (
                <Button variant="outline" size="sm" onClick={() => setEditingCustomer(null)}>Cancel</Button>
              )}
            </div>
            {(editingCustomer !== null) && (
              <div className="mt-2 space-y-2">
                <Input placeholder="Name" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} />
                <Input placeholder="Phone" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} />
                <Input placeholder="Email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} />
                <Input placeholder="Address" value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} />
                <div className="flex gap-2">
                  {editingCustomer && editingCustomer !== 'add' ? (
                    <Button variant="default" size="sm" onClick={updateCustomer}>Update</Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={addCustomer}>Add</Button>
                  )}
                </div>
              </div>
            )}
            <div className="mt-2">
              {filteredCustomers.map(customer => (
                <div key={customer.id} className="flex items-center gap-2 border-b py-1">
                  <span>{customer.name} ({customer.phone})</span>
                  <Button variant="outline" size="sm" onClick={() => { setEditingCustomer(customer); setCustomerForm(customer); }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteCustomer(customer.id)}>Delete</Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Product Search */}
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Add Products</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchProduct && (
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{product.price}/{product.unit} • Stock: {product.current_stock}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Shopping Cart */}
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Shopping Cart</h3>
            </div>
            
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No items in cart</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.price}/{item.unit}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-20 text-right font-medium">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Bill Summary */}
        <div className="space-y-6">
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Bill Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              {gstEnabled && (
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button 
                variant="action" 
                size="lg" 
                className="w-full"
                disabled={cartItems.length === 0 || !selectedCustomer}
                onClick={handleGenerateBill}
              >
                Generate Bill
              </Button>
              
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent Bills */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-lg font-semibold mb-4">Recent Bills</h3>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <div>
                    <p className="font-medium">Bill #{1000 + i}</p>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                  <Badge variant="outline">₹{(Math.random() * 5000 + 1000).toFixed(0)}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {billPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button className="absolute top-2 right-2 text-xl" onClick={() => setBillPreviewOpen(false)}>&times;</button>
            <div ref={billRef} className="bg-white p-4">
              <h2 className="text-2xl font-bold mb-2">Bill Preview</h2>
              <div className="mb-2">Customer: {customers.find(c => c.id.toString() === selectedCustomer)?.name}</div>
              <div className="mb-2">Phone: {customers.find(c => c.id.toString() === selectedCustomer)?.phone}</div>
              <div className="mb-2">Date: {new Date().toLocaleString()}</div>
              <table className="w-full text-sm border mt-2 mb-2">
                <thead>
                  <tr>
                    <th className="border px-2">Product</th>
                    <th className="border px-2">Qty</th>
                    <th className="border px-2">Price</th>
                    <th className="border px-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map(item => (
                    <tr key={item.id}>
                      <td className="border px-2">{item.name}</td>
                      <td className="border px-2">{item.quantity}</td>
                      <td className="border px-2">₹{item.price}</td>
                      <td className="border px-2">₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between mt-2">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {gstEnabled && (
                <div className="flex justify-between">
                  <span>GST (18%):</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={handleDownloadPDF}><Download className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={handleShare}><Share className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}