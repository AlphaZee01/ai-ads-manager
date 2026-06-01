import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PLAN_LIMITS: Record<string, { campaigns_per_month: number; max_daily_budget: number }> = {
  starter: { campaigns_per_month: 10, max_daily_budget: 200 },
  growth: { campaigns_per_month: 30, max_daily_budget: 500 },
  business: { campaigns_per_month: -1, max_daily_budget: 2000 },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  const trxref = searchParams.get("trxref");
  const ref = reference ?? trxref;

  if (!ref) {
    return NextResponse.redirect(
      new URL("/settings?payment=failed", req.url)
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Verify with Paystack
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );
  const data = await res.json();

  if (!data.status || data.data?.status !== "success") {
    return NextResponse.redirect(
      new URL("/settings?payment=failed", req.url)
    );
  }

  const plan: string = data.data?.metadata?.plan ?? "free";
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

  // Update subscription
  const currentPeriodEnd = new Date();
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  await supabase.from("subscriptions").upsert(
    {
      user_id: user.id,
      plan,
      status: "active",
      paystack_subscription_code: data.data?.subscription?.subscription_code ?? null,
      current_period_end: currentPeriodEnd.toISOString(),
      campaigns_per_month: limits.campaigns_per_month,
      max_daily_budget: limits.max_daily_budget,
    },
    { onConflict: "user_id" }
  );

  return NextResponse.redirect(
    new URL("/settings?payment=success", req.url)
  );
}
