import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";

export default function Analytics() {
  // State for analytics
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [profit, setProfit] = useState(0);
  const [revenueData, setRevenueData] = useState<any[]>([]); // monthly chart
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      // Load all transactions and items
      const { data: txns } = await supabase
        .from('transactions')
        .select('id, created_at, total_amount')
        .order('created_at');
      const { data: items } = await supabase
        .from('transaction_items')
        .select('transaction_id, product_id, unit_price, total_price, cost, quantity, product_name');
      const { data: prods } = await supabase
        .from('products')
        .select('id, category_id');
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name');
      // Compute totals
      let sumRevenue = 0;
      let sumExpenses = 0;
      let monthly: Record<string, { revenue: number; expenses: number; profit: number }> = {};
      // Build product:category lookup
      const prodCat: Record<string, string> = {};
      for (const p of prods || []) prodCat[p.id] = p.category_id;
      // Build category color
      const colorMap: Record<string, string> = {};
      const catNames: Record<string, string> = {};
      cats?.forEach((c, i) => {
        colorMap[c.id] = `hsl(var(--primary))`;
        catNames[c.id] = c.name;
      });
      // By-category sales aggregate
      const catCounts: Record<string, { name: string, value: number }> = {};
      // By-month data aggregate
      txns?.forEach(t => {
        sumRevenue += Number(t.total_amount || 0);
        const ym = t.created_at ? (new Date(t.created_at).toISOString().slice(0, 7)) : 'Unknown';
        if (!monthly[ym]) monthly[ym] = { revenue: 0, expenses: 0, profit: 0 };
        monthly[ym].revenue += Number(t.total_amount || 0);
      });
      for (const row of items || []) {
        const cost = Number(row.cost || 0) * Number(row.quantity || 1);
        const catId = prodCat[row.product_id];
        sumExpenses += cost;
        // category pies
        if (catId) {
          const label = catNames[catId] || `Cat ${catId}`;
          if (!catCounts[catId]) catCounts[catId] = { name: label, value: 0 };
          catCounts[catId].value += Number(row.total_price || 0);
        }
        // monthlies expenses
        const txn = txns?.find(t => t.id === row.transaction_id);
        const ym = txn?.created_at ? (new Date(txn.created_at).toISOString().slice(0, 7)) : 'Unknown';
        if (!monthly[ym]) monthly[ym] = { revenue: 0, expenses: 0, profit: 0 };
        monthly[ym].expenses += cost;
      }
      // Compute profits
      Object.values(monthly).forEach(m => { m.profit = m.revenue - m.expenses; });
      setRevenue(sumRevenue);
      setExpenses(sumExpenses);
      setProfit(sumRevenue - sumExpenses);
      // Chart data
      setRevenueData(Object.entries(monthly).map(([key, v]) => ({ month: key, ...v })));
      setCategoryData(Object.values(catCounts).map((cat, i) => ({ ...cat, color: `hsl(var(--primary) / ${(0.15 + 0.7*i/(Object.keys(catCounts).length||1)).toFixed(2)})` })));
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics & Insights</h1>
        <p className="text-muted-foreground mt-1">Track your business performance and cashflow</p>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="w-5 h-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">₱{revenue.toLocaleString()}</div>
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>&nbsp;</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                <TrendingDown className="w-5 h-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">₱{expenses.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-1">{revenue ? `${Math.round((expenses/(revenue||1))*100)}% of revenue` : '-'}</p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                <TrendingUp className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">₱{profit.toLocaleString()}</div>
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>&nbsp;</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={3}
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="hsl(var(--success))"
                    strokeWidth={3}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Monthly Cashflow</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(var(--success))" name="Income" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ₱${value.toLocaleString()}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--primary))`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Category Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryData.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-foreground">{category.name}</span>
                      <span className="text-sm font-semibold text-primary">₱{category.value.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.round((category.value/(revenue||1))*100)}%`,
                          backgroundColor: category.color || `hsl(var(--primary))`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
