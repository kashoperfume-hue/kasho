import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, thumbnail, sale_price, original_price, collection_type")
    .eq("is_active", true)
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(8);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
