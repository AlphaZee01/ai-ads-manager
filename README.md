# AI Ads Campaign Manager

An AI-powered Meta (Facebook/Instagram) ads campaign manager for Ghanaian SMEs. Built with Next.js 15, Supabase, Gemini 1.5 Flash, and Paystack.

## Features

- 🤖 **AI Chat** — Gemini-powered AdBot creates campaigns from natural language
- 📊 **Analytics** — Track impressions, clicks, CTR, CPC, CPA
- 🚀 **Meta Launch** — Launch campaigns directly to Meta Ads API
- 💳 **Paystack Billing** — GHS-denominated subscription plans
- 🔐 **Supabase Auth** — Email/password authentication

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase/schema.sql`
3. Enable **Email Auth** in Authentication → Providers

### 2. Environment Variables

Copy `.env.local` and fill in the values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini (Google AI Studio)
GOOGLE_AI_API_KEY=your-gemini-api-key

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PLAN_STARTER=PLN_xxx   # Create recurring plans in Paystack dashboard
PAYSTACK_PLAN_GROWTH=PLN_xxx
PAYSTACK_PLAN_BUSINESS=PLN_xxx

# App URL (for payment callbacks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Paystack Plans

Create 3 recurring monthly plans in your [Paystack dashboard](https://dashboard.paystack.com/#/plans):
- **Starter** — GHS 120/month
- **Growth** — GHS 300/month
- **Business** — GHS 700/month

Copy each plan code (e.g. `PLN_xxxx`) into the `.env.local` variables above.

### 4. Paystack Webhook

In Paystack dashboard → Settings → API Keys & Webhooks, set webhook URL to:
```
https://your-domain.com/api/payments/webhook
```

### 5. Install & Run

```bash
npm install
npm run dev
```

### 6. Deploy

Deploy to [Vercel](https://vercel.com):
```bash
npx vercel
```

Add all environment variables in the Vercel project settings.

## Plan Limits

| Plan     | Price/mo  | Campaigns | Max Daily Budget |
|----------|-----------|-----------|------------------|
| Free     | GHS 0     | 2         | GHS 50           |
| Starter  | GHS 120   | 10        | GHS 200          |
| Growth   | GHS 300   | 30        | GHS 500          |
| Business | GHS 700   | Unlimited | GHS 2,000        |

## Meta Ads Integration

Users connect their own Meta Business accounts in Settings:
1. Get a **User Access Token** from [Meta Business Suite](https://business.facebook.com)
2. Enter your **Ad Account ID** (format: `act_XXXXXXXXX`)
3. Optionally enter **Page ID** and **Pixel ID**

Campaigns are launched via the Meta Marketing API v18.
