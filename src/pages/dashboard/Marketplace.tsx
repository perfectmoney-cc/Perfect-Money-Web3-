import { useState, useEffect } from "react";
import pmLogo from "@/assets/pm-logo-new.png";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { WalletCard } from "@/components/WalletCard";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, TrendingUp, Package, ChevronLeft, ChevronRight, CheckCircle2, Gavel, History, Eye, Clock, User, Timer, Plus, Sparkles, Heart, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ipfsToHttp } from "@/utils/ipfsService";
import { NFTImage } from "@/components/NFTImage";
import { NFTSkeletonGrid, TrendingNFTSkeletonGrid, AnalyticsCardSkeleton } from "@/components/NFTSkeletonGrid";
import { useNFTFavorites } from "@/hooks/useNFTFavorites";
import { NFT_CATEGORIES } from "@/contracts/nftABI";

interface MarketItem {
  id: number;
  name: string;
  price: number;
  category: string;
  date: Date;
  views: number;
  description: string;
  seller: string;
  image?: string | null;
  isAuction?: boolean;
  auctionEndTime?: string;
  highestBid?: number;
  highestBidder?: string;
  isMinted?: boolean;
}

interface OwnedNFT {
  id: number;
  name: string;
  purchasePrice: number;
  category: string;
  description: string;
  image?: string | null;
  isMinted?: boolean;
}

interface Bid {
  id: number;
  bidder: string;
  amount: number;
  timestamp: string;
}

const MarketplacePage = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [detailItem, setDetailItem] = useState<MarketItem | null>(null);
  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<OwnedNFT | null>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [isAuctionListing, setIsAuctionListing] = useState(false);
  const [auctionDuration, setAuctionDuration] = useState("24");
  const [startingBid, setStartingBid] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { favorites, toggleFavorite, isFavorite, favoritesCount } = useNFTFavorites();
  const itemsPerPage = 12;

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Load owned NFTs from localStorage
  useEffect(() => {
    const owned = JSON.parse(localStorage.getItem("ownedNFTs") || "[]");
    setOwnedNFTs(owned);
  }, []);

  // Load bids for selected NFT
  useEffect(() => {
    if (selectedNFT) {
      const allBids = JSON.parse(localStorage.getItem(`nftBids_${selectedNFT.id}`) || "[]");
      setBids(allBids);
    }
  }, [selectedNFT]);

  // Load bids for detail view
  useEffect(() => {
    if (detailItem?.isAuction) {
      const allBids = JSON.parse(localStorage.getItem(`auctionBids_${detailItem.id}`) || "[]");
      setBids(allBids);
    }
  }, [detailItem]);

  // Get minted NFTs from localStorage
  const mintedNFTs = JSON.parse(localStorage.getItem("mintedNFTs") || "[]");

  // Generate market items including minted ones
  const nftCategories = ["PM Digital Card", "PM Voucher Card", "PM Gift Cards", "PM Partner Badge", "PM Discount Card", "PM VIP Exclusive Card"];

  const generateMarketItems = (): MarketItem[] => {
    const defaultItems: MarketItem[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Digital Asset #${i + 1}`,
      price: Math.floor(Math.random() * 1000) + 100,
      category: nftCategories[Math.floor(Math.random() * nftCategories.length)],
      date: new Date(2024, 0, Math.floor(Math.random() * 30) + 1),
      views: Math.floor(Math.random() * 1000) + 100,
      description: `Premium digital collectible verified on BSC blockchain. Unique and authenticated.`,
      seller: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
      isAuction: Math.random() > 0.7,
      auctionEndTime: new Date(Date.now() + Math.random() * 86400000 * 3).toISOString(),
      highestBid: Math.floor(Math.random() * 500) + 50,
    }));

    // Add minted NFTs to market
    const mintedItems: MarketItem[] = mintedNFTs
      .filter((nft: any) => nft.isListed)
      .map((nft: any) => ({
        id: nft.id,
        name: nft.name,
        price: nft.price,
        category: nft.category,
        date: new Date(nft.mintedAt),
        views: Math.floor(Math.random() * 100),
        description: nft.description,
        seller: nft.creator,
        image: nft.image,
        isAuction: nft.isAuction || false,
        auctionEndTime: nft.auctionEndTime,
        highestBid: nft.highestBid || 0,
        isMinted: true,
      }));

    return [...mintedItems, ...defaultItems];
  };

  const allMarketItems = generateMarketItems();

  const handleViewDetails = (item: MarketItem) => {
    setDetailItem(item);
  };

  const handleBuyNow = (item: MarketItem) => {
    setDetailItem(null);
    setSelectedItem(item);
  };

  const handleConfirmPurchase = () => {
    if (!selectedItem) return;
    const pmBalance = parseFloat(localStorage.getItem("pmBalance") || "0");
    const totalCost = selectedItem.price * 1.02;

    if (pmBalance < totalCost) {
      toast.error("Insufficient PM balance");
      return;
    }

    localStorage.setItem("pmBalance", (pmBalance - totalCost).toFixed(2));

    const newNFT: OwnedNFT = {
      id: Date.now(),
      name: selectedItem.name,
      purchasePrice: selectedItem.price,
      category: selectedItem.category,
      description: selectedItem.description,
      image: selectedItem.image,
    };
    const owned = [...ownedNFTs, newNFT];
    setOwnedNFTs(owned);
    localStorage.setItem("ownedNFTs", JSON.stringify(owned));

    // Remove from minted if it was a minted NFT
    if (selectedItem.isMinted) {
      const updated = mintedNFTs.filter((nft: any) => nft.id !== selectedItem.id);
      localStorage.setItem("mintedNFTs", JSON.stringify(updated));
    }

    const recentTransactions = JSON.parse(localStorage.getItem("recentTransactions") || "[]");
    recentTransactions.unshift({
      id: Date.now(),
      description: `Purchased ${selectedItem.name}`,
      amount: -totalCost,
      time: "Just now",
      type: "debit",
    });
    localStorage.setItem("recentTransactions", JSON.stringify(recentTransactions));
    window.dispatchEvent(new Event("balanceUpdate"));

    toast.success(`Successfully purchased ${selectedItem.name}!`);
    setSelectedItem(null);
  };

  const handlePlaceBidOnAuction = () => {
    if (!detailItem || !bidAmount) return;
    
    const bidValue = parseFloat(bidAmount);
    const pmBalance = parseFloat(localStorage.getItem("pmBalance") || "0");
    
    if (bidValue <= (detailItem.highestBid || 0)) {
      toast.error("Bid must be higher than current highest bid");
      return;
    }
    
    if (bidValue > pmBalance) {
      toast.error("Insufficient PM balance");
      return;
    }

    const walletAddress = localStorage.getItem("connectedWallet") || "0x742d35...5f0bEb";
    const newBid: Bid = {
      id: Date.now(),
      bidder: walletAddress,
      amount: bidValue,
      timestamp: new Date().toLocaleString(),
    };

    const existingBids = JSON.parse(localStorage.getItem(`auctionBids_${detailItem.id}`) || "[]");
    const updatedBids = [newBid, ...existingBids];
    localStorage.setItem(`auctionBids_${detailItem.id}`, JSON.stringify(updatedBids));
    setBids(updatedBids);

    // Update highest bid in minted NFTs if applicable
    if (detailItem.isMinted) {
      const updated = mintedNFTs.map((nft: any) =>
        nft.id === detailItem.id ? { ...nft, highestBid: bidValue, highestBidder: walletAddress } : nft
      );
      localStorage.setItem("mintedNFTs", JSON.stringify(updated));
    }

    toast.success(`Bid of ${bidValue} PM placed successfully!`);
    setBidAmount("");
    setDetailItem({ ...detailItem, highestBid: bidValue, highestBidder: walletAddress });
  };

  const handleListForSale = () => {
    if (!selectedNFT) return;

    if (isAuctionListing) {
      if (!startingBid || parseFloat(startingBid) <= 0) {
        toast.error("Please enter a valid starting bid");
        return;
      }

      const auctionEnd = new Date(Date.now() + parseInt(auctionDuration) * 3600000).toISOString();
      
      const auctionNFT = {
        id: selectedNFT.id,
        name: selectedNFT.name,
        description: selectedNFT.description,
        category: selectedNFT.category,
        price: parseFloat(startingBid),
        image: selectedNFT.image,
        creator: localStorage.getItem("connectedWallet") || "0x742d35...5f0bEb",
        mintedAt: new Date().toISOString(),
        isListed: true,
        isAuction: true,
        auctionEndTime: auctionEnd,
        highestBid: 0,
      };

      const minted = JSON.parse(localStorage.getItem("mintedNFTs") || "[]");
      minted.push(auctionNFT);
      localStorage.setItem("mintedNFTs", JSON.stringify(minted));

      // Remove from owned
      const updated = ownedNFTs.filter(nft => nft.id !== selectedNFT.id);
      setOwnedNFTs(updated);
      localStorage.setItem("ownedNFTs", JSON.stringify(updated));

      toast.success(`${selectedNFT.name} listed for auction starting at ${startingBid} PM`);
    } else {
      if (!listingPrice || parseFloat(listingPrice) <= 0) {
        toast.error("Please enter a valid price");
        return;
      }

      const listedNFT = {
        id: selectedNFT.id,
        name: selectedNFT.name,
        description: selectedNFT.description,
        category: selectedNFT.category,
        price: parseFloat(listingPrice),
        image: selectedNFT.image,
        creator: localStorage.getItem("connectedWallet") || "0x742d35...5f0bEb",
        mintedAt: new Date().toISOString(),
        isListed: true,
        isAuction: false,
      };

      const minted = JSON.parse(localStorage.getItem("mintedNFTs") || "[]");
      minted.push(listedNFT);
      localStorage.setItem("mintedNFTs", JSON.stringify(minted));

      const updated = ownedNFTs.filter(nft => nft.id !== selectedNFT.id);
      setOwnedNFTs(updated);
      localStorage.setItem("ownedNFTs", JSON.stringify(updated));

      toast.success(`${selectedNFT.name} listed for ${listingPrice} PM`);
    }

    setSelectedNFT(null);
    setListingPrice("");
    setStartingBid("");
    setIsAuctionListing(false);
  };

  // Handle favorite toggle
  const handleToggleFavorite = (e: React.MouseEvent, item: MarketItem) => {
    e.stopPropagation();
    const added = toggleFavorite({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
    });
    toast.success(added ? `${item.name} added to favorites` : `${item.name} removed from favorites`);
  };

  // Filter by category, search query, and favorites
  const filteredItems = allMarketItems.filter((item) => {
    const matchesSearch = searchQuery.trim() === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    const matchesFavorites = !showFavoritesOnly || isFavorite(item.id);
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "date") return b.date.getTime() - a.date.getTime();
    if (sortBy === "trending") return b.views - a.views;
    if (sortBy === "auctions") return (b.isAuction ? 1 : 0) - (a.isAuction ? 1 : 0);
    return 0;
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const marketItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const formatTimeRemaining = (endTime: string) => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  // Analytics data
  const analyticsData = {
    totalVolume: 125420,
    totalSales: 1847,
    floorPrice: 85,
    owners: 342,
    listed: allMarketItems.length,
  };

  // Top minters leaderboard
  const topMinters = [
    { rank: 1, address: "0x742d...5f0b", minted: 47, volume: 12500, avatar: "🎨" },
    { rank: 2, address: "0x8a3e...2c1d", minted: 38, volume: 9800, avatar: "🔥" },
    { rank: 3, address: "0x1f4b...9e7a", minted: 31, volume: 7650, avatar: "⭐" },
    { rank: 4, address: "0x5c2d...3f8e", minted: 26, volume: 5420, avatar: "💎" },
    { rank: 5, address: "0x9b7a...4d2c", minted: 22, volume: 4180, avatar: "🚀" },
  ];

  // Trending NFTs (top 4 by views)
  const trendingNFTs = [...allMarketItems].sort((a, b) => b.views - a.views).slice(0, 4);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner title="NFT Marketplace" subtitle="Browse, trade and auction digital assets with PM tokens" />

      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        <div className="md:hidden mt-5 mb-6">
          <WalletCard showQuickFunctionsToggle={false} compact={true} />
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <Button variant="gradient" onClick={() => navigate("/dashboard/mint-nft")}>
              <Sparkles className="h-4 w-4 mr-2" />
              Mint NFT
            </Button>
          </div>
          {/* Navigation Links to Sub-pages */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/marketplace/minters")}>
              <User className="h-4 w-4 mr-2" />
              Minters
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/marketplace/stats")}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Stats
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Collection Analytics */}
          {isLoading ? (
            <AnalyticsCardSkeleton />
          ) : (
            <Card className="p-6 bg-card/50 backdrop-blur-sm mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Collection Analytics</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{analyticsData.totalVolume.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Volume (PM)</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-green-500">{analyticsData.totalSales.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-yellow-500">{analyticsData.floorPrice}</p>
                  <p className="text-xs text-muted-foreground">Floor Price (PM)</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-blue-500">{analyticsData.owners}</p>
                  <p className="text-xs text-muted-foreground">Unique Owners</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-purple-500">{analyticsData.listed}</p>
                  <p className="text-xs text-muted-foreground">Listed Items</p>
                </div>
              </div>
            </Card>
          )}

          {/* Trending NFTs Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold">Trending NFTs</h2>
            </div>
            {isLoading ? (
              <TrendingNFTSkeletonGrid />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trendingNFTs.map((item, index) => (
                  <Card 
                    key={`trending-${item.id}`} 
                    className="overflow-hidden hover:shadow-glow transition-all cursor-pointer border-2 border-yellow-500/20 hover:border-yellow-500/50"
                    onClick={() => handleViewDetails(item)}
                  >
                    <div className="aspect-square bg-muted/50 relative overflow-hidden">
                      <NFTImage src={item.image} alt={item.name} />
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-black z-10">
                        #{index + 1} Trending
                      </Badge>
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 z-10">
                        <Eye className="h-3 w-3" />
                        <span className="text-xs">{item.views}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm truncate">{item.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-primary font-bold text-sm">{item.price} PM</span>
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Top Minters Leaderboard */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm mb-8">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Top Minters Leaderboard</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b border-border">
                    <th className="pb-3 pr-4">Rank</th>
                    <th className="pb-3 pr-4">Minter</th>
                    <th className="pb-3 pr-4 text-center">NFTs Minted</th>
                    <th className="pb-3 text-right">Total Volume (PM)</th>
                  </tr>
                </thead>
                <tbody>
                  {topMinters.map((minter) => (
                    <tr key={minter.rank} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4">
                        <span className={`font-bold ${minter.rank === 1 ? 'text-yellow-500' : minter.rank === 2 ? 'text-gray-400' : minter.rank === 3 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          #{minter.rank}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{minter.avatar}</span>
                          <span className="font-mono text-sm">{minter.address}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-center font-semibold">{minter.minted}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-bold text-primary">{minter.volume.toLocaleString()}</span>
                          <img src={pmLogo} alt="PM" className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Tabs defaultValue="browse" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browse">Browse Marketplace</TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Favorites ({favoritesCount})
              </TabsTrigger>
              <TabsTrigger value="owned">My NFTs ({ownedNFTs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg">NFT Marketplace</h1>
                    <p className="text-muted-foreground text-sm">{allMarketItems.length} items available</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Search NFTs..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-[200px]"
                  />
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trending">Most Trending</SelectItem>
                      <SelectItem value="date">Date Added</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="auctions">Auctions First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedCategory("all"); setCurrentPage(1); }}
                >
                  All Categories
                </Button>
                {NFT_CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {isLoading ? (
                <NFTSkeletonGrid count={12} columns={4} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {marketItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-glow transition-all group cursor-pointer" onClick={() => handleViewDetails(item)}>
                      <div className="aspect-square bg-muted/50 relative overflow-hidden">
                        <NFTImage src={item.image} alt={item.name} />
                        {item.isAuction && (
                          <Badge className="absolute top-3 left-3 bg-primary text-white z-10">
                            <Gavel className="h-3 w-3 mr-1" />
                            Auction
                          </Badge>
                        )}
                        <button
                          className={`absolute top-3 right-12 p-2 rounded-full z-10 transition-colors ${
                            isFavorite(item.id) 
                              ? "bg-red-500 text-white" 
                              : "bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-red-500"
                          }`}
                          onClick={(e) => handleToggleFavorite(e, item)}
                        >
                          <Heart className={`h-4 w-4 ${isFavorite(item.id) ? "fill-current" : ""}`} />
                        </button>
                        <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 z-10">
                          <Eye className="h-3 w-3" />
                          <span className="text-xs">{item.views}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold mb-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        
                        {item.isAuction ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Current Bid</span>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-primary">{item.highestBid || item.price}</span>
                                <img src={pmLogo} alt="PM" className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Timer className="h-3 w-3" />
                              <span>Ends in {formatTimeRemaining(item.auctionEndTime!)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-primary font-bold">{item.price}</span>
                              <img src={pmLogo} alt="PM" className="h-4 w-4" />
                              <span className="text-primary font-bold">PM</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="icon" onClick={() => setCurrentPage(pageNum)}>
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && <span className="text-muted-foreground">...</span>}
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              {favorites.length === 0 ? (
                <Card className="p-12 text-center">
                  <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">No Favorites Yet</h3>
                  <p className="text-muted-foreground mb-6">Click the heart icon on NFTs to add them to your favorites</p>
                  <Button variant="outline" onClick={() => document.querySelector<HTMLButtonElement>('[value="browse"]')?.click()}>
                    Browse Marketplace
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-glow transition-all group">
                      <div className="aspect-square bg-muted/50 relative overflow-hidden">
                        <NFTImage src={item.image} alt={item.name} />
                        <button
                          className="absolute top-3 right-3 p-2 rounded-full z-10 bg-red-500 text-white"
                          onClick={() => {
                            toggleFavorite(item);
                            toast.success(`${item.name} removed from favorites`);
                          }}
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold mb-1">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-primary font-bold">{item.price}</span>
                          <img src={pmLogo} alt="PM" className="h-4 w-4" />
                          <span className="text-primary font-bold">PM</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="owned" className="space-y-6">
              {ownedNFTs.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">No NFTs Yet</h3>
                  <p className="text-muted-foreground mb-6">Mint or purchase NFTs to see them here</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="gradient" onClick={() => navigate("/dashboard/mint-nft")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Mint NFT
                    </Button>
                    <Button variant="outline" onClick={() => document.querySelector<HTMLButtonElement>('[value="browse"]')?.click()}>
                      Browse Marketplace
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownedNFTs.map((nft) => (
                    <Card key={nft.id} className="overflow-hidden hover:shadow-glow transition-all">
                      <div className="aspect-square bg-muted/50 overflow-hidden">
                        <NFTImage src={nft.image} alt={nft.name} />
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold mb-1">{nft.name}</h3>
                          <p className="text-sm text-muted-foreground">{nft.category}</p>
                        </div>
                        {nft.purchasePrice > 0 && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Purchased for: </span>
                            <span className="font-bold">{nft.purchasePrice} PM</span>
                          </div>
                        )}
                        <Button variant="outline" className="w-full" onClick={() => setSelectedNFT(nft)}>
                          <Gavel className="h-4 w-4 mr-2" />
                          Sell / Auction
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* NFT Detail Modal */}
      <Dialog open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailItem?.name}</DialogTitle>
            <DialogDescription>NFT Details</DialogDescription>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4 py-4">
              <div className="aspect-square bg-muted/50 rounded-lg overflow-hidden">
                <NFTImage src={detailItem.image} alt={detailItem.name} fallbackClassName="h-24 w-24 text-muted-foreground" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Category</p>
                  <Badge variant="secondary">{detailItem.category}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Views</p>
                  <p className="font-medium flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {detailItem.views}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Description</p>
                <p className="text-sm">{detailItem.description}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Seller</p>
                <p className="font-mono text-sm flex items-center gap-1">
                  <User className="h-4 w-4" /> {detailItem.seller}
                </p>
              </div>

              {detailItem.isAuction ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Current Highest Bid</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xl text-primary">{detailItem.highestBid || detailItem.price}</span>
                        <img src={pmLogo} alt="PM" className="h-5 w-5" />
                        <span className="font-bold text-primary">PM</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span>Ends in {formatTimeRemaining(detailItem.auctionEndTime!)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Place Your Bid</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          placeholder={`Min: ${(detailItem.highestBid || detailItem.price) + 1}`}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">PM</span>
                      </div>
                      <Button variant="gradient" onClick={handlePlaceBidOnAuction}>
                        <Gavel className="h-4 w-4 mr-2" />
                        Bid
                      </Button>
                    </div>
                  </div>

                  {bids.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recent Bids</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {bids.slice(0, 5).map((bid) => (
                          <div key={bid.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                            <span className="font-mono text-xs">{bid.bidder}</span>
                            <span className="font-bold">{bid.amount} PM</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xl">{detailItem.price}</span>
                      <img src={pmLogo} alt="PM" className="h-5 w-5" />
                      <span className="font-bold">PM</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (2%)</span>
                    <span>{(detailItem.price * 0.02).toFixed(2)} PM</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-bold">Total</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-primary">{(detailItem.price * 1.02).toFixed(2)}</span>
                      <img src={pmLogo} alt="PM" className="h-4 w-4" />
                      <span className="font-bold text-primary">PM</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm">Verified and authenticated on BSC blockchain</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailItem(null)}>
              Close
            </Button>
            {detailItem && !detailItem.isAuction && (
              <Button variant="gradient" onClick={() => handleBuyNow(detailItem)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Now
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buy Confirmation Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>Review and confirm your purchase</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted/50 rounded-lg overflow-hidden">
                  <NFTImage src={selectedItem.image} alt={selectedItem.name} fallbackClassName="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.category}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Price</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{selectedItem.price}</span>
                    <img src={pmLogo} alt="PM" className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee (2%)</span>
                  <span>{(selectedItem.price * 0.02).toFixed(2)} PM</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-bold">Total (PM)</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-primary text-lg">{(selectedItem.price * 1.02).toFixed(2)}</span>
                    <img src={pmLogo} alt="PM" className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">Payment will be made using PM tokens from your wallet</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleConfirmPurchase}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sell/Auction NFT Modal */}
      <Dialog open={!!selectedNFT} onOpenChange={() => { setSelectedNFT(null); setIsAuctionListing(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>List {selectedNFT?.name}</DialogTitle>
            <DialogDescription>Choose how to sell your NFT</DialogDescription>
          </DialogHeader>

          {selectedNFT && (
            <div className="space-y-4 py-4">
              <Tabs value={isAuctionListing ? "auction" : "fixed"} onValueChange={(v) => setIsAuctionListing(v === "auction")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="fixed">Fixed Price</TabsTrigger>
                  <TabsTrigger value="auction">Auction</TabsTrigger>
                </TabsList>

                <TabsContent value="fixed" className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sale Price</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Enter price"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">PM</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="auction" className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Starting Bid</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Enter starting bid"
                        value={startingBid}
                        onChange={(e) => setStartingBid(e.target.value)}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">PM</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Auction Duration</label>
                    <Select value={auctionDuration} onValueChange={setAuctionDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 Hours</SelectItem>
                        <SelectItem value="24">24 Hours</SelectItem>
                        <SelectItem value="48">48 Hours</SelectItem>
                        <SelectItem value="72">72 Hours</SelectItem>
                        <SelectItem value="168">7 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground">Platform fee: 2% on successful sale</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSelectedNFT(null); setIsAuctionListing(false); }}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleListForSale}>
              {isAuctionListing ? (
                <>
                  <Gavel className="h-4 w-4 mr-2" />
                  Start Auction
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  List for Sale
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplacePage;
