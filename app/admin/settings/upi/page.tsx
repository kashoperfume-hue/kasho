"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getImageUrl } from "@/lib/utils";
import Image from "next/image";
import toast from "react-hot-toast";

interface UpiSettings {
  upi_id: string;
  qr_url: string | null;
  instructions: string;
  is_active: boolean;
}

export default function UpiSettingsPage() {
  const [settings, setSettings] = useState<UpiSettings>({ upi_id: "", qr_url: null, instructions: "", is_active: true });
  const [loading, setLoading] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("settings").select("value").eq("key", "upi").single();
      if (data?.value) setSettings(data.value as UpiSettings);
    };
    fetch();
  }, []);

  const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    let qrUrl = settings.qr_url;

    if (qrFile) {
      const ext = qrFile.name.split(".").pop();
      const path = `upi-qr-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from("qr-codes").upload(path, qrFile, { upsert: true });
      if (uploadError) { toast.error("Failed to upload QR"); setLoading(false); return; }
      qrUrl = uploadData.path;
    }

    const updatedSettings = { ...settings, qr_url: qrUrl };
    const { error } = await supabase.from("settings").update({ value: updatedSettings, updated_at: new Date().toISOString() }).eq("key", "upi");
    setLoading(false);
    if (error) { toast.error("Failed to save"); return; }
    setSettings(updatedSettings);
    toast.success("UPI settings saved");
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">Settings</p>
        <h1 className="font-serif text-3xl text-charcoal font-light">UPI Payment Settings</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border border-beige bg-cream p-8 space-y-8">
        <div>
          <label className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 block mb-3">UPI ID</label>
          <input value={settings.upi_id} onChange={(e) => setSettings((p) => ({ ...p, upi_id: e.target.value }))} placeholder="yourname@upi" className="input-luxury" />
        </div>

        <div>
          <label className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 block mb-3">Payment Instructions</label>
          <textarea
            value={settings.instructions}
            onChange={(e) => setSettings((p) => ({ ...p, instructions: e.target.value }))}
            rows={4}
            placeholder="Instructions shown to customer when they choose UPI payment..."
            className="w-full bg-transparent border border-beige px-4 py-3 text-sm text-charcoal placeholder-charcoal/30 focus:outline-none focus:border-charcoal transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 block mb-3">QR Code Image</label>
          {(qrPreview || settings.qr_url) && (
            <div className="relative w-40 h-40 border border-beige mb-4">
              <Image src={qrPreview || getImageUrl(settings.qr_url)} alt="UPI QR" fill className="object-contain p-2" sizes="160px" />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer btn-outline text-xs w-fit">
            <Upload size={13} />
            Upload QR Code
            <input type="file" accept="image/*" onChange={handleQrChange} className="hidden" />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={settings.is_active} onChange={(e) => setSettings((p) => ({ ...p, is_active: e.target.checked }))} className="accent-charcoal" />
            <span className="text-sm text-charcoal">UPI payment is active</span>
          </label>
        </div>

        <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save Settings
        </button>
      </motion.div>
    </div>
  );
}
