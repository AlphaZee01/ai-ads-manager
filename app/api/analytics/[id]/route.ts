import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, status, budget_daily, budget_total, spent, platform, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: analytics } = await supabase
    .from("analytics")
    .select("*")
    .eq("campaign_id", id)
    .order("date", { ascending: true });

  // Aggregate totals
  const totals = (analytics ?? []).reduce(
    (acc, row) => ({
      impressions: acc.impressions + (row.impressions ?? 0),
      clicks: acc.clicks + (row.clicks ?? 0),
      conversions: acc.conversions + (row.conversions ?? 0),
      spent: acc.spent + (row.spent ?? 0),
    }),
    { impressions: 0, clicks: 0, conversions: 0, spent: 0 }
  );

  const ctr =
    totals.impressions > 0
      ? ((totals.clicks / totals.impressions) * 100).toFixed(2)
      : "0.00";
  const cpc =
    totals.clicks > 0 ? (totals.spent / totals.clicks).toFixed(2) : "0.00";
  const cpa =
    totals.conversions > 0
      ? (totals.spent / totals.conversions).toFixed(2)
      : "0.00";

  return NextResponse.json({
    campaign,
    analytics: analytics ?? [],
    totals: { ...totals, ctr, cpc, cpa },
  });
}
