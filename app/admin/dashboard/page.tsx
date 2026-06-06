"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Users,
  TrendingUp,
  Package,
  Clock,
  AlertTriangle,
  IndianRupee,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import type { DashboardStats, Order } from "@/types";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];

      const [ordersRes, todayRes, customersRes, productsRes, lowStockRes, pendingRes, recentRes] =
        await Promise.all([
          supabase.from("orders").select("total", { count: "exact" }),
          supabase.from("orders").select("total").gte("created_at", today + "T00:00:00Z"),
          supabase.from("users").select("id", { count: "exact" }).eq("is_admin", false),
          supabase.from("products").select("id", { count: "exact" }).eq("is_active", true),
          supabase.from("products").select("id", { count: "exact" }).lte("stock_quantity", 5).gt("stock_quantity", 0),
          supabase.from("orders").select("id", { count: "exact" }).eq("status", "pending"),
          supabase.from("orders").select("*, items:order_items(product_name, quantity)").order("created_at", { ascending: false }).limit(5),
        ]);

      const totalRevenue = (ordersRes.data || []).reduce((s, o) => s + Number(o.total), 0);
      const revenueToday = (todayRes.data || []).reduce((s, o) => s + Number(o.total), 0);

      setStats({
        total_revenue: totalRevenue,
        total_orders: ordersRes.count || 0,
        total_customers: customersRes.count || 0,
        total_products: productsRes.count || 0,
        orders_today: todayRes.data?.length || 0,
        revenue_today: revenueToday,
        pending_orders: pendingRes.count || 0,
        low_stock_products: lowStockRes.count || 0,
      });

      setRecentOrders((recentRes.data as Order[]) || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  const statCards = stats
    ? [
        {
          label: "Total Revenue",
          value: formatPrice(stats.total_revenue),
          sub: `${formatPrice(stats.revenue_today)} today`,
          icon: IndianRupee,
          color: "text-gold",
          bg: "bg-gold/10",
        },
        {
          label: "Total Orders",
          value: stats.total_orders.toLocaleString(),
          sub: `${stats.orders_today} today`,
          icon: ShoppingBag,
          color: "text-sage-600",
          bg: "bg-sage/20",
        },
        {
          label: "Customers",
          value: stats.total_customers.toLocaleString(),
          sub: "Registered accounts",
          icon: Users,
          color: "text-rose",
          bg: "bg-rose/20",
        },
        {
          label: "Products",
          value: stats.total_products.toLocaleString(),
          sub: "Active listings",
          icon: Package,
          color: "text-charcoal",
          bg: "bg-beige/60",
        },
        {
          label: "Pending Orders",
          value: stats.pending_orders.toLocaleString(),
          sub: "Need attention",
          icon: Clock,
          color: "text-gold",
          bg: "bg-gold/10",
          alert: stats.pending_orders > 0,
        },
        {
          label: "Low Stock",
          value: stats.low_stock_products.toLocaleString(),
          sub: "Products ≤5 units",
          icon: AlertTriangle,
          color: "text-rose",
          bg: "bg-rose/20",
          alert: stats.low_stock_products > 0,
        },
      ]
    : [];

  const statusColor: Record<string, string> = {
    pending: "bg-gold/20 text-gold",
    processing: "bg-sage/20 text-sage-700",
    shipped: "bg-sage/30 text-sage-700",
    delivered: "bg-beige text-charcoal",
    cancelled: "bg-rose/20 text-rose",
    payment_pending: "bg-gold/10 text-gold",
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">
          Overview
        </p>
        <h1 className="font-serif text-3xl text-charcoal font-light">Dashboard</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-beige/40 shimmer" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                className={`border ${card.alert ? "border-gold/40" : "border-beige"} bg-cream p-5 lg:p-6`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 ${card.bg}`}>
                    <card.icon size={16} className={card.color} />
                  </div>
                  {card.alert && (
                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                  )}
                </div>
                <p className="font-serif text-2xl lg:text-3xl text-charcoal font-light">
                  {card.value}
                </p>
                <p className="text-[10px] font-medium tracking-widest uppercase text-charcoal/40 mt-1">
                  {card.label}
                </p>
                <p className="text-xs text-charcoal/30 mt-0.5">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="border border-beige bg-cream">
            <div className="flex items-center justify-between px-6 py-4 border-b border-beige">
              <h2 className="font-serif text-lg text-charcoal font-light">
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="flex items-center gap-1 text-xs text-charcoal/50 hover:text-gold transition-colors"
              >
                View all
                <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-beige/60">
              {recentOrders.length === 0 ? (
                <p className="text-center py-10 text-sm text-charcoal/30">
                  No orders yet
                </p>
              ) : (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-beige/20 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-charcoal group-hover:text-gold transition-colors">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-charcoal/40 mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase ${statusColor[order.status] || "bg-beige text-charcoal"}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium text-sm text-charcoal">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
