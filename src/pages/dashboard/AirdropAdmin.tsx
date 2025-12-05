import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import {
  ArrowLeft,
  Settings,
  DollarSign,
  Users,
  Loader2,
  Shield,
  AlertTriangle,
  Wallet,
  Plus,
  Save,
  Trash2,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, formatEther } from 'viem';
import { PMAirdropABI } from "@/contracts/swapABI";
import { CONTRACT_ADDRESSES } from "@/contracts/addresses";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PMAIRDROP_ADDRESS = CONTRACT_ADDRESSES[56].PMAirdrop as `0x${string}`;

interface TaskConfig {
  id: number;
  name: string;
  link: string;
  reward: string;
  enabled: boolean;
}

const AirdropAdminPage = () => {
  const { address, isConnected } = useAccount();
  const [claimFee, setClaimFee] = useState("0.01");
  const [networkFee, setNetworkFee] = useState("0.01");
  const [feeCollectorAddress, setFeeCollectorAddress] = useState("");
  const [maxClaimableValue, setMaxClaimableValue] = useState("");
  const [airdropDuration, setAirdropDuration] = useState("30");
  const [tasks, setTasks] = useState<TaskConfig[]>([]);
  const [newTask, setNewTask] = useState<TaskConfig>({ id: 0, name: "", link: "", reward: "100", enabled: true });

  const isContractDeployed = PMAIRDROP_ADDRESS !== "0x0000000000000000000000000000000000000000";

  // Read contract owner
  const { data: contractOwner } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'owner',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  const isOwner = address && contractOwner && address.toLowerCase() === (contractOwner as string).toLowerCase();

  // Read admin info
  const { data: adminInfo, refetch: refetchAdminInfo } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'getAdminInfo',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  // Read fee info
  const { data: feeInfo, refetch: refetchFeeInfo } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'getFeeInfo',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  // Read airdrop info
  const { data: airdropInfo, refetch: refetchAirdropInfo } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'getAirdropInfo',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  // Read all tasks
  const { data: allTasks, refetch: refetchTasks } = useReadContract({
    address: PMAIRDROP_ADDRESS,
    abi: PMAirdropABI,
    functionName: 'getAllTasks',
    chainId: 56,
    query: { enabled: isContractDeployed }
  });

  // Write contract
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Update local state from contract data
  useEffect(() => {
    if (feeInfo) {
      const info = feeInfo as any;
      setClaimFee((Number(info[0]) / 1e8).toString());
      setNetworkFee((Number(info[1]) / 1e8).toString());
    }
  }, [feeInfo]);

  useEffect(() => {
    if (adminInfo) {
      const info = adminInfo as any;
      setFeeCollectorAddress(info[1] as string);
    }
  }, [adminInfo]);

  useEffect(() => {
    if (airdropInfo) {
      const info = airdropInfo as any;
      setMaxClaimableValue(formatUnits(info[2] as bigint, 18));
    }
  }, [airdropInfo]);

  useEffect(() => {
    if (allTasks) {
      const [names, links, rewards, enabledList] = allTasks as [string[], string[], bigint[], boolean[]];
      const taskList: TaskConfig[] = names.map((name, i) => ({
        id: i,
        name,
        link: links[i],
        reward: formatUnits(rewards[i], 18),
        enabled: enabledList[i]
      }));
      setTasks(taskList);
      setNewTask(prev => ({ ...prev, id: taskList.length }));
    }
  }, [allTasks]);

  // Refresh on confirmation
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Transaction confirmed!");
      refetchAdminInfo();
      refetchFeeInfo();
      refetchAirdropInfo();
      refetchTasks();
    }
  }, [isConfirmed]);

  // Admin actions
  const handleSetClaimFee = () => {
    if (!isOwner) return toast.error("Only owner can perform this action");
    const feeIn8Decimals = BigInt(Math.round(parseFloat(claimFee) * 1e8));
    writeContract({
      address: PMAIRDROP_ADDRESS,
      abi: PMAirdropABI,
      functionName: 'setClaimFeeUSD',
      args: [feeIn8Decimals],
    } as any);
  };

  const handleSetNetworkFee = () => {
    if (!isOwner) return toast.error("Only owner can perform this action");
    const feeIn8Decimals = BigInt(Math.round(parseFloat(networkFee) * 1e8));
    if (feeIn8Decimals < BigInt(1000000)) {
      return toast.error("Network fee must be at least $0.01");
    }
    writeContract({
      address: PMAIRDROP_ADDRESS,
      abi: PMAirdropABI,
      functionName: 'setNetworkFeeUSD',
      args: [feeIn8Decimals],
    } as any);
  };

  const handleSetFeeCollector = () => {
    if (!isOwner) return toast.error("Only owner can perform this action");
    if (!feeCollectorAddress.startsWith("0x") || feeCollectorAddress.length !== 42) {
      return toast.error("Invalid address");
    }
    writeContract({
      address: PMAIRDROP_ADDRESS,
      abi: PMAirdropABI,
      functionName: 'setFeeCollector',
      args: [feeCollectorAddress as `0x${string}`],
    } as any);
  };

  const handleStartAirdrop = () => {
    if (!isOwner) return toast.error("Only owner can perform this action");
    const durationSeconds = BigInt(parseInt(airdropDuration) * 24 * 60 * 60);
    const maxTokens = parseUnits(maxClaimableValue || "0", 18);
    writeContract({
      address: PMAIRDROP_ADDRESS,
      abi: PMAirdropABI,
      functionName: 'startAirdrop',
      args: [durationSeconds, maxTokens],
    } as any);
  };

  const handleEndAirdrop = () => {
    if (!isOwner) return toast.error("Only owner can perform this action");
    writeContract({
      address: PMAIRDROP_ADDRESS,
      abi: PMAirdropABI,
      functionName: 'endAirdrop',
      args: [],
    } as any);
  };

  const handleResumeAirdrop = () => {
    if (!isOwner) return toast.error("Only owner can perform this action");
    writeContract({
      address: PMAIRDROP_ADDRESS,
      abi: PMAirdropABI,
      functionName: 'resumeAirdrop',
      args: [],
    } as any);
  };

  const handleWithdrawFees = () => {
    if (!isOwner) return toast.error("Only owner can perform this action");
    writeContract({
      address: PMAIRDROP_ADDRESS,
      abi: PMAirdropABI,
      functionName: 'withdrawFees',
      args: [],
    } as any);
  };

  const handleConfigureTask = (task: TaskConfig) => {
    if (!isOwner) return toast.error("Only owner can perform this action");
    const rewardInWei = parseUnits(task.reward || "0", 18);
    writeContract({
      address: PMAIRDROP_ADDRESS,
      abi: PMAirdropABI,
      functionName: 'configureTask',
      args: [BigInt(task.id), task.name, task.link, rewardInWei, task.enabled],
    } as any);
  };

  const handleAddTask = () => {
    if (!newTask.name || !newTask.link) {
      return toast.error("Please fill in task name and link");
    }
    handleConfigureTask(newTask);
    setNewTask({ id: newTask.id + 1, name: "", link: "", reward: "100", enabled: true });
  };

  const handleToggleTask = (taskId: number, enabled: boolean) => {
    if (!isOwner) return toast.error("Only owner can perform this action");
    writeContract({
      address: PMAIRDROP_ADDRESS,
      abi: PMAirdropABI,
      functionName: 'setTaskEnabled',
      args: [BigInt(taskId), enabled],
    } as any);
  };

  // Format display values
  const contractBalance = adminInfo ? formatEther((adminInfo as any)[4] as bigint) : "0";
  const totalFeesCollected = airdropInfo ? formatEther((airdropInfo as any)[8] as bigint) : "0";
  const totalNetworkFeesCollected = airdropInfo ? formatEther((airdropInfo as any)[9] as bigint) : "0";
  const isActiveAirdrop = airdropInfo ? (airdropInfo as any)[5] as boolean : false;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
        <Header />
        <TradingViewTicker />
        <HeroBanner title="Airdrop Admin" subtitle="Manage airdrop settings" />
        <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
          <Card className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
            <p className="text-muted-foreground">Please connect your wallet to access the admin panel.</p>
          </Card>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
        <Header />
        <TradingViewTicker />
        <HeroBanner title="Airdrop Admin" subtitle="Manage airdrop settings" />
        <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
          <Link to="/dashboard/airdrop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Airdrop
          </Link>
          <Card className="p-8 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-2">Only the contract owner can access the admin panel.</p>
            <p className="text-xs text-muted-foreground">Contract Owner: {contractOwner as string}</p>
            <p className="text-xs text-muted-foreground">Your Address: {address}</p>
          </Card>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="Airdrop Admin Panel" subtitle="Manage airdrop settings and tasks" />
      
      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        <Link to="/dashboard/airdrop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Airdrop
        </Link>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Contract Balance</span>
            </div>
            <p className="text-lg font-bold">{parseFloat(contractBalance).toFixed(4)} BNB</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Claim Fees</span>
            </div>
            <p className="text-lg font-bold">{parseFloat(totalFeesCollected).toFixed(6)} BNB</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Network Fees</span>
            </div>
            <p className="text-lg font-bold">{parseFloat(totalNetworkFeesCollected).toFixed(6)} BNB</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Status</span>
            </div>
            <p className={`text-lg font-bold ${isActiveAirdrop ? 'text-green-500' : 'text-red-500'}`}>
              {isActiveAirdrop ? 'Active' : 'Inactive'}
            </p>
          </Card>
        </div>

        <Tabs defaultValue="fees" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fees">Fee Settings</TabsTrigger>
            <TabsTrigger value="airdrop">Airdrop Control</TabsTrigger>
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
          </TabsList>

          {/* Fee Settings Tab */}
          <TabsContent value="fees">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Fee Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Claim Fee (USD)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.001"
                        value={claimFee}
                        onChange={(e) => setClaimFee(e.target.value)}
                        placeholder="0.01"
                      />
                      <Button onClick={handleSetClaimFee} disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Fee charged for each task claim</p>
                  </div>
                  <div>
                    <Label>Network Fee (USD) - Min $0.01</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.001"
                        min="0.01"
                        value={networkFee}
                        onChange={(e) => setNetworkFee(e.target.value)}
                        placeholder="0.01"
                      />
                      <Button onClick={handleSetNetworkFee} disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Additional network/gas fee (minimum $0.01)</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Fee Collector Address</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={feeCollectorAddress}
                        onChange={(e) => setFeeCollectorAddress(e.target.value)}
                        placeholder="0x..."
                      />
                      <Button onClick={handleSetFeeCollector} disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Address that receives collected fees</p>
                  </div>
                  <div>
                    <Label>Withdraw Collected Fees</Label>
                    <Button onClick={handleWithdrawFees} disabled={isPending} className="w-full mt-1" variant="outline">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                      Withdraw All Fees
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Airdrop Control Tab */}
          <TabsContent value="airdrop">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Airdrop Control
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Duration (Days)</Label>
                    <Input
                      type="number"
                      value={airdropDuration}
                      onChange={(e) => setAirdropDuration(e.target.value)}
                      placeholder="30"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Max Claimable Tokens</Label>
                    <Input
                      type="number"
                      value={maxClaimableValue}
                      onChange={(e) => setMaxClaimableValue(e.target.value)}
                      placeholder="1000000"
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleStartAirdrop} disabled={isPending || isActiveAirdrop} className="w-full">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Start Airdrop
                  </Button>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Current Status</p>
                    <p className={`text-2xl font-bold ${isActiveAirdrop ? 'text-green-500' : 'text-red-500'}`}>
                      {isActiveAirdrop ? 'ACTIVE' : 'INACTIVE'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleEndAirdrop} 
                      disabled={isPending || !isActiveAirdrop} 
                      variant="destructive"
                      className="flex-1"
                    >
                      End Airdrop
                    </Button>
                    <Button 
                      onClick={handleResumeAirdrop} 
                      disabled={isPending || isActiveAirdrop} 
                      variant="outline"
                      className="flex-1"
                    >
                      Resume Airdrop
                    </Button>
                  </div>
                  <Button 
                    onClick={() => { refetchAdminInfo(); refetchFeeInfo(); refetchAirdropInfo(); refetchTasks(); }}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Task Management Tab */}
          <TabsContent value="tasks">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Task Management
              </h3>
              
              {/* Add New Task */}
              <div className="p-4 bg-muted/50 rounded-lg mb-6">
                <h4 className="font-medium mb-3">Add New Task</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Task Name"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  />
                  <Input
                    placeholder="Task Link (https://...)"
                    value={newTask.link}
                    onChange={(e) => setNewTask({ ...newTask, link: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Reward (PM)"
                    value={newTask.reward}
                    onChange={(e) => setNewTask({ ...newTask, reward: e.target.value })}
                  />
                  <Button onClick={handleAddTask} disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add Task
                  </Button>
                </div>
              </div>

              {/* Existing Tasks */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.id}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{task.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {task.link}
                        </a>
                      </TableCell>
                      <TableCell>{task.reward} PM</TableCell>
                      <TableCell>
                        <Switch
                          checked={task.enabled}
                          onCheckedChange={(checked) => handleToggleTask(task.id, checked)}
                          disabled={isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfigureTask(task)}
                          disabled={isPending}
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No tasks configured yet. Add your first task above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default AirdropAdminPage;
