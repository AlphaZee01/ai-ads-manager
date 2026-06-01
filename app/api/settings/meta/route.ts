import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("meta_accounts")
    .select("ad_account_id, page_id, pixel_id, connected_at")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ meta: data ?? null });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { access_token, ad_account_id, page_id, pixel_id } = body;

  if (!access_token || !ad_account_id) {
    return NextResponse.json(
      { error: "access_token and ad_account_id are required" },
      { status: 400 }
    );
  }

  // Upsert meta account
  const { error } = await supabase.from("meta_accounts").upsert(
    {
      user_id: user.id,
      access_token,
      ad_account_id,
      page_id: page_id ?? null,
      pixel_id: pixel_id ?? null,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("meta_accounts").delete().eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
