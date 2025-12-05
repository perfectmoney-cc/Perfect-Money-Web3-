import { useState, useEffect, useRef } from "react";
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
import { ArrowLeft, Send, QrCode, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
import { useAccount, useBalance } from 'wagmi';
import { PM_TOKEN_ADDRESS } from "@/contracts/addresses";
const SendPage = () => {
  const {
    address
  } = useAccount();
  const {
    data: tokenBalance
  } = useBalance({
    address: address,
    token: PM_TOKEN_ADDRESS as `0x${string}`
  });
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [scanning, setScanning] = useState(false);
  const [availableBalance, setAvailableBalance] = useState("10000");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);

  // Sync balance from blockchain or localStorage
  useEffect(() => {
    if (tokenBalance?.formatted) {
      const balance = parseFloat(tokenBalance.formatted);
      if (balance > 0) {
        setAvailableBalance(tokenBalance.formatted);
      }
    } else {
      const savedBalance = localStorage.getItem('pmBalance') || "10000";
      setAvailableBalance(savedBalance);
    }
  }, [tokenBalance]);

  // Listen for balance updates
  useEffect(() => {
    const handleBalanceUpdate = () => {
      const newBalance = localStorage.getItem('pmBalance') || "10000";
      setAvailableBalance(newBalance);
    };
    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    return () => window.removeEventListener('balanceUpdate', handleBalanceUpdate);
  }, []);
  const handleSend = () => {
    if (!recipient || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Transaction sent successfully!");
    setRecipient("");
    setAmount("");
    setNote("");
  };
  const startScanning = async () => {
    try {
      setScanning(true);

      // Wait a moment for the DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;
      await html5QrCode.start({
        facingMode: "environment"
      }, {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250
        },
        aspectRatio: 1.0
      }, decodedText => {
        // Extract wallet address if it's a URI format
        let walletAddress = decodedText;
        if (decodedText.includes('ethereum:') || decodedText.includes('0x')) {
          const match = decodedText.match(/0x[a-fA-F0-9]{40}/);
          if (match) {
            walletAddress = match[0];
          }
        }
        setRecipient(walletAddress);
        toast.success("Wallet address scanned successfully!");
        stopScanning();
      }, error => {
        // Ignore scan errors (these fire constantly while scanning)
        if (!error.includes('NotFoundException')) {
          console.log(error);
        }
      });
      isRunningRef.current = true;
    } catch (err) {
      console.error("Scanner error:", err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          toast.error("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (err.name === 'NotFoundError') {
          toast.error("No camera found on this device.");
        } else if (err.message.includes('NotReadableError')) {
          toast.error("Camera is already in use by another application.");
        } else {
          toast.error("Failed to start camera. Please try again.");
        }
      } else {
        toast.error("Failed to start QR scanner.");
      }
      setScanning(false);
      isRunningRef.current = false;
    }
  };
  const stopScanning = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    scannerRef.current = null;
    isRunningRef.current = false;
    setScanning(false);
  };
  useEffect(() => {
    return () => {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);
  return <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="Send PM Tokens" subtitle="Transfer tokens instantly to any wallet address" />
      
      <main className="container mx-auto px-4 pt-12 pb-12 flex-1 my-[20px]">
        {/* Mobile Wallet Card */}
        <div className="md:hidden mb-6">
          <WalletCard showQuickFunctionsToggle={false} compact={true} />
        </div>
        
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="max-w-2xl mx-auto">
          <Card className="p-8 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-primary/10">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-xl">Send PM Tokens</h1>
                <p className="text-muted-foreground">Transfer tokens to another wallet</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address *</Label>
                <div className="flex gap-2">
                  <Input id="recipient" placeholder="0x..." value={recipient} onChange={e => setRecipient(e.target.value)} className="font-mono flex-1" />
                  <Button type="button" variant="outline" size="icon" onClick={startScanning} className="shrink-0">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {scanning && <Card className="p-4 bg-background/95 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Scan QR Code</h3>
                    <Button variant="ghost" size="icon" onClick={stopScanning}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
                </Card>}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PM) *</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <img src={pmLogo} alt="PM" className="h-5 w-5" />
                  </div>
                  <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="pl-12" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">PM</span>
                </div>
                <p className="text-sm text-muted-foreground">Available: {parseFloat(availableBalance).toLocaleString('en-US', {
                  minimumFractionDigits: 2
                })} PM</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Input id="note" placeholder="Payment for..." value={note} onChange={e => setNote(e.target.value)} />
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span className="font-medium">~0.0001 BNB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold">{amount || "0.00"} PM</span>
                </div>
              </div>

              <Button variant="gradient" size="lg" className="w-full" onClick={handleSend}>
                <Send className="h-5 w-5 mr-2" />
                Send Tokens
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>;
};
export default SendPage;