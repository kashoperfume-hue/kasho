"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface ShippingSettings {
  free_shipping_threshold: number;
  standard_shipping_charge: number;
  shiprocket_email: string;
  shiprocket_password: string;
  shiprocket_channel_id: string;
  shiprocket_pickup_name: string;
  shiprocket_pickup_phone: string;
  shiprocket_pickup_address: string;
  shiprocket_pickup_city: string;
  shiprocket_pickup_state: string;
  shiprocket_pickup_pincode: string;
  is_shiprocket_active: boolean;
}

export default function AdminShippingPage() {
  const [settings, setSettings] = useState<ShippingSettings>({
    free_shipping_threshold: 999,
    standard_shipping_charge: 99,
    shiprocket_email: "",
    shiprocket_password: "",
    shiprocket_channel_id: "",
    shiprocket_pickup_name: "Kasho Perfumes",
    shiprocket_pickup_phone: "",
    shiprocket_pickup_address: "",
    shiprocket_pickup_city: "",
    shiprocket_pickup_state: "",
    shiprocket_pickup_pincode: "",
    is_shiprocket_active: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("settings").select("value").eq("key", "shipping").single();
      if (data?.value) setSettings((p) => ({ ...p, ...(data.value as ShippingSettings) }));
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("settings").update({ value: settings as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("key", "shipping");
    setLoading(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Shipping settings saved");
  };

  const Field = ({ label, field, type = "text", placeholder = "" }: { label: string; field: keyof ShippingSettings; type?: string; placeholder?: string }) => (
    <div>
      <label className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 block mb-2">{label}</label>
      <input
        type={type}
        value={settings[field] as string | number}
        onChange={(e) => setSettings((p) => ({ ...p, [field]: type === "number" ? Number(e.target.value) : e.target.value }))}
        placeholder={placeholder}
        className="input-luxury"
      />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">Settings</p>
        <h1 className="font-serif text-3xl text-charcoal font-light">Shipping Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Basic Shipping */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border border-beige bg-cream p-7">
          <h2 className="font-serif text-lg text-charcoal font-light flex items-center gap-2 mb-6">
            <Truck size={16} className="text-gold" /> Shipping Rates
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Free Shipping Threshold (₹)" field="free_shipping_threshold" type="number" />
            <Field label="Standard Shipping Charge (₹)" field="standard_shipping_charge" type="number" />
          </div>
        </motion.div>

        {/* Shiprocket */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border border-beige bg-cream p-7">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-lg text-charcoal font-light">Shiprocket Integration</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={settings.is_shiprocket_active} onChange={(e) => setSettings((p) => ({ ...p, is_shiprocket_active: e.target.checked }))} className="accent-charcoal" />
              <span className="text-xs text-charcoal">Active</span>
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Shiprocket Email" field="shiprocket_email" type="email" />
            <Field label="Shiprocket Password" field="shiprocket_password" type="password" />
            <Field label="Channel ID" field="shiprocket_channel_id" />
          </div>

          <h3 className="font-serif text-base text-charcoal font-light mt-8 mb-4">Pickup Address</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Contact Name" field="shiprocket_pickup_name" />
            <Field label="Contact Phone" field="shiprocket_pickup_phone" />
            <Field label="Address" field="shiprocket_pickup_address" />
            <Field label="Pincode" field="shiprocket_pickup_pincode" />
            <Field label="City" field="shiprocket_pickup_city" />
            <Field label="State" field="shiprocket_pickup_state" />
          </div>
        </motion.div>

        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
