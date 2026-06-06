"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, Tag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { validateCoupon } from "@/lib/orders";
import type { Coupon } from "@/types";
import toast from "react-hot-toast";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, shipping, total } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);

  const handleCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    const result = await validateCoupon(couponCode, subtotal());
    setValidatingCoupon(false);
    if (result.error) { toast.error(result.error); return; }
    setCoupon(result.coupon);
    if (result.coupon) {
      let d = 0;
      if (result.coupon.type === "percentage") {
        d = Math.round((subtotal() * result.coupon.value) / 100);
        if (result.coupon.max_discount) d = Math.min(d, result.coupon.max_discount);
      } else if (result.coupon.type === "fixed") {
        d = Math.min(result.coupon.value, subtotal());
      } else if (result.coupon.type === "free_shipping") {
        d = shipping();
      }
      setDiscount(d);
      toast.success(`Coupon applied! You save ${formatPrice(d)}`);
    }
  };

  const orderTotal = total() - discount;

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-10">
          <p className="section-label mb-2">Your</p>
          <h1 className="font-serif text-4xl text-charcoal font-light">Shopping Cart</h1>
        </div>
      </div>

      <div className="page-container py-12">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <ShoppingBag size={64} className="text-beige" />
            <div className="text-center">
              <p className="font-serif text-2xl text-charcoal/50 mb-2">Your cart is empty</p>
              <p className="text-sm text-charcoal/30">Discover fragrances crafted for you</p>
            </div>
            <Link href="/products" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.product.id}
                    exit={{ opacity: 0, x: 40, height: 0 }}
                    className="flex gap-5 border border-beige bg-cream p-5"
                  >
                    <div className="relative w-24 h-28 bg-beige/40 flex-shrink-0">
                      <Image src={getImageUrl(item.product.thumbnail)} alt={item.product.name} fill className="object-cover" sizes="96px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-serif text-base text-charcoal">{item.product.name}</p>
                          {item.product.volume_ml && <p className="text-xs text-charcoal/40 mt-0.5">{item.product.volume_ml}ml</p>}
                        </div>
                        <button onClick={() => removeItem(item.product.id)} className="text-charcoal/30 hover:text-rose transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-beige">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-beige/40 transition-colors">
                            <Minus size={12} />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock_quantity} className="w-8 h-8 flex items-center justify-center hover:bg-beige/40 transition-colors disabled:opacity-30">
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="font-medium text-charcoal">{formatPrice(item.product.sale_price * item.quantity)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="space-y-5">
              {/* Coupon */}
              <div className="border border-beige bg-cream p-5">
                <p className="text-xs font-medium tracking-widest uppercase text-charcoal/50 mb-4 flex items-center gap-2">
                  <Tag size={12} /> Coupon Code
                </p>
                <div className="flex gap-0">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="KASHO10"
                    className="flex-1 border border-beige border-r-0 px-3 py-2 text-sm focus:outline-none focus:border-charcoal transition-colors bg-transparent uppercase"
                  />
                  <button onClick={handleCoupon} disabled={validatingCoupon} className="px-4 py-2 bg-charcoal text-cream text-xs tracking-wider uppercase hover:bg-ink transition-colors disabled:opacity-50">
                    Apply
                  </button>
                </div>
                {coupon && <p className="text-xs text-sage-700 mt-2 flex items-center gap-1">✓ Coupon &quot;{coupon.code}&quot; applied</p>}
              </div>

              {/* Order Summary */}
              <div className="border border-beige bg-cream p-6 space-y-3">
                <h2 className="font-serif text-lg text-charcoal font-light mb-4">Order Summary</h2>
                <div className="flex justify-between text-sm"><span className="text-charcoal/60">Subtotal</span><span>{formatPrice(subtotal())}</span></div>
                <div className="flex justify-between text-sm">
                  <span className="text-charcoal/60">Shipping</span>
                  <span>{shipping() === 0 ? <span className="text-sage-700 text-xs font-medium">FREE</span> : formatPrice(shipping())}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-sage-700">
                    <span>Discount</span><span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t border-beige pt-3">
                  <span className="font-serif">Total</span>
                  <span>{formatPrice(orderTotal)}</span>
                </div>
                {shipping() > 0 && (
                  <p className="text-xs text-charcoal/40">Add {formatPrice(999 - subtotal())} more for free shipping</p>
                )}
              </div>

              <Link href="/checkout" className="btn-primary w-full text-center block">
                Proceed to Checkout
              </Link>
              <Link href="/products" className="block text-center text-xs text-charcoal/40 hover:text-charcoal transition-colors tracking-wider uppercase">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
