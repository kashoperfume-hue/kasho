"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, getImageUrl } from "@/lib/utils";
import type { Product } from "@/types";
import toast from "react-hot-toast";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProducts = async () => {
    const supabase = createClient();
    let query = supabase.from("products").select("*, category:categories(name)").order("created_at", { ascending: false });
    if (search) query = query.ilike("name", `%${search}%`);
    const { data } = await query;
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("Failed to delete product"); setDeleting(null); return; }
    toast.success("Product deleted");
    setProducts((p) => p.filter((x) => x.id !== id));
    setDeleting(null);
  };

  const toggleActive = async (product: Product) => {
    const supabase = createClient();
    await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
    toast.success(product.is_active ? "Product hidden" : "Product visible");
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-charcoal/40 mb-1">Catalog</p>
          <h1 className="font-serif text-3xl text-charcoal font-light">Products</h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-xs flex items-center gap-2">
          <Plus size={14} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full border border-beige bg-cream pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-charcoal transition-colors max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="border border-beige bg-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-beige bg-beige/20">
              <tr>
                <th className="text-left px-5 py-3 text-[10px] font-medium tracking-widest uppercase text-charcoal/50">Product</th>
                <th className="text-left px-5 py-3 text-[10px] font-medium tracking-widest uppercase text-charcoal/50">SKU</th>
                <th className="text-left px-5 py-3 text-[10px] font-medium tracking-widest uppercase text-charcoal/50">Price</th>
                <th className="text-left px-5 py-3 text-[10px] font-medium tracking-widest uppercase text-charcoal/50">Stock</th>
                <th className="text-left px-5 py-3 text-[10px] font-medium tracking-widest uppercase text-charcoal/50">Status</th>
                <th className="text-right px-5 py-3 text-[10px] font-medium tracking-widest uppercase text-charcoal/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-beige/40 shimmer rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-sm text-charcoal/30">
                    No products found.{" "}
                    <Link href="/admin/products/new" className="text-gold hover:underline">Add one</Link>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige/10 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-12 bg-beige/40 flex-shrink-0 overflow-hidden">
                          <Image src={getImageUrl(p.thumbnail)} alt={p.name} fill className="object-cover" sizes="40px" />
                        </div>
                        <div>
                          <p className="font-medium text-charcoal text-sm">{p.name}</p>
                          <p className="text-xs text-charcoal/40">{(p.category as unknown as { name: string })?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-charcoal/50 font-mono">{p.sku}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-charcoal">{formatPrice(p.sale_price)}</p>
                      {p.original_price > p.sale_price && (
                        <p className="text-xs text-charcoal/40 line-through">{formatPrice(p.original_price)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium ${p.stock_quantity <= 5 ? "text-rose" : p.stock_quantity <= 20 ? "text-gold" : "text-sage-700"}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {!p.is_active && <span className="px-1.5 py-0.5 bg-rose/20 text-rose text-[9px] uppercase tracking-wider">Hidden</span>}
                        {p.is_featured && <span className="px-1.5 py-0.5 bg-gold/20 text-gold text-[9px] uppercase tracking-wider">Featured</span>}
                        {p.is_limited_edition && <span className="px-1.5 py-0.5 bg-rose/20 text-rose text-[9px] uppercase tracking-wider">Limited</span>}
                        {p.is_new_arrival && <span className="px-1.5 py-0.5 bg-sage/30 text-sage-700 text-[9px] uppercase tracking-wider">New</span>}
                        {p.is_active && !p.is_featured && !p.is_limited_edition && !p.is_new_arrival && (
                          <span className="px-1.5 py-0.5 bg-beige text-charcoal/50 text-[9px] uppercase tracking-wider">Active</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => toggleActive(p)} className="p-1.5 text-charcoal/40 hover:text-charcoal transition-colors" title={p.is_active ? "Hide" : "Show"}>
                          {p.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <Link href={`/admin/products/${p.id}/edit`} className="p-1.5 text-charcoal/40 hover:text-gold transition-colors">
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deleting === p.id}
                          className="p-1.5 text-charcoal/40 hover:text-rose transition-colors disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
