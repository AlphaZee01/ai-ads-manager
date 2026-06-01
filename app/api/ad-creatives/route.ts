import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAdCreatives } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaign_id, count = 3 } = await req.json();

  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id required" }, { status: 400 });
  }

  // Verify ownership + get campaign context
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, profiles!inner(business_name, description, industry)")
    .eq("id", campaign_id)
    .eq("user_id", user.id)
    .single();

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  let creatives: { headline: string; body: string; cta: string }[] = [];

  try {
    creatives = await generateAdCreatives(campaign, Math.min(count, 5));
  } catch (err) {
    console.error("Gemini creative gen error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }

  // Save to DB
  const rows = creatives.map((c) => ({
    campaign_id,
    user_id: user.id,
    headline: c.headline,
    body: c.body,
    cta: c.cta,
  }));

  const { data: saved, error } = await supabase
    .from("ad_creatives")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ creatives: saved });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaign_id");

  let query = supabase
    .from("ad_creatives")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ creatives: data });
}
