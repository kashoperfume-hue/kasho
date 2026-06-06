"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Star, Loader2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Address } from "@/types";
import AccountSidebar from "@/components/account/AccountSidebar";
import toast from "react-hot-toast";

const emptyForm = { full_name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", is_default: false };

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAddresses = async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    setAddresses((data as Address[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.full_name || !form.line1 || !form.city || !form.pincode) return;
    setSaving(true);
    const supabase = createClient();

    if (form.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    }

    await supabase.from("addresses").insert({ ...form, user_id: user.id });
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
    toast.success("Address saved");
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    const supabase = createClient();
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses((p) => p.filter((a) => a.id !== id));
    toast.success("Address deleted");
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    toast.success("Default address updated");
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-10">
          <p className="section-label mb-2">My</p>
          <h1 className="font-serif text-4xl text-charcoal font-light">Addresses</h1>
        </div>
      </div>
      <div className="page-container py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          <AccountSidebar />
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <p className="text-xs text-charcoal/40 tracking-wider uppercase">
                {addresses.length} saved address{addresses.length !== 1 ? "es" : ""}
              </p>
              <button onClick={() => setShowForm(!showForm)} className="btn-outline text-xs flex items-center gap-2">
                <Plus size={13} /> Add Address
              </button>
            </div>

            {showForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border border-beige bg-cream p-6 mb-6">
                <h3 className="font-serif text-lg text-charcoal font-light mb-6">New Address</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  {[
                    { key: "full_name", label: "Full Name", col: "sm:col-span-2" },
                    { key: "phone", label: "Phone" },
                    { key: "line1", label: "Address Line 1", col: "sm:col-span-2" },
                    { key: "line2", label: "Address Line 2 (optional)", col: "sm:col-span-2" },
                    { key: "pincode", label: "Pincode" },
                    { key: "city", label: "City" },
                    { key: "state", label: "State" },
                  ].map((f) => (
                    <div key={f.key} className={f.col || ""}>
                      <label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">{f.label}</label>
                      <input value={(form as Record<string, string>)[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} className="input-luxury" />
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-5">
                  <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))} className="accent-charcoal" />
                  <span className="text-sm text-charcoal">Set as default address</span>
                </label>
                <div className="flex gap-3 mt-6">
                  <button onClick={handleSave} disabled={saving} className="btn-primary text-xs flex items-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Save Address
                  </button>
                  <button onClick={() => { setShowForm(false); setForm(emptyForm); }} className="btn-ghost text-xs">Cancel</button>
                </div>
              </motion.div>
            )}

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-36 bg-beige/40 shimmer border border-beige" />)}
              </div>
            ) : addresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-beige bg-cream gap-4">
                <MapPin size={48} className="text-beige" />
                <p className="font-serif text-xl text-charcoal/40">No saved addresses</p>
                <button onClick={() => setShowForm(true)} className="btn-outline text-xs">Add Your First Address</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <motion.div key={addr.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`border p-5 relative ${addr.is_default ? "border-charcoal" : "border-beige"} bg-cream`}>
                    {addr.is_default && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-gold/20 text-gold text-[9px] uppercase tracking-widest font-medium flex items-center gap-1">
                        <Star size={9} className="fill-gold" /> Default
                      </span>
                    )}
                    <p className="font-serif text-base text-charcoal font-medium mb-1">{addr.full_name}</p>
                    <p className="text-xs text-charcoal/60 leading-relaxed">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                    <p className="text-xs text-charcoal/60">{addr.city}, {addr.state} — {addr.pincode}</p>
                    <p className="text-xs text-charcoal/50 mt-1">{addr.phone}</p>
                    <div className="flex gap-3 mt-4 pt-3 border-t border-beige/60">
                      {!addr.is_default && (
                        <button onClick={() => setDefault(addr.id)} className="text-xs text-charcoal/50 hover:text-charcoal transition-colors">Set Default</button>
                      )}
                      <button onClick={() => handleDelete(addr.id)} className="text-xs text-rose/60 hover:text-rose transition-colors ml-auto flex items-center gap-1">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
