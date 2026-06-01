const META_API_VERSION = "v19.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaCredentials {
  accessToken: string;
  adAccountId: string;
  pageId: string;
}

export interface CampaignPayload {
  objective: string;
  budget_daily: number;
  audience: {
    age_min: number;
    age_max: number;
    genders: string[];
    interests: string[];
    locations: string[];
  };
  placements: string[];
  cta: string;
  headline: string;
  primary_text: string;
  imageUrl?: string;
}

async function metaPost(
  endpoint: string,
  accessToken: string,
  body: Record<string, unknown>
) {
  const res = await fetch(`${META_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

async function metaGet(
  endpoint: string,
  accessToken: string,
  params: Record<string, string> = {}
) {
  const url = new URL(`${META_BASE}${endpoint}`);
  url.searchParams.set("access_token", accessToken);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

// Objective mapping
function mapObjective(objective: string) {
  const map: Record<string, string> = {
    MESSAGES: "OUTCOME_ENGAGEMENT",
    TRAFFIC: "OUTCOME_TRAFFIC",
    CONVERSIONS: "OUTCOME_SALES",
    REACH: "OUTCOME_AWARENESS",
    BRAND_AWARENESS: "OUTCOME_AWARENESS",
  };
  return map[objective] || "OUTCOME_AWARENESS";
}

export async function launchCampaign(
  creds: MetaCredentials,
  payload: CampaignPayload
) {
  const { accessToken, adAccountId, pageId } = creds;
  const accountId = adAccountId.startsWith("act_")
    ? adAccountId
    : `act_${adAccountId}`;

  // 1. Create Campaign
  const campaign = await metaPost(
    `/${accountId}/campaigns`,
    accessToken,
    {
      name: `AdBot Campaign - ${new Date().toLocaleDateString()}`,
      objective: mapObjective(payload.objective),
      status: "ACTIVE",
      special_ad_categories: [],
    }
  );

  // 2. Create Ad Set
  const adSet = await metaPost(`/${accountId}/adsets`, accessToken, {
    name: "AdBot Ad Set",
    campaign_id: campaign.id,
    daily_budget: Math.round(payload.budget_daily * 100), // convert to pesewas
    billing_event: "IMPRESSIONS",
    optimization_goal: payload.objective === "MESSAGES" ? "REPLIES" : "REACH",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    targeting: {
      age_min: payload.audience.age_min,
      age_max: payload.audience.age_max,
      geo_locations: {
        countries: ["GH"],
        cities: payload.audience.locations.map((loc) => ({ name: loc })),
      },
    },
    status: "ACTIVE",
    start_time: new Date().toISOString(),
  });

  // 3. Create Ad Creative
  const creative = await metaPost(
    `/${accountId}/adcreatives`,
    accessToken,
    {
      name: "AdBot Creative",
      object_story_spec: {
        page_id: pageId,
        link_data: {
          message: payload.primary_text,
          link: `https://www.facebook.com/${pageId}`,
          name: payload.headline,
          call_to_action: {
            type: payload.cta,
            value: payload.objective === "MESSAGES"
              ? { app_destination: "MESSENGER" }
              : {},
          },
          ...(payload.imageUrl ? { picture: payload.imageUrl } : {}),
        },
      },
    }
  );

  // 4. Create Ad
  const ad = await metaPost(`/${accountId}/ads`, accessToken, {
    name: "AdBot Ad",
    adset_id: adSet.id,
    creative: { creative_id: creative.id },
    status: "ACTIVE",
  });

  return {
    metaCampaignId: campaign.id,
    metaAdsetId: adSet.id,
    metaAdId: ad.id,
  };
}

export async function getCampaignInsights(
  creds: MetaCredentials,
  metaCampaignId: string,
  dateRange: { since: string; until: string }
) {
  try {
    const data = await metaGet(
      `/${metaCampaignId}/insights`,
      creds.accessToken,
      {
        fields: "spend,reach,impressions,clicks,ctr,actions",
        time_range: JSON.stringify(dateRange),
      }
    );
    return data.data || [];
  } catch {
    return [];
  }
}
