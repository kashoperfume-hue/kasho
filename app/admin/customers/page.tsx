"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { UserProfile } from "@/types";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase.from("users").select("*", { count: "exact" }).eq("is_admin", false).order("created_at", { ascending: false });
      if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      const { data, count } = await query;
      setCustomers((data as UserProfile[]) || []);
      setTotal(count || 0);
      setLoading(false);
    };
    fetch();
  }, [search]);

  const tierBadge: Record<string, string> = {
    free: "bg-beige text-charcoal",
    silver: "bg-beige text-charcoal",
    gold: "bg-gold/20 text-gold",
    platinum: "bg-charcoal text-cream",
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">Users</p>
        <h1 className="font-serif text-3xl text-charcoal font-light">Customers</h1>
        <p className="text-sm text-charcoal/40 mt-1">{total} registered customers</p>
      </div>

      <div className="relative mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full sm:w-72 border border-beige bg-cream pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-charcoal transition-colors"
        />
      </div>

      <div className="border border-beige bg-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-beige bg-beige/20">
              <tr>
                {["Customer", "Phone", "Tier", "Joined", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-medium tracking-widest uppercase text-charcoal/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/60">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-beige/40 shimmer rounded" /></td>)}</tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-sm text-charcoal/30">No customers found</td></tr>
              ) : (
                customers.map((c) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-beige/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-beige/60 flex items-center justify-center text-charcoal/60 text-xs font-medium">
                          {c.full_name?.charAt(0)?.toUpperCase() || c.email?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-charcoal text-sm">{c.full_name || "—"}</p>
                          <p className="text-xs text-charcoal/40">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-charcoal/50">{c.phone || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase ${tierBadge[c.membership_tier] || "bg-beige text-charcoal"}`}>
                        {c.membership_tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-charcoal/50 whitespace-nowrap">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] uppercase tracking-wider text-sage-700 bg-sage/20 px-2 py-0.5">Active</span>
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
