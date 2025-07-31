/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import toast, { Toaster } from "react-hot-toast";

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
  const [status, setStatus] = useState("");
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
    setStatus("");
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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <Toaster position="top-right" />
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Stripe Payment
        </h1>

        {/* Stripe PK */}
        <label className="block text-sm font-medium text-gray-700">
          Stripe Public Key
        </label>
        <input
          type="text"
          placeholder="pk_test_..."
          value={stripePK}
          onChange={(e) => {
            const val = e.target.value;
            setStripePK(val);
            localStorage.setItem("stripe-pk", val);
          }}
          className="w-full border rounded-md px-3 py-2 mb-4 mt-1"
        />

        {/* Token */}
        <label className="block text-sm font-medium text-gray-700">
          Auth Token
        </label>
        <input
          type="text"
          placeholder="Bearer token"
          value={token}
          onChange={(e) => {
            const val = e.target.value;
            setToken(val);
            localStorage.setItem("stripe-token", val);
          }}
          className="w-full border rounded-md px-3 py-2 mb-4 mt-1"
        />

        {/* Base API URL */}
        <label className="block text-sm font-medium text-gray-700">
          API URL
        </label>
        <input
          type="text"
          placeholder="https://your-api.com"
          value={baseUrl}
          onChange={(e) => {
            const val = e.target.value;
            setBaseUrl(val);
            localStorage.setItem("stripe-base-url", val);
          }}
          className="w-full border rounded-md px-3 py-2 mb-4 mt-1"
        />

        {/* JSON Payload */}
        <label className="block text-sm font-medium text-gray-700">
          JSON Payload
        </label>
        <textarea
          className="w-full border rounded-md px-3 py-2 h-24 font-mono text-sm"
          placeholder='{"bidId":"..."}'
          value={jsonPayload}
          onChange={(e) => {
            const val = e.target.value;
            setJsonPayload(val);
            localStorage.setItem("stripe-json-payload", val);
          }}
        />

        <button
          onClick={handleCreatePaymentIntent}
          className="w-full mt-4 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          disabled={!stripePK || !token || !jsonPayload || !baseUrl || loading}
        >
          {loading ? "Creating Payment..." : "Pay Now"}
        </button>

        {/* Stripe Checkout Form */}
        {clientSecret && stripePK && (
          <div className="mt-8">
            <Elements stripe={getStripePromise(stripePK)}>
              <CheckoutForm
                clientSecret={clientSecret}
                onSuccess={() => setClientSecret(null)}
              />
            </Elements>
          </div>
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
    <div className="mt-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Card Details
      </label>
      <div className="border border-gray-300 rounded-md p-3 mb-4 bg-white">
        <CardElement className="text-sm" />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition disabled:opacity-50"
        disabled={paying}
      >
        {paying ? "Processing..." : "Submit Payment"}
      </button>
    </div>
  );
}
