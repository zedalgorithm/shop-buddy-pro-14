import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Package, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const salesData = [
  { name: "Mon", sales: 4200 },
  { name: "Tue", sales: 3800 },
  { name: "Wed", sales: 5200 },
  { name: "Thu", sales: 4600 },
  { name: "Fri", sales: 6800 },
  { name: "Sat", sales: 7200 },
  { name: "Sun", sales: 5400 },
];

const topProducts = [
  { name: "Classic Burger", sold: 145, revenue: 2175 },
  { name: "Chicken Wrap", sold: 128, revenue: 1920 },
  { name: "Caesar Salad", sold: 98, revenue: 1470 },
  { name: "Fish & Chips", sold: 87, revenue: 1305 },
];

const lowStockItems = [
  { name: "Tomatoes", current: 12, minimum: 20, unit: "kg" },
  { name: "Burger Buns", current: 25, minimum: 50, unit: "pcs" },
  { name: "Lettuce", current: 8, minimum: 15, unit: "kg" },
];

export default function Dashboard() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your business performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="w-5 h-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$12,456</div>
            <p className="text-sm text-success flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+12.5% from last week</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <TrendingUp className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">458</div>
            <p className="text-sm text-success flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+8.2% from last week</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products in Stock</CardTitle>
            <Package className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">342</div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <ArrowDownRight className="w-4 h-4 text-warning" />
              <span>3 items low stock</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Transaction</CardTitle>
            <DollarSign className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$27.19</div>
            <p className="text-sm text-success flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>+3.1% from last week</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            {lowStockItems.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Current: {item.current} {item.unit} | Minimum: {item.minimum} {item.unit}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-warning">
                    {Math.round((item.current / item.minimum) * 100)}% of minimum
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
