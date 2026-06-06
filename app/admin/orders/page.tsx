"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const STATUS_OPTIONS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "payment_pending", label: "Payment Pending" },
  { value: "payment_confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const statusColor: Record<string, string> = {
  pending: "bg-gold/20 text-gold",
  payment_pending: "bg-gold/10 text-gold",
  payment_confirmed: "bg-sage/20 text-sage-700",
  processing: "bg-sage/20 text-sage-700",
  packed: "bg-sage/30 text-sage-700",
  shipped: "bg-beige text-charcoal",
  out_for_delivery: "bg-sage/40 text-sage-700",
  delivered: "bg-cream text-charcoal",
  cancelled: "bg-rose/20 text-rose",
  refunded: "bg-rose/10 text-rose",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("orders")
        .select("*, user:users(full_name, email)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (search) query = query.ilike("order_number", `%${search}%`);

      const { data } = await query;
      setOrders((data as Order[]) || []);
      setLoading(false);
    };
    fetchOrders();
  }, [search, statusFilter]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">Manage</p>
        <h1 className="font-serif text-3xl text-charcoal font-light">Orders</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number..."
            className="border border-beige bg-cream pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-charcoal transition-colors w-full sm:w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
          className="border border-beige bg-cream px-4 py-2.5 text-sm focus:outline-none focus:border-charcoal"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="border border-beige bg-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-beige bg-beige/20">
              <tr>
                {["Order", "Customer", "Date", "Items", "Total", "Payment", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-medium tracking-widest uppercase text-charcoal/50 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/60">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-beige/40 shimmer rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-sm text-charcoal/30">No orders found</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-beige/10 transition-colors">
                    <td className="px-5 py-4 font-medium text-charcoal">{order.order_number}</td>
                    <td className="px-5 py-4">
                      <p className="text-charcoal text-xs">{(order.user as unknown as { full_name: string })?.full_name || "—"}</p>
                      <p className="text-charcoal/40 text-xs">{(order.user as unknown as { email: string })?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-charcoal/50 whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-4 text-xs text-charcoal/50">{(order.items as unknown[])?.length ?? "—"}</td>
                    <td className="px-5 py-4 font-medium text-charcoal">{formatPrice(order.total)}</td>
                    <td className="px-5 py-4 text-xs uppercase tracking-wider text-charcoal/50">{order.payment_method}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase ${statusColor[order.status] || "bg-beige text-charcoal"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-xs text-gold hover:underline whitespace-nowrap">
                        View →
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
