import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Package, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  // Live stats
  const [revenue, setRevenue] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [avgTransaction, setAvgTransaction] = useState(0);
  const [stockTotal, setStockTotal] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      // Transactions
      const { data: txns } = await supabase
        .from('transactions')
        .select('id, created_at, total_amount')
        .order('created_at');
      const { data: items } = await supabase
        .from('transaction_items')
        .select('product_name, quantity, total_price, transaction_id');
      // Fetch inventory data same way as Inventory page
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, stock_quantity, low_stock_threshold, updated_at, categories(name)')
        .order('name');
      // Revenue, count, avg
      const txRevenue = txns?.reduce((sum, t) => sum + Number(t.total_amount||0), 0) || 0;
      setRevenue(txRevenue);
      setTransactionCount(txns?.length || 0);
      setAvgTransaction(txns && txns.length ? txRevenue / txns.length : 0);
      // Stock total - count of products with stock > 0 (same as Inventory page logic)
      setStockTotal((prods||[]).filter(p => Number(p.stock_quantity||0) > 0).length);
      // Low stock - same filter logic as Inventory page
      const lowStock = (prods||[]).filter(p => {
        const currentStock = Number(p.stock_quantity) || 0;
        const minStock = Number(p.low_stock_threshold) || 10;
        return currentStock < minStock;
      });
      setLowStockItems(lowStock.map((p: any) => ({
        id: p.id,
        name: p.name,
        stock_quantity: Number(p.stock_quantity) || 0,
        low_stock_threshold: Number(p.low_stock_threshold) || 10,
        unit: 'units',
        category: (p.categories as any)?.name || 'Uncategorized',
      })));
      // Sales by week or day
      const weekData: Record<string, { name: string; sales: number }> = {};
      for (const t of txns || []) {
        const d = new Date(t.created_at);
        // Use week string or day for tight hist
        const weekKey = `${d.getFullYear()}-W${Math.ceil((d.getDate()-(d.getDay()||7-1))/7)}`;
        if (!weekData[weekKey]) weekData[weekKey] = { name: weekKey, sales: 0 };
        weekData[weekKey].sales += Number(t.total_amount||0);
      }
      setSalesData(Object.values(weekData));
      // Top products (by sold quantity, last N periods)
      const productSold: Record<string, { name: string, sold: number, revenue: number }> = {};
      for (const row of items || []) {
        if (!productSold[row.product_name]) productSold[row.product_name] = { name: row.product_name, sold: 0, revenue: 0 };
        productSold[row.product_name].sold += Number(row.quantity||0);
        productSold[row.product_name].revenue += Number(row.total_price||0);
      }
      setTopProducts(Object.values(productSold).sort((a,b)=>b.sold-a.sold).slice(0, 8));
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Overview of your business performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">₱{revenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <TrendingUp className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{transactionCount}</div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products in Stock</CardTitle>
            <Package className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{stockTotal}</div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowDownRight className="w-4 h-4 text-warning" />
              <span>{lowStockItems.length} items low stock</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Transaction</CardTitle>
            <DollarSign className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">₱{isNaN(avgTransaction) ? '0' : avgTransaction.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Chart */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Weekly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Bar dataKey="sold" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      <Card className="border-warning shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No low stock items. All products are well stocked!</p>
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.stock_quantity || 0} {item.unit || 'units'} | Minimum: {item.low_stock_threshold || 10} {item.unit || 'units'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-warning">
                      {item.stock_quantity && item.low_stock_threshold ? Math.round((Number(item.stock_quantity) / (Number(item.low_stock_threshold)||1)) * 100) : 0}% of minimum
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
