import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle, Package, Search } from "lucide-react";
import { useState } from "react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  lastRestocked: string;
}

const inventoryItems: InventoryItem[] = [
  {
    id: "1",
    name: "Tomatoes",
    category: "Vegetables",
    currentStock: 12,
    minStock: 20,
    maxStock: 50,
    unit: "kg",
    lastRestocked: "2 days ago",
  },
  {
    id: "2",
    name: "Burger Buns",
    category: "Bakery",
    currentStock: 25,
    minStock: 50,
    maxStock: 150,
    unit: "pcs",
    lastRestocked: "1 day ago",
  },
  {
    id: "3",
    name: "Chicken Breast",
    category: "Meat",
    currentStock: 45,
    minStock: 30,
    maxStock: 80,
    unit: "kg",
    lastRestocked: "Today",
  },
  {
    id: "4",
    name: "Lettuce",
    category: "Vegetables",
    currentStock: 8,
    minStock: 15,
    maxStock: 40,
    unit: "kg",
    lastRestocked: "3 days ago",
  },
  {
    id: "5",
    name: "Cheese",
    category: "Dairy",
    currentStock: 35,
    minStock: 25,
    maxStock: 60,
    unit: "kg",
    lastRestocked: "Today",
  },
];

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.minStock) * 100;
    if (percentage < 80) return { status: "Low", variant: "destructive" as const, icon: AlertTriangle };
    if (percentage >= 100) return { status: "Optimal", variant: "default" as const, icon: CheckCircle };
    return { status: "Warning", variant: "secondary" as const, icon: AlertTriangle };
  };

  const lowStockCount = inventoryItems.filter((item) => item.currentStock < item.minStock).length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
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
            <div className="text-3xl font-bold text-foreground">{inventoryItems.length}</div>
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
            <div className="text-3xl font-bold text-success">
              {inventoryItems.length - lowStockCount}
            </div>
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
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const { status, variant, icon: Icon } = getStockStatus(item);
              const stockPercentage = (item.currentStock / item.maxStock) * 100;

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
                    <Button variant="outline" size="sm">
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
                      <p className="text-xs text-muted-foreground mb-1">Maximum</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.maxStock} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Restocked</p>
                      <p className="text-sm font-semibold text-foreground">{item.lastRestocked}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
