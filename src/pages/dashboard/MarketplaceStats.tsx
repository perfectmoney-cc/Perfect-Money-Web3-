import { useState, useEffect } from "react";
import pmLogo from "@/assets/pm-logo-new.png";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Search, Users, TrendingUp, Package, 
  BarChart3, ChevronLeft, ChevronRight, Star, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useNFTStats } from "@/hooks/useNFTMarketplace";

interface Collection {
  rank: number;
  name: string;
  image: string;
  floor: number;
  topOffer: number;
  change24h: number;
  volume: number;
  sales: number;
  listed: string;
  verified: boolean;
}

interface Holder {
  rank: number;
  address: string;
  avatar: string;
  nftsOwned: number;
  totalValue: number;
  collections: number;
}

const MarketplaceStats = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Fetch real blockchain data
  const { totalMinted, totalSupply, mintingFee, platformFeePercent, isLoading: statsLoading } = useNFTStats();

  // Sample collections data
  const allCollections: Collection[] = [
    { rank: 1, name: "PM Digital Cards", image: "💳", floor: 145, topOffer: 140, change24h: 2.8, volume: 88150, sales: 618, listed: "930/19.9K", verified: true },
    { rank: 2, name: "PM Voucher Cards", image: "🎟️", floor: 89, topOffer: 85, change24h: 0.1, volume: 40970, sales: 1582, listed: "210/12.3K", verified: true },
    { rank: 3, name: "PM Gift Cards", image: "🎁", floor: 574, topOffer: 548, change24h: -0.7, volume: 47730, sales: 7, listed: "173/9,998", verified: true },
    { rank: 4, name: "PM Partner Badges", image: "🏅", floor: 12, topOffer: 10, change24h: 3.1, volume: 41820, sales: 10500, listed: "3,386/35.6K", verified: true },
    { rank: 5, name: "PM Discount Cards", image: "🏷️", floor: 170, topOffer: 163, change24h: -2.2, volume: 29460, sales: 17, listed: "163/9,999", verified: true },
    { rank: 6, name: "PM VIP Exclusive", image: "👑", floor: 256, topOffer: 250, change24h: 1.5, volume: 33770, sales: 16300, listed: "11/19.9K", verified: true },
    ...Array.from({ length: 24 }, (_, i) => ({
      rank: i + 7,
      name: `PM Collection #${i + 7}`,
      image: ["🎨", "🔮", "🌟", "💫", "🎭"][i % 5],
      floor: Math.floor(Math.random() * 500) + 20,
      topOffer: Math.floor(Math.random() * 450) + 15,
      change24h: (Math.random() * 10 - 5),
      volume: Math.floor(Math.random() * 30000) + 1000,
      sales: Math.floor(Math.random() * 1000) + 10,
      listed: `${Math.floor(Math.random() * 500) + 10}/${(Math.random() * 20 + 1).toFixed(1)}K`,
      verified: Math.random() > 0.3,
    })),
  ];

  // Sample holders data
  const allHolders: Holder[] = Array.from({ length: 50 }, (_, i) => ({
    rank: i + 1,
    address: `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}`,
    avatar: ["🐋", "🦈", "🐠", "🐡", "🦑", "🦐", "🦀", "🐙", "🦞", "🐚"][i % 10],
    nftsOwned: Math.floor(Math.random() * 200) + 10,
    totalValue: Math.floor(Math.random() * 100000) + 5000,
    collections: Math.floor(Math.random() * 15) + 1,
  }));

  const filteredCollections = allCollections.filter(c =>
    searchQuery === "" || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHolders = allHolders.filter(h =>
    searchQuery === "" || h.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPagesCollections = Math.ceil(filteredCollections.length / itemsPerPage);
  const totalPagesHolders = Math.ceil(filteredHolders.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedCollections = filteredCollections.slice(startIndex, startIndex + itemsPerPage);
  const displayedHolders = filteredHolders.slice(startIndex, startIndex + itemsPerPage);

  // Global stats combining blockchain data with sample data
  const globalStats = {
    totalCollections: allCollections.length,
    totalHolders: allHolders.length,
    totalVolume: allCollections.reduce((sum, c) => sum + c.volume, 0),
    totalNFTs: totalMinted > 0 ? totalMinted : allHolders.reduce((sum, h) => sum + h.nftsOwned, 0),
    totalMintedOnChain: totalMinted,
    mintingFee,
    platformFeePercent,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="Marketplace Statistics" subtitle="NFT collections, holders, and trading analytics" />

      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        <div className="flex items-center justify-between mb-6">
          <Link to="/dashboard/marketplace" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Global Stats */}
          {statsLoading ? (
            <div className="flex items-center justify-center py-8 mb-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading blockchain data...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <Card className="p-4 bg-card/50 backdrop-blur-sm text-center">
                <Package className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{globalStats.totalCollections}</p>
                <p className="text-xs text-muted-foreground">Collections</p>
              </Card>
              <Card className="p-4 bg-card/50 backdrop-blur-sm text-center">
                <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{globalStats.totalHolders}</p>
                <p className="text-xs text-muted-foreground">Unique Holders</p>
              </Card>
              <Card className="p-4 bg-card/50 backdrop-blur-sm text-center">
                <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold">{globalStats.totalVolume.toLocaleString()}</p>
                  <img src={pmLogo} alt="PM" className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">Total Volume</p>
              </Card>
              <Card className="p-4 bg-card/50 backdrop-blur-sm text-center">
                <BarChart3 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{globalStats.totalMintedOnChain}</p>
                <p className="text-xs text-muted-foreground">Minted On-Chain</p>
              </Card>
              <Card className="p-4 bg-card/50 backdrop-blur-sm text-center border-primary/30">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <img src={pmLogo} alt="PM" className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold">{globalStats.mintingFee}</p>
                <p className="text-xs text-muted-foreground">Minting Fee (PM)</p>
              </Card>
              <Card className="p-4 bg-card/50 backdrop-blur-sm text-center">
                <BarChart3 className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{globalStats.platformFeePercent}%</p>
                <p className="text-xs text-muted-foreground">Platform Fee</p>
              </Card>
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search collections or holders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="collections" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="collections">Collections</TabsTrigger>
              <TabsTrigger value="holders">Top Holders</TabsTrigger>
            </TabsList>

            <TabsContent value="collections">
              <Card className="p-6 bg-card/50 backdrop-blur-sm overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-3 pr-4"><Star className="h-4 w-4" /></th>
                      <th className="pb-3 pr-4">#</th>
                      <th className="pb-3 pr-4">Collection</th>
                      <th className="pb-3 pr-4 text-right">Floor</th>
                      <th className="pb-3 pr-4 text-right">Top Offer</th>
                      <th className="pb-3 pr-4 text-right">Floor 1d %</th>
                      <th className="pb-3 pr-4 text-right">Volume</th>
                      <th className="pb-3 pr-4 text-right">Sales</th>
                      <th className="pb-3 text-right">Listed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCollections.map((collection) => (
                      <tr key={collection.rank} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                        <td className="py-4 pr-4">
                          <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-500 cursor-pointer" />
                        </td>
                        <td className="py-4 pr-4 font-medium">{collection.rank}</td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{collection.image}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{collection.name}</span>
                              {collection.verified && (
                                <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-500">✓</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-medium">{collection.floor}</span>
                            <img src={pmLogo} alt="PM" className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-medium">{collection.topOffer}</span>
                            <img src={pmLogo} alt="PM" className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <span className={collection.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {collection.change24h >= 0 ? '▲' : '▼'} {Math.abs(collection.change24h).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className={`font-bold px-2 py-1 rounded ${collection.volume > 40000 ? 'bg-green-500/20 text-green-500' : ''}`}>
                              {collection.volume.toLocaleString()}
                            </span>
                            <img src={pmLogo} alt="PM" className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-right font-medium">{collection.sales.toLocaleString()}</td>
                        <td className="py-4 text-right text-muted-foreground">{collection.listed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPagesCollections > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPagesCollections}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPagesCollections, p + 1))} disabled={currentPage === totalPagesCollections}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="holders">
              <Card className="p-6 bg-card/50 backdrop-blur-sm overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-3 pr-4">#</th>
                      <th className="pb-3 pr-4">Holder</th>
                      <th className="pb-3 pr-4 text-right">NFTs Owned</th>
                      <th className="pb-3 pr-4 text-right">Total Value</th>
                      <th className="pb-3 text-right">Collections</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedHolders.map((holder) => (
                      <tr key={holder.rank} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-4 pr-4">
                          <span className={`font-bold ${holder.rank === 1 ? 'text-yellow-500' : holder.rank === 2 ? 'text-gray-400' : holder.rank === 3 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {holder.rank}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{holder.avatar}</span>
                            <span className="font-mono text-sm">{holder.address}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-right font-bold">{holder.nftsOwned}</td>
                        <td className="py-4 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="font-bold text-primary">{holder.totalValue.toLocaleString()}</span>
                            <img src={pmLogo} alt="PM" className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="py-4 text-right">{holder.collections}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPagesHolders > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPagesHolders}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPagesHolders, p + 1))} disabled={currentPage === totalPagesHolders}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default MarketplaceStats;
