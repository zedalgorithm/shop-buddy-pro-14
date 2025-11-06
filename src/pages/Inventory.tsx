import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle, Package, Search, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number; // low_stock_threshold
  unit: string;
  lastRestocked?: string | null;
}

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockType, setRestockType] = useState<'add' | 'remove'>('add');
  const [restockQty, setRestockQty] = useState<number | ''>('');
  const [restockCost, setRestockCost] = useState<number | ''>('');
  const [restockPrice, setRestockPrice] = useState<number | ''>('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, stock_quantity, low_stock_threshold, updated_at, categories(name)')
          .order('name');
        if (error) throw error;

        const mapped: InventoryItem[] = (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.categories?.name || 'Uncategorized',
          currentStock: Number(p.stock_quantity) || 0,
          minStock: Number(p.low_stock_threshold) || 10,
          unit: 'units',
          lastRestocked: p.updated_at || null,
        }));
        setItems(mapped);
      } catch (e) {
        console.error('Failed to fetch inventory:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const openRestock = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockType('add');
    setRestockQty('');
    setRestockCost('');
    setRestockPrice('');
    setRestockOpen(true);
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const qty = restockQty === '' ? 0 : Math.max(0, Number(restockQty));
    const delta = restockType === 'add' ? qty : -qty;
    const newQty = Math.max(0, (restockItem.currentStock || 0) + delta);
    try {
      const updatePayload: Record<string, any> = { stock_quantity: newQty, updated_at: new Date().toISOString() };
      if (restockCost !== '' && !Number.isNaN(restockCost)) updatePayload.cost = Number(restockCost);
      if (restockPrice !== '' && !Number.isNaN(restockPrice)) updatePayload.price = Number(restockPrice);

      const { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', restockItem.id);
      if (error) throw error;

      // If adding stock, create a stock batch for FIFO sales
      if (restockType === 'add' && qty > 0) {
        // Load current product cost/price as defaults
        const { data: prodRow } = await supabase
          .from('products')
          .select('cost, price')
          .eq('id', restockItem.id)
          .single();
        const defaultCost = Number(prodRow?.cost ?? 0);
        const defaultPrice = Number(prodRow?.price ?? 0);

        const batch = {
          product_id: restockItem.id,
          quantity_remaining: qty,
          cost: restockCost === '' ? defaultCost : Number(restockCost),
          price: restockPrice === '' ? defaultPrice : Number(restockPrice),
        };
        await supabase.from('stock_batches').insert([batch]);
      }
      // update local state
      setItems(prev => prev.map(i => i.id === restockItem.id ? { ...i, currentStock: newQty } : i));
      setRestockOpen(false);
    } catch (err) {
      console.error('Failed to restock:', err);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (item: InventoryItem) => {
    const percentage = item.minStock > 0 ? (item.currentStock / item.minStock) * 100 : 100;
    if (percentage < 80) return { status: "Low", variant: "destructive" as const, icon: AlertTriangle };
    if (percentage >= 100) return { status: "Optimal", variant: "default" as const, icon: CheckCircle };
    return { status: "Warning", variant: "secondary" as const, icon: AlertTriangle };
  };

  const lowStockCount = items.filter((item) => item.currentStock < item.minStock).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inventory Management</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage your stock levels</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            <Package className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{items.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Across all categories</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{lowStockCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Items need reordering</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Optimal Stock</CardTitle>
            <CheckCircle className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{items.length - lowStockCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Items well stocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Inventory List */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const { status, variant, icon: Icon } = getStockStatus(item);
              const stockPercentage = Math.min((item.currentStock / Math.max(item.minStock, 1)) * 100, 100);

              return (
                <div key={item.id} className="p-4 bg-secondary rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <Badge variant={variant}>
                          <Icon className="w-3 h-3 mr-1" />
                          {status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openRestock(item)}>
                      Restock
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.currentStock} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Minimum</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.minStock} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                      <p className="text-sm font-semibold text-foreground">{item.lastRestocked ? new Date(item.lastRestocked).toLocaleString() : '—'}</p>
                    </div>
                  </div>

                  {/* Stock Level Bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        status === "Low"
                          ? "bg-destructive"
                          : status === "Warning"
                          ? "bg-warning"
                          : "bg-success"
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {restockItem ? restockItem.name : ''}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Action</Label>
                <div className="mt-2 flex gap-2">
                  <Button type="button" variant={restockType === 'add' ? 'default' : 'outline'} onClick={() => setRestockType('add')}>Add</Button>
                  <Button type="button" variant={restockType === 'remove' ? 'default' : 'outline'} onClick={() => setRestockType('remove')}>Remove</Button>
                </div>
              </div>
              <div>
                <Label htmlFor="qty">Quantity</Label>
                <Input id="qty" type="number" min={0} value={restockQty} onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') { setRestockQty(''); return; }
                  const n = Number(v);
                  if (!Number.isNaN(n)) setRestockQty(n);
                }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost">New Bought Price (Cost)</Label>
                <Input id="cost" type="number" step="0.01" min={0} value={restockCost} onChange={(e) => setRestockCost(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Leave blank to keep current" />
              </div>
              <div>
                <Label htmlFor="price">New Selling Price</Label>
                <Input id="price" type="number" step="0.01" min={0} value={restockPrice} onChange={(e) => setRestockPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Leave blank to keep current" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRestockOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
