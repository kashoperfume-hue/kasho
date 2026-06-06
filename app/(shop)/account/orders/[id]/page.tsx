"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Package, MapPin, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate, getImageUrl } from "@/lib/utils";
import type { Order, TrackingUpdate } from "@/types";
import AccountSidebar from "@/components/account/AccountSidebar";

const STATUS_STEPS = ["pending", "payment_confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*, items:order_items(*, product:products(thumbnail, slug)), tracking(*)")
        .eq("id", id)
        .single();
      setOrder(data as Order);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const statusColor: Record<string, string> = {
    pending: "text-gold bg-gold/10",
    payment_pending: "text-gold bg-gold/10",
    payment_confirmed: "text-sage-700 bg-sage/20",
    processing: "text-sage-700 bg-sage/20",
    packed: "text-sage-700 bg-sage/30",
    shipped: "text-charcoal bg-beige",
    out_for_delivery: "text-sage-700 bg-sage/40",
    delivered: "text-charcoal bg-beige",
    cancelled: "text-rose bg-rose/20",
  };

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-10">
          <div className="flex items-center gap-3">
            <Link href="/account/orders" className="text-charcoal/40 hover:text-charcoal transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="section-label mb-1">Order Detail</p>
              <h1 className="font-serif text-3xl text-charcoal font-light">
                {order?.order_number || "Loading..."}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          <AccountSidebar />

          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-32 bg-beige/40 shimmer border border-beige" />
                ))}
              </div>
            ) : !order ? (
              <div className="text-center py-16 border border-beige bg-cream">
                <p className="font-serif text-xl text-charcoal/40">Order not found</p>
              </div>
            ) : (
              <>
                {/* Status & Summary */}
                <div className="border border-beige bg-cream p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs text-charcoal/40">Placed on {formatDate(order.created_at)}</p>
                      <p className="font-medium text-charcoal mt-0.5">{order.order_number}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-[10px] font-medium tracking-widest uppercase ${statusColor[order.status] || "bg-beige text-charcoal"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <span className="font-serif text-lg text-charcoal">{formatPrice(order.total)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {currentStepIndex >= 0 && order.status !== "cancelled" && (
                    <div>
                      <div className="flex items-center gap-0">
                        {STATUS_STEPS.slice(0, 7).map((step, i) => (
                          <div key={step} className="flex-1 flex items-center">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${i <= currentStepIndex ? "bg-charcoal" : "bg-beige"}`} />
                            {i < 6 && <div className={`flex-1 h-0.5 ${i < currentStepIndex ? "bg-charcoal" : "bg-beige"}`} />}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        {["Placed", "Confirmed", "Processing", "Packed", "Shipped", "En Route", "Delivered"].map((label, i) => (
                          <p key={label} className={`text-[9px] uppercase tracking-wider ${i <= currentStepIndex ? "text-charcoal font-medium" : "text-charcoal/30"}`}>
                            {label}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tracking */}
                {order.tracking && (order.tracking as unknown as { tracking_number: string })?.tracking_number && (
                  <div className="border border-beige bg-cream p-6">
                    <h2 className="font-serif text-lg text-charcoal font-light flex items-center gap-2 mb-4">
                      <Package size={16} className="text-gold" /> Tracking Information
                    </h2>
                    <div className="space-y-2 text-sm">
                      <p className="text-charcoal/60">
                        Courier: <span className="text-charcoal font-medium">{(order.tracking as unknown as { courier_name: string })?.courier_name}</span>
                      </p>
                      <p className="text-charcoal/60">
                        Tracking #: <span className="font-mono font-medium text-charcoal">{(order.tracking as unknown as { tracking_number: string })?.tracking_number}</span>
                      </p>
                      {(order.tracking as unknown as { tracking_url: string })?.tracking_url && (
                        <a
                          href={(order.tracking as unknown as { tracking_url: string }).tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gold hover:text-charcoal transition-colors mt-2"
                        >
                          Track on courier website <ExternalLink size={11} />
                        </a>
                      )}
                    </div>

                    {/* Timeline */}
                    {(order.tracking as unknown as { updates: TrackingUpdate[] })?.updates?.length > 0 && (
                      <div className="mt-6 space-y-3 border-t border-beige pt-5">
                        <p className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 mb-3">History</p>
                        {((order.tracking as unknown as { updates: TrackingUpdate[] }).updates).slice().reverse().map((update, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-2 h-2 rounded-full mt-1 ${i === 0 ? "bg-gold" : "bg-beige"}`} />
                              {i < ((order.tracking as unknown as { updates: TrackingUpdate[] }).updates.length - 1) && (
                                <div className="w-px flex-1 bg-beige/60 mt-1" />
                              )}
                            </div>
                            <div className="pb-3">
                              <p className="text-xs font-medium text-charcoal capitalize">{update.status.replace(/_/g, " ")}</p>
                              <p className="text-xs text-charcoal/50 mt-0.5">{update.message}</p>
                              <p className="text-[10px] text-charcoal/30 mt-0.5">{formatDate(update.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div className="border border-beige bg-cream">
                  <div className="px-6 py-4 border-b border-beige">
                    <h2 className="font-serif text-lg text-charcoal font-light">Items Ordered</h2>
                  </div>
                  <div className="divide-y divide-beige/60">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex gap-4 p-5">
                        <div className="relative w-14 h-16 bg-beige/40 flex-shrink-0">
                          <Image
                            src={getImageUrl((item.product as unknown as { thumbnail: string })?.thumbnail)}
                            alt={item.product_name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-serif text-sm text-charcoal font-medium">{item.product_name}</p>
                          <p className="text-xs text-charcoal/40 mt-0.5">SKU: {item.product_sku} · Qty: {item.quantity}</p>
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
                    <div className="flex justify-between text-sm"><span className="text-charcoal/60">Shipping</span><span>{order.shipping_charge === 0 ? <span className="text-sage-700 text-xs font-medium">FREE</span> : formatPrice(order.shipping_charge)}</span></div>
                    {order.discount > 0 && <div className="flex justify-between text-sm text-sage-700"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
                    <div className="flex justify-between font-medium border-t border-beige pt-2">
                      <span className="font-serif">Total</span><span>{formatPrice(order.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-charcoal/50 pt-1">
                      <span>Payment</span>
                      <span className="uppercase">{order.payment_method === "cod" ? "Cash on Delivery" : "UPI"} · {order.payment_status}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border border-beige bg-cream p-6">
                  <h2 className="font-serif text-lg text-charcoal font-light flex items-center gap-2 mb-4">
                    <MapPin size={16} className="text-gold" /> Delivery Address
                  </h2>
                  <div className="text-sm text-charcoal/70 space-y-1">
                    <p className="font-medium text-charcoal">{(order.shipping_address as unknown as { full_name: string })?.full_name}</p>
                    <p>{(order.shipping_address as unknown as { line1: string })?.line1}{(order.shipping_address as unknown as { line2: string })?.line2 ? `, ${(order.shipping_address as unknown as { line2: string }).line2}` : ""}</p>
                    <p>{(order.shipping_address as unknown as { city: string })?.city}, {(order.shipping_address as unknown as { state: string })?.state} — {(order.shipping_address as unknown as { pincode: string })?.pincode}</p>
                    <p>{(order.shipping_address as unknown as { phone: string })?.phone}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
