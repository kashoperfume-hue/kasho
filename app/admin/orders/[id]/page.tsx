"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Save, ArrowLeft, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate, getImageUrl } from "@/lib/utils";
import type { Order, OrderStatus, TrackingUpdate } from "@/types";
import Image from "next/image";
import toast from "react-hot-toast";

const ORDER_STATUSES: OrderStatus[] = ["pending", "payment_pending", "payment_confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tracking, setTracking] = useState({ tracking_number: "", courier_name: "", tracking_url: "", status: "pending" as OrderStatus });

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("orders").select("*, items:order_items(*, product:products(thumbnail)), user:users(*), tracking(*)").eq("id", id).single();
      setOrder(data as Order);
      if ((data as Order)?.tracking) {
        const t = (data as unknown as { tracking: { tracking_number: string; courier_name: string; tracking_url: string; status: OrderStatus } })?.tracking;
        if (t) setTracking({ tracking_number: t.tracking_number || "", courier_name: t.courier_name || "", tracking_url: t.tracking_url || "", status: t.status });
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", order.id);
    const update: TrackingUpdate = { status: newStatus, message: `Order status updated to ${newStatus.replace(/_/g, " ")}`, timestamp: new Date().toISOString(), location: null };
    const existing = (order.tracking?.updates || []) as TrackingUpdate[];
    await supabase.from("tracking").update({ status: newStatus, updates: [...existing, update], updated_at: new Date().toISOString() }).eq("order_id", order.id);
    setOrder((p) => p ? { ...p, status: newStatus } : p);
    setSaving(false);
    toast.success("Order status updated");
  };

  const handleSaveTracking = async () => {
    if (!order) return;
    setSaving(true);
    const supabase = createClient();
    const update: TrackingUpdate = { status: tracking.status, message: `Tracking updated. Courier: ${tracking.courier_name || "—"}. Tracking: ${tracking.tracking_number || "—"}`, timestamp: new Date().toISOString(), location: null };
    const existing = (order.tracking?.updates || []) as TrackingUpdate[];
    await supabase.from("tracking").update({ ...tracking, updates: [...existing, update], updated_at: new Date().toISOString() }).eq("order_id", order.id);
    await supabase.from("orders").update({ status: tracking.status, updated_at: new Date().toISOString() }).eq("id", order.id);
    setSaving(false);
    toast.success("Tracking info saved");
  };

  if (loading) return <div className="p-8 flex items-center gap-2 text-charcoal/40"><Loader2 size={16} className="animate-spin" /> Loading...</div>;
  if (!order) return <div className="p-8 text-charcoal/40">Order not found</div>;

  const addr = order.shipping_address;
  const statusBg: Record<string, string> = { pending: "bg-gold/20 text-gold", delivered: "bg-sage/20 text-sage-700", cancelled: "bg-rose/20 text-rose" };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders" className="text-charcoal/40 hover:text-charcoal transition-colors"><ArrowLeft size={18} /></Link>
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-0.5">Order</p>
          <h1 className="font-serif text-2xl text-charcoal font-light flex items-center gap-3">
            {order.order_number}
            <span className={`px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase ${statusBg[order.status] || "bg-beige text-charcoal"}`}>
              {order.status.replace(/_/g, " ")}
            </span>
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="border border-beige bg-cream">
            <div className="px-6 py-4 border-b border-beige"><h2 className="font-serif text-lg text-charcoal font-light">Order Items</h2></div>
            <div className="divide-y divide-beige/60">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-5">
                  <div className="relative w-12 h-14 bg-beige/40 flex-shrink-0">
                    <Image src={getImageUrl((item.product as unknown as { thumbnail: string })?.thumbnail)} alt={item.product_name} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-charcoal">{item.product_name}</p>
                    <p className="text-xs text-charcoal/40">SKU: {item.product_sku} · Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-charcoal">{formatPrice(item.total_price)}</p>
                    <p className="text-xs text-charcoal/40">{formatPrice(item.unit_price)} each</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-beige px-6 py-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-charcoal/60">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-charcoal/60">Shipping</span><span>{formatPrice(order.shipping_charge)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-sm text-sage-700"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between font-medium border-t border-beige pt-2"><span className="font-serif">Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>

          {/* Tracking */}
          <div className="border border-beige bg-cream">
            <div className="px-6 py-4 border-b border-beige"><h2 className="font-serif text-lg text-charcoal font-light flex items-center gap-2"><Package size={16} className="text-gold" /> Tracking & Shipping</h2></div>
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Courier Name</label><input value={tracking.courier_name} onChange={(e) => setTracking((p) => ({ ...p, courier_name: e.target.value }))} className="input-luxury" placeholder="Delhivery, Bluedart..." /></div>
                <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Tracking Number</label><input value={tracking.tracking_number} onChange={(e) => setTracking((p) => ({ ...p, tracking_number: e.target.value }))} className="input-luxury font-mono" /></div>
                <div className="sm:col-span-2"><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Tracking URL</label><input value={tracking.tracking_url} onChange={(e) => setTracking((p) => ({ ...p, tracking_url: e.target.value }))} className="input-luxury" placeholder="https://track.courier.com/..." /></div>
                <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Update Status</label>
                  <select value={tracking.status} onChange={(e) => setTracking((p) => ({ ...p, status: e.target.value as OrderStatus }))} className="w-full bg-transparent border-b border-beige py-2 text-sm focus:outline-none focus:border-charcoal">
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleSaveTracking} disabled={saving} className="btn-primary text-xs flex items-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Tracking
              </button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="border border-beige bg-cream p-6">
            <h3 className="font-serif text-base text-charcoal font-light mb-4">Customer</h3>
            <p className="font-medium text-sm text-charcoal">{(order.user as unknown as { full_name: string })?.full_name || "—"}</p>
            <p className="text-xs text-charcoal/50">{(order.user as unknown as { email: string })?.email}</p>
          </div>
          {/* Shipping address */}
          <div className="border border-beige bg-cream p-6">
            <h3 className="font-serif text-base text-charcoal font-light mb-4">Shipping Address</h3>
            <p className="text-sm text-charcoal font-medium">{(addr as unknown as { full_name: string })?.full_name}</p>
            <p className="text-xs text-charcoal/60 mt-1">{(addr as unknown as { line1: string })?.line1}{(addr as unknown as { line2: string })?.line2 ? `, ${(addr as unknown as { line2: string }).line2}` : ""}</p>
            <p className="text-xs text-charcoal/60">{(addr as unknown as { city: string })?.city}, {(addr as unknown as { state: string })?.state} — {(addr as unknown as { pincode: string })?.pincode}</p>
            <p className="text-xs text-charcoal/50 mt-1">{(addr as unknown as { phone: string })?.phone}</p>
          </div>
          {/* Quick status */}
          <div className="border border-beige bg-cream p-6">
            <h3 className="font-serif text-base text-charcoal font-light mb-4">Quick Status Update</h3>
            <div className="space-y-2">
              {["processing", "packed", "shipped", "delivered", "cancelled"].map((s) => (
                <button key={s} onClick={() => handleStatusUpdate(s as OrderStatus)} disabled={order.status === s || saving} className="w-full text-left px-3 py-2 text-xs font-medium tracking-wider uppercase border border-beige hover:bg-beige/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  Mark as {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
          {/* Order info */}
          <div className="border border-beige bg-cream p-6">
            <h3 className="font-serif text-base text-charcoal font-light mb-4">Order Info</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-charcoal/50">Date</span><span className="text-charcoal">{formatDate(order.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-charcoal/50">Payment</span><span className="uppercase text-charcoal">{order.payment_method}</span></div>
              <div className="flex justify-between"><span className="text-charcoal/50">Payment Status</span><span className="text-charcoal capitalize">{order.payment_status}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
