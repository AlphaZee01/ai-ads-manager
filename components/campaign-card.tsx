"use client";

import Link from "next/link";

type Campaign = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed" | "failed";
  platform: string;
  budget_daily: number;
  spent: number;
  budget_total: number;
  objective: string;
  created_at: string;
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const spentPct =
    campaign.budget_total > 0
      ? Math.min(100, (campaign.spent / campaign.budget_total) * 100)
      : 0;

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{campaign.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{campaign.objective?.toLowerCase().replace(/_/g, " ")}</p>
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[campaign.status] ?? statusColors.draft}`}
          >
            {campaign.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Daily Budget</p>
            <p className="text-sm font-medium text-gray-800">GHS {campaign.budget_daily}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Spent</p>
            <p className="text-sm font-medium text-gray-800">GHS {campaign.spent?.toFixed(2) ?? "0.00"}</p>
          </div>
        </div>

        {campaign.budget_total > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Budget used</span>
              <span>{spentPct.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${spentPct}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          {new Date(campaign.created_at).toLocaleDateString("en-GH", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}
