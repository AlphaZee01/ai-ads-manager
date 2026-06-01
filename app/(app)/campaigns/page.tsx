import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CampaignCard } from "@/components/campaign-card";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const groups: Record<string, typeof campaigns> = {
    active: campaigns?.filter((c) => c.status === "active") ?? [],
    draft: campaigns?.filter((c) => c.status === "draft") ?? [],
    paused: campaigns?.filter((c) => c.status === "paused") ?? [],
    completed: campaigns?.filter((c) => c.status === "completed") ?? [],
    failed: campaigns?.filter((c) => c.status === "failed") ?? [],
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <Link
          href="/chat"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          + New Campaign
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 mb-3">No campaigns yet.</p>
          <Link href="/chat" className="text-blue-600 text-sm font-medium hover:underline">
            Create your first campaign with AI →
          </Link>
        </div>
      ) : (
        <>
          {Object.entries(groups).map(([status, items]) =>
            items && items.length > 0 ? (
              <div key={status}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 capitalize">
                  {status} ({items.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((c) => (
                    <CampaignCard key={c.id} campaign={c} />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </>
      )}
    </div>
  );
}
