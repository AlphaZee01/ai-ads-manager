"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/stat-card";

type Campaign = {
  id: string;
  name: string;
  status: string;
};

type AnalyticsData = {
  campaign: Campaign;
  totals: {
    impressions: number;
    clicks: number;
    conversions: number;
    spent: number;
    ctr: string;
    cpc: string;
    cpa: string;
  };
  analytics: {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spent: number;
  }[];
};

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.campaigns ?? []);
        if (d.campaigns?.length) {
          setSelected(d.campaigns[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch(`/api/analytics/${selected}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        {campaigns.length > 0 && (
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && !data && (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">No campaigns to display analytics for.</p>
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Impressions" value={data.totals.impressions.toLocaleString()} color="purple" />
            <StatCard label="Clicks" value={data.totals.clicks.toLocaleString()} sub={`${data.totals.ctr}% CTR`} color="blue" />
            <StatCard label="Conversions" value={data.totals.conversions.toLocaleString()} sub={`GHS ${data.totals.cpa} CPA`} color="green" />
            <StatCard label="Spent" value={`GHS ${data.totals.spent.toFixed(2)}`} sub={`GHS ${data.totals.cpc} CPC`} color="orange" />
          </div>

          {data.analytics.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">Daily Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="text-left px-5 py-3">Date</th>
                      <th className="text-right px-5 py-3">Impressions</th>
                      <th className="text-right px-5 py-3">Clicks</th>
                      <th className="text-right px-5 py-3">Conversions</th>
                      <th className="text-right px-5 py-3">Spent (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.analytics.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3 text-gray-600">{row.date}</td>
                        <td className="px-5 py-3 text-right">{row.impressions?.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">{row.clicks?.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">{row.conversions}</td>
                        <td className="px-5 py-3 text-right">{row.spent?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No analytics data yet for this campaign.</p>
              <p className="text-gray-400 text-xs mt-1">Data will appear once the campaign is live and running.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
