"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getImageUrl, formatDate } from "@/lib/utils";
import type { Review } from "@/types";
import AccountSidebar from "@/components/account/AccountSidebar";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) { setLoading(false); return; }
      const supabase = createClient();
      const { data } = await supabase
        .from("reviews")
        .select("*, product:products(name, slug, thumbnail)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setReviews((data as Review[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-10">
          <p className="section-label mb-2">My</p>
          <h1 className="font-serif text-4xl text-charcoal font-light">Reviews</h1>
        </div>
      </div>
      <div className="page-container py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          <AccountSidebar />
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-beige/40 shimmer border border-beige" />)
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-beige bg-cream gap-4">
                <MessageSquare size={48} className="text-beige" />
                <div className="text-center">
                  <p className="font-serif text-xl text-charcoal/40 mb-1">No reviews yet</p>
                  <p className="text-sm text-charcoal/30">Share your thoughts on fragrances you&apos;ve purchased</p>
                </div>
                <Link href="/account/orders" className="btn-outline text-xs">View My Orders</Link>
              </div>
            ) : (
              reviews.map((review, i) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="border border-beige bg-cream p-6">
                  <div className="flex gap-4">
                    {(review.product as unknown as { thumbnail: string })?.thumbnail && (
                      <div className="relative w-14 h-16 bg-beige/40 flex-shrink-0">
                        <Image src={getImageUrl((review.product as unknown as { thumbnail: string }).thumbnail)} alt="" fill className="object-cover" sizes="56px" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link href={`/products/${(review.product as unknown as { slug: string })?.slug}`} className="font-serif text-base text-charcoal hover:text-gold transition-colors">
                        {(review.product as unknown as { name: string })?.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star key={si} size={11} className={si < review.rating ? "fill-gold text-gold" : "text-beige"} />
                          ))}
                        </div>
                        <span className="text-xs text-charcoal/40">{formatDate(review.created_at)}</span>
                        {review.is_verified_purchase && (
                          <span className="text-[9px] uppercase tracking-wider text-sage-700 bg-sage/20 px-1.5 py-0.5">Verified</span>
                        )}
                        {!review.is_approved && (
                          <span className="text-[9px] uppercase tracking-wider text-gold bg-gold/10 px-1.5 py-0.5">Pending Approval</span>
                        )}
                      </div>
                      {review.title && <p className="font-medium text-sm text-charcoal mt-2">{review.title}</p>}
                      <p className="text-sm text-charcoal/60 mt-1 leading-relaxed">{review.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
