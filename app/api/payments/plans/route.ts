import { NextResponse } from "next/server";

export const runtime = "edge";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "GHS",
    campaigns_per_month: 2,
    max_daily_budget: 50,
    features: ["2 campaigns/month", "AI campaign generation", "Basic analytics"],
  },
  {
    id: "starter",
    name: "Starter",
    price: 120,
    currency: "GHS",
    campaigns_per_month: 10,
    max_daily_budget: 200,
    features: [
      "10 campaigns/month",
      "AI campaign generation",
      "Full analytics",
      "Meta Ads integration",
    ],
    plan_code: process.env.PAYSTACK_PLAN_STARTER,
  },
  {
    id: "growth",
    name: "Growth",
    price: 300,
    currency: "GHS",
    campaigns_per_month: 30,
    max_daily_budget: 500,
    features: [
      "30 campaigns/month",
      "AI campaign generation",
      "Full analytics",
      "Meta Ads integration",
      "Priority support",
    ],
    plan_code: process.env.PAYSTACK_PLAN_GROWTH,
  },
  {
    id: "business",
    name: "Business",
    price: 700,
    currency: "GHS",
    campaigns_per_month: -1, // unlimited
    max_daily_budget: 2000,
    features: [
      "Unlimited campaigns",
      "AI campaign generation",
      "Full analytics",
      "Meta Ads integration",
      "Dedicated support",
      "Custom integrations",
    ],
    plan_code: process.env.PAYSTACK_PLAN_BUSINESS,
  },
];

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}
