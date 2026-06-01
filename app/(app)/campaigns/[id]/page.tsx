"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Campaign = {
  id: string;
  name: string;
  status: string;
  objective: string;
  platform: string;
  budget_daily: number;
  budget_total: number;
  spent: number;
  headline: string;
  primary_text: string;
  cta: string;
  audience_age_min: number;
  audience_age_max: number;
  audience_genders: string[];
  audience_interests: string[];
  audience_locations: string[];
  placements: string[];
  created_at: string;
  launched_at: string | null;
  meta_campaign_id: string | null;
};

type Creative = {
  id: string;
  headline: string;
  body: string;
  cta: string;
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [genCreatives, setGenCreatives] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampaign();
    fetchCreatives();
  }, [id]);

  async function fetchCampaign() {
    const res = await fetch(`/api/campaigns/${id}`);
    if (res.ok) {
      const d = await res.json();
      setCampaign(d.campaign);
    }
    setLoading(false);
  }

  async function fetchCreatives() {
    const res = await fetch(`/api/ad-creatives?campaign_id=${id}`);
    if (res.ok) {
      const d = await res.json();
      setCreatives(d.creatives ?? []);
    }
  }

  async function handleLaunch() {
    setLaunching(true);
    setError("");
    const res = await fetch(`/api/campaigns/${id}/launch`, { method: "POST" });
    const d = await res.json();
    if (res.ok) {
      setCampaign((prev) => prev ? { ...prev, status: "active", meta_campaign_id: d.meta_campaign_id } : prev);
    } else {
      setError(d.error ?? "Launch failed");
    }
    setLaunching(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    router.push("/campaigns");
  }

  async function handleGenerateCreatives() {
    setGenCreatives(true);
    const res = await fetch("/api/ad-creatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: id, count: 3 }),
    });
    if (res.ok) {
      await fetchCreatives();
    }
    setGenCreatives(false);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Campaign not found.</p>
        <Link href="/campaigns" className="text-blue-600 text-sm mt-2 inline-block hover:underline">← Back</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/campaigns" className="text-xs text-gray-400 hover:text-gray-600 mb-1 inline-block">← Campaigns</Link>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[campaign.status] ?? statusColors.draft}`}>
              {campaign.status}
            </span>
            <span className="text-xs text-gray-400">{campaign.platform}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === "draft" && (
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {launching ? "Launching..." : "Launch on Meta"}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-red-500 border border-red-200 text-sm font-medium px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Campaign Details</h2>
          <Row label="Objective" value={campaign.objective?.replace(/_/g, " ")} />
          <Row label="Daily Budget" value={`GHS ${campaign.budget_daily}`} />
          <Row label="Total Budget" value={`GHS ${campaign.budget_total}`} />
          <Row label="Spent" value={`GHS ${campaign.spent?.toFixed(2) ?? "0.00"}`} />
          {campaign.meta_campaign_id && (
            <Row label="Meta Campaign ID" value={campaign.meta_campaign_id} mono />
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Audience</h2>
          <Row label="Age" value={`${campaign.audience_age_min}–${campaign.audience_age_max}`} />
          <Row label="Genders" value={(campaign.audience_genders ?? []).join(", ")} />
          <Row label="Locations" value={(campaign.audience_locations ?? []).join(", ")} />
          <Row label="Interests" value={(campaign.audience_interests ?? []).join(", ")} />
          <Row label="Placements" value={(campaign.placements ?? []).join(", ")} />
        </div>
      </div>

      {/* Ad Copy */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Ad Copy</h2>
        <div>
          <p className="text-xs text-gray-500 mb-1">Headline</p>
          <p className="text-gray-800 font-medium">{campaign.headline}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Primary Text</p>
          <p className="text-gray-700 text-sm">{campaign.primary_text}</p>
        </div>
        <Row label="CTA" value={campaign.cta?.replace(/_/g, " ")} />
      </div>

      {/* AI Creatives */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">AI Creative Variations</h2>
          <button
            onClick={handleGenerateCreatives}
            disabled={genCreatives}
            className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            {genCreatives ? "Generating..." : "Generate Variations"}
          </button>
        </div>
        {creatives.length === 0 ? (
          <p className="text-sm text-gray-400">No creatives yet. Generate AI variations above.</p>
        ) : (
          <div className="space-y-3">
            {creatives.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-800">{c.headline}</p>
                <p className="text-gray-600 mt-1">{c.body}</p>
                <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{c.cta?.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-xs text-right text-gray-800 font-medium ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );
}
