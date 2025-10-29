import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Receipt, CreditCard, Clock } from "lucide-react";
import { useState } from "react";

interface Transaction {
  id: string;
  date: string;
  time: string;
  items: number;
  total: number;
  paymentMethod: string;
  status: "completed" | "pending" | "refunded";
}

const transactions: Transaction[] = [
  {
    id: "TXN-001",
    date: "2025-10-29",
    time: "14:32",
    items: 3,
    total: 42.5,
    paymentMethod: "Credit Card",
    status: "completed",
  },
  {
    id: "TXN-002",
    date: "2025-10-29",
    time: "14:15",
    items: 2,
    total: 27.0,
    paymentMethod: "Cash",
    status: "completed",
  },
  {
    id: "TXN-003",
    date: "2025-10-29",
    time: "13:58",
    items: 5,
    total: 68.75,
    paymentMethod: "Credit Card",
    status: "completed",
  },
  {
    id: "TXN-004",
    date: "2025-10-29",
    time: "13:42",
    items: 1,
    total: 15.0,
    paymentMethod: "Debit Card",
    status: "completed",
  },
  {
    id: "TXN-005",
    date: "2025-10-28",
    time: "18:22",
    items: 4,
    total: 55.25,
    paymentMethod: "Credit Card",
    status: "completed",
  },
];

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = transactions.filter((txn) =>
    txn.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "refunded":
        return "destructive";
      default:
        return "default";
    }
  };

  const totalRevenue = transactions
    .filter((txn) => txn.status === "completed")
    .reduce((sum, txn) => sum + txn.total, 0);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground mt-1">View and manage all sales transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-success/10 to-success/5 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(totalRevenue / transactions.length).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Transactions List */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {filteredTransactions.map((txn) => (
              <div
                key={txn.id}
                className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-foreground">{txn.id}</p>
                        <Badge variant={getStatusColor(txn.status)}>{txn.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {txn.date} at {txn.time} • {txn.items} items • {txn.paymentMethod}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">${txn.total.toFixed(2)}</p>
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
