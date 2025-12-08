import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { WalletCard } from "@/components/WalletCard";
import { 
  ArrowLeft, Vault as VaultIcon, Lock, TrendingUp, Clock, 
  Coins, Loader2, CheckCircle, AlertTriangle, DollarSign, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAccount, useBalance } from "wagmi";
import usdtLogo from "@/assets/usdt-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";

interface StakingPlan {
  id: string;
  name: string;
  tier: "bronze" | "silver" | "gold";
  minAmount: number;
  maxAmount: number;
  apy: number;
  lockPeriod: number;
  minPmHold: number;
  maxPoolSize: number;
  currentPoolSize: number;
  color: string;
  gradient: string;
}

interface UserStake {
  planId: string;
  amount: number;
  token: "USDT" | "USDC";
  startDate: Date;
  endDate: Date;
  claimedProfit: number;
  pendingProfit: number;
}

const STAKING_PLANS: StakingPlan[] = [
  {
    id: "bronze",
    name: "Bronze",
    tier: "bronze",
    minAmount: 10,
    maxAmount: 1000,
    apy: 5,
    lockPeriod: 90,
    minPmHold: 100000,
    maxPoolSize: 300000,
    currentPoolSize: 125000,
    color: "text-amber-600",
    gradient: "from-amber-500/20 to-amber-700/20",
  },
  {
    id: "silver",
    name: "Silver",
    tier: "silver",
    minAmount: 1001,
    maxAmount: 10000,
    apy: 6,
    lockPeriod: 90,
    minPmHold: 300000,
    maxPoolSize: 500000,
    currentPoolSize: 280000,
    color: "text-gray-400",
    gradient: "from-gray-400/20 to-gray-600/20",
  },
  {
    id: "gold",
    name: "Gold",
    tier: "gold",
    minAmount: 10001,
    maxAmount: 25000,
    apy: 8,
    lockPeriod: 90,
    minPmHold: 500000,
    maxPoolSize: 1000000,
    currentPoolSize: 450000,
    color: "text-yellow-500",
    gradient: "from-yellow-500/20 to-yellow-600/20",
  },
];

const Vault = () => {
  const { address, isConnected } = useAccount();
  const [selectedPlan, setSelectedPlan] = useState<StakingPlan>(STAKING_PLANS[0]);
  const [stakeAmount, setStakeAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<"USDT" | "USDC">("USDT");
  const [isStaking, setIsStaking] = useState(false);
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [pmBalance, setPmBalance] = useState(150000); // Mock PM balance

  // Calculate pool fill percentage
  const getPoolPercentage = (plan: StakingPlan) => {
    return (plan.currentPoolSize / plan.maxPoolSize) * 100;
  };

  const isPoolFull = (plan: StakingPlan) => {
    return plan.currentPoolSize >= plan.maxPoolSize;
  };

  const hasEnoughPM = (plan: StakingPlan) => {
    return pmBalance >= plan.minPmHold;
  };

  const getDailyProfit = (amount: number, apy: number) => {
    return (amount * (apy / 100)) / 365;
  };

  const handleStake = async () => {
    const amount = parseFloat(stakeAmount);
    
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount < selectedPlan.minAmount || amount > selectedPlan.maxAmount) {
      toast.error(`Amount must be between ${selectedPlan.minAmount} and ${selectedPlan.maxAmount} ${selectedToken}`);
      return;
    }

    if (!hasEnoughPM(selectedPlan)) {
      toast.error(`You need at least ${selectedPlan.minPmHold.toLocaleString()} PM tokens to stake in ${selectedPlan.name} pool`);
      return;
    }

    if (isPoolFull(selectedPlan)) {
      toast.error("This pool is currently full");
      return;
    }

    setIsStaking(true);
    
    try {
      // Simulate staking transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newStake: UserStake = {
        planId: selectedPlan.id,
        amount: amount,
        token: selectedToken,
        startDate: new Date(),
        endDate: new Date(Date.now() + selectedPlan.lockPeriod * 24 * 60 * 60 * 1000),
        claimedProfit: 0,
        pendingProfit: 0,
      };
      
      setUserStakes([...userStakes, newStake]);
      setStakeAmount("");
      toast.success(`Successfully staked ${amount} ${selectedToken} in ${selectedPlan.name} pool!`);
    } catch (error) {
      toast.error("Staking failed. Please try again.");
    } finally {
      setIsStaking(false);
    }
  };

  const handleClaimProfit = (stakeIndex: number) => {
    const stake = userStakes[stakeIndex];
    if (stake.pendingProfit < 10) {
      toast.error("Minimum claim amount is 10 USDT/USDC");
      return;
    }
    
    const afterTax = stake.pendingProfit * 0.95; // 5% withdrawal tax
    toast.success(`Claimed ${afterTax.toFixed(2)} ${stake.token} (after 5% tax)`);
    
    const updatedStakes = [...userStakes];
    updatedStakes[stakeIndex] = {
      ...stake,
      claimedProfit: stake.claimedProfit + stake.pendingProfit,
      pendingProfit: 0,
    };
    setUserStakes(updatedStakes);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "bronze":
        return <Coins className="h-6 w-6 text-amber-600" />;
      case "silver":
        return <Coins className="h-6 w-6 text-gray-400" />;
      case "gold":
        return <Sparkles className="h-6 w-6 text-yellow-500" />;
      default:
        return <Coins className="h-6 w-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="Staking Vault" subtitle="Stake USDT/USDC and earn passive income daily" />

      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        {/* Mobile Wallet Card */}
        <div className="md:hidden mb-6">
          <WalletCard showQuickFunctionsToggle={false} compact={true} />
        </div>

        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="max-w-6xl mx-auto space-y-6">
          {/* PM Balance Info */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your PM Token Balance</p>
                  <p className="text-xl font-bold">{pmBalance.toLocaleString()} PM</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Required for Staking
              </Badge>
            </div>
          </Card>

          {/* Staking Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STAKING_PLANS.map((plan) => {
              const poolPercentage = getPoolPercentage(plan);
              const isFull = isPoolFull(plan);
              const hasRequiredPM = hasEnoughPM(plan);

              return (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                    selectedPlan.id === plan.id
                      ? "ring-2 ring-primary shadow-xl scale-[1.02]"
                      : "hover:shadow-lg"
                  } ${isFull ? "opacity-60" : ""}`}
                  onClick={() => !isFull && setSelectedPlan(plan)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient}`} />
                  
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {getTierIcon(plan.tier)}
                        <h3 className={`text-xl font-bold ${plan.color}`}>{plan.name}</h3>
                      </div>
                      {isFull ? (
                        <Badge variant="destructive">Pool Full</Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">APY</span>
                        <span className="font-bold text-lg text-green-500">{plan.apy}% Monthly</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Stake Range</span>
                        <span className="font-semibold text-sm">
                          ${plan.minAmount.toLocaleString()} - ${plan.maxAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Lock Period</span>
                        <span className="font-semibold text-sm">{plan.lockPeriod} Days</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Min PM Hold</span>
                        <span className={`font-semibold text-sm ${hasRequiredPM ? "text-green-500" : "text-red-500"}`}>
                          {plan.minPmHold.toLocaleString()} PM
                        </span>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Pool Capacity</span>
                          <span>{poolPercentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={poolPercentage} className="h-2" />
                        <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                          <span>${plan.currentPoolSize.toLocaleString()}</span>
                          <span>${plan.maxPoolSize.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Staking Form */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Stake in {selectedPlan.name} Pool
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Select Token</label>
                  <div className="flex gap-3">
                    <Button
                      variant={selectedToken === "USDT" ? "default" : "outline"}
                      onClick={() => setSelectedToken("USDT")}
                      className="flex-1 gap-2"
                    >
                      <img src={usdtLogo} alt="USDT" className="h-5 w-5" />
                      USDT
                    </Button>
                    <Button
                      variant={selectedToken === "USDC" ? "default" : "outline"}
                      onClick={() => setSelectedToken("USDC")}
                      className="flex-1 gap-2"
                    >
                      <img src={usdcLogo} alt="USDC" className="h-5 w-5" />
                      USDC
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
                  <Input
                    type="number"
                    placeholder={`${selectedPlan.minAmount} - ${selectedPlan.maxAmount}`}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: ${selectedPlan.minAmount} | Max: ${selectedPlan.maxAmount}
                  </p>
                </div>

                <Button
                  onClick={handleStake}
                  disabled={isStaking || isPoolFull(selectedPlan) || !hasEnoughPM(selectedPlan) || !isConnected}
                  className="w-full h-12 text-lg"
                >
                  {isStaking ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPoolFull(selectedPlan) ? (
                    "Pool Full"
                  ) : !hasEnoughPM(selectedPlan) ? (
                    `Need ${selectedPlan.minPmHold.toLocaleString()} PM`
                  ) : (
                    `Stake ${selectedToken}`
                  )}
                </Button>
              </div>

              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Earning Estimate
                </h4>
                
                {stakeAmount && parseFloat(stakeAmount) > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily Profit</span>
                      <span className="font-semibold text-green-500">
                        +${getDailyProfit(parseFloat(stakeAmount), selectedPlan.apy).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Profit</span>
                      <span className="font-semibold text-green-500">
                        +${(getDailyProfit(parseFloat(stakeAmount), selectedPlan.apy) * 30).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total ({selectedPlan.lockPeriod} days)</span>
                      <span className="font-bold text-green-500">
                        +${(getDailyProfit(parseFloat(stakeAmount), selectedPlan.apy) * selectedPlan.lockPeriod).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Lock Period: {selectedPlan.lockPeriod} days
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Daily profit withdrawals available
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    Min. 10 USDT/USDC to claim | 5% withdrawal tax
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* User Stakes */}
          {userStakes.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <VaultIcon className="h-5 w-5 text-primary" />
                Your Active Stakes
              </h3>

              <div className="space-y-4">
                {userStakes.map((stake, index) => {
                  const plan = STAKING_PLANS.find(p => p.id === stake.planId);
                  const daysRemaining = Math.ceil((stake.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isUnlocked = daysRemaining <= 0;
                  
                  return (
                    <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={plan?.gradient}>{plan?.name}</Badge>
                          <span className="font-semibold">{stake.amount} {stake.token}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isUnlocked ? (
                            <Badge className="bg-green-500/20 text-green-500">Unlocked</Badge>
                          ) : (
                            <Badge variant="outline">
                              <Lock className="h-3 w-3 mr-1" />
                              {daysRemaining} days left
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Started</p>
                          <p className="font-medium">{stake.startDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unlock Date</p>
                          <p className="font-medium">{stake.endDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Claimed Profit</p>
                          <p className="font-medium text-green-500">${stake.claimedProfit.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pending Profit</p>
                          <p className="font-medium text-yellow-500">${stake.pendingProfit.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleClaimProfit(index)}
                          disabled={stake.pendingProfit < 10}
                          className="flex-1"
                        >
                          Claim Profit
                        </Button>
                        {isUnlocked && (
                          <Button size="sm" variant="outline" className="flex-1">
                            Withdraw Capital
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Vault;