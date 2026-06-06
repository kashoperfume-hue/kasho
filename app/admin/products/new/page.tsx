"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Plus, X, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slugify, generateSKU } from "@/lib/utils";
import type { Category } from "@/types";
import toast from "react-hot-toast";
import Image from "next/image";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "", slug: "", sku: "", category_id: "",
    description: "", short_description: "",
    sale_price: "", original_price: "",
    stock_quantity: "0",
    tags: "", collection_type: "",
    is_featured: false, is_new_arrival: false, is_best_seller: false,
    is_trending: false, is_limited_edition: false,
    top_notes: "", heart_notes: "", base_notes: "",
    longevity: "", projection: "", fragrance_family: "", volume_ml: "100",
  });

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("*").eq("is_active", true);
      setCategories((data as Category[]) || []);
    };
    fetch();
  }, []);

  const handleNameChange = (name: string) => {
    setForm((p) => ({
      ...p, name,
      slug: slugify(name),
      sku: p.sku || generateSKU(name, p.category_id || "KS"),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((p) => [...p, ...files]);
    setImagePreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (idx: number) => {
    setImageFiles((p) => p.filter((_, i) => i !== idx));
    setImagePreviews((p) => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sale_price) return;
    setLoading(true);
    const supabase = createClient();

    // Upload images
    let uploadedImages: string[] = [];
    if (imageFiles.length) {
      setUploadingImages(true);
      for (const file of imageFiles) {
        const ext = file.name.split(".").pop();
        const path = `${form.slug}-${Date.now()}.${ext}`;
        const { data } = await supabase.storage.from("products").upload(path, file);
        if (data) uploadedImages.push(data.path);
      }
      setUploadingImages(false);
    }

    const { error } = await supabase.from("products").insert({
      name: form.name,
      slug: form.slug || slugify(form.name),
      sku: form.sku,
      category_id: form.category_id || null,
      description: form.description,
      short_description: form.short_description,
      sale_price: Number(form.sale_price),
      original_price: Number(form.original_price) || Number(form.sale_price),
      stock_quantity: Number(form.stock_quantity),
      images: uploadedImages,
      thumbnail: uploadedImages[0] || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      collection_type: form.collection_type || null,
      is_featured: form.is_featured,
      is_new_arrival: form.is_new_arrival,
      is_best_seller: form.is_best_seller,
      is_trending: form.is_trending,
      is_limited_edition: form.is_limited_edition,
      top_notes: form.top_notes.split(",").map((n) => n.trim()).filter(Boolean),
      heart_notes: form.heart_notes.split(",").map((n) => n.trim()).filter(Boolean),
      base_notes: form.base_notes.split(",").map((n) => n.trim()).filter(Boolean),
      longevity: form.longevity || null,
      projection: form.projection || null,
      fragrance_family: form.fragrance_family || null,
      volume_ml: form.volume_ml ? Number(form.volume_ml) : null,
    });

    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product created!");
    router.push("/admin/products");
  };

  const Field = ({ label, children, col = "" }: { label: string; children: React.ReactNode; col?: string }) => (
    <div className={col}>
      <label className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 block mb-2">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">Products</p>
        <h1 className="font-serif text-3xl text-charcoal font-light">Add New Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="border border-beige bg-cream p-7">
          <h2 className="font-serif text-lg text-charcoal font-light mb-6">Basic Information</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Product Name *" col="sm:col-span-2">
              <input required value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Noir Séduction" className="input-luxury" />
            </Field>
            <Field label="Slug">
              <input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="input-luxury font-mono text-sm" />
            </Field>
            <Field label="SKU">
              <input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} className="input-luxury font-mono text-sm" />
            </Field>
            <Field label="Category">
              <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} className="w-full bg-transparent border-b border-beige py-2 text-sm focus:outline-none focus:border-charcoal">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Collection Type">
              <select value={form.collection_type} onChange={(e) => setForm((p) => ({ ...p, collection_type: e.target.value }))} className="w-full bg-transparent border-b border-beige py-2 text-sm focus:outline-none focus:border-charcoal">
                <option value="">None</option>
                <option value="mens">Men's</option>
                <option value="womens">Women's</option>
                <option value="unisex">Unisex</option>
                <option value="limited-edition">Limited Edition</option>
              </select>
            </Field>
            <Field label="Short Description" col="sm:col-span-2">
              <input value={form.short_description} onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))} placeholder="One-line product description" className="input-luxury" />
            </Field>
            <Field label="Full Description" col="sm:col-span-2">
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder="Detailed product description..." className="w-full bg-transparent border border-beige px-4 py-3 text-sm focus:outline-none focus:border-charcoal transition-colors resize-none" />
            </Field>
          </div>
        </div>

        {/* Pricing */}
        <div className="border border-beige bg-cream p-7">
          <h2 className="font-serif text-lg text-charcoal font-light mb-6">Pricing & Inventory</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Field label="Sale Price (₹) *">
              <input required type="number" value={form.sale_price} onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value }))} className="input-luxury" />
            </Field>
            <Field label="Original Price (₹)">
              <input type="number" value={form.original_price} onChange={(e) => setForm((p) => ({ ...p, original_price: e.target.value }))} className="input-luxury" />
            </Field>
            <Field label="Stock Quantity">
              <input type="number" value={form.stock_quantity} onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))} className="input-luxury" />
            </Field>
            <Field label="Volume (ml)">
              <input type="number" value={form.volume_ml} onChange={(e) => setForm((p) => ({ ...p, volume_ml: e.target.value }))} className="input-luxury" />
            </Field>
            <Field label="Tags (comma-separated)" col="sm:col-span-2">
              <input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="woody, spicy, masculine, evening" className="input-luxury" />
            </Field>
          </div>
          {/* Flags */}
          <div className="flex flex-wrap gap-5 mt-6">
            {[
              { key: "is_featured", label: "Featured" },
              { key: "is_new_arrival", label: "New Arrival" },
              { key: "is_best_seller", label: "Best Seller" },
              { key: "is_trending", label: "Trending" },
              { key: "is_limited_edition", label: "Limited Edition" },
            ].map((flag) => (
              <label key={flag.key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={Boolean(form[flag.key as keyof typeof form])} onChange={(e) => setForm((p) => ({ ...p, [flag.key]: e.target.checked }))} className="accent-charcoal" />
                <span className="text-sm text-charcoal">{flag.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="border border-beige bg-cream p-7">
          <h2 className="font-serif text-lg text-charcoal font-light mb-6">Product Images</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {imagePreviews.map((url, i) => (
              <div key={i} className="relative w-24 h-28 bg-beige/30 overflow-hidden group">
                <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-0.5 bg-ink/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
                {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-charcoal/70 text-cream text-[8px] text-center py-0.5">Thumbnail</div>}
              </div>
            ))}
            <label className="w-24 h-28 border-2 border-dashed border-beige flex flex-col items-center justify-center cursor-pointer hover:border-charcoal transition-colors gap-1">
              <Upload size={16} className="text-charcoal/30" />
              <span className="text-[9px] text-charcoal/30 uppercase tracking-wider">Add</span>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          <p className="text-xs text-charcoal/30">First image will be used as thumbnail. Recommended: 800×1000px, JPG or PNG.</p>
        </div>

        {/* Fragrance Notes */}
        <div className="border border-beige bg-cream p-7">
          <h2 className="font-serif text-lg text-charcoal font-light mb-6">Fragrance Details</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Field label="Top Notes (comma-separated)">
              <input value={form.top_notes} onChange={(e) => setForm((p) => ({ ...p, top_notes: e.target.value }))} placeholder="Bergamot, Black Pepper" className="input-luxury" />
            </Field>
            <Field label="Heart Notes">
              <input value={form.heart_notes} onChange={(e) => setForm((p) => ({ ...p, heart_notes: e.target.value }))} placeholder="Vetiver, Cedar" className="input-luxury" />
            </Field>
            <Field label="Base Notes">
              <input value={form.base_notes} onChange={(e) => setForm((p) => ({ ...p, base_notes: e.target.value }))} placeholder="Musk, Amber" className="input-luxury" />
            </Field>
            <Field label="Longevity">
              <input value={form.longevity} onChange={(e) => setForm((p) => ({ ...p, longevity: e.target.value }))} placeholder="8-10 hours" className="input-luxury" />
            </Field>
            <Field label="Projection">
              <input value={form.projection} onChange={(e) => setForm((p) => ({ ...p, projection: e.target.value }))} placeholder="Moderate" className="input-luxury" />
            </Field>
            <Field label="Fragrance Family">
              <input value={form.fragrance_family} onChange={(e) => setForm((p) => ({ ...p, fragrance_family: e.target.value }))} placeholder="Woody Oriental" className="input-luxury" />
            </Field>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {(loading || uploadingImages) ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            {uploadingImages ? "Uploading images..." : loading ? "Creating..." : "Create Product"}
          </button>
          <button type="button" onClick={() => router.push("/admin/products")} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}
