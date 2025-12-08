import { useState, useEffect, useCallback, useMemo } from "react";
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
  Coins, Loader2, CheckCircle, AlertTriangle, DollarSign, Sparkles,
  BarChart3, History, Target, Settings, PieChart, Users, Trophy, AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES, PM_TOKEN_ADDRESS } from "@/contracts/addresses";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { ReferralBonus } from "@/components/vault/ReferralBonus";
import { EarlyWithdrawalModal } from "@/components/vault/EarlyWithdrawal";
import { StakingLeaderboard } from "@/components/vault/StakingLeaderboard";
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
  chartColor: string;
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

interface StakeHistoryItem {
  date: string;
  action: "stake" | "claim" | "withdraw";
  amount: number;
  token: string;
  plan: string;
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
    chartColor: "#d97706",
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
    chartColor: "#9ca3af",
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
    chartColor: "#eab308",
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
  const [stakeHistory, setStakeHistory] = useState<StakeHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("stake");
  const [showEarlyWithdrawal, setShowEarlyWithdrawal] = useState(false);
  const [selectedStakeForWithdrawal, setSelectedStakeForWithdrawal] = useState<number | null>(null);

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

  // Analytics calculations
  const analytics = useMemo(() => {
    const activeStakes = userStakes.filter(s => s.isActive);
    const totalStaked = activeStakes.reduce((sum, s) => sum + s.amount, 0);
    const totalClaimed = userStakes.reduce((sum, s) => sum + s.claimedProfit, 0);
    const totalPending = activeStakes.reduce((sum, s) => sum + calculatePendingProfit(s), 0);
    
    // Calculate projected earnings
    const projectedMonthly = activeStakes.reduce((sum, s) => {
      const plan = STAKING_PLANS.find(p => p.id === s.planId);
      return sum + (s.amount * (plan?.monthlyRate || 0) / 100);
    }, 0);

    const projectedYearly = projectedMonthly * 12;

    // Distribution by plan
    const planDistribution = STAKING_PLANS.map(plan => ({
      name: plan.name,
      value: activeStakes.filter(s => s.planId === plan.id).reduce((sum, s) => sum + s.amount, 0),
      color: plan.chartColor,
    })).filter(p => p.value > 0);

    // Generate chart data for profit over time
    const chartData = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayProfit = activeStakes.reduce((sum, stake) => {
        const plan = STAKING_PLANS.find(p => p.id === stake.planId);
        if (!plan) return sum;
        const stakeStart = stake.startTime * 1000;
        if (date.getTime() < stakeStart) return sum;
        return sum + (stake.amount * plan.monthlyRate / 100 / 30);
      }, 0);
      
      chartData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        profit: parseFloat(dayProfit.toFixed(2)),
      });
    }

    return {
      totalStaked,
      totalClaimed,
      totalPending,
      projectedMonthly,
      projectedYearly,
      planDistribution,
      chartData,
      activeCount: activeStakes.length,
    };
  }, [userStakes, calculatePendingProfit]);

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
      setStakeHistory([
        {
          date: new Date().toLocaleString(),
          action: "stake",
          amount: amount,
          token: selectedToken,
          plan: selectedPlan.name,
        },
        ...stakeHistory,
      ]);
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
    
    const afterTax = pendingProfit * 0.95;
    toast.success(`Claimed $${afterTax.toFixed(2)} ${stake.token} (after 5% tax)`);
    
    const updatedStakes = [...userStakes];
    updatedStakes[stakeIndex] = {
      ...stake,
      claimedProfit: stake.claimedProfit + pendingProfit,
    };
    setUserStakes(updatedStakes);
    
    setStakeHistory([
      {
        date: new Date().toLocaleString(),
        action: "claim",
        amount: afterTax,
        token: stake.token,
        plan: STAKING_PLANS.find(p => p.id === stake.planId)?.name || "",
      },
      ...stakeHistory,
    ]);
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
    
    setStakeHistory([
      {
        date: new Date().toLocaleString(),
        action: "withdraw",
        amount: stake.amount,
        token: stake.token,
        plan: STAKING_PLANS.find(p => p.id === stake.planId)?.name || "",
      },
      ...stakeHistory,
    ]);
  };

  const handleEarlyWithdrawal = (stakeIndex: number) => {
    setSelectedStakeForWithdrawal(stakeIndex);
    setShowEarlyWithdrawal(true);
  };

  const confirmEarlyWithdrawal = () => {
    if (selectedStakeForWithdrawal === null) return;
    
    const stake = userStakes[selectedStakeForWithdrawal];
    const penalty = stake.amount * 0.20;
    const netAmount = stake.amount - penalty;
    
    const updatedStakes = [...userStakes];
    updatedStakes[selectedStakeForWithdrawal] = {
      ...stake,
      isActive: false,
    };
    setUserStakes(updatedStakes);
    
    setStakeHistory([
      {
        date: new Date().toLocaleString(),
        action: "withdraw",
        amount: netAmount,
        token: stake.token,
        plan: STAKING_PLANS.find(p => p.id === stake.planId)?.name || "",
      },
      ...stakeHistory,
    ]);
    
    setSelectedStakeForWithdrawal(null);
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

  // Check if user is contract owner (mock for now)
  const isOwner = address?.toLowerCase() === "0x742d35cc6634c0532925a3b844bc9e7595f0beb".toLowerCase();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="Staking Vault" subtitle="Stake USDT/USDC and earn passive income daily" />

      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        <div className="md:hidden mb-6">
          <WalletCard showQuickFunctionsToggle={false} compact={true} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          {isOwner && (
            <Link to="/dashboard/vault/admin">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          )}
        </div>

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

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="stake" className="gap-2">
                <VaultIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Stake</span>
              </TabsTrigger>
              <TabsTrigger value="referral" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Referral</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Ranking</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            {/* Stake Tab */}
            <TabsContent value="stake" className="mt-6 space-y-6">
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

              {/* Active Stakes */}
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
                            {isUnlocked ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => handleWithdrawCapital(userStakes.indexOf(stake))}
                              >
                                Withdraw Capital
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="flex-1"
                                onClick={() => handleEarlyWithdrawal(userStakes.indexOf(stake))}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Emergency Exit (20% fee)
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Referral Tab */}
            <TabsContent value="referral" className="mt-6">
              <ReferralBonus />
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="mt-6">
              <StakingLeaderboard />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <VaultIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Total Staked</span>
                  </div>
                  <p className="text-2xl font-bold">${analytics.totalStaked.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{analytics.activeCount} active stakes</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Total Earned</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">${analytics.totalClaimed.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Claimed rewards</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-500">${analytics.totalPending.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground">Ready to claim</p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-xs text-muted-foreground">Projected Monthly</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-500">${analytics.projectedMonthly.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">${analytics.projectedYearly.toFixed(2)}/year</p>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profit Over Time Chart */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Daily Profit (30 Days)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="profit" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary) / 0.2)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Plan Distribution */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Stake Distribution
                  </h3>
                  {analytics.planDistribution.length > 0 ? (
                    <div className="h-64 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={analytics.planDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analytics.planDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <p>No active stakes to display</p>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Transaction History
                </h3>
                
                {stakeHistory.length > 0 ? (
                  <div className="space-y-3">
                    {stakeHistory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            item.action === "stake" ? "bg-blue-500/20" :
                            item.action === "claim" ? "bg-green-500/20" : "bg-yellow-500/20"
                          }`}>
                            {item.action === "stake" ? <VaultIcon className="h-4 w-4 text-blue-500" /> :
                             item.action === "claim" ? <DollarSign className="h-4 w-4 text-green-500" /> :
                             <Lock className="h-4 w-4 text-yellow-500" />}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{item.action}</p>
                            <p className="text-xs text-muted-foreground">{item.plan} • {item.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            item.action === "claim" ? "text-green-500" : ""
                          }`}>
                            {item.action === "claim" ? "+" : ""}{item.amount.toFixed(2)} {item.token}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No transaction history yet</p>
                    <p className="text-sm">Start staking to see your history</p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Early Withdrawal Modal */}
      {selectedStakeForWithdrawal !== null && userStakes[selectedStakeForWithdrawal] && (
        <EarlyWithdrawalModal
          isOpen={showEarlyWithdrawal}
          onClose={() => {
            setShowEarlyWithdrawal(false);
            setSelectedStakeForWithdrawal(null);
          }}
          stake={{
            amount: userStakes[selectedStakeForWithdrawal].amount,
            token: userStakes[selectedStakeForWithdrawal].token,
            planName: STAKING_PLANS.find(p => p.id === userStakes[selectedStakeForWithdrawal].planId)?.name || "",
            endTime: userStakes[selectedStakeForWithdrawal].endTime,
            pendingProfit: calculatePendingProfit(userStakes[selectedStakeForWithdrawal]),
          }}
          onConfirm={confirmEarlyWithdrawal}
        />
      )}
    </div>
  );
};

export default Vault;