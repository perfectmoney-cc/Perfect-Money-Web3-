import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { WalletCard } from "@/components/WalletCard";
import { 
  ArrowLeft, 
  Store, 
  ShoppingBag, 
  Gift, 
  Ticket, 
  Star, 
  Search,
  Filter,
  CreditCard,
  Smartphone,
  Headphones,
  Shirt,
  Home,
  Car,
  Plane,
  Utensils,
  Heart,
  Percent,
  Clock,
  TrendingUp,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const StorePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All", icon: ShoppingBag },
    { id: "gift-cards", name: "Gift Cards", icon: Gift },
    { id: "vouchers", name: "Vouchers", icon: Ticket },
    { id: "electronics", name: "Electronics", icon: Smartphone },
    { id: "fashion", name: "Fashion", icon: Shirt },
    { id: "travel", name: "Travel", icon: Plane },
    { id: "food", name: "Food & Dining", icon: Utensils },
  ];

  const featuredProducts = [
    {
      id: 1,
      name: "Amazon Gift Card",
      category: "gift-cards",
      price: 50,
      originalPrice: 55,
      discount: 10,
      image: "🎁",
      rating: 4.9,
      sales: 1250,
      description: "Redeem for millions of items on Amazon"
    },
    {
      id: 2,
      name: "Netflix Subscription",
      category: "vouchers",
      price: 15,
      originalPrice: 15,
      discount: 0,
      image: "🎬",
      rating: 4.8,
      sales: 890,
      description: "1 Month Premium subscription"
    },
    {
      id: 3,
      name: "Spotify Premium",
      category: "vouchers",
      price: 10,
      originalPrice: 12,
      discount: 17,
      image: "🎵",
      rating: 4.7,
      sales: 756,
      description: "1 Month Premium subscription"
    },
    {
      id: 4,
      name: "Steam Wallet",
      category: "gift-cards",
      price: 25,
      originalPrice: 25,
      discount: 0,
      image: "🎮",
      rating: 4.9,
      sales: 2100,
      description: "Add funds to your Steam account"
    },
    {
      id: 5,
      name: "Uber Credits",
      category: "vouchers",
      price: 20,
      originalPrice: 22,
      discount: 9,
      image: "🚗",
      rating: 4.6,
      sales: 540,
      description: "Ride credits for Uber"
    },
    {
      id: 6,
      name: "Apple Gift Card",
      category: "gift-cards",
      price: 100,
      originalPrice: 110,
      discount: 9,
      image: "🍎",
      rating: 4.9,
      sales: 980,
      description: "Use for App Store, Apple Music & more"
    },
    {
      id: 7,
      name: "PlayStation Store",
      category: "gift-cards",
      price: 50,
      originalPrice: 50,
      discount: 0,
      image: "🎯",
      rating: 4.8,
      sales: 1450,
      description: "PSN Wallet top-up"
    },
    {
      id: 8,
      name: "Airbnb Credit",
      category: "travel",
      price: 100,
      originalPrice: 115,
      discount: 13,
      image: "🏠",
      rating: 4.7,
      sales: 320,
      description: "Travel credits for accommodations"
    },
  ];

  const flashDeals = [
    { name: "Google Play", discount: 20, endsIn: "2h 15m", image: "📱" },
    { name: "Xbox Game Pass", discount: 25, endsIn: "4h 30m", image: "🎮" },
    { name: "DoorDash", discount: 15, endsIn: "1h 45m", image: "🍔" },
  ];

  const filteredProducts = featuredProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePurchase = (product: typeof featuredProducts[0]) => {
    toast.success(`Added ${product.name} to cart!`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner 
        title="PM Store" 
        subtitle="Buy gift cards, vouchers & more with PM Tokens" 
      />
      
      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        {/* Mobile Wallet Card */}
        <div className="md:hidden mt-5 mb-6">
          <WalletCard showQuickFunctionsToggle={false} compact={true} />
        </div>

        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary/20 to-orange-500/20">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-xl">PM Store</h1>
              <p className="text-muted-foreground text-sm">Spend your PM Tokens on real products</p>
            </div>
          </div>

          {/* Flash Deals Banner */}
          <Card className="p-6 bg-gradient-to-r from-primary/10 via-orange-500/10 to-yellow-500/10 border-primary/30 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h2 className="font-bold text-lg">Flash Deals</h2>
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">Limited Time</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {flashDeals.map((deal, index) => (
                <Card key={index} className="p-4 bg-card/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{deal.image}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{deal.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500/20 text-red-500 text-xs">{deal.discount}% OFF</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {deal.endsIn}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  <category.icon className="h-4 w-4 mr-1" />
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">150+</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">25K+</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4.8</p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Percent className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">15%</p>
                  <p className="text-xs text-muted-foreground">Avg Savings</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="p-4 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all group cursor-pointer"
              >
                <div className="relative mb-4">
                  <div className="w-full h-32 rounded-lg bg-muted/30 flex items-center justify-center text-5xl">
                    {product.image}
                  </div>
                  {product.discount > 0 && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                      -{product.discount}%
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs">{product.rating}</span>
                    <span className="text-xs text-muted-foreground">({product.sales} sold)</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-lg font-bold text-primary">{product.price} PM</span>
                      {product.discount > 0 && (
                        <span className="text-xs text-muted-foreground line-through ml-2">
                          {product.originalPrice} PM
                        </span>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handlePurchase(product)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Buy
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No products found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filter</p>
            </div>
          )}

          {/* How It Works */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm mt-8">
            <h2 className="text-xl font-bold mb-6">How PM Store Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="font-semibold mb-1">Browse Products</h3>
                <p className="text-xs text-muted-foreground">Explore our catalog of gift cards and vouchers</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="font-semibold mb-1">Pay with PM</h3>
                <p className="text-xs text-muted-foreground">Use your PM Tokens to make purchases</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="font-semibold mb-1">Instant Delivery</h3>
                <p className="text-xs text-muted-foreground">Receive your codes instantly via email</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-primary">4</span>
                </div>
                <h3 className="font-semibold mb-1">Redeem & Enjoy</h3>
                <p className="text-xs text-muted-foreground">Use your gift cards on partner platforms</p>
              </div>
            </div>
          </Card>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
              <div className="flex items-center gap-3">
                <Percent className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">Best Prices</h3>
                  <p className="text-xs text-muted-foreground">Save up to 25% on popular brands</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Instant Delivery</h3>
                  <p className="text-xs text-muted-foreground">Get codes within seconds</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-purple-500" />
                <div>
                  <h3 className="font-semibold">100% Secure</h3>
                  <p className="text-xs text-muted-foreground">Blockchain-powered transactions</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default StorePage;