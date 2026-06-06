"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import ProductCard from "@/components/product/ProductCard";
import AccountSidebar from "@/components/account/AccountSidebar";

export default function WishlistPage() {
  const { items } = useWishlist();

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-10">
          <p className="section-label mb-2">My</p>
          <h1 className="font-serif text-4xl text-charcoal font-light">Wishlist</h1>
        </div>
      </div>
      <div className="page-container py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          <AccountSidebar />
          <div className="lg:col-span-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 border border-beige bg-cream">
                <Heart size={48} className="text-beige" />
                <div className="text-center">
                  <p className="font-serif text-xl text-charcoal/40 mb-1">Your wishlist is empty</p>
                  <p className="text-sm text-charcoal/30">Save fragrances you love</p>
                </div>
                <Link href="/products" className="btn-outline text-xs">Explore Fragrances</Link>
              </div>
            ) : (
              <>
                <p className="text-xs text-charcoal/40 tracking-wider uppercase mb-6">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                  {items.map((product, i) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
