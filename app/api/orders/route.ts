import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateOrderNumber } from "@/lib/utils";

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
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { items, shipping_address, payment_method, coupon_code, subtotal, shipping_charge, discount, total } = body;

  if (!items?.length || !shipping_address || !payment_method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const orderNumber = generateOrderNumber();

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      status: payment_method === "cod" ? "pending" : "payment_pending",
      payment_method,
      payment_status: payment_method === "cod" ? "pending" : "submitted",
      subtotal,
      shipping_charge,
      discount: discount || 0,
      total,
      coupon_code: coupon_code || null,
      shipping_address,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // Create order items
  const orderItems = items.map((item: { product: { id: string; name: string; sku: string; thumbnail: string | null; sale_price: number }; quantity: number }) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_sku: item.product.sku,
    product_image: item.product.thumbnail,
    quantity: item.quantity,
    unit_price: item.product.sale_price,
    total_price: item.product.sale_price * item.quantity,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Create tracking record
  await supabase.from("tracking").insert({
    order_id: order.id,
    status: "pending",
    updates: [{ status: "pending", message: "Order placed successfully", timestamp: new Date().toISOString(), location: null }],
  });

  // Update coupon usage
  if (coupon_code) {
    await supabase.rpc("increment_coupon_usage", { coupon_code_param: coupon_code });
  }

  // Update stock
  for (const item of items as { product: { id: string }; quantity: number }[]) {
    await supabase.rpc("decrement_stock", { product_id_param: item.product.id, quantity_param: item.quantity });
  }

  return NextResponse.json({ success: true, orderNumber, orderId: order.id });
}
