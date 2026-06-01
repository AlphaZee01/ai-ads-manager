import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanLimits } from "@/lib/paystack";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("user_id", user.id).single();
  if (!business) return Response.json({ campaigns: [] });

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, ad_creatives(*)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  return Response.json({ campaigns: campaigns || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Plan limit check
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const plan = sub?.plan || "free";
  const limits = getPlanLimits(plan);

  if (limits.campaignsPerMonth !== -1) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: business } = await supabase
      .from("businesses").select("id").eq("user_id", user.id).single();

    const { count } = await supabase
      .from("campaigns")
      .select("id", { count: "exact" })
      .eq("business_id", business?.id)
      .gte("created_at", startOfMonth.toISOString());

    if ((count || 0) >= limits.campaignsPerMonth) {
      return Response.json(
        { error: `Your ${plan} plan allows ${limits.campaignsPerMonth} campaign(s) per month. Upgrade to create more.` },
        { status: 403 }
      );
    }
  }

  const { data: business } = await supabase
    .from("businesses").select("id").eq("user_id", user.id).single();
  if (!business) return Response.json({ error: "Business not found" }, { status: 404 });

  const body = await req.json();

  // Enforce budget cap
  if (limits.dailyBudgetCap !== -1 && body.budget_daily > limits.dailyBudgetCap) {
    body.budget_daily = limits.dailyBudgetCap;
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      business_id: business.id,
      objective: body.objective,
      budget_daily: body.budget_daily,
      audience: body.audience,
      placements: body.placements,
      cta: body.cta,
      status: "draft",
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Save ad creative if provided
  if (body.headline || body.primary_text) {
    await supabase.from("ad_creatives").insert({
      campaign_id: campaign.id,
      headline: body.headline,
      primary_text: body.primary_text,
      image_url: body.image_url || null,
    });
  }

  return Response.json({ campaign }, { status: 201 });
}
