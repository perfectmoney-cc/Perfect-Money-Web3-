import { useState, useEffect } from "react";
import pmLogo from "@/assets/pm-logo-new.png";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { WalletCard } from "@/components/WalletCard";
import { ArrowLeft, Gift, Clock, CheckCircle, ExternalLink, Trophy, Loader2, BarChart3, AlertTriangle, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { FaFacebook, FaYoutube, FaTwitter, FaTelegram } from "react-icons/fa";
import { SiTrustpilot, SiGoogle } from "react-icons/si";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { formatUnits, parseEther, formatEther } from 'viem';
import { PMAirdropABI } from "@/contracts/swapABI";
import { CONTRACT_ADDRESSES } from "@/contracts/addresses";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PMAIRDROP_ADDRESS = CONTRACT_ADDRESSES[56].PMAirdrop as `0x${string}`;
const CLAIM_FEE_USD = 0.01; // Fee in USD for each claim

const AirdropPage = () => {
  const { address, isConnected } = useAccount();
  const [walletAddress, setWalletAddress] = useState("");
  const [bnbPrice, setBnbPrice] = useState<number>(600); // Default fallback price
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingTask, setPendingTask] = useState<{ id: number; link: string; title: string } | null>(null);

  // Get user's BNB balance
  const { data: bnbBalance, refetch: refetchBalance } = useBalance({
    address: address,
    chainId: 56,
  });

  // Fetch BNB price
  useEffect(() => {
    const fetchBnbPrice = async () => {
      try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
        const data = await response.json();
        if (data.price) {
          setBnbPrice(parseFloat(data.price));
        }
      } catch (error) {
        console.error('Failed to fetch BNB price:', error);
      }
    };
    fetchBnbPrice();
    const interval = setInterval(fetchBnbPrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate BNB amount for $0.01 fee (fallback)
  const claimFeeBnb = CLAIM_FEE_USD / bnbPrice;
  const userBnbBalance = bnbBalance ? parseFloat(formatEther(bnbBalance.value)) : 0;

  // Check if contract is deployed
  const isContractDeployed = PMAIRDROP_ADDRESS !== "0x0000000000000000000000000000000000000000";

  // Read airdrop info from contract
  const { data: isActive } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'isActive',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  const { data: startTime } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'startTime',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  const { data: endTime } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'endTime',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  const { data: totalClaimed } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'totalClaimed',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  const { data: maxClaimable } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'maxClaimable',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  const { data: totalTasks } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'totalTasks',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  // Get claim fee info from contract
  const { data: claimFeeInfo } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'getClaimFeeInfo',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  // Use contract fee if available, otherwise use calculated fee
  const contractFeeBnb = claimFeeInfo ? Number(formatUnits((claimFeeInfo as any)[1] as bigint, 18)) : null;
  const effectiveClaimFeeBnb = contractFeeBnb ?? claimFeeBnb;
  const hasEnoughBnb = userBnbBalance >= effectiveClaimFeeBnb;

  // User-specific data
  const { data: hasClaimed, refetch: refetchHasClaimed } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'hasClaimed',
    args: address ? [address] : undefined,
    chainId: 56,
    query: { enabled: isContractDeployed && !!address }
  });

  const { data: claimedAmount } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'claimedAmount',
    args: address ? [address] : undefined,
    chainId: 56,
    query: { enabled: isContractDeployed && !!address }
  });

  const { data: userCompletedTasks, refetch: refetchUserTasks } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'getUserTasks',
    args: address ? [address] : undefined,
    chainId: 56,
    query: { enabled: isContractDeployed && !!address }
  });

  // Task rewards
  const { data: task0Reward } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'taskRewards',
    args: [BigInt(0)],
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  // Write contract for claiming tasks
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Auto-connect wallet on mount
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
    }
  }, [isConnected, address]);

  // Format stats
  const totalClaimedFormatted = totalClaimed ? formatUnits(totalClaimed as bigint, 18) : "0";
  const maxClaimableFormatted = maxClaimable ? formatUnits(maxClaimable as bigint, 18) : "0";
  const userClaimedFormatted = claimedAmount ? formatUnits(claimedAmount as bigint, 18) : "0";
  const taskReward = task0Reward ? formatUnits(task0Reward as bigint, 18) : "100";
  const completedTaskIds = userCompletedTasks ? (userCompletedTasks as bigint[]).map(id => Number(id)) : [];

  // Calculate time left
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!endTime || !isContractDeployed) {
      // Fallback countdown
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 45);
      
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate.getTime() - now;
        if (distance < 0) {
          clearInterval(timer);
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return;
        }
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(distance % (1000 * 60 * 60 * 24) / (1000 * 60 * 60)),
          minutes: Math.floor(distance % (1000 * 60 * 60) / (1000 * 60)),
          seconds: Math.floor(distance % (1000 * 60) / 1000)
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    // Use contract end time
    const endTimeMs = Number(endTime) * 1000;
    const timer = setInterval(() => {
      const now = Date.now();
      const distance = endTimeMs - now;
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(distance % (1000 * 60 * 60 * 24) / (1000 * 60 * 60)),
        minutes: Math.floor(distance % (1000 * 60 * 60) / (1000 * 60)),
        seconds: Math.floor(distance % (1000 * 60) / 1000)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, isContractDeployed]);

  // Social tasks
  const [tasks, setTasks] = useState([
    { id: 0, title: "Like us on Facebook", icon: FaFacebook, link: "https://facebook.com/perfectmoney", color: "text-blue-600", completed: false },
    { id: 1, title: "Leave Review on Facebook", icon: FaFacebook, link: "https://facebook.com/perfectmoney/reviews", color: "text-blue-600", completed: false },
    { id: 2, title: "Subscribe to Youtube Channel", icon: FaYoutube, link: "https://youtube.com/@perfectmoney", color: "text-red-600", completed: false },
    { id: 3, title: "React to any Youtube Videos", icon: FaYoutube, link: "https://youtube.com/@perfectmoney/videos", color: "text-red-600", completed: false },
    { id: 4, title: "Follow us on Twitter", icon: FaTwitter, link: "https://twitter.com/perfectmoney", color: "text-sky-500", completed: false },
    { id: 5, title: "React or Tweet Post", icon: FaTwitter, link: "https://twitter.com/perfectmoney", color: "text-sky-500", completed: false },
    { id: 6, title: "Join Telegram Group", icon: FaTelegram, link: "https://t.me/perfectmoney", color: "text-cyan-500", completed: false },
    { id: 7, title: "Review on TrustPilot", icon: SiTrustpilot, link: "https://trustpilot.com/review/perfectmoney.com", color: "text-green-600", completed: false },
    { id: 8, title: "Review on Google", icon: SiGoogle, link: "https://g.page/r/perfectmoney/review", color: "text-blue-500", completed: false }
  ]);

  // Update tasks from contract data
  useEffect(() => {
    if (completedTaskIds.length > 0) {
      setTasks(prev => prev.map(task => ({
        ...task,
        completed: completedTaskIds.includes(task.id)
      })));
    }
  }, [completedTaskIds]);

  // Handle task claim on contract - show confirmation dialog first
  const handleTaskClaim = async (taskId: number, link: string) => {
    // First open the link
    window.open(link, "_blank");

    if (!isConnected) {
      toast.error("Please connect your wallet to claim rewards");
      return;
    }

    if (!isContractDeployed) {
      // Fallback to local storage
      setTasks(prev => prev.map(task => task.id === taskId ? { ...task, completed: true } : task));
      toast.success("Task marked as completed!");
      return;
    }

    if (!(isActive as boolean)) {
      toast.error("Airdrop is not active");
      return;
    }

    // Find task title for dialog
    const task = tasks.find(t => t.id === taskId);
    setPendingTask({ id: taskId, link, title: task?.title || `Task ${taskId}` });
    setConfirmDialogOpen(true);
  };

  // Execute the actual claim after confirmation
  const executeTaskClaim = async () => {
    if (!pendingTask) return;
    
    if (!hasEnoughBnb) {
      toast.error(`Insufficient BNB balance. You need at least ${effectiveClaimFeeBnb.toFixed(6)} BNB`);
      setConfirmDialogOpen(false);
      setPendingTask(null);
      return;
    }

    try {
      // Calculate fee: $0.01 worth of BNB
      const feeInBnb = parseEther(effectiveClaimFeeBnb.toFixed(18));
      
      writeContract({
        address: PMAIRDROP_ADDRESS,
        abi: PMAirdropABI,
        functionName: 'claimTask',
        args: [BigInt(pendingTask.id)],
        value: feeInBnb,
      } as any);
      
      toast.info(`Claiming task with $${CLAIM_FEE_USD} fee (~${effectiveClaimFeeBnb.toFixed(6)} BNB)`);
    } catch (error: any) {
      toast.error(error?.message || "Failed to claim task reward");
    }
    
    setConfirmDialogOpen(false);
    setPendingTask(null);
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      refetchUserTasks();
      refetchHasClaimed();
      refetchBalance();
      toast.success(`Task reward claimed! +${taskReward} PM`);
      window.dispatchEvent(new Event("balanceUpdate"));
    }
  }, [isConfirmed, txHash]);

  const allTasksCompleted = tasks.every(task => task.completed);
  const completedCount = tasks.filter(t => t.completed).length;

  // Handle main airdrop claim (with merkle proof)
  const handleClaimAirdrop = () => {
    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (hasClaimed) {
      toast.error("You have already claimed the airdrop");
      return;
    }

    if (!isContractDeployed) {
      toast.info("Airdrop contract not deployed yet. Complete tasks to earn rewards!");
      return;
    }

    // Note: Main claim requires merkle proof which should be provided by backend
    toast.info("Merkle proof required for main claim. Complete tasks to earn PM tokens!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="Perfect Money Airdrop" subtitle="Complete tasks and claim PM tokens" />
      
      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        {/* Mobile Wallet Card */}
        <div className="md:hidden mt-5 mb-6">
          <WalletCard showQuickFunctionsToggle={false} compact={true} />
        </div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Stats Card */}
        <Card className="p-4 mb-4 bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-sm border-primary/30">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Airdrop Statistics</h3>
            {!isContractDeployed && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full ml-auto">Not Deployed</span>
            )}
            {isContractDeployed && isActive && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full ml-auto">Active</span>
            )}
            {isContractDeployed && !isActive && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-auto">Inactive</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-2 bg-background/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Pool</p>
              <p className="font-bold">{Number(maxClaimableFormatted).toLocaleString()}</p>
            </div>
            <div className="p-2 bg-background/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Claimed</p>
              <p className="font-bold">{Number(totalClaimedFormatted).toLocaleString()}</p>
            </div>
            <div className="p-2 bg-background/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="font-bold">{(Number(maxClaimableFormatted) - Number(totalClaimedFormatted)).toLocaleString()}</p>
            </div>
            <div className="p-2 bg-background/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Your Claimed</p>
              <p className="font-bold text-primary">{Number(userClaimedFormatted).toLocaleString()} PM</p>
            </div>
            <div className="p-2 bg-background/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Task Reward</p>
              <p className="font-bold">{taskReward} PM</p>
            </div>
          </div>
        </Card>

        {/* BNB Balance Card */}
        {isConnected && (
          <Card className={`p-4 mb-6 backdrop-blur-sm border ${hasEnoughBnb ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className={`h-5 w-5 ${hasEnoughBnb ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-sm font-medium">Your BNB Balance</p>
                  <p className={`text-lg font-bold ${hasEnoughBnb ? 'text-green-500' : 'text-red-500'}`}>
                    {userBnbBalance.toFixed(6)} BNB
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Claim Fee</p>
                <p className="text-sm font-medium">${CLAIM_FEE_USD} (~{effectiveClaimFeeBnb.toFixed(6)} BNB)</p>
                {!hasEnoughBnb && (
                  <p className="text-xs text-red-400 mt-1">Insufficient balance</p>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Airdrop Header with Timer */}
          <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img src={pmLogo} alt="PM" className="h-10 md:h-12 w-10 md:w-12" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="md:text-3xl font-bold text-lg">{Number(maxClaimableFormatted).toLocaleString()}</h2>
                      <img src={pmLogo} alt="PM" className="h-6 w-6" />
                      <span className="text-xl md:text-2xl font-bold">PM</span>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground">Total Airdrop Pool</p>
                  </div>
                </div>
                <p className="text-sm md:text-base text-muted-foreground">
                  Complete social tasks to earn PM tokens. Each task rewards {taskReward} PM. 
                  Limited time offer!
                </p>
              </div>
              
              <Card className="p-4 md:p-6 bg-background/80 backdrop-blur-sm">
                <div className="text-center mb-4">
                  <Clock className="h-5 md:h-6 w-5 md:w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">Time Remaining</p>
                </div>
                <div className="grid grid-cols-4 gap-2 md:gap-3">
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-lg p-2 md:p-3 mb-1">
                      <span className="text-xl md:text-2xl font-bold">{timeLeft.days}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Days</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-lg p-2 md:p-3 mb-1">
                      <span className="text-xl md:text-2xl font-bold">{timeLeft.hours}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Hours</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-lg p-2 md:p-3 mb-1">
                      <span className="text-xl md:text-2xl font-bold">{timeLeft.minutes}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Mins</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-primary/10 rounded-lg p-2 md:p-3 mb-1">
                      <span className="text-xl md:text-2xl font-bold">{timeLeft.seconds}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Secs</span>
                  </div>
                </div>
              </Card>
            </div>
          </Card>

          {/* Main Content: Tasks and Claim Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Tasks Column */}
            <Card className="p-4 md:p-6 bg-card/50 backdrop-blur-sm h-fit">
              <h2 className="md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2 text-lg">
                <Gift className="h-5 md:h-6 w-5 md:w-6 text-primary" />
                Complete Tasks
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  +{taskReward} PM each
                </span>
              </h2>
              
              {/* Fee Notice */}
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Each claim requires a small fee of <strong>${CLAIM_FEE_USD}</strong> (~{effectiveClaimFeeBnb.toFixed(6)} BNB)</span>
                </p>
              </div>
              
              <div className="space-y-3">
                {tasks.map(task => {
                  const Icon = task.icon;
                  const isLoading = isPending && !task.completed;
                  return (
                    <div key={task.id} className={`flex items-center justify-between p-3 md:p-4 border rounded-lg transition-all ${task.completed ? 'border-green-500/50 bg-green-500/5' : 'border-border hover:border-primary/50'}`}>
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        {task.completed ? (
                          <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="h-4 md:h-5 w-4 md:w-5 rounded-full border-2 border-muted flex-shrink-0" />
                        )}
                        <Icon className={`h-4 md:h-5 w-4 md:w-5 flex-shrink-0 ${task.color}`} />
                        <span className="font-medium text-xs md:text-sm truncate">{task.title}</span>
                      </div>
                      <Button 
                        variant={task.completed ? "ghost" : "outline"} 
                        size="sm" 
                        onClick={() => handleTaskClaim(task.id, task.link)} 
                        disabled={task.completed || isLoading}
                        className="flex-shrink-0 text-xs md:text-sm"
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : task.completed ? (
                          "Done"
                        ) : (
                          <>
                            Claim <ExternalLink className="h-3 w-3 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium">Progress</span>
                  <span className="text-xs md:text-sm font-bold">
                    {completedCount} / {tasks.length}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${(completedCount / tasks.length) * 100}%` }} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Earned: <span className="font-bold text-primary">{Number(userClaimedFormatted).toLocaleString()} PM</span>
                </p>
              </div>
            </Card>

            {/* Claim Form Column */}
            <Card className="p-4 md:p-6 bg-card/50 backdrop-blur-sm h-fit">
              <h2 className="md:text-2xl font-bold mb-4 md:mb-6 text-lg">Your Airdrop Status</h2>
              
              {hasClaimed ? (
                <div className="text-center py-8 md:py-12">
                  <CheckCircle className="h-12 md:h-16 w-12 md:w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg md:text-xl font-bold mb-2">Already Claimed!</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    You have claimed {Number(userClaimedFormatted).toLocaleString()} PM tokens.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <Label htmlFor="wallet" className="text-sm md:text-base">Connected Wallet (BEP-20)</Label>
                    <Input 
                      id="wallet" 
                      placeholder="0x..." 
                      value={walletAddress} 
                      readOnly
                      className="mt-2 bg-muted/50" 
                    />
                    {!isConnected && (
                      <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Connect your wallet to participate
                      </p>
                    )}
                  </div>

                  <div className="p-3 md:p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h3 className="font-bold text-sm md:text-base mb-2 flex items-center gap-2">
                      <Trophy className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                      Your Rewards
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="md:text-3xl font-bold text-primary text-lg">
                        {Number(userClaimedFormatted).toLocaleString()}
                      </p>
                      <img src={pmLogo} alt="PM" className="h-6 w-6" />
                      <span className="text-xl md:text-2xl font-bold text-primary">PM</span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Complete {tasks.length - completedCount} more tasks to earn +{(tasks.length - completedCount) * Number(taskReward)} PM
                    </p>
                  </div>

                  {!isContractDeployed && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-400 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Airdrop contract not yet deployed. Task completion will be recorded locally.
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground text-center space-y-1">
                    <p>• One claim per wallet address</p>
                    <p>• Task rewards are instant when contract is active</p>
                    <p>• Complete all tasks to maximize rewards</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Claim Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Task Claim</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>You are about to claim the reward for:</p>
              <p className="font-semibold text-foreground">{pendingTask?.title}</p>
              
              <div className="p-3 bg-muted rounded-lg space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Claim Fee:</span>
                  <span className="font-medium">${CLAIM_FEE_USD} USD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fee in BNB:</span>
                  <span className="font-medium">{effectiveClaimFeeBnb.toFixed(6)} BNB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Your Balance:</span>
                  <span className={`font-medium ${hasEnoughBnb ? 'text-green-500' : 'text-red-500'}`}>
                    {userBnbBalance.toFixed(6)} BNB
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span>Reward:</span>
                  <span className="font-bold text-primary">+{taskReward} PM</span>
                </div>
              </div>

              {!hasEnoughBnb && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Insufficient BNB balance to pay the claim fee
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeTaskClaim}
              disabled={!hasEnoughBnb || isPending}
              className={!hasEnoughBnb ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Confirm & Claim'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AirdropPage;