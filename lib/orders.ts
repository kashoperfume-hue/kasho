"use server";

import { createClient } from "@/lib/supabase/server";
import { generateOrderNumber } from "@/lib/utils";
import type { CheckoutFormData, Order, LocalCartItem, Coupon } from "@/types";

export async function createOrder(
  formData: CheckoutFormData,
  cartItems: LocalCartItem[],
  coupon: Coupon | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };
  if (cartItems.length === 0) return { error: "Cart is empty" };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.sale_price * item.quantity,
    0
  );
  const shipping = subtotal >= 999 ? 0 : 99;
  let discount = 0;

  if (coupon) {
    if (coupon.type === "percentage") {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
    } else if (coupon.type === "fixed") {
      discount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === "free_shipping") {
      discount = shipping;
    }
  }

  const total = subtotal + shipping - discount;

  const orderNumber = generateOrderNumber();

  const shippingAddress = {
    full_name: formData.full_name,
    phone: formData.phone,
    line1: formData.line1,
    line2: formData.line2 || null,
    city: formData.city,
    state: formData.state,
    pincode: formData.pincode,
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      status: "pending",
      payment_method: formData.payment_method,
      payment_status:
        formData.payment_method === "cod" ? "pending" : "submitted",
      subtotal,
      discount,
      shipping_charge: shipping,
      total,
      coupon_code: coupon?.code || null,
      shipping_address: shippingAddress,
      notes: formData.notes || null,
    })
    .select()
    .single();

  if (orderError) {
    return { error: orderError.message };
  }

  // Insert order items
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_sku: item.product.sku,
    product_image: item.product.thumbnail,
    quantity: item.quantity,
    unit_price: item.product.sale_price,
    total_price: item.product.sale_price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    return { error: itemsError.message };
  }

  // Update coupon usage
  if (coupon) {
    await supabase
      .from("coupons")
      .update({ used_count: coupon.used_count + 1 })
      .eq("id", coupon.id);
  }

  // Save address if requested
  if (formData.save_address) {
    await supabase.from("addresses").insert({
      user_id: user.id,
      ...shippingAddress,
      is_default: false,
    });
  }

  // Create payment record for UPI
  if (formData.payment_method === "upi") {
    await supabase.from("payments").insert({
      order_id: order.id,
      user_id: user.id,
      method: "upi",
      amount: total,
      status: "submitted",
      transaction_ref: formData.upi_transaction_ref || null,
    });
  }

  // Initial tracking entry
  await supabase.from("tracking").insert({
    order_id: order.id,
    status: "pending",
    updates: [
      {
        status: "pending",
        message: "Order placed successfully",
        timestamp: new Date().toISOString(),
        location: null,
      },
    ],
  });

  return { success: true, orderId: order.id, orderNumber };
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, items:order_items(*, product:products(*)), tracking(*), user:users(*)"
    )
    .eq("id", orderId)
    .single();

  if (error) return null;
  return data as Order;
}

export async function getUserOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*, product:products(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data as Order[]) || [];
}

export async function validateCoupon(
  code: string,
  orderValue: number
): Promise<{ coupon: Coupon | null; error: string | null }> {
  const supabase = await createClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (!coupon) return { coupon: null, error: "Invalid coupon code" };

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { coupon: null, error: "Coupon has expired" };
  }

  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    return { coupon: null, error: "Coupon usage limit reached" };
  }

  if (orderValue < coupon.min_order_value) {
    return {
      coupon: null,
      error: `Minimum order value ₹${coupon.min_order_value} required`,
    };
  }

  return { coupon: coupon as Coupon, error: null };
}
