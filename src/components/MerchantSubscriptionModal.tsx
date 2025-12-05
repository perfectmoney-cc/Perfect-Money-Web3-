import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Crown, Zap, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

interface MerchantSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribe: (planName: string, walletAddress: string) => void;
}

export const MerchantSubscriptionModal = ({ 
  open, 
  onOpenChange, 
  onSubscribe 
}: MerchantSubscriptionModalProps) => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const walletAddress = address || "";

  const plans = [
    {
      name: "Starter",
      price: "5,000 PM",
      period: "/year",
      icon: Zap,
      features: [
        "Up to 100 transactions/month",
        "Basic payment integration",
        "Email support",
        "Payment QR codes",
        "Transaction history"
      ]
    },
    {
      name: "Professional",
      price: "10,000 PM",
      period: "/year",
      icon: Crown,
      popular: true,
      features: [
        "Unlimited transactions",
        "Advanced API access",
        "Priority 24/7 support",
        "Custom payment links",
        "Advanced analytics",
        "Multi-currency support",
        "Webhook notifications"
      ]
    }
  ];

  const handleSubscribe = async (planName: string) => {
    if (!isConnected || !walletAddress) {
      toast.error("Please connect your wallet first");
      if (openConnectModal) {
        openConnectModal();
      }
      return;
    }
    
    toast.success(`Subscribing to ${planName} plan...`);
    setTimeout(() => {
      onSubscribe(planName, walletAddress);
      onOpenChange(false);
      toast.success(`Successfully subscribed to ${planName}!`);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center mb-2">
            Choose Your Merchant Plan
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Select a plan to start accepting PM token payments
          </p>
          {isConnected && walletAddress && (
            <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-primary/10 rounded-lg">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
            </div>
          )}
          {!isConnected && (
            <Button 
              variant="outline" 
              className="mt-4 mx-auto"
              onClick={() => openConnectModal?.()}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet to Subscribe
            </Button>
          )}
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={plan.name} 
                className={`p-6 relative ${
                  plan.popular 
                    ? 'border-2 border-primary shadow-glow' 
                    : 'border border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary px-3 py-1 rounded-full text-xs font-bold">
                      POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.popular ? "gradient" : "outline"}
                  className="w-full"
                  onClick={() => handleSubscribe(plan.name)}
                >
                  Subscribe to {plan.name}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          All plans include secure blockchain payments and can be cancelled anytime
        </div>
      </DialogContent>
    </Dialog>
  );
};
