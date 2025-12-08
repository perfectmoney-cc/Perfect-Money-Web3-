import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, User, TrendingUp } from "lucide-react";
import { useAccount } from "wagmi";

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalStaked: number;
  planTier: "bronze" | "silver" | "gold";
  rewardsEarned: number;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0Ab2C", totalStaked: 25000, planTier: "gold", rewardsEarned: 1850 },
  { rank: 2, address: "0x8ba1f109551bD432803012645Ac136ddd64DBA72", totalStaked: 22500, planTier: "gold", rewardsEarned: 1650 },
  { rank: 3, address: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B", totalStaked: 18000, planTier: "gold", rewardsEarned: 1320 },
  { rank: 4, address: "0x1234567890abcdef1234567890abcdef12345678", totalStaked: 9500, planTier: "silver", rewardsEarned: 540 },
  { rank: 5, address: "0xfedcba0987654321fedcba0987654321fedcba09", totalStaked: 8200, planTier: "silver", rewardsEarned: 465 },
  { rank: 6, address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", totalStaked: 5000, planTier: "silver", rewardsEarned: 285 },
  { rank: 7, address: "0xcafebabecafebabecafebabecafebabecafebabe", totalStaked: 950, planTier: "bronze", rewardsEarned: 45 },
  { rank: 8, address: "0x0000111122223333444455556666777788889999", totalStaked: 750, planTier: "bronze", rewardsEarned: 35 },
  { rank: 9, address: "0xaaaa1111bbbb2222cccc3333dddd4444eeee5555", totalStaked: 500, planTier: "bronze", rewardsEarned: 23 },
  { rank: 10, address: "0x5555eeee4444dddd3333cccc2222bbbb1111aaaa", totalStaked: 250, planTier: "bronze", rewardsEarned: 11 },
];

export const StakingLeaderboard = () => {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    // Check if user is in leaderboard
    if (address) {
      const userEntry = leaderboard.find(e => e.address.toLowerCase() === address.toLowerCase());
      if (userEntry) {
        setUserRank(userEntry);
      } else {
        // Mock user not in top 10
        setUserRank({
          rank: 42,
          address: address,
          totalStaked: 150,
          planTier: "bronze",
          rewardsEarned: 6.50,
        });
      }
    }
  }, [address, leaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold w-5 text-center">{rank}</span>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "gold":
        return <Badge className="bg-yellow-500/20 text-yellow-500 text-xs">Gold</Badge>;
      case "silver":
        return <Badge className="bg-gray-400/20 text-gray-400 text-xs">Silver</Badge>;
      case "bronze":
        return <Badge className="bg-amber-600/20 text-amber-600 text-xs">Bronze</Badge>;
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Stakers Leaderboard
        </h3>
        <Badge variant="outline" className="animate-pulse">
          Live Rankings
        </Badge>
      </div>

      {/* User's Rank */}
      {userRank && (
        <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="font-bold text-lg">#{userRank.rank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Staked</p>
              <p className="font-bold">${userRank.totalStaked.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Rewards</p>
              <p className="font-bold text-green-500">${userRank.rewardsEarned.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="space-y-2">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = address && entry.address.toLowerCase() === address.toLowerCase();
          
          return (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                isCurrentUser
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-muted/30 hover:bg-muted/50"
              } ${entry.rank <= 3 ? "border-l-4" : ""} ${
                entry.rank === 1 ? "border-l-yellow-500" :
                entry.rank === 2 ? "border-l-gray-400" :
                entry.rank === 3 ? "border-l-amber-600" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div>
                  <p className={`font-mono text-sm ${isCurrentUser ? "text-primary font-bold" : ""}`}>
                    {isCurrentUser ? "You" : formatAddress(entry.address)}
                  </p>
                  {getTierBadge(entry.planTier)}
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Staked</p>
                  <p className="font-semibold">${entry.totalStaked.toLocaleString()}</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-xs text-muted-foreground">Earned</p>
                  <p className="font-semibold text-green-500 flex items-center justify-end gap-1">
                    <TrendingUp className="h-3 w-3" />
                    ${entry.rewardsEarned.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Rankings update every hour based on total staked amount
      </p>
    </Card>
  );
};
