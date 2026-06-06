import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

async function getShiprocketToken(email: string, password: string): Promise<string | null> {
  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { data: userData } = await supabase.from("users").select("is_admin").eq("id", user?.id || "").single();
  if (!user || !userData?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, orderId } = await req.json();

  // Get shipping settings
  const { data: settings } = await supabase.from("settings").select("value").eq("key", "shipping").single();
  const shippingConfig = settings?.value as Record<string, string>;

  const token = await getShiprocketToken(
    shippingConfig?.shiprocket_email || process.env.SHIPROCKET_EMAIL || "",
    shippingConfig?.shiprocket_password || process.env.SHIPROCKET_PASSWORD || ""
  );

  if (!token) {
    return NextResponse.json({ error: "Shiprocket authentication failed" }, { status: 500 });
  }

  if (action === "create_order") {
    const { data: order } = await supabase
      .from("orders")
      .select("*, items:order_items(*), user:users(*)")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const addr = order.shipping_address as Record<string, string>;
    const shiprocketOrder = {
      order_id: order.order_number,
      order_date: order.created_at.split("T")[0],
      pickup_location: shippingConfig?.shiprocket_pickup_name || "Primary",
      billing_customer_name: addr.full_name?.split(" ")[0] || "Customer",
      billing_last_name: addr.full_name?.split(" ").slice(1).join(" ") || "",
      billing_address: addr.line1,
      billing_address_2: addr.line2 || "",
      billing_city: addr.city,
      billing_pincode: addr.pincode,
      billing_state: addr.state,
      billing_country: "India",
      billing_email: (order.user as Record<string, string>)?.email || "",
      billing_phone: addr.phone,
      shipping_is_billing: true,
      order_items: order.items.map((item: Record<string, unknown>) => ({
        name: item.product_name,
        sku: item.product_sku,
        units: item.quantity,
        selling_price: item.unit_price,
      })),
      payment_method: order.payment_method === "cod" ? "COD" : "Prepaid",
      sub_total: order.total,
      length: 15,
      breadth: 12,
      height: 10,
      weight: 0.3,
    };

    const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(shiprocketOrder),
    });

    const data = await res.json();

    if (data.order_id) {
      await supabase.from("tracking").update({
        shiprocket_order_id: data.order_id,
        shiprocket_shipment_id: data.shipment_id,
      }).eq("order_id", orderId);
    }

    return NextResponse.json(data);
  }

  if (action === "track") {
    const { data: tracking } = await supabase
      .from("tracking")
      .select("shiprocket_shipment_id")
      .eq("order_id", orderId)
      .single();

    if (!(tracking as Record<string, string>)?.shiprocket_shipment_id) {
      return NextResponse.json({ error: "No shipment ID found" }, { status: 404 });
    }

    const res = await fetch(`${SHIPROCKET_BASE_URL}/courier/track/shipment/${(tracking as Record<string, string>).shiprocket_shipment_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
