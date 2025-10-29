import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Receipt, Box } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "POS", href: "/pos", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: Box },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Transactions", href: "/transactions", icon: Receipt },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-secondary">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            StockFlow POS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Inventory & Sales</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
