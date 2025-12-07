import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { 
  ArrowLeft, 
  Shield, 
  Settings, 
  DollarSign, 
  Pause, 
  Play, 
  Plus, 
  Wallet,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAccount, useWriteContract } from "wagmi";
import { PMNFTABI } from "@/contracts/nftABI";
import { getContractAddress } from "@/contracts/addresses";
import { parseEther } from "viem";
import { useBlockchainStats } from "@/hooks/useNFTBlockchain";

const PMNFT_ADDRESS = getContractAddress(56, 'PMNFT') as `0x${string}`;

export default function NFTAdmin() {
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const { 
    stats, 
    mintFee, 
    platformFee, 
    isPaused, 
    collector, 
    owner, 
    categories,
    isLoading,
    refetch 
  } = useBlockchainStats();

  const [newMintFee, setNewMintFee] = useState("");
  const [newPlatformFee, setNewPlatformFee] = useState("");
  const [newCollector, setNewCollector] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const isOwner = address?.toLowerCase() === owner?.toLowerCase();

  const handleSetMintFee = async () => {
    if (!newMintFee) {
      toast.error("Please enter a minting fee");
      return;
    }
    try {
      await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'setMintFee',
        args: [parseEther(newMintFee)],
      } as any);
      toast.success("Minting fee updated!");
      setNewMintFee("");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update minting fee");
    }
  };

  const handleSetPlatformFee = async () => {
    if (!newPlatformFee || parseInt(newPlatformFee) > 10) {
      toast.error("Platform fee must be 0-10%");
      return;
    }
    try {
      await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'setPlatformFee',
        args: [BigInt(newPlatformFee)],
      } as any);
      toast.success("Platform fee updated!");
      setNewPlatformFee("");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update platform fee");
    }
  };

  const handleSetCollector = async () => {
    if (!newCollector || !newCollector.startsWith("0x")) {
      toast.error("Please enter a valid address");
      return;
    }
    try {
      await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'setCollector',
        args: [newCollector as `0x${string}`],
      } as any);
      toast.success("Fee collector updated!");
      setNewCollector("");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update collector");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    try {
      await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'addCategory',
        args: [newCategory],
      } as any);
      toast.success(`Category "${newCategory}" added!`);
      setNewCategory("");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to add category");
    }
  };

  const handleTogglePause = async () => {
    try {
      await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: isPaused ? 'unpause' : 'pause',
      } as any);
      toast.success(isPaused ? "Contract unpaused!" : "Contract paused!");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to toggle pause");
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) {
      toast.error("Please enter amount to withdraw");
      return;
    }
    try {
      await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'withdraw',
        args: [parseEther(withdrawAmount)],
      } as any);
      toast.success("Withdrawal successful!");
      setWithdrawAmount("");
    } catch (error: any) {
      toast.error(error?.message || "Withdrawal failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="NFT Admin Panel" subtitle="Manage platform fees, categories, and contract settings" />

      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard/marketplace" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {!isOwner && (
          <Card className="p-6 mb-6 border-yellow-500/50 bg-yellow-500/10">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <div>
                <h3 className="font-semibold text-yellow-500">Admin Access Required</h3>
                <p className="text-sm text-muted-foreground">
                  Only the contract owner can modify settings. Current owner: {owner ? `${owner.slice(0, 8)}...${owner.slice(-6)}` : 'Loading...'}
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Contract Status */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Contract Status</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Contract State</span>
                <Badge variant={isPaused ? "destructive" : "default"} className="gap-1">
                  {isPaused ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {isPaused ? "Paused" : "Active"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Minted</span>
                <span className="font-mono font-bold">{stats?.totalMinted || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Sales</span>
                <span className="font-mono font-bold">{stats?.totalSales || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Volume</span>
                <span className="font-mono font-bold text-primary">
                  {parseFloat(stats?.totalVolume || '0').toLocaleString()} PM
                </span>
              </div>
              <Button 
                variant={isPaused ? "default" : "destructive"}
                className="w-full"
                onClick={handleTogglePause}
                disabled={!isOwner || isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isPaused ? (
                  <Play className="h-4 w-4 mr-2" />
                ) : (
                  <Pause className="h-4 w-4 mr-2" />
                )}
                {isPaused ? "Unpause Contract" : "Pause Contract"}
              </Button>
            </div>
          </Card>

          {/* Fee Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Fee Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Minting Fee</span>
                  <span className="font-mono font-bold">{parseFloat(mintFee).toLocaleString()} PM</span>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="New fee (PM)" 
                    value={newMintFee}
                    onChange={(e) => setNewMintFee(e.target.value)}
                    type="number"
                    disabled={!isOwner}
                  />
                  <Button onClick={handleSetMintFee} disabled={!isOwner || isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set"}
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Platform Fee</span>
                  <span className="font-mono font-bold">{platformFee}%</span>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="New % (0-10)" 
                    value={newPlatformFee}
                    onChange={(e) => setNewPlatformFee(e.target.value)}
                    type="number"
                    max="10"
                    disabled={!isOwner}
                  />
                  <Button onClick={handleSetPlatformFee} disabled={!isOwner || isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Fee Collector */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Fee Collector</h2>
            </div>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground block mb-1">Current Collector</span>
                <span className="font-mono text-sm break-all">{collector || 'Loading...'}</span>
              </div>
              <div className="space-y-2">
                <Label>New Collector Address</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="0x..." 
                    value={newCollector}
                    onChange={(e) => setNewCollector(e.target.value)}
                    disabled={!isOwner}
                  />
                  <Button onClick={handleSetCollector} disabled={!isOwner || isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Emergency Withdraw (PM)</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Amount" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    type="number"
                    disabled={!isOwner}
                  />
                  <Button variant="destructive" onClick={handleWithdraw} disabled={!isOwner || isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Categories */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">NFT Categories</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {cat}
                  </Badge>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Add New Category</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Category name" 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    disabled={!isOwner}
                  />
                  <Button onClick={handleAddCategory} disabled={!isOwner || isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
