import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CampaignCard } from "@/components/campaign-card";
import { StatCard } from "@/components/stat-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [
    { data: campaigns },
    { data: subscription },
    { data: analytics },
  ] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("subscriptions")
      .select("plan, campaigns_per_month, max_daily_budget")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("analytics")
      .select("impressions, clicks, conversions, spent")
      .in(
        "campaign_id",
        (
          await supabase
            .from("campaigns")
            .select("id")
            .eq("user_id", user.id)
        ).data?.map((c) => c.id) ?? []
      ),
  ]);

  const totals = (analytics ?? []).reduce(
    (acc, row) => ({
      impressions: acc.impressions + (row.impressions ?? 0),
      clicks: acc.clicks + (row.clicks ?? 0),
      conversions: acc.conversions + (row.conversions ?? 0),
      spent: acc.spent + (row.spent ?? 0),
    }),
    { impressions: 0, clicks: 0, conversions: 0, spent: 0 }
  );

  const activeCampaigns = campaigns?.filter((c) => c.status === "active").length ?? 0;
  const plan = subscription?.plan ?? "free";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Plan: <span className="font-medium capitalize text-blue-600">{plan}</span>
          </p>
        </div>
        <Link
          href="/chat"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          + New Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Campaigns"
          value={activeCampaigns}
          sub={`of ${campaigns?.length ?? 0} total`}
          color="blue"
        />
        <StatCard
          label="Total Impressions"
          value={totals.impressions.toLocaleString()}
          color="purple"
        />
        <StatCard
          label="Total Clicks"
          value={totals.clicks.toLocaleString()}
          sub={
            totals.impressions > 0
              ? `${((totals.clicks / totals.impressions) * 100).toFixed(2)}% CTR`
              : undefined
          }
          color="green"
        />
        <StatCard
          label="Total Spent"
          value={`GHS ${totals.spent.toFixed(2)}`}
          color="orange"
        />
      </div>

      {/* Recent Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Campaigns</h2>
          <Link href="/campaigns" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        {campaigns && campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 text-sm mb-3">No campaigns yet.</p>
            <Link
              href="/chat"
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              Create your first campaign with AI →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
