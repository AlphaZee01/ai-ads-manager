import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

const PLAN_LIMITS: Record<string, { campaigns_per_month: number; max_daily_budget: number }> = {
  starter: { campaigns_per_month: 10, max_daily_budget: 200 },
  growth: { campaigns_per_month: 30, max_daily_budget: 500 },
  business: { campaigns_per_month: -1, max_daily_budget: 2000 },
};

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const body = await req.text();

  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = await createClient();

  if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
    const userId = event.data?.metadata?.user_id;
    if (userId) {
      await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          status: "cancelled",
          campaigns_per_month: 2,
          max_daily_budget: 50,
        })
        .eq("user_id", userId);
    }
  }

  if (event.event === "charge.success") {
    const userId = event.data?.metadata?.user_id;
    const plan: string = event.data?.metadata?.plan ?? "free";
    const limits = PLAN_LIMITS[plan];

    if (userId && limits) {
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan,
          status: "active",
          current_period_end: currentPeriodEnd.toISOString(),
          campaigns_per_month: limits.campaigns_per_month,
          max_daily_budget: limits.max_daily_budget,
        },
        { onConflict: "user_id" }
      );
    }
  }

  return NextResponse.json({ received: true });
}
