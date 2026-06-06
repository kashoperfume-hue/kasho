"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order } from "@/types";
import AccountSidebar from "@/components/account/AccountSidebar";

const statusColor: Record<string, string> = {
  pending: "text-gold bg-gold/10",
  payment_pending: "text-gold bg-gold/10",
  payment_confirmed: "text-sage-700 bg-sage/20",
  processing: "text-sage-700 bg-sage/20",
  packed: "text-sage-700 bg-sage/30",
  shipped: "text-charcoal bg-beige",
  delivered: "text-charcoal bg-beige",
  cancelled: "text-rose bg-rose/20",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase.from("orders").select("*, items:order_items(product_name, quantity, unit_price, product_image)").eq("user_id", user.id).order("created_at", { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-10">
          <p className="section-label mb-2">My</p>
          <h1 className="font-serif text-4xl text-charcoal font-light">Orders</h1>
        </div>
      </div>
      <div className="page-container py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          <AccountSidebar />
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-beige/40 shimmer border border-beige" />)
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 border border-beige bg-cream">
                <ShoppingBag size={48} className="text-beige" />
                <p className="font-serif text-xl text-charcoal/40">No orders yet</p>
                <Link href="/products" className="btn-outline text-xs">Start Shopping</Link>
              </div>
            ) : (
              orders.map((order, i) => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="border border-beige bg-cream p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="font-serif text-base text-charcoal font-medium">{order.order_number}</p>
                      <p className="text-xs text-charcoal/40 mt-0.5">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-[10px] font-medium tracking-widest uppercase ${statusColor[order.status] || "bg-beige text-charcoal"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium text-charcoal">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-charcoal/50">
                      {(order.items as unknown[])?.length || 0} item{(order.items as unknown[])?.length !== 1 ? "s" : ""} · {order.payment_method === "cod" ? "Cash on Delivery" : "UPI Payment"}
                    </p>
                    <Link href={`/account/orders/${order.id}`} className="text-xs font-medium tracking-wider uppercase text-gold hover:text-charcoal transition-colors">
                      View Details →
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
