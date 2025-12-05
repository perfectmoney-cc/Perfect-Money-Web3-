import { useState, useEffect } from "react";
import pmLogo from "@/assets/pm-logo-new.png";
import bnbLogo from "@/assets/bnb-logo.png";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { WalletCard } from "@/components/WalletCard";
import { ArrowLeft, Wallet, ArrowRightLeft, Clock, TrendingUp, Loader2, Lock, Unlock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther, formatUnits } from 'viem';
import { PMPresaleABI } from "@/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/contracts/addresses";

const PRESALE_ADDRESS = CONTRACT_ADDRESSES[56].PMPresale as `0x${string}`;

const ROUND_NAMES = ["Seed", "Private", "Public"] as const;
const ROUND_COLORS = ["from-yellow-500/20 to-orange-500/20", "from-blue-500/20 to-purple-500/20", "from-green-500/20 to-emerald-500/20"];
const ROUND_BADGES = ["bg-yellow-500/20 text-yellow-400", "bg-blue-500/20 text-blue-400", "bg-green-500/20 text-green-400"];

interface RoundInfo {
  price: bigint;
  supply: bigint;
  sold: bigint;
  start: bigint;
  end: bigint;
  minBuy: bigint;
  maxBuyTokens: bigint;
  whitelistEnabled: boolean;
}

const BuyTokenPage = () => {
  const { address, isConnected } = useAccount();
  const [bnbAmount, setBnbAmount] = useState("");
  const [pmAmount, setPmAmount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRound, setSelectedRound] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Fetch BNB balance from blockchain
  const { data: bnbBalance } = useBalance({
    address,
    chainId: 56,
  });

  // Read presale ended status
  const { data: presaleEnded } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'presaleEnded',
    chainId: 56,
  });

  // Read active round
  const { data: activeRound } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'getActiveRound',
    chainId: 56,
  });

  // Read total sold
  const { data: totalSold } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'getTotalSold',
    chainId: 56,
  });

  // Read total supply
  const { data: totalSupply } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'getTotalSupply',
    chainId: 56,
  });

  // Read round info for each round
  const { data: seedRoundInfo } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'getRoundInfo',
    args: [0],
    chainId: 56,
  });

  const { data: privateRoundInfo } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'getRoundInfo',
    args: [1],
    chainId: 56,
  });

  const { data: publicRoundInfo } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'getRoundInfo',
    args: [2],
    chainId: 56,
  });

  // Read user purchased amount for selected round
  const { data: userPurchased } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'purchasedAmount',
    args: [selectedRound, address || '0x0000000000000000000000000000000000000000'],
    chainId: 56,
  });

  // Check if user is whitelisted for selected round
  const { data: isWhitelisted } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'isWhitelisted',
    args: [selectedRound, address || '0x0000000000000000000000000000000000000000'],
    chainId: 56,
  });

  // Write contract for buying tokens
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Process round info
  const roundInfos: (RoundInfo | null)[] = [
    seedRoundInfo ? {
      price: seedRoundInfo[0],
      supply: seedRoundInfo[1],
      sold: seedRoundInfo[2],
      start: seedRoundInfo[3],
      end: seedRoundInfo[4],
      minBuy: seedRoundInfo[5],
      maxBuyTokens: seedRoundInfo[6],
      whitelistEnabled: seedRoundInfo[7],
    } : null,
    privateRoundInfo ? {
      price: privateRoundInfo[0],
      supply: privateRoundInfo[1],
      sold: privateRoundInfo[2],
      start: privateRoundInfo[3],
      end: privateRoundInfo[4],
      minBuy: privateRoundInfo[5],
      maxBuyTokens: privateRoundInfo[6],
      whitelistEnabled: privateRoundInfo[7],
    } : null,
    publicRoundInfo ? {
      price: publicRoundInfo[0],
      supply: publicRoundInfo[1],
      sold: publicRoundInfo[2],
      start: publicRoundInfo[3],
      end: publicRoundInfo[4],
      minBuy: publicRoundInfo[5],
      maxBuyTokens: publicRoundInfo[6],
      whitelistEnabled: publicRoundInfo[7],
    } : null,
  ];

  const currentRoundInfo = roundInfos[selectedRound];

  // Calculate exchange rate for selected round
  const getExchangeRate = (roundInfo: RoundInfo | null) => {
    if (!roundInfo || roundInfo.price === 0n) return 100000;
    // price is in wei per token, so 1 BNB (1e18 wei) / price = tokens per BNB
    return Number(10n ** 18n / roundInfo.price);
  };

  const exchangeRate = getExchangeRate(currentRoundInfo);

  // Calculate totals
  const totalSoldAmount = totalSold ? Number(formatEther(totalSold)) : 0;
  const totalSupplyAmount = totalSupply ? Number(formatEther(totalSupply)) : 20000000000;
  const soldPercentage = totalSupplyAmount > 0 ? (totalSoldAmount / totalSupplyAmount) * 100 : 0;
  const remaining = totalSupplyAmount - totalSoldAmount;

  // Countdown Timer for selected round
  useEffect(() => {
    if (!currentRoundInfo) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const endTime = Number(currentRoundInfo.end);
      const startTime = Number(currentRoundInfo.start);
      
      let targetTime: number;
      if (now < startTime) {
        targetTime = startTime; // Count to start
      } else {
        targetTime = endTime; // Count to end
      }

      const distance = (targetTime - now) * 1000;
      
      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentRoundInfo]);

  const handleBnbChange = (value: string) => {
    setBnbAmount(value);
    const pm = parseFloat(value) * exchangeRate;
    setPmAmount(pm ? pm.toFixed(2) : "");
  };

  const handlePmChange = (value: string) => {
    setPmAmount(value);
    const bnb = parseFloat(value) / exchangeRate;
    setBnbAmount(bnb ? bnb.toFixed(6) : "");
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      setIsProcessing(false);
      setShowSuccessModal(true);
      toast.success(`Purchase successful! ${parseFloat(pmAmount).toLocaleString()} PM added to your balance.`);
      window.dispatchEvent(new Event('balanceUpdate'));
      window.dispatchEvent(new Event('transactionUpdate'));
      setBnbAmount("");
      setPmAmount("");
    }
  }, [isConfirmed, txHash, pmAmount]);

  const isRoundActive = (roundInfo: RoundInfo | null) => {
    if (!roundInfo) return false;
    const now = Math.floor(Date.now() / 1000);
    return now >= Number(roundInfo.start) && now <= Number(roundInfo.end);
  };

  const isRoundUpcoming = (roundInfo: RoundInfo | null) => {
    if (!roundInfo) return false;
    const now = Math.floor(Date.now() / 1000);
    return now < Number(roundInfo.start);
  };

  const handleBuy = async () => {
    if (!bnbAmount || !pmAmount) {
      toast.error("Please enter an amount");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (presaleEnded) {
      toast.error("Presale has ended");
      return;
    }

    if (!isRoundActive(currentRoundInfo)) {
      toast.error("This round is not active");
      return;
    }

    if (currentRoundInfo?.whitelistEnabled && !isWhitelisted) {
      toast.error("You are not whitelisted for this round");
      return;
    }

    const bnbRequired = parseFloat(bnbAmount);
    const currentBnbBalance = bnbBalance ? parseFloat(bnbBalance.formatted) : 0;
    
    if (bnbRequired > currentBnbBalance) {
      toast.error("Insufficient BNB balance");
      return;
    }

    const minBuyBnb = currentRoundInfo ? Number(formatEther(currentRoundInfo.minBuy)) : 0.01;
    if (bnbRequired < minBuyBnb) {
      toast.error(`Minimum purchase is ${minBuyBnb} BNB`);
      return;
    }

    setIsProcessing(true);
    toast.loading("Initiating transaction...", { id: "buy-tx" });

    try {
      writeContract({
        address: PRESALE_ADDRESS,
        abi: PMPresaleABI,
        functionName: 'buyTokens',
        args: [selectedRound],
        value: parseEther(bnbAmount),
      } as any);
      
      toast.dismiss("buy-tx");
      toast.loading("Please confirm in your wallet...", { id: "confirm-tx" });
    } catch (error: any) {
      setIsProcessing(false);
      toast.dismiss("buy-tx");
      toast.dismiss("confirm-tx");
      toast.error(error?.message || "Transaction failed");
    }
  };

  const getRoundStatus = (roundInfo: RoundInfo | null, index: number) => {
    if (!roundInfo) return "Not Configured";
    const now = Math.floor(Date.now() / 1000);
    if (now < Number(roundInfo.start)) return "Upcoming";
    if (now > Number(roundInfo.end)) return "Ended";
    return "Active";
  };

  const formatDate = (timestamp: bigint) => {
    if (!timestamp || timestamp === 0n) return "Not Set";
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="Buy PM Tokens" subtitle="Multi-round presale: Seed → Private → Public" />
      
      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        {/* Mobile Wallet Card */}
        <div className="md:hidden mb-6">
          <WalletCard showQuickFunctionsToggle={false} compact={true} />
        </div>
        
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Total Presale Progress */}
          <Card className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border-primary/30">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">🔥 PM Token Multi-Round Presale</h2>
                <p className="text-muted-foreground text-xs">Three rounds with progressive pricing</p>
              </div>
              {presaleEnded && (
                <Badge variant="destructive" className="text-sm">Presale Ended</Badge>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Total Presale Progress</span>
                  <span className="text-sm font-bold text-primary">{soldPercentage.toFixed(2)}% Sold</span>
                </div>
                <Progress value={soldPercentage} className="h-3" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Sold: {totalSoldAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })} PM</span>
                  <span>Remaining: {remaining.toLocaleString('en-US', { maximumFractionDigits: 0 })} PM</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Round Selection Tabs */}
          <Tabs defaultValue="0" onValueChange={(v) => setSelectedRound(parseInt(v))} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {ROUND_NAMES.map((name, index) => {
                const info = roundInfos[index];
                const status = getRoundStatus(info, index);
                return (
                  <TabsTrigger key={index} value={index.toString()} className="relative">
                    <span className="flex items-center gap-2">
                      {status === "Active" && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                      {status === "Upcoming" && <Lock className="w-3 h-3" />}
                      {status === "Ended" && <CheckCircle className="w-3 h-3" />}
                      {name}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {[0, 1, 2].map((roundIndex) => {
              const info = roundInfos[roundIndex];
              const status = getRoundStatus(info, roundIndex);
              const isActive = status === "Active";
              const roundSold = info ? Number(formatEther(info.sold)) : 0;
              const roundSupply = info ? Number(formatEther(info.supply)) : 0;
              const roundProgress = roundSupply > 0 ? (roundSold / roundSupply) * 100 : 0;

              return (
                <TabsContent key={roundIndex} value={roundIndex.toString()} className="space-y-6">
                  {/* Round Info Card */}
                  <Card className={`p-6 bg-gradient-to-br ${ROUND_COLORS[roundIndex]} backdrop-blur-sm border-primary/30`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={ROUND_BADGES[roundIndex]}>{ROUND_NAMES[roundIndex]} Round</Badge>
                        <Badge variant={isActive ? "default" : status === "Upcoming" ? "secondary" : "outline"}>
                          {status}
                        </Badge>
                      </div>
                      {info?.whitelistEnabled && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Whitelist Only
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Price</p>
                        <p className="text-sm md:text-base font-bold">1 BNB = {getExchangeRate(info).toLocaleString()} PM</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Allocation</p>
                        <p className="text-sm md:text-base font-bold">{roundSupply.toLocaleString('en-US', { maximumFractionDigits: 0 })} PM</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Min Buy</p>
                        <p className="text-sm md:text-base font-bold">{info ? formatEther(info.minBuy) : '0'} BNB</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Max Per Wallet</p>
                        <p className="text-sm md:text-base font-bold">{info ? Number(formatEther(info.maxBuyTokens)).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'} PM</p>
                      </div>
                    </div>

                    {/* Round Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{ROUND_NAMES[roundIndex]} Progress</span>
                        <span className="text-sm font-bold text-primary">{roundProgress.toFixed(2)}%</span>
                      </div>
                      <Progress value={roundProgress} className="h-2" />
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Sold: {roundSold.toLocaleString('en-US', { maximumFractionDigits: 0 })} PM</span>
                        <span>Available: {(roundSupply - roundSold).toLocaleString('en-US', { maximumFractionDigits: 0 })} PM</span>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Start:</span>{" "}
                        <span className="font-medium">{info ? formatDate(info.start) : 'Not Set'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">End:</span>{" "}
                        <span className="font-medium">{info ? formatDate(info.end) : 'Not Set'}</span>
                      </div>
                    </div>

                    {/* Countdown */}
                    {isActive && (
                      <div className="mt-4 p-4 bg-background/50 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="font-bold">Round Ends In:</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: "Days", value: timeLeft.days },
                            { label: "Hours", value: timeLeft.hours },
                            { label: "Minutes", value: timeLeft.minutes },
                            { label: "Seconds", value: timeLeft.seconds }
                          ].map(item => (
                            <div key={item.label} className="text-center p-2 bg-primary/10 rounded-lg">
                              <div className="text-xl md:text-2xl font-bold text-primary">{item.value.toString().padStart(2, '0')}</div>
                              <div className="text-[10px] md:text-xs text-muted-foreground">{item.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User Purchase Info */}
                    {isConnected && userPurchased && userPurchased > 0n && (
                      <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-sm text-green-400">
                          <CheckCircle className="w-4 h-4 inline mr-2" />
                          You have purchased: {Number(formatEther(userPurchased)).toLocaleString('en-US', { maximumFractionDigits: 2 })} PM
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* Buy Token Form */}
                  <Card className="p-8 bg-card/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <Wallet className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <h1 className="text-xl md:text-3xl font-bold">Buy {ROUND_NAMES[roundIndex]} Round</h1>
                        <p className="text-sm md:text-base text-muted-foreground">Exchange BNB for PM tokens at {ROUND_NAMES[roundIndex]} price</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* From */}
                      <div className="space-y-2">
                        <Label htmlFor="bnb">From (BNB)</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <img src={bnbLogo} alt="BNB" className="h-5 w-5" />
                          </div>
                          <Input 
                            id="bnb" 
                            type="number" 
                            placeholder="0.00" 
                            value={bnbAmount} 
                            onChange={e => handleBnbChange(e.target.value)} 
                            className="pl-12"
                            disabled={!isActive || presaleEnded}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">BNB</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Available: {bnbBalance ? parseFloat(bnbBalance.formatted).toFixed(4) : '0.0000'} BNB
                        </p>
                      </div>

                      {/* Swap Icon */}
                      <div className="flex justify-center">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <ArrowRightLeft className="h-5 w-5 text-primary" />
                        </div>
                      </div>

                      {/* To */}
                      <div className="space-y-2">
                        <Label htmlFor="pm">To (PM)</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <img src={pmLogo} alt="PM" className="h-5 w-5" />
                          </div>
                          <Input 
                            id="pm" 
                            type="number" 
                            placeholder="0.00" 
                            value={pmAmount} 
                            onChange={e => handlePmChange(e.target.value)} 
                            className="pl-12"
                            disabled={!isActive || presaleEnded}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">PM</span>
                        </div>
                      </div>

                      {/* Exchange Info */}
                      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Exchange Rate</span>
                          <span className="font-medium">1 BNB = {exchangeRate.toLocaleString()} PM</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Network Fee</span>
                          <span className="font-medium">~0.0003 BNB</span>
                        </div>
                        {info?.whitelistEnabled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Whitelist Status</span>
                            <span className={`font-medium ${isWhitelisted ? 'text-green-500' : 'text-red-500'}`}>
                              {isWhitelisted ? 'Whitelisted' : 'Not Whitelisted'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Messages */}
                      {!isActive && !presaleEnded && (
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <p className="text-sm text-yellow-400">
                            <Lock className="w-4 h-4 inline mr-2" />
                            This round is {status === "Upcoming" ? "not yet started" : "ended"}. Please select an active round.
                          </p>
                        </div>
                      )}

                      {info?.whitelistEnabled && !isWhitelisted && isConnected && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-sm text-red-400">
                            <Lock className="w-4 h-4 inline mr-2" />
                            This round requires whitelist access. You are not whitelisted.
                          </p>
                        </div>
                      )}

                      <Button 
                        variant="gradient" 
                        size="lg" 
                        className="w-full" 
                        onClick={handleBuy}
                        disabled={isProcessing || isPending || isConfirming || !isConnected || !isActive || presaleEnded || (info?.whitelistEnabled && !isWhitelisted)}
                      >
                        {(isProcessing || isPending || isConfirming) ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            {isPending ? "Confirm in Wallet..." : isConfirming ? "Processing..." : "Loading..."}
                          </>
                        ) : (
                          <>
                            <Wallet className="h-5 w-5 mr-2" />
                            {!isConnected ? "Connect Wallet" : !isActive ? "Round Not Active" : `Buy ${ROUND_NAMES[roundIndex]} Tokens`}
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </main>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-green-500/20">
                <TrendingUp className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Purchase Successful!</DialogTitle>
            <DialogDescription className="text-center">
              Your PM tokens have been successfully purchased from the {ROUND_NAMES[selectedRound]} round.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction Hash:</span>
                <span className="font-mono text-xs">{txHash ? `${txHash.slice(0, 8)}...${txHash.slice(-6)}` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-500 font-medium">Confirmed</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-medium">BSC Mainnet</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Round:</span>
                <span className="font-medium">{ROUND_NAMES[selectedRound]}</span>
              </div>
            </div>
            <Button variant="gradient" className="w-full" onClick={() => setShowSuccessModal(false)}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default BuyTokenPage;
