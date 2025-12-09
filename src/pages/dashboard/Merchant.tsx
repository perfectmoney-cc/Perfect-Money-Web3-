import { useState, useEffect } from "react";
import pmLogo from "@/assets/pm-logo-new.png";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { MerchantSubscriptionModal } from "@/components/MerchantSubscriptionModal";
import { WalletCard } from "@/components/WalletCard";
import { RevenueChart } from "@/components/merchant/RevenueChart";
import { 
  ArrowLeft, Store, QrCode, Link as LinkIcon, ChevronLeft, ChevronRight, Eye, 
  Ticket, Users, TrendingUp, Zap, Shield, Globe, Smartphone, CreditCard, 
  BarChart3, MessageSquare, Bell, Megaphone
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAccount } from "wagmi";

const MerchantPage = () => {
  const { address, isConnected } = useAccount();
  const walletAddress = address || "";
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [subscriptionPlan, setSubscriptionPlan] = useState("Professional");
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [apiKey, setApiKey] = useState("");
  const navigate = useNavigate();
  const transactionsPerPage = 10;

  // Check wallet subscription on mount and when wallet changes
  useEffect(() => {
    if (isConnected && walletAddress) {
      const subscriptions = JSON.parse(localStorage.getItem("merchantSubscriptions") || "{}");
      const subscription = subscriptions[walletAddress];
      
      if (subscription && subscription.subscribed) {
        setIsSubscribed(true);
        setSubscriptionPlan(subscription.plan);
        setSubscriptionExpiry(new Date(subscription.expiry));
      } else {
        setIsSubscribed(false);
        setShowSubscriptionModal(true);
      }
    } else {
      setIsSubscribed(false);
      setShowSubscriptionModal(true);
    }
  }, [isConnected, walletAddress]);

  // Generate API key on subscription (with real-time generation)
  useEffect(() => {
    if (isSubscribed && walletAddress) {
      const storedKeys = JSON.parse(localStorage.getItem("merchantApiKeys") || "{}");
      
      if (storedKeys[walletAddress]) {
        // Use existing API key
        setApiKey(storedKeys[walletAddress]);
      } else {
        // Generate new API key in real-time
        toast.info("Generating your API key...");
        
        // Simulate real-time generation with progressive updates
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          if (progress <= 80) {
            toast.info(`Generating API key... ${progress}%`);
          }
        }, 300);

        setTimeout(() => {
          clearInterval(interval);
          
          // Generate actual API key
          const newKey = `pm_live_${Math.random().toString(36).substr(2, 24)}${Date.now().toString(36)}`;
          storedKeys[walletAddress] = newKey;
          localStorage.setItem("merchantApiKeys", JSON.stringify(storedKeys));
          setApiKey(newKey);
          
          toast.success("API key generated successfully!");
        }, 1500);
      }
    }
  }, [isSubscribed, walletAddress]);

  // Calculate time remaining for subscription
  useEffect(() => {
    if (subscriptionExpiry && isSubscribed) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const expiryTime = subscriptionExpiry.getTime();
        const difference = expiryTime - now;

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          
          setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining("Expired");
          setIsSubscribed(false);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [subscriptionExpiry, isSubscribed]);

  const handleSubscribe = (plan: string, walletAddress: string) => {
    setIsSubscribed(true);
    setSubscriptionPlan(plan);
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    setSubscriptionExpiry(expiry);
    
    // Store subscription with wallet address
    const subscriptions = JSON.parse(localStorage.getItem("merchantSubscriptions") || "{}");
    subscriptions[walletAddress] = {
      plan,
      expiry: expiry.toISOString(),
      subscribed: true
    };
    localStorage.setItem("merchantSubscriptions", JSON.stringify(subscriptions));
  };

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

  const totalPages = Math.ceil(merchantTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const transactions = merchantTransactions.slice(startIndex, startIndex + transactionsPerPage);

  if (!isSubscribed) {
    return (
      <>
        <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
          <Header />
          <TradingViewTicker />
          <HeroBanner 
            title="Merchant Portal" 
            subtitle="Accept PM token payments for your business"
          />
          
          <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
            {/* Mobile Wallet Card */}
            <div className="md:hidden mb-6">
              <WalletCard showQuickFunctionsToggle={false} compact={true} />
            </div>
            <div className="max-w-4xl mx-auto text-center">
              <Card className="p-12 bg-card/50 backdrop-blur-sm">
                <Store className="h-16 w-16 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Merchant Subscription Required</h2>
                <p className="text-muted-foreground mb-8">
                  Subscribe to one of our merchant plans to start accepting PM token payments
                </p>
                <Button 
                  variant="gradient" 
                  size="lg"
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  View Subscription Plans
                </Button>
              </Card>
            </div>
          </main>

          <Footer />
          <MobileBottomNav />
        </div>
        
        <MerchantSubscriptionModal
          open={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          onSubscribe={handleSubscribe}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner 
        title="Merchant Portal" 
        subtitle="Accept PM token payments for your business"
      />
      
      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        {/* Mobile Wallet Card */}
        <div className="md:hidden mb-6">
          <WalletCard showQuickFunctionsToggle={false} compact={true} />
        </div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Merchant Dashboard</h1>
                <p className="text-sm lg:text-base text-muted-foreground">Manage your payment gateway</p>
              </div>
            </div>

            {/* Subscription Status */}
            <Card className="p-4 lg:p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 w-full lg:w-auto">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-sm font-medium text-muted-foreground">{subscriptionPlan} Plan</p>
                </div>
                <div className="p-3 rounded-lg bg-background/50 backdrop-blur-sm">
                  <p className="text-xs text-muted-foreground mb-1">Time Until Expiry</p>
                  <p className="text-xl lg:text-2xl font-bold text-primary tabular-nums">{timeRemaining}</p>
                </div>
                <p className="text-xs text-muted-foreground">Renews Annually</p>
              </div>
            </Card>
          </div>

          {/* Revenue Chart */}
          <div className="mb-6">
            <RevenueChart />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            <Card className="p-4 lg:p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-3">
                <img src={pmLogo} alt="PM" className="h-8 w-8" />
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate('/dashboard/merchant/transactions')}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-xl lg:text-2xl">12,450</h3>
                <img src={pmLogo} alt="PM" className="h-4 w-4" />
                <span className="font-bold text-sm">PM</span>
              </div>
              <p className="text-xs lg:text-sm text-muted-foreground">Total Revenue</p>
            </Card>

            <Card className="p-4 lg:p-6 bg-card/50 backdrop-blur-sm">
              <div className="flex items-start justify-between mb-3">
                <Store className="h-8 w-8 text-primary" />
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate('/dashboard/merchant/transactions')}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="font-bold text-xl lg:text-2xl mb-1">156</h3>
              <p className="text-xs lg:text-sm text-muted-foreground">Transactions</p>
            </Card>

            <Card className="p-4 lg:p-6 bg-card/50 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between mb-3">
                <LinkIcon className="h-8 w-8 text-primary" />
                <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate('/dashboard/merchant/links')}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="font-bold text-xl lg:text-2xl mb-1">8</h3>
              <p className="text-xs lg:text-sm text-muted-foreground">Active Links</p>
            </Card>
          </div>

          <Card className="p-8 bg-card/50 backdrop-blur-sm mb-6">
            <h2 className="text-xl font-bold mb-4">Payment Integration</h2>
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">API Key</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      toast.success("API key copied!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <code className="text-sm text-muted-foreground font-mono break-all">{apiKey || "Generating..."}</code>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="gradient" 
                  size="sm"
                  className="text-xs lg:text-sm"
                  onClick={() => navigate('/dashboard/merchant/generate-qr')}
                >
                  <QrCode className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Generate</span> QR
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs lg:text-sm"
                  onClick={() => navigate('/dashboard/merchant/create-link')}
                >
                  <LinkIcon className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Create</span> Link
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs lg:text-sm"
                  onClick={() => navigate('/dashboard/merchant/api')}
                >
                  <Globe className="h-4 w-4 mr-1 lg:mr-2" />
                  API
                </Button>
              </div>
            </div>
          </Card>

          {/* Voucher Admin Section */}
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Ticket className="h-5 w-5 text-purple-500" />
                Voucher Management
              </h2>
              <Badge className="bg-purple-500/20 text-purple-500">Merchant Feature</Badge>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Create and distribute digital vouchers to attract and retain customers.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard/voucher')}
                className="border-purple-500/30 hover:bg-purple-500/10"
              >
                <Ticket className="h-4 w-4 mr-2" />
                View Vouchers
              </Button>
              <Button 
                variant="gradient"
                onClick={() => navigate('/dashboard/voucher/admin')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Voucher Admin
              </Button>
            </div>
          </Card>

          {/* Recommendations Section */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Recommended Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => navigate('/dashboard/merchant/multi-currency')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Globe className="h-4 w-4 text-blue-500" />
                  </div>
                  <h3 className="font-semibold">Enable Multi-Currency</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Accept payments in BNB, USDT, USDC alongside PM tokens
                </p>
              </div>
              
              <div 
                className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => navigate('/dashboard/merchant/loyalty')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <h3 className="font-semibold">Launch Loyalty Program</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reward repeat customers with PM token cashback
                </p>
              </div>
              
              <div 
                className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => navigate('/dashboard/merchant/pos')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Smartphone className="h-4 w-4 text-purple-500" />
                  </div>
                  <h3 className="font-semibold">POS Integration</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect your physical store with our mobile POS app
                </p>
              </div>
              
              <div 
                className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => navigate('/dashboard/merchant/recurring')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <CreditCard className="h-4 w-4 text-orange-500" />
                  </div>
                  <h3 className="font-semibold">Recurring Payments</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Set up subscription billing for your services
                </p>
              </div>
              
              <div 
                className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => navigate('/dashboard/merchant/analytics')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <BarChart3 className="h-4 w-4 text-cyan-500" />
                  </div>
                  <h3 className="font-semibold">Advanced Analytics</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get detailed insights on customer behavior and sales trends
                </p>
              </div>
              
              <div 
                className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => navigate('/dashboard/merchant/promotions')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-pink-500/20">
                    <Megaphone className="h-4 w-4 text-pink-500" />
                  </div>
                  <h3 className="font-semibold">Promotion Tools</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Create flash sales and limited-time offers easily
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Customer Insights
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold text-primary">--</p>
                <p className="text-xs text-muted-foreground">Total Customers</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold text-green-500">--</p>
                <p className="text-xs text-muted-foreground">Repeat Rate</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold text-blue-500">--</p>
                <p className="text-xs text-muted-foreground">Avg. Order Value</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold text-yellow-500">--</p>
                <p className="text-xs text-muted-foreground">Customer Rating</p>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Analytics will populate as you receive more transactions
            </p>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium">Payment #{transaction.id}</p>
                        <p className="text-sm text-muted-foreground">{transaction.time}</p>
                      </div>
                      <span className="font-bold text-primary">+{transaction.amount} PM</span>
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

export default MerchantPage;
