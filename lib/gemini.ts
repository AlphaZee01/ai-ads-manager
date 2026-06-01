import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export interface CampaignJSON {
  objective: string;
  audience: {
    age_min: number;
    age_max: number;
    genders: string[];
    interests: string[];
    locations: string[];
  };
  budget_daily: number;
  placements: string[];
  cta: string;
  headline: string;
  primary_text: string;
}

export function buildSystemPrompt(business: {
  name: string;
  industry: string;
  location: string;
  whatsapp?: string;
}) {
  return `You are AdBot, an AI marketing assistant for ${business.name}, a ${business.industry} business based in ${business.location}, Ghana.

Your job is to help the business owner create effective Meta (Facebook/Instagram) ad campaigns through a friendly conversation.

Ask questions to understand:
1. Their marketing goal (e.g. get more WhatsApp orders, drive foot traffic, promote a product)
2. Their target audience (age, gender, location, interests)
3. Their daily budget in GHS

Once you have enough information, generate a campaign JSON in this EXACT format wrapped in a \`\`\`campaign code block:

\`\`\`campaign
{
  "objective": "MESSAGES|TRAFFIC|CONVERSIONS|REACH|BRAND_AWARENESS",
  "audience": {
    "age_min": 18,
    "age_max": 45,
    "genders": ["all"],
    "interests": ["interest1", "interest2"],
    "locations": ["Cape Coast", "Accra"]
  },
  "budget_daily": 30,
  "placements": ["facebook_feed", "instagram_feed", "instagram_stories"],
  "cta": "SEND_MESSAGE|LEARN_MORE|SHOP_NOW|CALL_NOW",
  "headline": "Catchy ad headline here",
  "primary_text": "Compelling ad copy here. Keep it under 125 characters."
}
\`\`\`

Rules:
- Budget must be between 10 and 500 GHS/day
- Be conversational, friendly, and encouraging
- Use simple language (no jargon)
- After generating the campaign, briefly explain it in plain English
- If the user provides a WhatsApp number (${business.whatsapp || "not provided"}), recommend MESSAGES objective`;
}

export async function generateAdCreatives(
  campaign: {
    headline?: string;
    primary_text?: string;
    objective?: string;
    cta?: string;
    profiles?: { business_name?: string; description?: string; industry?: string };
  },
  count: number = 3
): Promise<{ headline: string; body: string; cta: string }[]> {
  const business = campaign.profiles;
  const prompt = `Generate ${count} ad creative variations for this Meta (Facebook/Instagram) campaign.

Business: ${business?.business_name ?? "Unknown"}
Industry: ${business?.industry ?? "General"}
Description: ${business?.description ?? ""}
Campaign objective: ${campaign.objective ?? "TRAFFIC"}
Original headline: ${campaign.headline ?? ""}
Original copy: ${campaign.primary_text ?? ""}
CTA: ${campaign.cta ?? "LEARN_MORE"}

Return ONLY a JSON array with ${count} objects, each with:
- "headline": string (max 40 chars)
- "body": string (max 125 chars, compelling ad copy)
- "cta": string (one of: LEARN_MORE, SHOP_NOW, SEND_MESSAGE, CALL_NOW, SIGN_UP)

No markdown, no extra text, just the JSON array.`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code blocks if present
  const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(clean);
}
