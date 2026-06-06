"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import IntroLoader from "@/components/home/IntroLoader";
import HeroSection from "@/components/home/HeroSection";
import TrustSection from "@/components/home/TrustSection";
import FeaturedCollections from "@/components/home/FeaturedCollections";
import ProductSection from "@/components/home/ProductSection";
import BrandStory from "@/components/home/BrandStory";
import CustomerReviews from "@/components/home/CustomerReviews";
import Newsletter from "@/components/home/Newsletter";
import InstagramGallery from "@/components/home/InstagramGallery";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";

export default function HomePage() {
  const [showLoader, setShowLoader] = useState(true);
  const [loaderDone, setLoaderDone] = useState(false);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);

  useEffect(() => {
    // Check if intro was already shown in this session
    if (sessionStorage.getItem("kasho-intro-shown")) {
      setShowLoader(false);
      setLoaderDone(true);
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const supabase = createClient();
      const [featuredRes, newRes, bestRes, trendRes] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).eq("is_featured", true).limit(4),
        supabase.from("products").select("*").eq("is_active", true).eq("is_new_arrival", true).limit(4),
        supabase.from("products").select("*").eq("is_active", true).eq("is_best_seller", true).limit(4),
        supabase.from("products").select("*").eq("is_active", true).eq("is_trending", true).limit(4),
      ]);
      setFeatured((featuredRes.data as Product[]) || []);
      setNewArrivals((newRes.data as Product[]) || []);
      setBestSellers((bestRes.data as Product[]) || []);
      setTrending((trendRes.data as Product[]) || []);
    };
    fetchProducts();
  }, []);

  const handleLoaderComplete = () => {
    setShowLoader(false);
    sessionStorage.setItem("kasho-intro-shown", "1");
    setTimeout(() => setLoaderDone(true), 50);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoader && (
          <IntroLoader key="intro" onComplete={handleLoaderComplete} />
        )}
      </AnimatePresence>

      {loaderDone && (
        <>
          <HeroSection />
          <TrustSection />
          <FeaturedCollections />

          {featured.length > 0 && (
            <ProductSection
              label="Curated"
              title="Featured Fragrances"
              products={featured}
              viewAllHref="/products?filter=featured"
              className="bg-cream"
            />
          )}

          {newArrivals.length > 0 && (
            <ProductSection
              label="Just In"
              title="New Arrivals"
              products={newArrivals}
              viewAllHref="/products?filter=new"
              className="bg-beige/20"
            />
          )}

          {bestSellers.length > 0 && (
            <ProductSection
              label="Loved"
              title="Best Sellers"
              products={bestSellers}
              viewAllHref="/products?filter=bestsellers"
              className="bg-cream"
            />
          )}

          {trending.length > 0 && (
            <ProductSection
              label="Trending"
              title="Right Now"
              products={trending}
              viewAllHref="/products?filter=trending"
              className="bg-beige/20"
            />
          )}

          <BrandStory />
          <CustomerReviews />
          <InstagramGallery />
          <Newsletter />
        </>
      )}
    </>
  );
}
