import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { WalletCard } from "@/components/WalletCard";
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";

const MerchantTransactions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const transactionsPerPage = 10;

  const [merchantTransactions, setMerchantTransactions] = useState<any[]>(() => {
    const stored = localStorage.getItem("merchantTransactions");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    const updateTransactions = () => {
      const stored = localStorage.getItem("merchantTransactions");
      if (stored) {
        setMerchantTransactions(JSON.parse(stored));
      }
    };

    window.addEventListener("merchantTransactionUpdate", updateTransactions);
    return () => window.removeEventListener("merchantTransactionUpdate", updateTransactions);
  }, []);

  const filteredTransactions = merchantTransactions.filter(t => 
    t.id?.toString().includes(searchQuery) || 
    t.amount?.toString().includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const transactions = filteredTransactions.slice(startIndex, startIndex + transactionsPerPage);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner 
        title="Merchant Transactions" 
        subtitle="View all your payment transactions"
      />
      
      <main className="container mx-auto px-4 pt-6 lg:pt-12 pb-12 flex-1">
        <div className="md:hidden mb-6">
          <WalletCard showQuickFunctionsToggle={false} compact={true} />
        </div>

        <Link to="/dashboard/merchant" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Merchant
        </Link>

        <div className="max-w-4xl mx-auto">
          <Card className="p-4 lg:p-6 bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold">All Transactions</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 lg:p-4 border border-border rounded-lg">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">Payment #{transaction.id}</p>
                        <p className="text-sm text-muted-foreground">{transaction.time}</p>
                        {transaction.sender && (
                          <p className="text-xs text-muted-foreground truncate">From: {transaction.sender}</p>
                        )}
                      </div>
                      <span className="font-bold text-primary ml-4">+{transaction.amount} PM</span>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default MerchantTransactions;
