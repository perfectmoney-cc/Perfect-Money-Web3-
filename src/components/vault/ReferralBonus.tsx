import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, Gift, CheckCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  pendingBonus: number;
}

export const ReferralBonus = () => {
  const { address } = useAccount();
  const [referralLink, setReferralLink] = useState("");
  
  // Mock referral stats
  const [stats] = useState<ReferralStats>({
    totalReferrals: 5,
    activeReferrals: 3,
    totalEarned: 125.50,
    pendingBonus: 45.00,
  });

  const generateReferralLink = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }
    const code = address.slice(2, 10).toUpperCase();
    const link = `${window.location.origin}/dashboard/vault?ref=${code}`;
    setReferralLink(link);
    toast.success("Referral link generated!");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copied to clipboard!");
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Referral Program
        </h3>
        <Badge className="bg-green-500/20 text-green-500">
          5% Bonus per Referral
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-2xl font-bold">{stats.totalReferrals}</p>
          <p className="text-xs text-muted-foreground">Total Referrals</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-2xl font-bold text-green-500">{stats.activeReferrals}</p>
          <p className="text-xs text-muted-foreground">Active Stakers</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-2xl font-bold text-primary">${stats.totalEarned.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Earned</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/30 text-center">
          <p className="text-2xl font-bold text-yellow-500">${stats.pendingBonus.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Pending Bonus</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Your Referral Link</label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              placeholder="Generate your referral link"
              className="font-mono text-sm"
            />
            {referralLink ? (
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={generateReferralLink}>
                Generate
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            How It Works
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Share your referral link with friends
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Earn 5% bonus on their first stake amount
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              Earn 2% bonus on their subsequent stakes for 90 days
            </li>
            <li className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              No limit on referral earnings!
            </li>
          </ul>
        </div>

        {stats.pendingBonus >= 10 && (
          <Button className="w-full" onClick={() => toast.success(`Claimed $${stats.pendingBonus.toFixed(2)} referral bonus!`)}>
            Claim ${stats.pendingBonus.toFixed(2)} Bonus
          </Button>
        )}
      </div>
    </Card>
  );
};
