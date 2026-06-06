"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Save, Loader2, ArrowLeft, X, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { Category, Product } from "@/types";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", slug: "", sku: "", category_id: "",
    description: "", short_description: "",
    sale_price: "", original_price: "",
    stock_quantity: "0",
    tags: "", collection_type: "",
    is_featured: false, is_new_arrival: false, is_best_seller: false,
    is_trending: false, is_limited_edition: false, is_active: true,
    top_notes: "", heart_notes: "", base_notes: "",
    longevity: "", projection: "", fragrance_family: "", volume_ml: "100",
    images: [] as string[], thumbnail: "" as string | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").eq("is_active", true),
        supabase.from("products").select("*").eq("id", id).single(),
      ]);
      setCategories((catRes.data as Category[]) || []);
      if (prodRes.data) {
        const p = prodRes.data as Product;
        setForm({
          name: p.name, slug: p.slug, sku: p.sku, category_id: p.category_id || "",
          description: p.description || "", short_description: p.short_description || "",
          sale_price: String(p.sale_price), original_price: String(p.original_price),
          stock_quantity: String(p.stock_quantity),
          tags: p.tags?.join(", ") || "", collection_type: p.collection_type || "",
          is_featured: p.is_featured, is_new_arrival: p.is_new_arrival, is_best_seller: p.is_best_seller,
          is_trending: p.is_trending, is_limited_edition: p.is_limited_edition, is_active: p.is_active,
          top_notes: p.top_notes?.join(", ") || "", heart_notes: p.heart_notes?.join(", ") || "", base_notes: p.base_notes?.join(", ") || "",
          longevity: p.longevity || "", projection: p.projection || "", fragrance_family: p.fragrance_family || "",
          volume_ml: String(p.volume_ml || 100),
          images: p.images || [], thumbnail: p.thumbnail,
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleNewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImageFiles((p) => [...p, ...files]);
    setNewImagePreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeExistingImage = (idx: number) => {
    setForm((p) => ({
      ...p,
      images: p.images.filter((_, i) => i !== idx),
      thumbnail: idx === 0 && p.images.length > 1 ? p.images[1] : idx === 0 ? null : p.thumbnail,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    let uploadedImages: string[] = [];
    for (const file of newImageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${form.slug}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data } = await supabase.storage.from("products").upload(path, file);
      if (data) uploadedImages.push(data.path);
    }

    const allImages = [...form.images, ...uploadedImages];
    const { error } = await supabase.from("products").update({
      name: form.name, slug: form.slug, sku: form.sku, category_id: form.category_id || null,
      description: form.description, short_description: form.short_description,
      sale_price: Number(form.sale_price), original_price: Number(form.original_price) || Number(form.sale_price),
      stock_quantity: Number(form.stock_quantity),
      images: allImages, thumbnail: allImages[0] || form.thumbnail,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      collection_type: form.collection_type || null,
      is_featured: form.is_featured, is_new_arrival: form.is_new_arrival, is_best_seller: form.is_best_seller,
      is_trending: form.is_trending, is_limited_edition: form.is_limited_edition, is_active: form.is_active,
      top_notes: form.top_notes.split(",").map((n) => n.trim()).filter(Boolean),
      heart_notes: form.heart_notes.split(",").map((n) => n.trim()).filter(Boolean),
      base_notes: form.base_notes.split(",").map((n) => n.trim()).filter(Boolean),
      longevity: form.longevity || null, projection: form.projection || null, fragrance_family: form.fragrance_family || null,
      volume_ml: form.volume_ml ? Number(form.volume_ml) : null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Product updated!");
    router.push("/admin/products");
  };

  if (loading) return <div className="p-8 flex items-center gap-2 text-charcoal/40"><Loader2 size={16} className="animate-spin" /> Loading...</div>;

  const Field = ({ label, children, col = "" }: { label: string; children: React.ReactNode; col?: string }) => (
    <div className={col}>
      <label className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 block mb-2">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="text-charcoal/40 hover:text-charcoal transition-colors"><ArrowLeft size={18} /></Link>
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">Edit</p>
          <h1 className="font-serif text-3xl text-charcoal font-light">{form.name}</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="border border-beige bg-cream p-7">
          <h2 className="font-serif text-lg text-charcoal font-light mb-6">Basic Information</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="Product Name *" col="sm:col-span-2">
              <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))} className="input-luxury" />
            </Field>
            <Field label="Slug"><input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} className="input-luxury font-mono text-sm" /></Field>
            <Field label="SKU"><input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} className="input-luxury font-mono text-sm" /></Field>
            <Field label="Category">
              <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} className="w-full bg-transparent border-b border-beige py-2 text-sm focus:outline-none focus:border-charcoal">
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Collection Type">
              <select value={form.collection_type} onChange={(e) => setForm((p) => ({ ...p, collection_type: e.target.value }))} className="w-full bg-transparent border-b border-beige py-2 text-sm focus:outline-none focus:border-charcoal">
                <option value="">None</option>
                <option value="mens">Men&apos;s</option>
                <option value="womens">Women&apos;s</option>
                <option value="unisex">Unisex</option>
                <option value="limited-edition">Limited Edition</option>
              </select>
            </Field>
            <Field label="Short Description" col="sm:col-span-2">
              <input value={form.short_description} onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))} className="input-luxury" />
            </Field>
            <Field label="Description" col="sm:col-span-2">
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className="w-full bg-transparent border border-beige px-4 py-3 text-sm focus:outline-none focus:border-charcoal transition-colors resize-none" />
            </Field>
          </div>
        </div>

        <div className="border border-beige bg-cream p-7">
          <h2 className="font-serif text-lg text-charcoal font-light mb-6">Pricing & Inventory</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Field label="Sale Price (₹) *"><input required type="number" value={form.sale_price} onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value }))} className="input-luxury" /></Field>
            <Field label="Original Price (₹)"><input type="number" value={form.original_price} onChange={(e) => setForm((p) => ({ ...p, original_price: e.target.value }))} className="input-luxury" /></Field>
            <Field label="Stock"><input type="number" value={form.stock_quantity} onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))} className="input-luxury" /></Field>
            <Field label="Volume (ml)"><input type="number" value={form.volume_ml} onChange={(e) => setForm((p) => ({ ...p, volume_ml: e.target.value }))} className="input-luxury" /></Field>
            <Field label="Tags" col="sm:col-span-2"><input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="woody, spicy, evening" className="input-luxury" /></Field>
          </div>
          <div className="flex flex-wrap gap-5 mt-6">
            {[
              { key: "is_active", label: "Active" },
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

        <div className="border border-beige bg-cream p-7">
          <h2 className="font-serif text-lg text-charcoal font-light mb-6">Images</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {form.images.map((img, i) => (
              <div key={i} className="relative w-24 h-28 bg-beige/30 overflow-hidden group">
                <Image src={getImageUrl(img)} alt="" fill className="object-cover" sizes="96px" />
                <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 p-0.5 bg-ink/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
                {i === 0 && <div className="absolute bottom-0 inset-x-0 bg-charcoal/70 text-cream text-[8px] text-center py-0.5">Thumbnail</div>}
              </div>
            ))}
            {newImagePreviews.map((url, i) => (
              <div key={`new-${i}`} className="relative w-24 h-28 bg-beige/30 overflow-hidden group ring-2 ring-gold">
                <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                <div className="absolute bottom-0 inset-x-0 bg-gold/70 text-ink text-[8px] text-center py-0.5">New</div>
              </div>
            ))}
            <label className="w-24 h-28 border-2 border-dashed border-beige flex flex-col items-center justify-center cursor-pointer hover:border-charcoal transition-colors gap-1">
              <Upload size={16} className="text-charcoal/30" />
              <span className="text-[9px] text-charcoal/30 uppercase tracking-wider">Add</span>
              <input type="file" multiple accept="image/*" onChange={handleNewImages} className="hidden" />
            </label>
          </div>
        </div>

        <div className="border border-beige bg-cream p-7">
          <h2 className="font-serif text-lg text-charcoal font-light mb-6">Fragrance Details</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Field label="Top Notes"><input value={form.top_notes} onChange={(e) => setForm((p) => ({ ...p, top_notes: e.target.value }))} className="input-luxury" /></Field>
            <Field label="Heart Notes"><input value={form.heart_notes} onChange={(e) => setForm((p) => ({ ...p, heart_notes: e.target.value }))} className="input-luxury" /></Field>
            <Field label="Base Notes"><input value={form.base_notes} onChange={(e) => setForm((p) => ({ ...p, base_notes: e.target.value }))} className="input-luxury" /></Field>
            <Field label="Longevity"><input value={form.longevity} onChange={(e) => setForm((p) => ({ ...p, longevity: e.target.value }))} className="input-luxury" /></Field>
            <Field label="Projection"><input value={form.projection} onChange={(e) => setForm((p) => ({ ...p, projection: e.target.value }))} className="input-luxury" /></Field>
            <Field label="Fragrance Family"><input value={form.fragrance_family} onChange={(e) => setForm((p) => ({ ...p, fragrance_family: e.target.value }))} className="input-luxury" /></Field>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.push("/admin/products")} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}
