"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { IndianRupee, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { RevenueDataPoint, TopProduct } from "@/types";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [recentCustomers, setRecentCustomers] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Revenue by day — last 14 days
      const past14 = new Date();
      past14.setDate(past14.getDate() - 14);

      const [ordersRes, itemsRes, customersRes] = await Promise.all([
        supabase.from("orders").select("total, created_at, status").neq("status", "cancelled"),
        supabase.from("order_items").select("product_id, product_name, product_image, quantity, total_price"),
        supabase.from("users").select("id", { count: "exact" }).gte("created_at", past14.toISOString()),
      ]);

      const orders = ordersRes.data || [];
      const allRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
      setTotalRevenue(allRevenue);
      setTotalOrders(orders.length);
      setAvgOrderValue(orders.length ? Math.round(allRevenue / orders.length) : 0);
      setRecentCustomers(customersRes.count || 0);

      // Aggregate by day
      const byDay: Record<string, { revenue: number; orders: number }> = {};
      orders.forEach((o) => {
        const day = o.created_at.split("T")[0];
        if (!byDay[day]) byDay[day] = { revenue: 0, orders: 0 };
        byDay[day].revenue += Number(o.total);
        byDay[day].orders += 1;
      });
      const sorted = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, v]) => ({ date, ...v }));
      setRevenueData(sorted);

      // Top products by revenue
      const productRevenue: Record<string, TopProduct> = {};
      (itemsRes.data || []).forEach((item) => {
        if (!productRevenue[item.product_id]) {
          productRevenue[item.product_id] = { product_id: item.product_id, product_name: item.product_name, total_sold: 0, total_revenue: 0, thumbnail: item.product_image };
        }
        productRevenue[item.product_id].total_sold += item.quantity;
        productRevenue[item.product_id].total_revenue += Number(item.total_price);
      });
      const top = Object.values(productRevenue).sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 8);
      setTopProducts(top);
      setLoading(false);
    };
    fetchData();
  }, []);

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">Insights</p>
        <h1 className="font-serif text-3xl text-charcoal font-light">Analytics</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: formatPrice(totalRevenue), icon: IndianRupee, color: "text-gold", bg: "bg-gold/10" },
          { label: "Total Orders", value: totalOrders.toLocaleString(), icon: ShoppingBag, color: "text-sage-600", bg: "bg-sage/20" },
          { label: "Avg Order Value", value: formatPrice(avgOrderValue), icon: TrendingUp, color: "text-rose", bg: "bg-rose/20" },
          { label: "New Customers (14d)", value: recentCustomers.toLocaleString(), icon: Users, color: "text-charcoal", bg: "bg-beige/60" },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="border border-beige bg-cream p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className={`p-2 ${stat.bg} w-fit mb-3`}><stat.icon size={16} className={stat.color} /></div>
            <p className="font-serif text-2xl text-charcoal font-light">{loading ? "—" : stat.value}</p>
            <p className="text-[10px] font-medium tracking-widest uppercase text-charcoal/40 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="border border-beige bg-cream p-6 mb-6">
        <h2 className="font-serif text-lg text-charcoal font-light mb-6">Revenue — Last 14 Days</h2>
        {loading ? (
          <div className="h-40 bg-beige/40 shimmer" />
        ) : revenueData.length === 0 ? (
          <p className="text-sm text-charcoal/30 text-center py-10">No data yet</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {revenueData.map((point, i) => (
              <motion.div
                key={point.date}
                className="flex-1 flex flex-col items-center gap-1 group"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.04, origin: "bottom" }}
                style={{ transformOrigin: "bottom" }}
              >
                <div
                  className="w-full bg-gold/40 hover:bg-gold transition-all duration-200 relative group-hover:shadow-lg"
                  style={{ height: `${(point.revenue / maxRevenue) * 120 + 4}px` }}
                  title={`${point.date}: ${formatPrice(point.revenue)}`}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-cream text-[9px] px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {formatPrice(point.revenue)}
                  </div>
                </div>
                <p className="text-[8px] text-charcoal/30 rotate-45 origin-left translate-y-1 whitespace-nowrap">
                  {point.date.slice(5)}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Top Products */}
      <div className="border border-beige bg-cream">
        <div className="px-6 py-4 border-b border-beige">
          <h2 className="font-serif text-lg text-charcoal font-light">Top Products by Revenue</h2>
        </div>
        <div className="divide-y divide-beige/60">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-12 bg-beige/40 shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-beige/40 shimmer" />
                  <div className="h-3 w-20 bg-beige/40 shimmer" />
                </div>
              </div>
            ))
          ) : topProducts.length === 0 ? (
            <p className="text-center py-10 text-sm text-charcoal/30">No sales data yet</p>
          ) : (
            topProducts.map((product, i) => (
              <div key={product.product_id} className="flex items-center gap-4 px-6 py-4 hover:bg-beige/10 transition-colors">
                <span className="w-5 text-xs text-charcoal/30 font-medium">{i + 1}.</span>
                <div className="relative w-10 h-12 bg-beige/40 flex-shrink-0">
                  <Image src={getImageUrl(product.thumbnail)} alt={product.product_name} fill className="object-cover" sizes="40px" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-charcoal">{product.product_name}</p>
                  <p className="text-xs text-charcoal/40">{product.total_sold} units sold</p>
                </div>
                <p className="font-medium text-charcoal">{formatPrice(product.total_revenue)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
