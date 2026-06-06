"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice, getImageUrl } from "@/lib/utils";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalItems,
    subtotal,
    shipping,
    total,
  } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-cream z-50 flex flex-col shadow-luxury-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-beige">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-charcoal" />
                <h2 className="font-serif text-lg text-charcoal">
                  Your Cart{" "}
                  {totalItems() > 0 && (
                    <span className="font-sans text-sm text-charcoal/50 font-normal">
                      ({totalItems()})
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 text-charcoal/50 hover:text-charcoal transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
                  <ShoppingBag size={48} className="text-beige" />
                  <div>
                    <p className="font-serif text-lg text-charcoal">
                      Your cart is empty
                    </p>
                    <p className="text-sm text-charcoal/50 mt-1">
                      Discover our curated fragrances
                    </p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="btn-outline text-xs"
                  >
                    Shop Now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-beige/60">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        className="flex gap-4 p-5"
                      >
                        {/* Image */}
                        <div className="relative w-20 h-24 bg-beige/40 flex-shrink-0 overflow-hidden">
                          <Image
                            src={getImageUrl(item.product.thumbnail)}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-serif text-sm text-charcoal leading-tight">
                                {item.product.name}
                              </p>
                              {item.product.volume_ml && (
                                <p className="text-xs text-charcoal/50 mt-0.5">
                                  {item.product.volume_ml}ml
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-charcoal/30 hover:text-charcoal transition-colors flex-shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            {/* Qty */}
                            <div className="flex items-center border border-beige">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1
                                  )
                                }
                                className="w-7 h-7 flex items-center justify-center text-charcoal hover:bg-beige/50 transition-colors"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-8 text-center text-xs font-medium text-charcoal">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1
                                  )
                                }
                                disabled={
                                  item.quantity >= item.product.stock_quantity
                                }
                                className="w-7 h-7 flex items-center justify-center text-charcoal hover:bg-beige/50 transition-colors disabled:opacity-30"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            {/* Price */}
                            <p className="text-sm font-medium text-charcoal">
                              {formatPrice(
                                item.product.sale_price * item.quantity
                              )}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-beige p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal/60">Subtotal</span>
                    <span className="text-charcoal">{formatPrice(subtotal())}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-charcoal/60">Shipping</span>
                    <span className="text-charcoal">
                      {shipping() === 0 ? (
                        <span className="text-sage-700 text-xs font-medium">
                          FREE
                        </span>
                      ) : (
                        formatPrice(shipping())
                      )}
                    </span>
                  </div>
                  {shipping() > 0 && (
                    <p className="text-xs text-charcoal/40">
                      Add {formatPrice(999 - subtotal())} more for free shipping
                    </p>
                  )}
                  <div className="flex items-center justify-between font-medium border-t border-beige pt-3">
                    <span className="font-serif text-charcoal">Total</span>
                    <span className="text-charcoal">{formatPrice(total())}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="btn-primary w-full text-center block"
                >
                  Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="block text-center text-xs text-charcoal/50 hover:text-charcoal transition-colors tracking-wider uppercase"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
