import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Ticket, Gift, Clock, CheckCircle, XCircle, Search, Plus, QrCode } from "lucide-react";
import { toast } from "sonner";

interface VoucherItem {
  id: string;
  code: string;
  name: string;
  value: string;
  expiryDate: string;
  status: "active" | "used" | "expired";
  type: "discount" | "gift" | "reward";
}

const mockVouchers: VoucherItem[] = [
  {
    id: "1",
    code: "PM-WELCOME-2024",
    name: "Welcome Bonus",
    value: "500 PM",
    expiryDate: "2025-12-31",
    status: "active",
    type: "gift",
  },
  {
    id: "2",
    code: "PM-DISCOUNT-10",
    name: "10% Discount",
    value: "10%",
    expiryDate: "2025-06-30",
    status: "active",
    type: "discount",
  },
  {
    id: "3",
    code: "PM-STAKE-REWARD",
    name: "Staking Reward",
    value: "1000 PM",
    expiryDate: "2025-03-15",
    status: "used",
    type: "reward",
  },
  {
    id: "4",
    code: "PM-EARLY-BIRD",
    name: "Early Bird Bonus",
    value: "250 PM",
    expiryDate: "2024-12-01",
    status: "expired",
    type: "gift",
  },
];

const Voucher = () => {
  const [vouchers] = useState<VoucherItem[]>(mockVouchers);
  const [redeemCode, setRedeemCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVouchers = vouchers.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeVouchers = filteredVouchers.filter((v) => v.status === "active");
  const usedVouchers = filteredVouchers.filter((v) => v.status === "used");
  const expiredVouchers = filteredVouchers.filter((v) => v.status === "expired");

  const handleRedeem = () => {
    if (!redeemCode.trim()) {
      toast.error("Please enter a voucher code");
      return;
    }
    toast.success("Voucher redeemed successfully!");
    setRedeemCode("");
  };

  const getStatusIcon = (status: VoucherItem["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "used":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "expired":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: VoucherItem["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>;
      case "used":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Used</Badge>;
      case "expired":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Expired</Badge>;
    }
  };

  const getTypeIcon = (type: VoucherItem["type"]) => {
    switch (type) {
      case "discount":
        return <Ticket className="h-5 w-5 text-primary" />;
      case "gift":
        return <Gift className="h-5 w-5 text-purple-500" />;
      case "reward":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const VoucherCard = ({ voucher }: { voucher: VoucherItem }) => (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">{getTypeIcon(voucher.type)}</div>
          <div>
            <h3 className="font-semibold text-sm">{voucher.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{voucher.code}</p>
          </div>
        </div>
        {getStatusBadge(voucher.status)}
      </div>
      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="text-lg font-bold text-primary">{voucher.value}</p>
          <p className="text-xs text-muted-foreground">Expires: {voucher.expiryDate}</p>
        </div>
        {voucher.status === "active" && (
          <Button size="sm" variant="outline" className="text-xs">
            <QrCode className="h-3 w-3 mr-1" />
            Use
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Vouchers</h1>
              <p className="text-muted-foreground text-sm">Manage and redeem your PM vouchers</p>
            </div>
          </div>

          {/* Redeem Voucher Section */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
            <div className="flex items-center gap-3 mb-4">
              <Plus className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Redeem Voucher</h2>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Enter voucher code"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleRedeem} className="bg-primary hover:bg-primary/90">
                Redeem
              </Button>
            </div>
          </Card>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vouchers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center bg-green-500/10 border-green-500/30">
              <p className="text-2xl font-bold text-green-500">{activeVouchers.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </Card>
            <Card className="p-4 text-center bg-yellow-500/10 border-yellow-500/30">
              <p className="text-2xl font-bold text-yellow-500">{usedVouchers.length}</p>
              <p className="text-xs text-muted-foreground">Used</p>
            </Card>
            <Card className="p-4 text-center bg-red-500/10 border-red-500/30">
              <p className="text-2xl font-bold text-red-500">{expiredVouchers.length}</p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </Card>
          </div>

          {/* Vouchers Tabs */}
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="active">Active ({activeVouchers.length})</TabsTrigger>
              <TabsTrigger value="used">Used ({usedVouchers.length})</TabsTrigger>
              <TabsTrigger value="expired">Expired ({expiredVouchers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4 space-y-3">
              {activeVouchers.length > 0 ? (
                activeVouchers.map((voucher) => <VoucherCard key={voucher.id} voucher={voucher} />)
              ) : (
                <Card className="p-8 text-center">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active vouchers</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="used" className="mt-4 space-y-3">
              {usedVouchers.length > 0 ? (
                usedVouchers.map((voucher) => <VoucherCard key={voucher.id} voucher={voucher} />)
              ) : (
                <Card className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No used vouchers</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="expired" className="mt-4 space-y-3">
              {expiredVouchers.length > 0 ? (
                expiredVouchers.map((voucher) => <VoucherCard key={voucher.id} voucher={voucher} />)
              ) : (
                <Card className="p-8 text-center">
                  <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No expired vouchers</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Voucher;
