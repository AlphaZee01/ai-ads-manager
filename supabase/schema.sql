-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Businesses
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  industry text,
  location text,
  whatsapp text,
  logo_url text,
  created_at timestamptz default now()
);

alter table businesses enable row level security;
create policy "Users manage own business" on businesses
  for all using (auth.uid() = user_id);

-- Conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses not null,
  messages jsonb default '[]',
  created_at timestamptz default now()
);

alter table conversations enable row level security;
create policy "Users manage own conversations" on conversations
  for all using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

-- Campaigns
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses not null,
  objective text,
  budget_daily numeric default 0,
  audience jsonb default '{}',
  placements jsonb default '[]',
  cta text,
  status text default 'draft',
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  created_at timestamptz default now()
);

alter table campaigns enable row level security;
create policy "Users manage own campaigns" on campaigns
  for all using (
    business_id in (select id from businesses where user_id = auth.uid())
  );

-- Ad Creatives
create table if not exists ad_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns not null,
  image_url text,
  headline text,
  primary_text text,
  template_id text,
  created_at timestamptz default now()
);

alter table ad_creatives enable row level security;
create policy "Users manage own ad_creatives" on ad_creatives
  for all using (
    campaign_id in (
      select c.id from campaigns c
      join businesses b on b.id = c.business_id
      where b.user_id = auth.uid()
    )
  );

-- Meta Accounts
create table if not exists meta_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  access_token text,
  ad_account_id text,
  page_id text,
  created_at timestamptz default now()
);

alter table meta_accounts enable row level security;
create policy "Users manage own meta_accounts" on meta_accounts
  for all using (auth.uid() = user_id);

-- Subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  plan text default 'free',
  paystack_sub_code text,
  paystack_customer_code text,
  status text default 'active',
  renews_at timestamptz,
  created_at timestamptz default now()
);

alter table subscriptions enable row level security;
create policy "Users manage own subscriptions" on subscriptions
  for all using (auth.uid() = user_id);

-- Daily Insights Cache
create table if not exists daily_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  insight_date date not null,
  content text,
  created_at timestamptz default now(),
  unique(user_id, insight_date)
);

alter table daily_insights enable row level security;
create policy "Users manage own daily_insights" on daily_insights
  for all using (auth.uid() = user_id);
