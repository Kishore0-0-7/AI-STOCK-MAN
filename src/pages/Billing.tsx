import { useState } from "react";
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
  Trash2
} from "lucide-react";

export default function Billing() {
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [gstEnabled, setGstEnabled] = useState(true);

  const mockCustomers = [
    { id: "C001", name: "Raj Grocery Store", phone: "+91 98765 43210" },
    { id: "C002", name: "Mumbai Mart", phone: "+91 99887 76543" },
    { id: "C003", name: "Delhi Retail", phone: "+91 97654 32109" }
  ];

  const mockProducts = [
    { id: "P001", name: "Basmati Rice Premium", price: 120, stock: 150, unit: "kg" },
    { id: "P002", name: "Sunflower Oil", price: 180, stock: 8, unit: "L" },
    { id: "P003", name: "Wheat Flour", price: 45, stock: 200, unit: "kg" },
    { id: "P004", name: "Sugar", price: 42, stock: 75, unit: "kg" },
    { id: "P005", name: "Toor Dal", price: 160, stock: 5, unit: "kg" }
  ];

  const addToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
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

  return (
    <div className="space-y-6">
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
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                {mockCustomers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                        ₹{product.price}/{product.unit} • Stock: {product.stock}
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
              >
                Generate Bill
              </Button>
              
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm">
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
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
    </div>
  );
}