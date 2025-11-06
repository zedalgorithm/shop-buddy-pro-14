import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Receipt, CreditCard, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  created_at: string;
  items: number;
  total: number;
  paymentMethod: string | null;
  status: string;
  details?: any[]; // optional for transaction_items per transaction
}

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTxns = async () => {
      setLoading(true);
      // Fetch transactions with items count
      const { data: trx, error } = await supabase
        .from('transactions')
        .select('id, created_at, total_amount, payment_method, status')
        .order('created_at', { ascending: false });
      if (error) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      // Get item totals in a single query per transaction
      const txns: Transaction[] = [];
      for (const t of trx || []) {
        let items = 0;
        let total = Number(t.total_amount || 0);
        // Fetch all transaction_items (with product_name/qty/price) for each transaction
        const { data: itemsRows, error: itemErr } = await supabase
          .from('transaction_items')
          .select('product_name, quantity, unit_price')
          .eq('transaction_id', t.id);
        items = (itemsRows || []).reduce((s, i) => s + Number(i.quantity), 0);
        txns.push({
          id: t.id,
          created_at: t.created_at,
          items,
          total,
          paymentMethod: t.payment_method,
          status: t.status,
          details: itemsRows || [],
        });
      }
      setTransactions(txns);
      setLoading(false);
    };
    fetchTxns();
  }, []);

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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground mt-1">View and manage all sales transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
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
                <p className="text-2xl font-bold text-foreground">₱{totalRevenue.toFixed(2)}</p>
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
                  ₱{(totalRevenue / transactions.length).toFixed(2)}
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
            {loading ? (
              <div className='flex justify-center items-center h-48'>Loading…</div>
            ) : filteredTransactions.map((txn) => {

                const d = new Date(txn.created_at);
                const date = d.toLocaleDateString();
                const time = d.toLocaleTimeString();
                // Concatenate product_names as headline
                const productNamesArr = (txn.details || []).map(item => item.product_name);
                const productNames = productNamesArr.join(', ') || '(No Products)';
                return (
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
                            <p className="font-semibold text-foreground">{productNames}</p>
                            <Badge variant={getStatusColor(txn.status)}>{txn.status}</Badge>
                          </div>
                          {/* Transaction ID in subdued style */}
                          <p className="text-xs text-muted-foreground break-all mb-1">
                            {txn.id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {date} at {time} • {txn.items} items • {txn.paymentMethod || 'Unknown'}
                          </p>
                          {/* Only show product list if multi-product txn; otherwise, headline handles it */}
                          {productNamesArr.length > 1 && (
                            <ul className="pl-3 mt-1 text-xs text-foreground/90 space-y-1">
                              {(txn.details || []).map((row: any, i: number) => (
                                <li key={i} className="flex justify-between">
                                  <span>{row.product_name}</span>
                                  <span>x{row.quantity} • ₱{(row.unit_price || 0).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">₱{txn.total.toFixed(2)}</p>
                      </div>
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
