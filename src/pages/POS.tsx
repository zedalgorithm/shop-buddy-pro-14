import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Minus, Trash2, CreditCard, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface CartItem {
  id: string; // product id
  name: string;
  price: number; // unit selling price from batch
  quantity: number;
  batchId: string;
  unitCost: number;
}

type ProductRow = {
  id: string;
  name: string;
  price: number;
  category?: string;
  image_url?: string | null;
  in_stock?: boolean;
};

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchesByProduct, setBatchesByProduct] = useState<Record<string, Array<{ id: string; remaining: number; cost: number; price: number }>>>({});
  // Tax rate - default 8%, stored in localStorage
  const [taxRate, setTaxRate] = useState<number>(() => {
    const saved = localStorage.getItem('pos_tax_rate');
    return saved ? parseFloat(saved) : 8; // Default 8%
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, image_url, in_stock, category:categories(name)')
          .order('name');
        if (error) throw error;

        const signFromAny = async (value?: string | null): Promise<string | null> => {
          if (!value) return null;

          // If it's an absolute HTTP(S) URL, try to extract a storage path and sign it
          if (value.startsWith('http://') || value.startsWith('https://')) {
            try {
              const url = new URL(value);
              const path = url.pathname;
              const publicPrefix = '/storage/v1/object/public/product-images/';
              const anyPrefix = '/storage/v1/object/product-images/';
              let storagePath = '';
              if (path.includes(publicPrefix)) {
                storagePath = path.substring(path.indexOf(publicPrefix) + publicPrefix.length);
              } else if (path.includes(anyPrefix)) {
                storagePath = path.substring(path.indexOf(anyPrefix) + anyPrefix.length);
              }
              if (storagePath) {
                const { data: signed, error: signedErr } = await supabase.storage
                  .from('product-images')
                  .createSignedUrl(storagePath, 60 * 60);
                if (!signedErr && signed?.signedUrl) return signed.signedUrl;
              }
            } catch {}
            return value; // non-supabase or failed extraction
          }

          // Otherwise treat as storage path like products/file.jpg
          try {
            const { data: signed, error: signedErr } = await supabase.storage
              .from('product-images')
              .createSignedUrl(value, 60 * 60);
            if (!signedErr && signed?.signedUrl) return signed.signedUrl;
          } catch {}
          const { data: pub } = supabase.storage.from('product-images').getPublicUrl(value);
          return pub.publicUrl || null;
        };

        const resolved = await Promise.all((data || []).map(async (p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price) || 0,
          category: p.category?.name || '',
          image_url: await signFromAny(p.image_url),
          in_stock: p.in_stock,
        })));

        setProducts(resolved);

        // Load stock batches for FIFO sales
        const { data: batches, error: bErr } = await supabase
          .from('stock_batches')
          .select('id, product_id, quantity_remaining, cost, price, created_at')
          .gt('quantity_remaining', 0)
          .order('created_at');
        if (bErr) throw bErr;
        const grouped: Record<string, Array<{ id: string; remaining: number; cost: number; price: number }>> = {};
        (batches || []).forEach((b: any) => {
          if (!grouped[b.product_id]) grouped[b.product_id] = [];
          grouped[b.product_id].push({ id: b.id, remaining: b.quantity_remaining, cost: Number(b.cost)||0, price: Number(b.price)||0 });
        });
        setBatchesByProduct(grouped);
      } catch (e) {
        console.error('Failed to load products for POS:', e);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: ProductRow) => {
    const batches = batchesByProduct[product.id] || [];
    const first = batches.find(b => b.remaining > 0);
    if (!first) {
      toast.error('No stock available');
      return;
    }
    // allocate 1 from this batch
    first.remaining -= 1;
    setBatchesByProduct({ ...batchesByProduct });

    // try to find existing cart line for same batch
    const index = cart.findIndex(ci => ci.id === product.id && ci.batchId === first.id);
    if (index >= 0) {
      const next = [...cart];
      next[index] = { ...next[index], quantity: next[index].quantity + 1 };
      setCart(next);
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: first.price || product.price, unitCost: first.cost || 0, batchId: first.id, quantity: 1 }]);
    }
  };

  const updateQuantity = (cartKey: string, change: number) => {
    // cartKey is product id|batch id; we will pass a composite id
    const [productId, batchId] = cartKey.split('|');
    const idx = cart.findIndex(ci => ci.id === productId && ci.batchId === batchId);
    if (idx < 0) return;
    const item = cart[idx];
    const batches = batchesByProduct[productId] || [];
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    if (change > 0) {
      if (batch.remaining <= 0) {
        // try allocate from next available batch, add as a new cart line with its own price
        const nextBatch = batches.find(b => b.remaining > 0);
        if (!nextBatch) {
          toast.warning('No more stock available');
          return;
        }
        nextBatch.remaining -= 1;
        setBatchesByProduct({ ...batchesByProduct });
        setCart([...cart, { id: item.id, name: item.name, price: nextBatch.price || item.price, unitCost: nextBatch.cost || 0, batchId: nextBatch.id, quantity: 1 }]);
      } else {
        batch.remaining -= 1;
        const next = [...cart];
        next[idx] = { ...item, quantity: item.quantity + 1 };
        setCart(next);
        setBatchesByProduct({ ...batchesByProduct });
      }
    } else if (change < 0) {
      if (item.quantity <= 1) {
        // remove and return one to batch
        batch.remaining += 1;
        setCart(cart.filter((_, i) => i !== idx));
        setBatchesByProduct({ ...batchesByProduct });
      } else {
        batch.remaining += 1;
        const next = [...cart];
        next[idx] = { ...item, quantity: item.quantity - 1 };
        setCart(next);
        setBatchesByProduct({ ...batchesByProduct });
      }
    }
  };

  const removeItem = (cartKey: string) => {
    const [productId, batchId] = cartKey.split('|');
    const next: CartItem[] = [];
    let returned = 0;
    cart.forEach(ci => {
      if (ci.id === productId && ci.batchId === batchId) {
        returned += ci.quantity;
      } else {
        next.push(ci);
      }
    });
    if (returned > 0) {
      const batches = batchesByProduct[productId] || [];
      const batch = batches.find(b => b.id === batchId);
      if (batch) batch.remaining += returned;
      setBatchesByProduct({ ...batchesByProduct });
    }
    setCart(next);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * (taxRate / 100); // Use configured tax rate
  const total = subtotal + tax;

  const handleTaxRateChange = (value: string) => {
    const rate = parseFloat(value) || 0;
    if (rate >= 0 && rate <= 100) {
      setTaxRate(rate);
      localStorage.setItem('pos_tax_rate', rate.toString());
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    try {
      // 1. Insert transaction header row
      const { data: trx, error: trxError } = await supabase
        .from('transactions')
        .insert([{
          total_amount: total,
          subtotal,
          tax,
          payment_method: 'cash', // Extend as needed
          status: 'completed',
        }])
        .select()
        .single();
      if (trxError || !trx?.id) {
        toast.error(`Transaction failed. Possible migration/RLS error: ${trxError?.message || trxError || 'No id from insert!'}`);
        console.error('POS: Insert transaction error:', trxError);
        return;
      }

      // 2. Insert each cart line into transaction_items
      for (const ci of cart) {
        const { error: itemError } = await supabase.from('transaction_items').insert({
          transaction_id: trx.id,
          product_id: ci.id,
          batch_id: ci.batchId,
          quantity: ci.quantity,
          unit_price: ci.price,
          total_price: ci.price * ci.quantity,
          cost: ci.unitCost,
          product_name: ci.name,
        });
        if (itemError) {
          toast.error(`Failed to insert transaction_items: ${itemError.message}`);
          console.error('POS: Insert transaction_items error:', itemError);
          return;
        }

        // Stock: decrement batch and product totals
        const { data: batchRow, error: batchFetchError } = await supabase
          .from('stock_batches')
          .select('id, quantity_remaining')
          .eq('id', ci.batchId)
          .single();
        if (batchFetchError) {
          toast.error(`Batch error: ${batchFetchError.message}`);
          console.error('POS: Fetch batch error:', batchFetchError);
          return;
        }
        const remaining = Math.max(0, (batchRow?.quantity_remaining || 0) - ci.quantity);
        const { error: batchUpdError } = await supabase.from('stock_batches').update({ quantity_remaining: remaining }).eq('id', ci.batchId);
        if (batchUpdError) {
          toast.error(`Batch update error: ${batchUpdError.message}`);
          console.error('POS: Batch update error:', batchUpdError);
          return;
        }
      }

      // Update all products stock totals
      const productTotals: Record<string, number> = {};
      for (const ci of cart) {
        productTotals[ci.id] = (productTotals[ci.id] || 0) + ci.quantity;
      }
      for (const [productId, qty] of Object.entries(productTotals)) {
        const { data: prod, error: prodFetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', productId)
          .single();
        if (prodFetchError) {
          toast.error(`Product fetch error: ${prodFetchError.message}`);
          console.error('POS: Product fetch error:', prodFetchError);
          return;
        }
        const newQty = Math.max(0, (prod?.stock_quantity || 0) - qty);
        const { error: prodUpdError } = await supabase.from('products').update({ stock_quantity: newQty, updated_at: new Date().toISOString() }).eq('id', productId);
        if (prodUpdError) {
          toast.error(`Product update error: ${prodUpdError.message}`);
          console.error('POS: Product update error:', prodUpdError);
          return;
        }
      }
      toast.success(`Transaction completed! Total: ₱${total.toFixed(2)}`);
      setCart([]);
    } catch (e: any) {
      toast.error('Checkout failed: ' + (e?.message || e));
      console.error('Checkout failed', e);
      if (e?.message?.includes('permission')) {
        toast.error('Check your Supabase table RLS and policy setup for transactions and transaction_items.');
      }
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Products Section */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Point of Sale</h1>
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

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-all border-border"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-6">
                  <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = ''; }} />
                    ) : (
                      <Package className="w-10 h-10 text-primary/60" />
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{product.category || 'Uncategorized'}</p>
                  <p className="text-xl font-bold text-primary">
                    ₱{(() => {
                      const batches = batchesByProduct[product.id] || [];
                      const first = batches.find(b => b.remaining > 0);
                      const price = first ? (first.price || product.price) : product.price;
                      return price.toFixed(2);
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cost ₱{(() => {
                      const batches = batchesByProduct[product.id] || [];
                      const first = batches.find(b => b.remaining > 0);
                      const cost = first ? (first.cost || 0) : 0;
                      return cost.toFixed(2);
                    })()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col max-h-[50vh] lg:max-h-full">
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
              <div key={`${item.id}|${item.batchId}`} className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">₱{item.price.toFixed(2)} each · Cost ₱{item.unitCost.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateQuantity(`${item.id}|${item.batchId}`, -1)}
                    className="h-8 w-8"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-medium text-foreground">{item.quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => updateQuantity(`${item.id}|${item.batchId}`, 1)}
                    className="h-8 w-8"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => removeItem(`${item.id}|${item.batchId}`)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-border space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-muted-foreground">Tax</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => handleTaxRateChange(e.target.value)}
                  className="w-16 h-7 text-xs"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <span className="text-muted-foreground">₱{tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold text-foreground">
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
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
