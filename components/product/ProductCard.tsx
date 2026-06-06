"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice, getImageUrl, getDiscountPercentage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export default function ProductCard({
  product,
  className,
  priority = false,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const discount = getDiscountPercentage(
    product.original_price,
    product.sale_price
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn("product-card group", className)}
    >
      {/* Image Area */}
      <div className="relative aspect-[3/4] bg-beige/30 overflow-hidden">
        <Image
          src={getImageUrl(product.thumbnail)}
          alt={product.name}
          fill
          priority={priority}
          className={cn(
            "object-cover transition-all duration-700 group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-beige/40 shimmer" />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new_arrival && (
            <span className="px-2 py-0.5 bg-sage text-charcoal text-[9px] font-medium tracking-widest uppercase">
              New
            </span>
          )}
          {product.is_limited_edition && (
            <span className="px-2 py-0.5 bg-rose text-charcoal text-[9px] font-medium tracking-widest uppercase">
              Limited
            </span>
          )}
          {discount > 0 && (
            <span className="px-2 py-0.5 bg-gold text-ink text-[9px] font-medium tracking-widest uppercase">
              -{discount}%
            </span>
          )}
          {!product.is_in_stock && (
            <span className="px-2 py-0.5 bg-charcoal text-cream text-[9px] font-medium tracking-widest uppercase">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggle(product);
          }}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all duration-300",
            wishlisted
              ? "text-rose bg-cream/80"
              : "text-charcoal/50 bg-cream/60 sm:opacity-0 sm:group-hover:opacity-100"
          )}
          aria-label="Toggle wishlist"
        >
          <Heart
            size={15}
            className={wishlisted ? "fill-rose-300 text-rose-300" : ""}
          />
        </button>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300"
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              if (product.is_in_stock) addItem(product, 1);
            }}
            disabled={!product.is_in_stock}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-medium tracking-widest uppercase transition-all duration-200",
              product.is_in_stock
                ? "bg-charcoal text-cream hover:bg-ink"
                : "bg-charcoal/40 text-cream/60 cursor-not-allowed"
            )}
          >
            <ShoppingBag size={12} />
            {product.is_in_stock ? "Add to Cart" : "Sold Out"}
          </button>
          <Link
            href={`/products/${product.slug}`}
            className="w-9 flex items-center justify-center bg-cream/80 text-charcoal hover:bg-cream transition-colors"
          >
            <Eye size={13} />
          </Link>
        </motion.div>
      </div>

      {/* Info */}
      <Link href={`/products/${product.slug}`} className="block p-3 lg:p-4">
        <p className="text-[10px] font-medium tracking-widest uppercase text-charcoal/40 mb-1">
          {product.category?.name ||
            (product.collection_type
              ? product.collection_type.replace("-", " ")
              : "Kasho")}
        </p>
        <h3 className="font-serif text-sm lg:text-base text-charcoal leading-snug group-hover:text-gold transition-colors duration-300">
          {product.name}
        </h3>

        {/* Rating */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={
                    i < Math.round(product.average_rating)
                      ? "star-filled text-xs"
                      : "star-empty text-xs"
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-[10px] text-charcoal/40">
              ({product.review_count})
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <span className="font-medium text-charcoal text-sm">
            {formatPrice(product.sale_price)}
          </span>
          {product.original_price > product.sale_price && (
            <span className="text-xs text-charcoal/40 line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
