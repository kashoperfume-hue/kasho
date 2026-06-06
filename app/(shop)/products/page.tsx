"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { createClient } from "@/lib/supabase/client";
import type { Product, ProductFilters, CollectionType } from "@/types";
import { formatPrice } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Top Rated" },
];

const COLLECTION_FILTERS = [
  { value: "mens", label: "Men's" },
  { value: "womens", label: "Women's" },
  { value: "unisex", label: "Unisex" },
  { value: "limited-edition", label: "Limited Edition" },
];

const SPECIAL_FILTERS = [
  { key: "is_new_arrival", label: "New Arrivals" },
  { key: "is_best_seller", label: "Best Sellers" },
  { key: "is_featured", label: "Featured" },
  { key: "is_trending", label: "Trending" },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState<ProductFilters>({
    sort: "newest",
    page: 1,
    per_page: 12,
    collection: (searchParams.get("collection") as CollectionType) || undefined,
    is_new_arrival: searchParams.get("filter") === "new",
    is_best_seller: searchParams.get("filter") === "bestsellers",
    is_featured: searchParams.get("filter") === "featured",
    is_trending: searchParams.get("filter") === "trending",
    min_price: undefined,
    max_price: undefined,
    in_stock: undefined,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("products")
      .select("*, category:categories(*)", { count: "exact" })
      .eq("is_active", true);

    if (filters.collection) query = query.eq("collection_type", filters.collection);
    if (filters.is_new_arrival) query = query.eq("is_new_arrival", true);
    if (filters.is_best_seller) query = query.eq("is_best_seller", true);
    if (filters.is_featured) query = query.eq("is_featured", true);
    if (filters.is_trending) query = query.eq("is_trending", true);
    if (filters.min_price) query = query.gte("sale_price", filters.min_price);
    if (filters.max_price) query = query.lte("sale_price", filters.max_price);
    if (filters.in_stock) query = query.gt("stock_quantity", 0);

    switch (filters.sort) {
      case "price_asc": query = query.order("sale_price", { ascending: true }); break;
      case "price_desc": query = query.order("sale_price", { ascending: false }); break;
      case "popular": query = query.order("review_count", { ascending: false }); break;
      case "rating": query = query.order("average_rating", { ascending: false }); break;
      default: query = query.order("created_at", { ascending: false });
    }

    const from = ((filters.page || 1) - 1) * (filters.per_page || 12);
    query = query.range(from, from + (filters.per_page || 12) - 1);

    const { data, count } = await query;
    setProducts((data as Product[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilter = (key: keyof ProductFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ sort: "newest", page: 1, per_page: 12 });
  };

  const activeFilterCount = [
    filters.collection,
    filters.is_new_arrival,
    filters.is_best_seller,
    filters.is_featured,
    filters.is_trending,
    filters.in_stock,
    filters.min_price,
    filters.max_price,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-12">
          <p className="section-label mb-2">Shop</p>
          <h1 className="font-serif text-4xl lg:text-5xl text-charcoal font-light">
            All Fragrances
          </h1>
          <p className="text-charcoal/50 text-sm mt-2">
            {loading ? "Loading..." : `${total} fragrance${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-charcoal hover:text-gold transition-colors border border-beige px-4 py-2"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 w-4 h-4 bg-charcoal text-cream text-[9px] flex items-center justify-center rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Collection quick filters */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto">
            {COLLECTION_FILTERS.map((col) => (
              <button
                key={col.value}
                onClick={() =>
                  updateFilter(
                    "collection",
                    filters.collection === col.value
                      ? undefined
                      : (col.value as CollectionType)
                  )
                }
                className={`px-4 py-1.5 text-[10px] font-medium tracking-widest uppercase transition-all whitespace-nowrap ${
                  filters.collection === col.value
                    ? "bg-charcoal text-cream"
                    : "border border-beige text-charcoal hover:border-charcoal"
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="bg-transparent border border-beige px-3 py-2 text-xs font-medium text-charcoal focus:outline-none focus:border-charcoal cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-beige/30 border border-beige p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Special filters */}
                <div>
                  <p className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 mb-3">
                    Type
                  </p>
                  <div className="space-y-2">
                    {SPECIAL_FILTERS.map((f) => (
                      <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(filters[f.key as keyof ProductFilters])}
                          onChange={(e) => updateFilter(f.key as keyof ProductFilters, e.target.checked || undefined)}
                          className="accent-charcoal"
                        />
                        <span className="text-xs text-charcoal">{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <p className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 mb-3">
                    Price Range
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.min_price || ""}
                      onChange={(e) => updateFilter("min_price", e.target.value ? Number(e.target.value) : undefined)}
                      className="w-20 bg-cream border border-beige px-2 py-1.5 text-xs focus:outline-none focus:border-charcoal"
                    />
                    <span className="text-charcoal/40 text-xs">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.max_price || ""}
                      onChange={(e) => updateFilter("max_price", e.target.value ? Number(e.target.value) : undefined)}
                      className="w-20 bg-cream border border-beige px-2 py-1.5 text-xs focus:outline-none focus:border-charcoal"
                    />
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <p className="text-[10px] font-medium tracking-widest uppercase text-charcoal/50 mb-3">
                    Availability
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.in_stock)}
                      onChange={(e) => updateFilter("in_stock", e.target.checked || undefined)}
                      className="accent-charcoal"
                    />
                    <span className="text-xs text-charcoal">In Stock Only</span>
                  </label>
                </div>

                {/* Clear */}
                <div className="flex items-end">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 text-xs text-charcoal/50 hover:text-charcoal transition-colors"
                    >
                      <X size={12} />
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-beige/40 shimmer" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-charcoal/30 mb-4">
              No fragrances found
            </p>
            <button onClick={clearFilters} className="btn-outline text-xs">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > (filters.per_page || 12) && (
          <div className="flex justify-center gap-2 mt-12">
            <button
              onClick={() => updateFilter("page", Math.max(1, (filters.page || 1) - 1))}
              disabled={(filters.page || 1) <= 1}
              className="px-4 py-2 border border-beige text-xs text-charcoal disabled:opacity-30 hover:bg-beige/40 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-xs text-charcoal/50">
              Page {filters.page} of {Math.ceil(total / (filters.per_page || 12))}
            </span>
            <button
              onClick={() => updateFilter("page", (filters.page || 1) + 1)}
              disabled={(filters.page || 1) >= Math.ceil(total / (filters.per_page || 12))}
              className="px-4 py-2 border border-beige text-xs text-charcoal disabled:opacity-30 hover:bg-beige/40 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
