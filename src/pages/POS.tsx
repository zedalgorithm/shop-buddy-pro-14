import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Minus, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const products = [
  { id: "1", name: "Classic Burger", price: 15, category: "Main" },
  { id: "2", name: "Chicken Wrap", price: 12, category: "Main" },
  { id: "3", name: "Caesar Salad", price: 10, category: "Salads" },
  { id: "4", name: "Fish & Chips", price: 18, category: "Main" },
  { id: "5", name: "Soft Drink", price: 3, category: "Beverages" },
  { id: "6", name: "French Fries", price: 5, category: "Sides" },
];

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: typeof products[0]) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(
      cart
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    toast.success(`Transaction completed! Total: $${total.toFixed(2)}`);
    setCart([]);
  };

  return (
    <div className="h-full flex">
      {/* Products Section */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Point of Sale</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-all border-border"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-6">
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-4xl">🍔</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-card border-l border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Current Order</h2>
          <p className="text-sm text-muted-foreground mt-1">{cart.length} items</p>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground">Cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Add items to start a transaction</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, -1)}
                    className="h-8 w-8"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-medium text-foreground">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateQuantity(item.id, 1)}
                    className="h-8 w-8"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-border space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold text-foreground">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          <Button
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:opacity-90 transition-opacity"
            size="lg"
            onClick={handleCheckout}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Complete Transaction
          </Button>
        </div>
      </div>
    </div>
  );
}
