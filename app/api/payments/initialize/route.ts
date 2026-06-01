import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PLAN_CODES: Record<string, string | undefined> = {
  starter: process.env.PAYSTACK_PLAN_STARTER,
  growth: process.env.PAYSTACK_PLAN_GROWTH,
  business: process.env.PAYSTACK_PLAN_BUSINESS,
};

const PLAN_AMOUNTS: Record<string, number> = {
  starter: 12000, // GHS 120 in pesewas
  growth: 30000,  // GHS 300
  business: 70000, // GHS 700
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();

  if (!["starter", "growth", "business"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const planCode = PLAN_CODES[plan];
  const amount = PLAN_AMOUNTS[plan];

  const callbackUrl =
    process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`
      : `http://localhost:3000/api/payments/verify`;

  const body: Record<string, unknown> = {
    email: user.email,
    amount,
    currency: "GHS",
    callback_url: callbackUrl,
    metadata: {
      user_id: user.id,
      plan,
    },
  };

  if (planCode) {
    body.plan = planCode;
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!data.status) {
    return NextResponse.json(
      { error: data.message ?? "Paystack error" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    authorization_url: data.data.authorization_url,
    reference: data.data.reference,
  });
}
