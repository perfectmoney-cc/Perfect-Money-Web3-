import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { WalletCard } from "@/components/WalletCard";
import { ArrowLeft, Users, Copy, Gift, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
const ReferralPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const referralsPerPage = 10;

  // Simulated connected wallet address
  const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  const referralCode = walletAddress;
  const referralLink = `https://perfectmoney.cc/ref/${referralCode}`;

  // Get referrals from localStorage (default to empty array)
  const allReferrals = JSON.parse(localStorage.getItem("referrals") || "[]");
  const totalPages = Math.ceil(allReferrals.length / referralsPerPage);
  const startIndex = (currentPage - 1) * referralsPerPage;
  const currentReferrals = allReferrals.slice(startIndex, startIndex + referralsPerPage);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  return <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="Referral Program" subtitle="Earn rewards by inviting friends to Perfect Money" />
      
      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        {/* Mobile Wallet Card */}
        <div className="md:hidden mt-5 mb-6">
          <WalletCard showQuickFunctionsToggle={false} compact={true} />
        </div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Referral Dashboard</h1>
              <p className="text-muted-foreground">Share and earn together</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <Users className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-1 text-xl">{allReferrals.length}</h3>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <Gift className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-1 text-xl">{allReferrals.length * 10} PM</h3>
              <p className="text-sm text-muted-foreground">Earned Rewards</p>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm">
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-1 text-xl">{allReferrals.filter((r: any) => r.daysAgo <= 30).length}</h3>
              <p className="text-sm text-muted-foreground">Active This Month</p>
            </Card>
          </div>

          <Card className="p-8 bg-card/50 backdrop-blur-sm mb-6">
            <h2 className="font-bold mb-4 text-lg">Your Referral Link</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="font-mono text-xs sm:text-sm" />
                <Button variant="outline" onClick={() => copyToClipboard(referralLink)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-semibold mb-2 text-sm">Referral Code (Your Wallet)</h3>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-primary break-all">{referralCode}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(referralCode)} className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <h3 className="font-semibold mb-2 text-green-500 text-sm">🎁 Earn 10% Referral Rewards</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="text-xs">• 10% from Token Presale purchases</li>
                  <li>• 10% from Airdrop claims</li>
                  <li>• 10% from Merchant subscriptions</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm mb-6">
            <h2 className="text-xl font-bold mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Share Your Link</h3>
                  <p className="text-sm text-muted-foreground">Send your unique referral link to friends and family</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">They Sign Up</h3>
                  <p className="text-sm text-muted-foreground">Your referrals create an account using your link</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Earn Rewards</h3>
                  <p className="text-sm text-muted-foreground">Get 10 PM tokens for each successful referral</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Referrals</h2>
              {totalPages > 0 && <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>}
            </div>
            <div className="space-y-3 mb-4">
              {currentReferrals.length === 0 ? <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No referrals yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Share your referral link to start earning rewards</p>
                </div> : currentReferrals.map((referral: any) => <div key={referral.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">{referral.user}</p>
                      <p className="text-sm text-muted-foreground">{referral.daysAgo} days ago</p>
                    </div>
                    <span className="font-bold text-primary">+{referral.reward}</span>
                  </div>)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({
                length: totalPages
              }, (_, i) => i + 1).map(page => <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="w-8 h-8 p-0">
                      {page}
                    </Button>)}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>}
          </Card>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>;
};
export default ReferralPage;