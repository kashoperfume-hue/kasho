"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    const search = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`)
        .limit(24);
      setResults((data as Product[]) || []);
      setLoading(false);
    };
    search();
  }, [q]);

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-10">
          <p className="section-label mb-2">Results for</p>
          <h1 className="font-serif text-4xl text-charcoal font-light flex items-center gap-3">
            <Search size={24} className="text-beige" />
            &ldquo;{q}&rdquo;
          </h1>
          {!loading && <p className="text-sm text-charcoal/40 mt-2">{results.length} result{results.length !== 1 ? "s" : ""}</p>}
        </div>
      </div>
      <div className="page-container py-12">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-beige/40 shimmer" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-24">
            <Search size={48} className="text-beige mx-auto mb-4" />
            <p className="font-serif text-2xl text-charcoal/30">No results found</p>
            <p className="text-sm text-charcoal/30 mt-2">Try different keywords or browse our collections</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {results.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
}
