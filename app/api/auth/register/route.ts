import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password, full_name, phone } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, password aur name zaroori hai" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password kam se kam 6 characters ka hona chahiye" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone: phone || "",
      },
    });

    if (error) {
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        return NextResponse.json(
          { error: "Yeh email pehle se registered hai. Login karein." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId: data.user?.id });
  } catch {
    return NextResponse.json(
      { error: "Server error. Dobara try karein." },
      { status: 500 }
    );
  }
}
