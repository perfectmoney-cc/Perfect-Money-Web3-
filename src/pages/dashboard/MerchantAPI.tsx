import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Code, Copy, Check, Globe, TestTube, Zap, Key, RefreshCw, ExternalLink, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { TradingViewTicker } from "@/components/TradingViewTicker";
import { HeroBanner } from "@/components/HeroBanner";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useAccount } from "wagmi";

const MerchantAPI = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  
  // Generate deterministic API keys based on wallet address and environment
  const generateApiKey = (env: string) => {
    if (!address) return "";
    const baseHash = address.slice(2, 34);
    const envPrefix = env === "sandbox" ? "sb" : "pk";
    return `pm_${envPrefix}_${baseHash}${Date.now().toString(36).slice(-8)}`;
  };
  
  const [sandboxApiKey, setSandboxApiKey] = useState(() => generateApiKey("sandbox"));
  const [productionApiKey, setProductionApiKey] = useState(() => generateApiKey("production"));
  const [sandboxSecretKey, setSandboxSecretKey] = useState(() => `pm_sb_secret_${address?.slice(2, 26) || 'demo'}${Math.random().toString(36).slice(-12)}`);
  const [productionSecretKey, setProductionSecretKey] = useState(() => `pm_pk_secret_${address?.slice(2, 26) || 'demo'}${Math.random().toString(36).slice(-12)}`);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const regenerateKey = (type: "api" | "secret", env: "sandbox" | "production") => {
    const newKey = type === "api" 
      ? `pm_${env === "sandbox" ? "sb" : "pk"}_${address?.slice(2, 34) || 'demo'}${Date.now().toString(36).slice(-8)}`
      : `pm_${env === "sandbox" ? "sb" : "pk"}_secret_${address?.slice(2, 26) || 'demo'}${Math.random().toString(36).slice(-12)}`;
    
    if (type === "api") {
      if (env === "sandbox") setSandboxApiKey(newKey);
      else setProductionApiKey(newKey);
    } else {
      if (env === "sandbox") setSandboxSecretKey(newKey);
      else setProductionSecretKey(newKey);
    }
    
    toast.success(`${env === "sandbox" ? "Sandbox" : "Production"} ${type === "api" ? "API" : "Secret"} key regenerated!`);
  };

  const baseUrls = {
    sandbox: "https://sandbox.api.perfectmoney.cc/v1",
    production: "https://api.perfectmoney.cc/v1"
  };

  const generatePaymentLink = (env: "sandbox" | "production") => {
    const baseUrl = env === "sandbox" ? "https://sandbox.perfectmoney.cc" : "https://pay.perfectmoney.cc";
    const merchantId = address?.slice(0, 10) || "demo";
    return `${baseUrl}/pay/${merchantId}/${Date.now().toString(36)}`;
  };

  const currentApiKey = environment === "sandbox" ? sandboxApiKey : productionApiKey;
  const currentSecretKey = environment === "sandbox" ? sandboxSecretKey : productionSecretKey;
  const currentBaseUrl = baseUrls[environment];

  const endpoints = [
    {
      name: "Create Payment",
      method: "POST",
      path: "/payments/create",
      description: "Create a new payment request",
      requestExample: {
        amount: "100.00",
        currency: "PM",
        order_id: "ORDER-12345",
        callback_url: "https://yoursite.com/webhook",
        success_url: "https://yoursite.com/success",
        cancel_url: "https://yoursite.com/cancel"
      },
      responseExample: {
        success: true,
        payment_id: "pay_abc123xyz",
        payment_url: generatePaymentLink(environment),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }
    },
    {
      name: "Get Payment Status",
      method: "GET",
      path: "/payments/:payment_id",
      description: "Retrieve payment details and status",
      requestExample: {
        payment_id: "pay_abc123xyz"
      },
      responseExample: {
        success: true,
        payment_id: "pay_abc123xyz",
        status: "completed",
        amount: "100.00",
        currency: "PM",
        tx_hash: "0x1234...abcd",
        completed_at: new Date().toISOString()
      }
    },
    {
      name: "Refund Payment",
      method: "POST",
      path: "/payments/:payment_id/refund",
      description: "Initiate a refund for a completed payment",
      requestExample: {
        payment_id: "pay_abc123xyz",
        amount: "50.00",
        reason: "Customer request"
      },
      responseExample: {
        success: true,
        refund_id: "ref_xyz789",
        status: "processing",
        amount: "50.00"
      }
    },
    {
      name: "List Payments",
      method: "GET",
      path: "/payments",
      description: "List all payments with optional filters",
      requestExample: {
        limit: 20,
        offset: 0,
        status: "completed",
        from_date: "2024-01-01"
      },
      responseExample: {
        success: true,
        total: 150,
        payments: [
          { payment_id: "pay_abc123", amount: "100.00", status: "completed" },
          { payment_id: "pay_def456", amount: "250.00", status: "completed" }
        ]
      }
    }
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
        <Header />
        <TradingViewTicker />
        <HeroBanner title="Merchant API" subtitle="Connect your wallet to access API keys" />
        <main className="container mx-auto px-4 py-12 flex-1">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Please connect your wallet to access the API integration panel</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 lg:pb-0">
      <Header />
      <TradingViewTicker />
      <HeroBanner 
        title="Merchant API Integration" 
        subtitle="Production & Sandbox API keys with real-time payment links"
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6 flex-1">
        <Button variant="ghost" onClick={() => navigate("/dashboard/merchant")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Merchant Dashboard
        </Button>

        {/* Environment Switcher */}
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {environment === "sandbox" ? (
                  <TestTube className="h-6 w-6 text-yellow-500" />
                ) : (
                  <Globe className="h-6 w-6 text-green-500" />
                )}
                <div>
                  <CardTitle>API Environment</CardTitle>
                  <CardDescription>Switch between sandbox and production</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${environment === "sandbox" ? "text-yellow-500 font-semibold" : "text-muted-foreground"}`}>
                  Sandbox
                </span>
                <Switch
                  checked={environment === "production"}
                  onCheckedChange={(checked) => setEnvironment(checked ? "production" : "sandbox")}
                />
                <span className={`text-sm ${environment === "production" ? "text-green-500 font-semibold" : "text-muted-foreground"}`}>
                  Production
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${environment === "sandbox" ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={environment === "sandbox" ? "secondary" : "default"} className={environment === "production" ? "bg-green-600" : "bg-yellow-600"}>
                  {environment === "sandbox" ? "Sandbox Mode" : "Production Mode"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {environment === "sandbox" 
                  ? "Use sandbox for testing. No real transactions will be processed."
                  : "Production mode. All transactions are live and will process real payments."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">API Key</CardTitle>
                </div>
                <Badge variant="outline">{environment}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={currentApiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(currentApiKey, "API Key")}
                >
                  {copiedText === "API Key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => regenerateKey("api", environment)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this key in the <code className="bg-muted px-1 rounded">X-API-Key</code> header
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Secret Key</CardTitle>
                </div>
                <Badge variant="outline">{environment}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={currentSecretKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(currentSecretKey, "Secret Key")}
                >
                  {copiedText === "Secret Key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => regenerateKey("secret", environment)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Keep this secret! Used for webhook signature verification
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Base URL */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Base URL</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <code className={`flex-1 p-3 rounded-lg font-mono text-sm ${environment === "sandbox" ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"}`}>
                {currentBaseUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(currentBaseUrl, "Base URL")}
              >
                {copiedText === "Base URL" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Payment Link Generator */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-rose-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Quick Payment Link Generator</CardTitle>
            </div>
            <CardDescription>Generate payment links instantly for {environment} environment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-background/50 rounded-lg border">
              <Label className="text-sm text-muted-foreground mb-2 block">Generated Payment Link</Label>
              <div className="flex gap-2">
                <Input
                  value={generatePaymentLink(environment)}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(generatePaymentLink(environment), "Payment Link")}
                >
                  {copiedText === "Payment Link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(generatePaymentLink(environment), '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {environment === "sandbox" 
                ? "⚠️ Sandbox links are for testing only and won't process real payments"
                : "✅ Production links will process real PM token payments"}
            </p>
          </CardContent>
        </Card>

        {/* API Endpoints Documentation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <CardTitle>API Endpoints</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create" className="space-y-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
                {endpoints.map((endpoint, idx) => (
                  <TabsTrigger key={idx} value={endpoint.name.toLowerCase().replace(/\s/g, '-')}>
                    {endpoint.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {endpoints.map((endpoint, idx) => (
                <TabsContent key={idx} value={endpoint.name.toLowerCase().replace(/\s/g, '-')} className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={endpoint.method === "POST" ? "bg-green-600" : "bg-blue-600"}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-primary font-mono">{currentBaseUrl}{endpoint.path}</code>
                  </div>
                  <p className="text-muted-foreground mb-4">{endpoint.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Request</Label>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                        {JSON.stringify(endpoint.requestExample, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <Label className="mb-2 block">Response</Label>
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto text-green-500">
                        {JSON.stringify(endpoint.responseExample, null, 2)}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Code Example */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start Example</CardTitle>
            <CardDescription>Create a payment using cURL or JavaScript</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              </TabsList>
              
              <TabsContent value="curl" className="mt-4">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X POST ${currentBaseUrl}/payments/create \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${currentApiKey}" \\
  -d '{
    "amount": "100.00",
    "currency": "PM",
    "order_id": "ORDER-12345",
    "callback_url": "https://yoursite.com/webhook"
  }'`}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => copyToClipboard(
                    `curl -X POST ${currentBaseUrl}/payments/create -H "Content-Type: application/json" -H "X-API-Key: ${currentApiKey}" -d '{"amount": "100.00", "currency": "PM", "order_id": "ORDER-12345", "callback_url": "https://yoursite.com/webhook"}'`,
                    "cURL"
                  )}
                >
                  {copiedText === "cURL" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy
                </Button>
              </TabsContent>
              
              <TabsContent value="javascript" className="mt-4">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`const response = await fetch('${currentBaseUrl}/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${currentApiKey}'
  },
  body: JSON.stringify({
    amount: '100.00',
    currency: 'PM',
    order_id: 'ORDER-12345',
    callback_url: 'https://yoursite.com/webhook'
  })
});

const data = await response.json();
console.log(data.payment_url);`}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => copyToClipboard(
                    `const response = await fetch('${currentBaseUrl}/payments/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': '${currentApiKey}' }, body: JSON.stringify({ amount: '100.00', currency: 'PM', order_id: 'ORDER-12345', callback_url: 'https://yoursite.com/webhook' }) });`,
                    "JavaScript"
                  )}
                >
                  {copiedText === "JavaScript" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default MerchantAPI;
