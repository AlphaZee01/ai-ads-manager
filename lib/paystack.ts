const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE_URL = "https://api.paystack.co";

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    currency: "GHS",
    campaignsPerMonth: 1,
    dailyBudgetCap: 50,
    paystackPlanCode: null,
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 12000, // in kobo/pesewas (GHS 120)
    currency: "GHS",
    campaignsPerMonth: 5,
    dailyBudgetCap: 200,
    paystackPlanCode: process.env.PAYSTACK_PLAN_STARTER || "PLN_starter",
  },
  growth: {
    id: "growth",
    name: "Growth",
    price: 30000, // GHS 300
    currency: "GHS",
    campaignsPerMonth: 20,
    dailyBudgetCap: 500,
    paystackPlanCode: process.env.PAYSTACK_PLAN_GROWTH || "PLN_growth",
  },
  business: {
    id: "business",
    name: "Business",
    price: 70000, // GHS 700
    currency: "GHS",
    campaignsPerMonth: -1, // unlimited
    dailyBudgetCap: -1, // unlimited
    paystackPlanCode: process.env.PAYSTACK_PLAN_BUSINESS || "PLN_business",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export async function initializeTransaction(params: {
  email: string;
  amount: number;
  planCode: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      plan: params.planCode,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
  return res.json();
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${BASE_URL}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  return res.json();
}

export async function cancelSubscription(code: string, token: string) {
  const res = await fetch(`${BASE_URL}/subscription/disable`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, token }),
  });
  return res.json();
}

export function getPlanById(planId: PlanId) {
  return PLANS[planId];
}

export function getPlanLimits(planId: string) {
  const plan = PLANS[planId as PlanId] || PLANS.free;
  return {
    campaignsPerMonth: plan.campaignsPerMonth,
    dailyBudgetCap: plan.dailyBudgetCap,
  };
}
