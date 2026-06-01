import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { launchCampaign } from "@/lib/meta";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Get campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, ad_creatives(*), businesses!inner(user_id)")
    .eq("id", id)
    .eq("businesses.user_id", user.id)
    .single();

  if (!campaign) return Response.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status === "active") return Response.json({ error: "Already launched" }, { status: 400 });

  // Get Meta credentials
  const { data: metaAccount } = await supabase
    .from("meta_accounts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!metaAccount?.access_token || !metaAccount?.ad_account_id) {
    return Response.json(
      { error: "Meta Ads credentials not configured. Go to Settings → Meta Ads." },
      { status: 400 }
    );
  }

  try {
    const creative = campaign.ad_creatives?.[0];
    const result = await launchCampaign(
      {
        accessToken: metaAccount.access_token,
        adAccountId: metaAccount.ad_account_id,
        pageId: metaAccount.page_id,
      },
      {
        objective: campaign.objective,
        budget_daily: campaign.budget_daily,
        audience: campaign.audience,
        placements: campaign.placements,
        cta: campaign.cta,
        headline: creative?.headline || "",
        primary_text: creative?.primary_text || "",
        imageUrl: creative?.image_url || undefined,
      }
    );

    await supabase
      .from("campaigns")
      .update({
        status: "active",
        meta_campaign_id: result.metaCampaignId,
        meta_adset_id: result.metaAdsetId,
        meta_ad_id: result.metaAdId,
      })
      .eq("id", id);

    return Response.json({ success: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Launch failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
