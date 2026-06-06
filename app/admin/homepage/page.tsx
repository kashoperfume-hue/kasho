"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Banner } from "@/types";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminHomepagePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", link_url: "", button_text: "", sort_order: 0, is_active: true });

  const fetchBanners = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setBanners((data as Banner[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    if (!imgFile) { toast.error("Please upload a banner image"); return; }
    setSaving(true);
    const supabase = createClient();

    const ext = imgFile.name.split(".").pop();
    const path = `banner-${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from("banners").upload(path, imgFile);
    if (uploadError) { toast.error("Image upload failed"); setSaving(false); return; }

    const { error } = await supabase.from("banners").insert({
      ...form,
      image_url: uploadData.path,
      mobile_image_url: null,
    });

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Banner created");
    setShowForm(false);
    setImgFile(null);
    setImgPreview(null);
    setForm({ title: "", subtitle: "", link_url: "", button_text: "", sort_order: 0, is_active: true });
    fetchBanners();
  };

  const toggleBanner = async (banner: Banner) => {
    const supabase = createClient();
    await supabase.from("banners").update({ is_active: !banner.is_active }).eq("id", banner.id);
    setBanners((p) => p.map((b) => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
    toast.success(banner.is_active ? "Banner hidden" : "Banner visible");
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    const supabase = createClient();
    await supabase.from("banners").delete().eq("id", id);
    setBanners((p) => p.filter((b) => b.id !== id));
    toast.success("Banner deleted");
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">Content</p>
          <h1 className="font-serif text-3xl text-charcoal font-light">Homepage Banners</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-2">
          <Plus size={14} /> Add Banner
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border border-beige bg-cream p-6 mb-6">
          <h3 className="font-serif text-lg text-charcoal font-light mb-6">New Banner</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Title</label>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="input-luxury" />
            </div>
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Subtitle</label>
              <input value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} className="input-luxury" />
            </div>
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Link URL</label>
              <input value={form.link_url} onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))} placeholder="/collections/mens" className="input-luxury" />
            </div>
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Button Text</label>
              <input value={form.button_text} onChange={(e) => setForm((p) => ({ ...p, button_text: e.target.value }))} placeholder="Shop Now" className="input-luxury" />
            </div>
            <div><label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))} className="input-luxury" />
            </div>
          </div>

          <div className="mt-5">
            <label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-3">Banner Image *</label>
            {imgPreview && (
              <div className="relative h-32 w-64 mb-3 bg-beige/30">
                <Image src={imgPreview} alt="Preview" fill className="object-cover" sizes="256px" />
              </div>
            )}
            <label className="btn-outline text-xs flex items-center gap-2 w-fit cursor-pointer">
              <Upload size={13} /> Upload Image
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            <p className="text-xs text-charcoal/30 mt-2">Recommended: 1440×600px, JPG or PNG</p>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-xs flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create Banner
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost text-xs">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="border border-beige bg-cream divide-y divide-beige/60">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-beige/40 shimmer m-4" />)
        ) : banners.length === 0 ? (
          <p className="text-center py-16 text-sm text-charcoal/30">No banners yet</p>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="flex items-center gap-4 p-4 hover:bg-beige/10 transition-colors">
              <GripVertical size={16} className="text-charcoal/20 flex-shrink-0" />
              <div className="relative w-24 h-14 bg-beige/40 flex-shrink-0 overflow-hidden">
                <Image src={getImageUrl(banner.image_url)} alt={banner.title} fill className="object-cover" sizes="96px" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-charcoal">{banner.title}</p>
                {banner.subtitle && <p className="text-xs text-charcoal/40 mt-0.5">{banner.subtitle}</p>}
                {banner.link_url && <p className="text-xs text-gold mt-0.5">{banner.link_url}</p>}
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-medium tracking-wider uppercase ${banner.is_active ? "bg-sage/20 text-sage-700" : "bg-rose/20 text-rose"}`}>
                {banner.is_active ? "Active" : "Hidden"}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleBanner(banner)} className="p-1.5 text-charcoal/40 hover:text-charcoal transition-colors">
                  {banner.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => deleteBanner(banner.id)} className="p-1.5 text-charcoal/30 hover:text-rose transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
