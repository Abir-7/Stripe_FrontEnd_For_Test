/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import toast, { Toaster } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Lock, Shield, CheckCircle } from "lucide-react";

let stripePromise: Promise<Stripe | null>;

function getStripePromise(pk: string) {
  if (!stripePromise || pk !== (window as any).__lastStripePK) {
    stripePromise = loadStripe(pk);
    (window as any).__lastStripePK = pk;
  }
  return stripePromise;
}

export default function PaymentPage() {
  const [stripePK, setStripePK] = useState("");
  const [token, setToken] = useState("");
  const [jsonPayload, setJsonPayload] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load persisted values
  useEffect(() => {
    const savedPK = localStorage.getItem("stripe-pk") || "";
    const savedToken = localStorage.getItem("stripe-token") || "";
    const savedPayload = localStorage.getItem("stripe-json-payload") || "";
    const savedBaseUrl = localStorage.getItem("stripe-base-url") || "";

    setStripePK(savedPK);
    setToken(savedToken);
    setJsonPayload(savedPayload);
    setBaseUrl(savedBaseUrl);
  }, []);

  const handleCreatePaymentIntent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: jsonPayload,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Server Error");
      }

      const paymentIntent = data.data?.paymentIntent;
      if (!paymentIntent) throw new Error("No payment intent returned");
      setClientSecret(paymentIntent);
      toast.success("Payment Intent Created");
    } catch (err: any) {
      toast.error("Failed: " + err.message);
      setClientSecret(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" bg-gradient-to-br from-background via-muted/30 to-background py-8 px-4">
      <Toaster
        position="top-right"
        toastOptions={{
          className: "bg-card text-card-foreground border border-border",
          duration: 4000,
        }}
      />

      <div className="container mx-auto space-y-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-violet-100 rounded-full">
              <CreditCard className="h-8 w-8 text-violet-500 " />
            </div>
            <h1 className="font-bold text-4xl text-violet-500"> Stripe</h1>
          </div>
          <h1 className="text-3xl font-bold text-foreground text-balance">
            Text your Stripe integration
          </h1>
        </div>

        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              Enter your Stripe and API configuration details below
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="stripe-pk"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  Stripe Public Key
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                </Label>
                <Input
                  id="stripe-pk"
                  type="text"
                  placeholder="pk_test_..."
                  value={stripePK}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStripePK(val);
                    localStorage.setItem("stripe-pk", val);
                  }}
                  className="font-mono text-sm bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="auth-token"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  Auth Token
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                </Label>
                <Input
                  id="auth-token"
                  type="password"
                  placeholder="Bearer token"
                  value={token}
                  onChange={(e) => {
                    const val = e.target.value;
                    setToken(val);
                    localStorage.setItem("stripe-token", val);
                  }}
                  className="font-mono text-sm bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="api-url"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  API URL
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                </Label>
                <Input
                  id="api-url"
                  type="url"
                  placeholder="https://your-api.com"
                  value={baseUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBaseUrl(val);
                    localStorage.setItem("stripe-base-url", val);
                  }}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="json-payload"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  JSON Payload
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                </Label>
                <Textarea
                  id="json-payload"
                  className="font-mono text-sm bg-background min-h-[100px] resize-y"
                  placeholder='{"bidId": "example-123", "amount": 1000}'
                  value={jsonPayload}
                  onChange={(e) => {
                    const val = e.target.value;
                    setJsonPayload(val);
                    localStorage.setItem("stripe-json-payload", val);
                  }}
                />
              </div>
            </div>

            <Separator />

            <Button
              onClick={handleCreatePaymentIntent}
              className="w-full h-12 text-base font-semibold"
              disabled={
                !stripePK || !token || !jsonPayload || !baseUrl || loading
              }
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating Payment Intent...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Initialize Payment
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {clientSecret && stripePK && (
          <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                Complete Payment
              </CardTitle>
              <CardDescription className="text-base">
                Enter your card details to complete the transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={getStripePromise(stripePK)}>
                <CheckoutForm
                  clientSecret={clientSecret}
                  onSuccess={() => setClientSecret(null)}
                />
              </Elements>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CheckoutForm({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setPaying(true);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    if (result.error) {
      toast.error("Payment failed: " + result.error.message);
    } else if (result.paymentIntent?.status === "succeeded") {
      toast.success("Payment succeeded!");
      onSuccess();
    } else if (result.paymentIntent?.status === "requires_capture") {
      toast.success("Payment succeeded! Need manual capture");
      onSuccess();
    }
    console.log(result.paymentIntent?.status);
    setPaying(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          Card Details
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secure</span>
          </div>
        </Label>
        <div className="border border-border rounded-lg p-4 bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
          <CardElement
            className="text-base"
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "hsl(var(--foreground))",
                  fontFamily: "var(--font-sans)",
                  "::placeholder": {
                    color: "hsl(var(--muted-foreground))",
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
        disabled={paying || !stripe || !elements}
        size="lg"
      >
        {paying ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Processing Payment...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Complete Payment
          </div>
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>256-bit SSL</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="h-4 w-4" />
            <span>PCI DSS Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
