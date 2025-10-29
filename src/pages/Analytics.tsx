import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react";
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

const revenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
  { month: "Feb", revenue: 52000, expenses: 35000, profit: 17000 },
  { month: "Mar", revenue: 48000, expenses: 33000, profit: 15000 },
  { month: "Apr", revenue: 61000, expenses: 38000, profit: 23000 },
  { month: "May", revenue: 55000, expenses: 36000, profit: 19000 },
  { month: "Jun", revenue: 67000, expenses: 40000, profit: 27000 },
];

const categoryData = [
  { name: "Main Dishes", value: 45, color: "hsl(var(--primary))" },
  { name: "Beverages", value: 20, color: "hsl(var(--success))" },
  { name: "Sides", value: 18, color: "hsl(var(--warning))" },
  { name: "Desserts", value: 17, color: "hsl(var(--accent))" },
];

const cashflowData = [
  { date: "Week 1", income: 15200, expenses: 9800 },
  { date: "Week 2", income: 18400, expenses: 11200 },
  { date: "Week 3", income: 16800, expenses: 10500 },
  { date: "Week 4", income: 20100, expenses: 12300 },
];

export default function Analytics() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Analytics & Insights</h1>
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
                <div className="text-3xl font-bold text-foreground">$328,000</div>
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+18.2% from last period</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                <TrendingDown className="w-5 h-5 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">$214,000</div>
                <p className="text-sm text-muted-foreground mt-1">65% of revenue</p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                <TrendingUp className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">$114,000</div>
                <p className="text-sm text-success flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>+24.5% from last period</span>
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
              <CardTitle className="text-foreground">Weekly Cashflow</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(var(--success))" name="Income" radius={[8, 8, 0, 0]} />
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
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                      <span className="text-sm font-semibold text-primary">{category.value}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${category.value}%`,
                          backgroundColor: category.color,
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
