"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Coupon, CouponType } from "@/types";
import toast from "react-hot-toast";

const defaultForm = { code: "", type: "percentage" as CouponType, value: 0, min_order_value: 0, max_discount: "", usage_limit: "", is_active: true, expires_at: "" };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const fetchCoupons = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    if (!form.code || !form.value) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("coupons").insert({
      code: form.code.toUpperCase(),
      type: form.type,
      value: form.value,
      min_order_value: form.min_order_value,
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      is_active: form.is_active,
      expires_at: form.expires_at || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Coupon created");
    setForm(defaultForm);
    setShowForm(false);
    fetchCoupons();
  };

  const toggleActive = async (coupon: Coupon) => {
    const supabase = createClient();
    await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
    setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    const supabase = createClient();
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    toast.success("Coupon deleted");
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">Promotions</p>
          <h1 className="font-serif text-3xl text-charcoal font-light">Coupons</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-2">
          <Plus size={14} /> New Coupon
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border border-beige bg-cream p-6 mb-6">
          <h3 className="font-serif text-lg text-charcoal font-light mb-6">Create Coupon</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Code *</label>
              <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="KASHO10" className="input-luxury" />
            </div>
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Type *</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as CouponType }))} className="w-full bg-transparent border-b border-beige py-2 text-sm focus:outline-none focus:border-charcoal">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Value *</label>
              <input type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: Number(e.target.value) }))} className="input-luxury" placeholder={form.type === "percentage" ? "10" : "200"} />
            </div>
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Min Order (₹)</label>
              <input type="number" value={form.min_order_value} onChange={(e) => setForm((p) => ({ ...p, min_order_value: Number(e.target.value) }))} className="input-luxury" />
            </div>
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Max Discount (₹)</label>
              <input type="number" value={form.max_discount} onChange={(e) => setForm((p) => ({ ...p, max_discount: e.target.value }))} className="input-luxury" placeholder="Optional" />
            </div>
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Usage Limit</label>
              <input type="number" value={form.usage_limit} onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))} className="input-luxury" placeholder="Unlimited" />
            </div>
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Expires At</label>
              <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))} className="input-luxury" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-xs flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="border border-beige bg-cream overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-beige bg-beige/20">
            <tr>
              {["Code", "Type", "Value", "Min Order", "Used", "Expires", "Status", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-medium tracking-widest uppercase text-charcoal/50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-beige/60">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-beige/40 shimmer rounded" /></td>)}</tr>
              ))
            ) : coupons.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-sm text-charcoal/30">No coupons yet</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-beige/10">
                  <td className="px-5 py-4 font-mono font-medium text-charcoal">{c.code}</td>
                  <td className="px-5 py-4 text-xs uppercase tracking-wider text-charcoal/50">{c.type.replace("_", " ")}</td>
                  <td className="px-5 py-4 font-medium">{c.type === "percentage" ? `${c.value}%` : c.type === "fixed" ? `₹${c.value}` : "Free Ship"}</td>
                  <td className="px-5 py-4 text-xs text-charcoal/50">₹{c.min_order_value}</td>
                  <td className="px-5 py-4 text-xs text-charcoal/50">{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</td>
                  <td className="px-5 py-4 text-xs text-charcoal/50">{c.expires_at ? formatDate(c.expires_at) : "Never"}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 text-[10px] tracking-wider uppercase ${c.is_active ? "bg-sage/20 text-sage-700" : "bg-rose/20 text-rose"}`}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive(c)} className="text-charcoal/40 hover:text-charcoal transition-colors" title="Toggle">
                        {c.is_active ? <ToggleRight size={16} className="text-sage-600" /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => handleDelete(c.id, c.code)} className="text-charcoal/30 hover:text-rose transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
