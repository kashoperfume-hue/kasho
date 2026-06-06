import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get("x-webhook-secret");
  const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();
  const { type, table, record, old_record } = payload;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Handle order status changes
    if (table === "orders" && type === "UPDATE") {
      const oldStatus = old_record?.status;
      const newStatus = record?.status;

      if (oldStatus !== newStatus) {
        // Add tracking update
        const update = {
          status: newStatus,
          message: getStatusMessage(newStatus),
          timestamp: new Date().toISOString(),
          location: null,
        };

        const { data: tracking } = await supabase
          .from("tracking")
          .select("updates")
          .eq("order_id", record.id)
          .single();

        const existingUpdates = (tracking?.updates as unknown[]) || [];
        await supabase
          .from("tracking")
          .update({
            status: newStatus,
            updates: [...existingUpdates, update],
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", record.id);
      }
    }

    // Handle new user creation — sync profile
    if (table === "auth.users" && type === "INSERT") {
      await supabase.from("users").insert({
        id: record.id,
        email: record.email,
        full_name: record.raw_user_meta_data?.full_name || null,
        created_at: record.created_at,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    pending: "Order placed successfully",
    payment_pending: "Awaiting payment confirmation",
    payment_confirmed: "Payment confirmed, preparing your order",
    processing: "Your order is being prepared",
    packed: "Order packed and ready for pickup",
    shipped: "Your order has been shipped",
    out_for_delivery: "Your order is out for delivery",
    delivered: "Order delivered successfully",
    cancelled: "Order has been cancelled",
    refunded: "Refund has been initiated",
  };
  return messages[status] || `Order status updated to ${status.replace(/_/g, " ")}`;
}
