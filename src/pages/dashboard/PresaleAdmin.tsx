import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, Users, Calendar, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { PMPresaleABI } from "@/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/contracts/addresses";

const PRESALE_ADDRESS = CONTRACT_ADDRESSES[56].PMPresale as `0x${string}`;

const ROUND_NAMES = ["Seed", "Private", "Public"] as const;

interface RoundConfig {
  price: string;
  supply: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  minBuy: string;
  maxBuyTokens: string;
  whitelistEnabled: boolean;
}

const PresaleAdminPage = () => {
  const { address, isConnected } = useAccount();
  const [selectedRound, setSelectedRound] = useState(0);
  const [whitelistAddresses, setWhitelistAddresses] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  
  const [roundConfigs, setRoundConfigs] = useState<RoundConfig[]>([
    { price: "0.00001", supply: "5000000000", startDate: "", startTime: "00:00", endDate: "", endTime: "23:59", minBuy: "0.1", maxBuyTokens: "100000000", whitelistEnabled: true },
    { price: "0.000015", supply: "5000000000", startDate: "", startTime: "00:00", endDate: "", endTime: "23:59", minBuy: "0.1", maxBuyTokens: "100000000", whitelistEnabled: true },
    { price: "0.00002", supply: "10000000000", startDate: "", startTime: "00:00", endDate: "", endTime: "23:59", minBuy: "0.05", maxBuyTokens: "200000000", whitelistEnabled: false },
  ]);

  // Read contract owner
  const { data: contractOwner } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'owner',
    chainId: 56,
  });

  // Read presale ended status
  const { data: presaleEnded } = useReadContract({
    address: PRESALE_ADDRESS,
    abi: PMPresaleABI,
    functionName: 'presaleEnded',
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

  // Write contract functions
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Check if connected wallet is owner
  useEffect(() => {
    if (address && contractOwner) {
      setIsOwner(address.toLowerCase() === (contractOwner as string).toLowerCase());
    }
  }, [address, contractOwner]);

  // Load existing round data
  useEffect(() => {
    const roundInfos = [seedRoundInfo, privateRoundInfo, publicRoundInfo];
    const newConfigs = [...roundConfigs];
    
    roundInfos.forEach((info, index) => {
      if (info) {
        const infoArray = info as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean];
        const [price, supply, sold, start, end, minBuy, maxBuyTokens, whitelistEnabled] = infoArray;
        
        if (start > 0n) {
          const startDate = new Date(Number(start) * 1000);
          const endDate = new Date(Number(end) * 1000);
          
          newConfigs[index] = {
            price: formatEther(price),
            supply: formatEther(supply),
            startDate: startDate.toISOString().split('T')[0],
            startTime: startDate.toTimeString().slice(0, 5),
            endDate: endDate.toISOString().split('T')[0],
            endTime: endDate.toTimeString().slice(0, 5),
            minBuy: formatEther(minBuy),
            maxBuyTokens: formatEther(maxBuyTokens),
            whitelistEnabled: whitelistEnabled,
          };
        }
      }
    });
    
    setRoundConfigs(newConfigs);
  }, [seedRoundInfo, privateRoundInfo, publicRoundInfo]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && txHash) {
      toast.success("Transaction confirmed!");
    }
  }, [isConfirmed, txHash]);

  const handleConfigChange = (field: keyof RoundConfig, value: string | boolean) => {
    const newConfigs = [...roundConfigs];
    newConfigs[selectedRound] = { ...newConfigs[selectedRound], [field]: value };
    setRoundConfigs(newConfigs);
  };

  const handleConfigureRound = async () => {
    const config = roundConfigs[selectedRound];
    
    if (!config.startDate || !config.endDate) {
      toast.error("Please set start and end dates");
      return;
    }

    const startTimestamp = Math.floor(new Date(`${config.startDate}T${config.startTime}`).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(`${config.endDate}T${config.endTime}`).getTime() / 1000);

    if (endTimestamp <= startTimestamp) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      writeContract({
        address: PRESALE_ADDRESS,
        abi: PMPresaleABI,
        functionName: 'configureRound',
        args: [
          selectedRound,
          parseEther(config.price),
          parseEther(config.supply),
          BigInt(startTimestamp),
          BigInt(endTimestamp),
          parseEther(config.minBuy),
          parseEther(config.maxBuyTokens),
          config.whitelistEnabled
        ],
      } as any);
      
      toast.loading("Configuring round...", { id: "config-tx" });
    } catch (error: any) {
      toast.error(error?.message || "Configuration failed");
    }
  };

  const handleSetWhitelist = async (status: boolean) => {
    const addresses = whitelistAddresses
      .split(/[\n,]/)
      .map(addr => addr.trim())
      .filter(addr => addr.startsWith('0x') && addr.length === 42);

    if (addresses.length === 0) {
      toast.error("No valid addresses found");
      return;
    }

    try {
      writeContract({
        address: PRESALE_ADDRESS,
        abi: PMPresaleABI,
        functionName: 'setWhitelist',
        args: [selectedRound, addresses, status],
      } as any);
      
      toast.loading(`${status ? 'Adding' : 'Removing'} ${addresses.length} addresses...`, { id: "whitelist-tx" });
    } catch (error: any) {
      toast.error(error?.message || "Whitelist update failed");
    }
  };

  const handleEndPresale = async () => {
    if (!window.confirm("Are you sure you want to end the presale? This cannot be undone.")) {
      return;
    }

    try {
      writeContract({
        address: PRESALE_ADDRESS,
        abi: PMPresaleABI,
        functionName: 'endPresale',
        args: [],
      } as any);
      
      toast.loading("Ending presale...", { id: "end-tx" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to end presale");
    }
  };

  const handleWithdrawBNB = async () => {
    try {
      writeContract({
        address: PRESALE_ADDRESS,
        abi: PMPresaleABI,
        functionName: 'withdrawBNB',
        args: [],
      } as any);
      
      toast.loading("Withdrawing BNB...", { id: "withdraw-tx" });
    } catch (error: any) {
      toast.error(error?.message || "Withdrawal failed");
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
        <Header />
        <TradingViewTicker />
        <HeroBanner title="Presale Admin" subtitle="Configure presale rounds and whitelist" />
        <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
          <Card className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
            <p className="text-muted-foreground">Please connect your wallet to access admin functions.</p>
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
        <HeroBanner title="Presale Admin" subtitle="Configure presale rounds and whitelist" />
        <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
          <Card className="p-8 text-center">
            <ShieldCheck className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Only the contract owner can access admin functions.</p>
            <p className="text-xs text-muted-foreground mt-2">Connected: {address}</p>
            <p className="text-xs text-muted-foreground">Owner: {contractOwner as string}</p>
          </Card>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  const config = roundConfigs[selectedRound];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="Presale Admin Panel" subtitle="Configure rounds, whitelist, and manage presale" />
      
      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {presaleEnded && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30">
            <p className="text-red-400 font-medium">⚠️ Presale has ended. Configuration is locked.</p>
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Round Selection */}
          <Tabs defaultValue="0" onValueChange={(v) => setSelectedRound(parseInt(v))}>
            <TabsList className="grid w-full grid-cols-3">
              {ROUND_NAMES.map((name, index) => (
                <TabsTrigger key={index} value={index.toString()}>
                  {name} Round
                </TabsTrigger>
              ))}
            </TabsList>

            {[0, 1, 2].map((roundIndex) => (
              <TabsContent key={roundIndex} value={roundIndex.toString()} className="space-y-6">
                {/* Round Configuration */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Settings className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold">{ROUND_NAMES[roundIndex]} Round Configuration</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Price (BNB per token)</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={roundConfigs[roundIndex].price}
                        onChange={(e) => handleConfigChange('price', e.target.value)}
                        disabled={presaleEnded as boolean}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Supply (tokens)</Label>
                      <Input
                        type="number"
                        value={roundConfigs[roundIndex].supply}
                        onChange={(e) => handleConfigChange('supply', e.target.value)}
                        disabled={presaleEnded as boolean}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={roundConfigs[roundIndex].startDate}
                        onChange={(e) => handleConfigChange('startDate', e.target.value)}
                        disabled={presaleEnded as boolean}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={roundConfigs[roundIndex].startTime}
                        onChange={(e) => handleConfigChange('startTime', e.target.value)}
                        disabled={presaleEnded as boolean}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={roundConfigs[roundIndex].endDate}
                        onChange={(e) => handleConfigChange('endDate', e.target.value)}
                        disabled={presaleEnded as boolean}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={roundConfigs[roundIndex].endTime}
                        onChange={(e) => handleConfigChange('endTime', e.target.value)}
                        disabled={presaleEnded as boolean}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Min Buy (BNB)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={roundConfigs[roundIndex].minBuy}
                        onChange={(e) => handleConfigChange('minBuy', e.target.value)}
                        disabled={presaleEnded as boolean}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Tokens per Wallet</Label>
                      <Input
                        type="number"
                        value={roundConfigs[roundIndex].maxBuyTokens}
                        onChange={(e) => handleConfigChange('maxBuyTokens', e.target.value)}
                        disabled={presaleEnded as boolean}
                      />
                    </div>

                    <div className="flex items-center justify-between col-span-full p-4 rounded-lg bg-muted/50">
                      <div>
                        <Label>Whitelist Required</Label>
                        <p className="text-sm text-muted-foreground">Only whitelisted addresses can participate</p>
                      </div>
                      <Switch
                        checked={roundConfigs[roundIndex].whitelistEnabled}
                        onCheckedChange={(checked) => handleConfigChange('whitelistEnabled', checked)}
                        disabled={presaleEnded as boolean}
                      />
                    </div>
                  </div>

                  <Button
                    variant="gradient"
                    className="w-full mt-6"
                    onClick={handleConfigureRound}
                    disabled={isPending || isConfirming || presaleEnded as boolean}
                  >
                    {(isPending || isConfirming) ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Configuring...
                      </>
                    ) : (
                      <>
                        <Settings className="h-5 w-5 mr-2" />
                        Save {ROUND_NAMES[roundIndex]} Configuration
                      </>
                    )}
                  </Button>
                </Card>

                {/* Whitelist Management */}
                {roundConfigs[roundIndex].whitelistEnabled && (
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Users className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-bold">{ROUND_NAMES[roundIndex]} Whitelist Management</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Wallet Addresses (one per line or comma-separated)</Label>
                        <Textarea
                          placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
                          rows={6}
                          value={whitelistAddresses}
                          onChange={(e) => setWhitelistAddresses(e.target.value)}
                          disabled={presaleEnded as boolean}
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button
                          variant="default"
                          className="flex-1"
                          onClick={() => handleSetWhitelist(true)}
                          disabled={isPending || isConfirming || presaleEnded as boolean}
                        >
                          Add to Whitelist
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleSetWhitelist(false)}
                          disabled={isPending || isConfirming || presaleEnded as boolean}
                        >
                          Remove from Whitelist
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Admin Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Presale Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="destructive"
                onClick={handleEndPresale}
                disabled={isPending || isConfirming || presaleEnded as boolean}
              >
                End Presale
              </Button>
              <Button
                variant="outline"
                onClick={handleWithdrawBNB}
                disabled={isPending || isConfirming || !presaleEnded}
              >
                Withdraw BNB
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default PresaleAdminPage;
