"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, ShoppingCart, Star, ChevronDown, ZoomIn, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice, getImageUrl } from "@/lib/utils";
import type { Product, Review } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "notes" | "reviews">("description");
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [zoomed, setZoomed] = useState(false);

  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("products").select("*, category:categories(*)").eq("slug", slug).eq("is_active", true).single();
      if (!data) { setLoading(false); return; }
      setProduct(data as Product);

      // Related products
      const { data: rel } = await supabase.from("products").select("*").eq("is_active", true).eq("category_id", data.category_id).neq("id", data.id).limit(4);
      setRelated((rel as Product[]) || []);

      // Reviews
      const { data: revs } = await supabase.from("reviews").select("*, user:users(full_name, avatar_url)").eq("product_id", data.id).eq("is_approved", true).order("created_at", { ascending: false });
      setReviews((revs as Review[]) || []);
      setLoading(false);
    };
    fetch();
  }, [slug]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  if (loading) return (
    <div className="min-h-screen bg-cream page-container py-20">
      <div className="grid lg:grid-cols-2 gap-16">
        <div className="aspect-[4/5] bg-beige/40 shimmer" />
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => <div key={i} className={`h-${i === 0 ? 8 : 4} bg-beige/40 shimmer rounded`} />)}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="font-serif text-2xl text-charcoal/30 mb-4">Product not found</p>
        <Link href="/products" className="btn-outline text-xs">Browse All</Link>
      </div>
    </div>
  );

  const images = product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : [];
  const currentImage = images[activeImage] || images[0];

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="page-container pt-8 pb-0">
        <nav className="flex items-center gap-2 text-xs text-charcoal/40">
          <Link href="/" className="hover:text-charcoal">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-charcoal">Products</Link>
          <span>/</span>
          <span className="text-charcoal">{product.name}</span>
        </nav>
      </div>

      {/* Main Product */}
      <div className="page-container py-10 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Gallery */}
          <div className="space-y-3">
            {/* Main image */}
            <div
              className="relative aspect-[4/5] bg-beige/30 overflow-hidden cursor-zoom-in"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
            >
              {currentImage ? (
                <Image
                  src={getImageUrl(currentImage)}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  style={zoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: "scale(1.8)" } : {}}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-6xl text-beige font-light">K</span>
                </div>
              )}
              <div className="absolute top-4 right-4 p-2 bg-cream/70 text-charcoal/50">
                <ZoomIn size={14} />
              </div>
              {product.is_limited_edition && (
                <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-rose text-charcoal text-[10px] font-medium tracking-widest uppercase">
                  Limited Edition
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-16 h-20 flex-shrink-0 bg-beige/30 overflow-hidden transition-all ${activeImage === i ? "ring-2 ring-charcoal ring-offset-1" : "opacity-60 hover:opacity-100"}`}
                  >
                    <Image src={getImageUrl(img)} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
            {/* Category & collection */}
            <p className="section-label">{product.category?.name || product.collection_type?.replace("-", " ") || "Kasho"}</p>

            <h1 className="font-serif text-4xl lg:text-5xl text-charcoal font-light leading-tight">{product.name}</h1>

            {/* Rating */}
            {product.review_count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.round(product.average_rating) ? "fill-gold text-gold" : "text-beige"} />
                  ))}
                </div>
                <span className="text-xs text-charcoal/50">{product.average_rating.toFixed(1)} ({product.review_count} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl text-charcoal">{formatPrice(product.sale_price)}</span>
              {product.original_price > product.sale_price && (
                <>
                  <span className="text-lg text-charcoal/40 line-through">{formatPrice(product.original_price)}</span>
                  <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs font-medium">
                    {product.discount_percentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Volume */}
            {product.volume_ml && (
              <p className="text-sm text-charcoal/50">{product.volume_ml}ml · Eau de Parfum</p>
            )}

            <div className="h-px bg-beige/60" />

            {/* Short desc */}
            {product.short_description && (
              <p className="text-sm text-charcoal/70 leading-relaxed">{product.short_description}</p>
            )}

            {/* Fragrance preview */}
            {(product.top_notes?.length || product.heart_notes?.length || product.base_notes?.length) && (
              <div className="grid grid-cols-3 gap-3">
                {[["Top", product.top_notes], ["Heart", product.heart_notes], ["Base", product.base_notes]].map(([label, notes]) =>
                  (notes as string[])?.length ? (
                    <div key={label as string} className="bg-beige/30 p-3 text-center">
                      <p className="text-[9px] font-medium tracking-widest uppercase text-charcoal/40 mb-1.5">{label as string} Notes</p>
                      <p className="text-xs text-charcoal leading-relaxed">{(notes as string[]).join(" · ")}</p>
                    </div>
                  ) : null
                )}
              </div>
            )}

            {/* Longevity & Projection */}
            {(product.longevity || product.projection) && (
              <div className="flex gap-6">
                {product.longevity && (
                  <div><p className="text-[9px] tracking-widest uppercase text-charcoal/40 mb-1">Longevity</p><p className="text-xs text-charcoal font-medium">{product.longevity}</p></div>
                )}
                {product.projection && (
                  <div><p className="text-[9px] tracking-widest uppercase text-charcoal/40 mb-1">Projection</p><p className="text-xs text-charcoal font-medium">{product.projection}</p></div>
                )}
              </div>
            )}

            <div className="h-px bg-beige/60" />

            {/* Quantity & Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[9px] tracking-widest uppercase text-charcoal/40 mb-2">Quantity</p>
                  <div className="flex items-center border border-beige">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-beige/40 transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center font-medium text-charcoal">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} disabled={quantity >= product.stock_quantity} className="w-10 h-10 flex items-center justify-center hover:bg-beige/40 transition-colors disabled:opacity-30">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-charcoal/40">
                  {product.stock_quantity > 10 ? "In Stock" : product.stock_quantity > 0 ? `Only ${product.stock_quantity} left` : "Out of Stock"}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { if (product.is_in_stock) addItem(product, quantity); }}
                  disabled={!product.is_in_stock}
                  className="flex-1 btn-outline flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <ShoppingCart size={15} />
                  {product.is_in_stock ? "Add to Cart" : "Sold Out"}
                </button>
                <button
                  onClick={() => { if (product.is_in_stock) { addItem(product, quantity); } }}
                  disabled={!product.is_in_stock}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <ShoppingBag size={15} />
                  Buy Now
                </button>
                <button
                  onClick={() => toggle(product)}
                  className={`w-12 h-12 flex items-center justify-center border transition-colors ${isWishlisted(product.id) ? "border-rose bg-rose/10 text-rose" : "border-beige text-charcoal/50 hover:border-rose hover:text-rose"}`}
                >
                  <Heart size={16} className={isWishlisted(product.id) ? "fill-rose" : ""} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="page-container pb-16">
        <div className="border border-beige">
          {/* Tab headers */}
          <div className="flex border-b border-beige">
            {(["description", "notes", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-xs font-medium tracking-widest uppercase transition-all relative ${activeTab === tab ? "text-charcoal" : "text-charcoal/40 hover:text-charcoal"}`}
              >
                {tab === "reviews" ? `Reviews (${product.review_count})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-charcoal" />}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === "description" && (
              <p className="text-sm text-charcoal/70 leading-relaxed max-w-2xl">{product.description || product.short_description || "No description available."}</p>
            )}
            {activeTab === "notes" && (
              <div className="grid sm:grid-cols-3 gap-6 max-w-xl">
                {[["Top Notes", product.top_notes], ["Heart Notes", product.heart_notes], ["Base Notes", product.base_notes]].map(([label, notes]) => (
                  <div key={label as string}>
                    <p className="text-[10px] font-medium tracking-widest uppercase text-gold mb-3">{label as string}</p>
                    <div className="space-y-2">
                      {(notes as string[])?.map((note) => (
                        <div key={note} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-gold/60" />
                          <p className="text-sm text-charcoal">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "reviews" && (
              <div className="space-y-6 max-w-2xl">
                {reviews.length === 0 ? (
                  <p className="text-sm text-charcoal/40">No reviews yet. Be the first to review this fragrance.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-beige/60 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-serif text-sm text-charcoal font-medium">{(review.user as unknown as { full_name: string })?.full_name || "Verified Customer"}</p>
                          {review.is_verified_purchase && <p className="text-[10px] text-sage-700 tracking-wider uppercase">Verified Purchase</p>}
                        </div>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11} className={i < review.rating ? "fill-gold text-gold" : "text-beige"} />
                          ))}
                        </div>
                      </div>
                      {review.title && <p className="font-medium text-sm text-charcoal mb-1">{review.title}</p>}
                      <p className="text-sm text-charcoal/60 leading-relaxed">{review.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="page-container pb-20">
          <h2 className="font-serif text-3xl text-charcoal font-light mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
