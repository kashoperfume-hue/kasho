"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import ProductsPageContent from "@/app/(shop)/products/page";

const COLLECTION_META: Record<string, { title: string; desc: string; label: string }> = {
  "mens": { label: "Pour Homme", title: "Men's Collection", desc: "Bold, sophisticated fragrances crafted for the modern man who commands presence." },
  "womens": { label: "Pour Femme", title: "Women's Collection", desc: "Alluring, luminous scents that define feminine luxury and grace." },
  "unisex": { label: "Signature", title: "Unisex Collection", desc: "Boundary-defying fragrances for those who transcend labels." },
  "limited-edition": { label: "Édition Limitée", title: "Limited Edition", desc: "Rare masterpieces crafted in small batches. Own a piece of exclusivity." },
};

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const meta = COLLECTION_META[slug] || { label: "Collection", title: slug, desc: "" };

  return (
    <div>
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="section-label mb-3">{meta.label}</p>
            <h1 className="font-serif text-5xl lg:text-6xl text-charcoal font-light">{meta.title}</h1>
            {meta.desc && <p className="text-charcoal/50 text-sm mt-3 max-w-md">{meta.desc}</p>}
          </motion.div>
        </div>
      </div>
      {/* Render products page with collection pre-filtered */}
      <ProductsPageContent />
    </div>
  );
}
