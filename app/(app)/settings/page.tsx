"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Profile = {
  business_name: string;
  industry: string;
  website: string;
  description: string;
};

type MetaAccount = {
  ad_account_id: string;
  page_id: string | null;
  pixel_id: string | null;
  connected_at: string;
} | null;

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  campaigns_per_month: number;
  max_daily_budget: number;
  features: string[];
};

type Subscription = {
  plan: string;
  campaigns_per_month: number;
  max_daily_budget: number;
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  const [profile, setProfile] = useState<Profile>({ business_name: "", industry: "", website: "", description: "" });
  const [meta, setMeta] = useState<MetaAccount>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [metaForm, setMetaForm] = useState({ access_token: "", ad_account_id: "", page_id: "", pixel_id: "" });
  const [saving, setSaving] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/business").then((r) => r.json()),
      fetch("/api/settings/meta").then((r) => r.json()),
      fetch("/api/payments/plans").then((r) => r.json()),
      fetch("/api/campaigns").then((r) => r.json()), // reuse for subscription data
    ]).then(([biz, metaData, plansData]) => {
      if (biz.profile) setProfile(biz.profile);
      if (metaData.meta) setMeta(metaData.meta);
      if (plansData.plans) setPlans(plansData.plans);
    });

    // Fetch subscription
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then(() => {
        // Get subscription separately
        fetch("/api/payments/plans"); // just to warm
      });

    if (paymentStatus === "success") {
      setToast("Payment successful! Your plan has been upgraded.");
      setTimeout(() => setToast(""), 5000);
    } else if (paymentStatus === "failed") {
      setToast("Payment failed. Please try again.");
      setTimeout(() => setToast(""), 5000);
    }
  }, [paymentStatus]);

  async function saveProfile() {
    setSaving(true);
    const res = await fetch("/api/settings/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      setToast("Profile saved!");
      setTimeout(() => setToast(""), 3000);
    }
    setSaving(false);
  }

  async function saveMeta() {
    setSavingMeta(true);
    const res = await fetch("/api/settings/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metaForm),
    });
    const d = await res.json();
    if (res.ok) {
      setToast("Meta account connected!");
      setTimeout(() => setToast(""), 3000);
      // Refresh
      const r2 = await fetch("/api/settings/meta").then((r) => r.json());
      if (r2.meta) setMeta(r2.meta);
    } else {
      setToast(d.error ?? "Failed to connect");
      setTimeout(() => setToast(""), 4000);
    }
    setSavingMeta(false);
  }

  async function disconnectMeta() {
    await fetch("/api/settings/meta", { method: "DELETE" });
    setMeta(null);
    setToast("Meta account disconnected.");
    setTimeout(() => setToast(""), 3000);
  }

  async function upgradePlan(planId: string) {
    setUpgrading(planId);
    const res = await fetch("/api/payments/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId }),
    });
    const d = await res.json();
    if (res.ok && d.authorization_url) {
      window.location.href = d.authorization_url;
    } else {
      setToast(d.error ?? "Failed to initialize payment");
      setTimeout(() => setToast(""), 4000);
      setUpgrading(null);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg ${
          toast.includes("failed") || toast.includes("Failed")
            ? "bg-red-600 text-white"
            : "bg-green-600 text-white"
        }`}>
          {toast}
        </div>
      )}

      {/* Business Profile */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Business Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Business Name</label>
            <input
              value={profile.business_name}
              onChange={(e) => setProfile((p) => ({ ...p, business_name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Industry</label>
            <input
              value={profile.industry}
              onChange={(e) => setProfile((p) => ({ ...p, industry: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Website</label>
            <input
              value={profile.website}
              onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Business Description</label>
          <textarea
            value={profile.description}
            onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </section>

      {/* Meta Integration */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Meta Ads Integration</h2>
          {meta && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Connected</span>
          )}
        </div>

        {meta ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600"><span className="font-medium">Ad Account:</span> {meta.ad_account_id}</p>
            {meta.page_id && <p className="text-sm text-gray-600"><span className="font-medium">Page:</span> {meta.page_id}</p>}
            {meta.pixel_id && <p className="text-sm text-gray-600"><span className="font-medium">Pixel:</span> {meta.pixel_id}</p>}
            <p className="text-xs text-gray-400">Connected {new Date(meta.connected_at).toLocaleDateString()}</p>
            <button
              onClick={disconnectMeta}
              className="text-red-500 border border-red-200 text-sm px-4 py-2 rounded-xl hover:bg-red-50 transition-colors mt-2"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Connect your Meta Business account to launch campaigns directly from AdBot.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Access Token *</label>
                <input
                  value={metaForm.access_token}
                  onChange={(e) => setMetaForm((f) => ({ ...f, access_token: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="EAABwzL..."
                  type="password"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Ad Account ID *</label>
                <input
                  value={metaForm.ad_account_id}
                  onChange={(e) => setMetaForm((f) => ({ ...f, ad_account_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="act_123456789"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Page ID</label>
                <input
                  value={metaForm.page_id}
                  onChange={(e) => setMetaForm((f) => ({ ...f, page_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123456789"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Pixel ID</label>
                <input
                  value={metaForm.pixel_id}
                  onChange={(e) => setMetaForm((f) => ({ ...f, pixel_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="987654321"
                />
              </div>
            </div>
            <button
              onClick={saveMeta}
              disabled={savingMeta || !metaForm.access_token || !metaForm.ad_account_id}
              className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {savingMeta ? "Connecting..." : "Connect Meta Account"}
            </button>
          </div>
        )}
      </section>

      {/* Billing */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Billing & Plans</h2>
        {subscription && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
            Current plan: <span className="font-semibold capitalize">{subscription.plan}</span>
            {" — "}{subscription.campaigns_per_month === -1 ? "Unlimited" : subscription.campaigns_per_month} campaigns/month
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div>
                <p className="font-semibold text-gray-900">{plan.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {plan.price === 0 ? "Free" : `GHS ${plan.price}`}
                  {plan.price > 0 && <span className="text-xs font-normal text-gray-400">/mo</span>}
                </p>
              </div>
              <ul className="space-y-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-gray-600 flex gap-1.5">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              {plan.id !== "free" && (
                <button
                  onClick={() => upgradePlan(plan.id)}
                  disabled={upgrading === plan.id || subscription?.plan === plan.id}
                  className="w-full bg-blue-600 text-white text-xs font-medium py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {subscription?.plan === plan.id
                    ? "Current Plan"
                    : upgrading === plan.id
                    ? "Redirecting..."
                    : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
