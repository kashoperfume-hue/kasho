import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email aur password zaroori hai" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData.user) {
      return NextResponse.json({ error: "Email ya password galat hai" }, { status: 401 });
    }

    const userId = authData.user.id;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("is_admin, full_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      await supabaseAdmin
        .from("users")
        .upsert({
          id: userId,
          email: authData.user.email!,
          full_name: authData.user.user_metadata?.full_name || "Admin",
          is_admin: false,
        }, { onConflict: "id" });

      return NextResponse.json({
        error: "Aapka account admin nahi hai. Supabase mein is_admin = TRUE set karein:\n\nUPDATE public.users SET is_admin = TRUE WHERE email = '" + email + "';"
      }, { status: 403 });
    }

    if (!profile.is_admin) {
      return NextResponse.json({
        error: "Access denied. Supabase SQL Editor mein yeh run karein:\n\nUPDATE public.users SET is_admin = TRUE WHERE email = '" + email + "';"
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      name: profile.full_name || email.split("@")[0],
    });
  } catch {
    return NextResponse.json({ error: "Server error. Dobara try karein." }, { status: 500 });
  }
}
