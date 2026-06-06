"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import AccountSidebar from "@/components/account/AccountSidebar";

export default function AccountPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || "", phone: profile.phone || "" });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("users").update({ full_name: form.full_name, phone: form.phone, updated_at: new Date().toISOString() }).eq("id", user.id);
    setLoading(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Profile updated");
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-10">
          <p className="section-label mb-2">My</p>
          <h1 className="font-serif text-4xl text-charcoal font-light">Account</h1>
        </div>
      </div>
      <div className="page-container py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          <AccountSidebar />
          <div className="lg:col-span-3">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border border-beige bg-cream p-8">
              <div className="flex items-center gap-3 mb-8">
                <User size={18} className="text-gold" />
                <h2 className="font-serif text-2xl text-charcoal font-light">Profile Information</h2>
              </div>
              <form onSubmit={handleSave} className="space-y-8 max-w-lg">
                <div>
                  <label className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 block mb-2">Email Address</label>
                  <p className="text-sm text-charcoal">{user?.email}</p>
                  <p className="text-xs text-charcoal/30 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 block mb-2">Full Name</label>
                  <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" className="input-luxury" />
                </div>
                <div>
                  <label className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 block mb-2">Phone Number</label>
                  <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" className="input-luxury" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
