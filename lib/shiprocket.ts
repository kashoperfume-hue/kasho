import axios from "axios";
import type { Order, ShiprocketOrder } from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_SHIPROCKET_BASE_URL ||
  "https://apiv2.shiprocket.in/v1/external";

let token: string | null = null;
let tokenExpiry: number = 0;

async function getToken(): Promise<string> {
  if (token && Date.now() < tokenExpiry) {
    return token;
  }

  const res = await axios.post(`${BASE_URL}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });

  token = res.data.token;
  tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return token!;
}

export async function syncOrderToShiprocket(order: Order) {
  try {
    const authToken = await getToken();
    const addr = order.shipping_address;

    const payload: ShiprocketOrder = {
      order_id: order.order_number,
      order_date: order.created_at,
      channel_id: "",
      billing_customer_name: addr.full_name,
      billing_last_name: "",
      billing_address: addr.line1 + (addr.line2 ? `, ${addr.line2}` : ""),
      billing_city: addr.city,
      billing_state: addr.state,
      billing_country: "India",
      billing_pin_code: addr.pincode,
      billing_email: order.user?.email || "",
      billing_phone: addr.phone,
      shipping_is_billing: true,
      payment_method:
        order.payment_method === "cod" ? "COD" : "Prepaid",
      sub_total: order.total,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.3,
      order_items: order.items.map((item) => ({
        name: item.product_name,
        sku: item.product_sku,
        units: item.quantity,
        selling_price: item.unit_price,
      })),
    };

    const res = await axios.post(`${BASE_URL}/orders/create/adhoc`, payload, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    return { success: true, shiprocketOrderId: res.data.order_id };
  } catch (err: unknown) {
    console.error("Shiprocket sync error:", err);
    return { success: false, error: "Failed to sync with Shiprocket" };
  }
}

export async function getShipmentTracking(shipmentId: string) {
  try {
    const authToken = await getToken();
    const res = await axios.get(
      `${BASE_URL}/courier/track/shipment/${shipmentId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    return { success: true, data: res.data };
  } catch {
    return { success: false, error: "Failed to fetch tracking" };
  }
}

export async function generateLabel(shipmentId: string) {
  try {
    const authToken = await getToken();
    const res = await axios.post(
      `${BASE_URL}/courier/generate/label`,
      { shipment_id: [shipmentId] },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return { success: true, url: res.data.label_url };
  } catch {
    return { success: false, error: "Failed to generate label" };
  }
}
