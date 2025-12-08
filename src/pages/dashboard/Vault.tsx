import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, parseEther } from "viem";
import { CONTRACT_ADDRESSES, PM_TOKEN_ADDRESS } from "@/contracts/addresses";
import usdtLogo from "@/assets/usdt-logo.png";
import usdcLogo from "@/assets/usdc-logo.png";

interface StakingPlan {
  id: number;
  name: string;
  tier: "bronze" | "silver" | "gold";
  minAmount: number;
  maxAmount: number;
  monthlyRate: number;
  lockPeriod: number;
  minPmHold: number;
  maxPoolSize: number;
  currentPoolSize: number;
  color: string;
  gradient: string;
}

interface UserStake {
  planId: number;
  amount: number;
  token: "USDT" | "USDC";
  startTime: number;
  endTime: number;
  claimedProfit: number;
  isActive: boolean;
}

const STAKING_PLANS: StakingPlan[] = [
  {
    id: 0,
    name: "Bronze",
    tier: "bronze",
    minAmount: 10,
    maxAmount: 1000,
    monthlyRate: 5,
    lockPeriod: 90,
    minPmHold: 100000,
    maxPoolSize: 300000,
    currentPoolSize: 125000,
    color: "text-amber-600",
    gradient: "from-amber-500/20 to-amber-700/20",
  },
  {
    id: 1,
    name: "Silver",
    tier: "silver",
    minAmount: 1001,
    maxAmount: 10000,
    monthlyRate: 6,
    lockPeriod: 90,
    minPmHold: 300000,
    maxPoolSize: 500000,
    currentPoolSize: 280000,
    color: "text-gray-400",
    gradient: "from-gray-400/20 to-gray-600/20",
  },
  {
    id: 2,
    name: "Gold",
    tier: "gold",
    minAmount: 10001,
    maxAmount: 25000,
    monthlyRate: 8,
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
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Get PM token balance
  const { data: pmTokenBalance } = useBalance({
    address: address,
    token: PM_TOKEN_ADDRESS as `0x${string}`,
    chainId: 56,
  });

  const pmBalance = pmTokenBalance ? parseFloat(pmTokenBalance.formatted) : 0;

  // Real-time profit calculation - update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate pending profit in real-time
  const calculatePendingProfit = useCallback((stake: UserStake) => {
    const plan = STAKING_PLANS.find(p => p.id === stake.planId);
    if (!plan || !stake.isActive) return 0;

    const now = currentTime / 1000;
    const elapsed = now - stake.startTime;
    const dailyRate = plan.monthlyRate / 30 / 100;
    const daysElapsed = elapsed / (24 * 60 * 60);
    
    return (stake.amount * dailyRate * daysElapsed) - stake.claimedProfit;
  }, [currentTime]);

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

  const getDailyProfit = (amount: number, monthlyRate: number) => {
    return (amount * (monthlyRate / 100)) / 30;
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
      // Simulate staking transaction (will be replaced with real contract call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const now = Date.now() / 1000;
      const newStake: UserStake = {
        planId: selectedPlan.id,
        amount: amount,
        token: selectedToken,
        startTime: now,
        endTime: now + (selectedPlan.lockPeriod * 24 * 60 * 60),
        claimedProfit: 0,
        isActive: true,
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
    const pendingProfit = calculatePendingProfit(stake);
    
    if (pendingProfit < 10) {
      toast.error("Minimum claim amount is 10 USDT/USDC");
      return;
    }
    
    const afterTax = pendingProfit * 0.95; // 5% withdrawal tax
    toast.success(`Claimed $${afterTax.toFixed(2)} ${stake.token} (after 5% tax)`);
    
    const updatedStakes = [...userStakes];
    updatedStakes[stakeIndex] = {
      ...stake,
      claimedProfit: stake.claimedProfit + pendingProfit,
    };
    setUserStakes(updatedStakes);
  };

  const handleWithdrawCapital = (stakeIndex: number) => {
    const stake = userStakes[stakeIndex];
    const now = currentTime / 1000;
    
    if (now < stake.endTime) {
      toast.error("Capital is still locked");
      return;
    }

    const pendingProfit = calculatePendingProfit(stake);
    if (pendingProfit >= 10) {
      toast.error("Please claim your pending profit first");
      return;
    }
    
    toast.success(`Withdrew ${stake.amount} ${stake.token} capital`);
    
    const updatedStakes = [...userStakes];
    updatedStakes[stakeIndex] = {
      ...stake,
      isActive: false,
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

  const formatTimeRemaining = (endTime: number) => {
    const now = currentTime / 1000;
    const remaining = endTime - now;
    
    if (remaining <= 0) return "Unlocked";
    
    const days = Math.floor(remaining / (24 * 60 * 60));
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remaining % (60 * 60)) / 60);
    const seconds = Math.floor(remaining % 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
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
                  <p className="text-xl font-bold">{pmBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} PM</p>
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
                        <span className="text-muted-foreground text-sm">Monthly Rate</span>
                        <span className="font-bold text-lg text-green-500">{plan.monthlyRate}%</span>
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
                        +${getDailyProfit(parseFloat(stakeAmount), selectedPlan.monthlyRate).toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Profit</span>
                      <span className="font-semibold text-green-500">
                        +${(parseFloat(stakeAmount) * selectedPlan.monthlyRate / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total ({selectedPlan.lockPeriod} days)</span>
                      <span className="font-bold text-green-500">
                        +${(getDailyProfit(parseFloat(stakeAmount), selectedPlan.monthlyRate) * selectedPlan.lockPeriod).toFixed(2)}
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

          {/* User Stakes with Real-time Profit */}
          {userStakes.filter(s => s.isActive).length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <VaultIcon className="h-5 w-5 text-primary" />
                Your Active Stakes
                <Badge variant="outline" className="ml-2 animate-pulse">
                  Live Updates
                </Badge>
              </h3>

              <div className="space-y-4">
                {userStakes.filter(s => s.isActive).map((stake, index) => {
                  const plan = STAKING_PLANS.find(p => p.id === stake.planId);
                  const pendingProfit = calculatePendingProfit(stake);
                  const now = currentTime / 1000;
                  const isUnlocked = now >= stake.endTime;
                  
                  return (
                    <div key={index} className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge className={`bg-gradient-to-r ${plan?.gradient}`}>{plan?.name}</Badge>
                          <span className="font-semibold">{stake.amount} {stake.token}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isUnlocked ? (
                            <Badge className="bg-green-500/20 text-green-500">Unlocked</Badge>
                          ) : (
                            <Badge variant="outline" className="font-mono">
                              <Lock className="h-3 w-3 mr-1" />
                              {formatTimeRemaining(stake.endTime)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Started</p>
                          <p className="font-medium">{new Date(stake.startTime * 1000).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unlock Date</p>
                          <p className="font-medium">{new Date(stake.endTime * 1000).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Claimed Profit</p>
                          <p className="font-medium text-green-500">${stake.claimedProfit.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pending Profit</p>
                          <p className="font-bold text-yellow-500 animate-pulse">
                            ${pendingProfit.toFixed(6)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleClaimProfit(userStakes.indexOf(stake))}
                          disabled={pendingProfit < 10}
                          className="flex-1"
                        >
                          {pendingProfit < 10 ? `Min $10 to claim` : `Claim $${(pendingProfit * 0.95).toFixed(2)}`}
                        </Button>
                        {isUnlocked && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleWithdrawCapital(userStakes.indexOf(stake))}
                          >
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