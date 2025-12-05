import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Handshake, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const ApplyPartnership = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Partnership application submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner 
        title="Apply for Partnership" 
        subtitle="Join our growing network of partners"
      />
      
      <main className="container mx-auto px-4 pt-12 pb-12 flex-1">
        <Link to="/dashboard/partners" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Partners
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-lg bg-primary/10">
              <Handshake className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Partnership Application</h1>
              <p className="text-muted-foreground">Tell us about your business</p>
            </div>
          </div>

          <Card className="p-8 bg-card/50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Company Name</label>
                  <Input placeholder="Your company name" required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Industry Type</label>
                  <Input placeholder="e.g., Exchange, Wallet Provider" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Contact Name</label>
                  <Input placeholder="Full name" required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input type="email" placeholder="contact@company.com" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Phone</label>
                  <Input type="tel" placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Website</label>
                  <Input type="url" placeholder="https://yourcompany.com" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Company Description</label>
                <Textarea 
                  placeholder="Tell us about your company and what you do..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Partnership Proposal</label>
                <Textarea 
                  placeholder="How would you like to partner with Perfect Money?"
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" variant="gradient" className="flex-1 md:flex-none">
                  <Building2 className="h-4 w-4 mr-2" />
                  Submit Application
                </Button>
                <Link to="/dashboard/partners" className="flex-1 md:flex-none">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default ApplyPartnership;
