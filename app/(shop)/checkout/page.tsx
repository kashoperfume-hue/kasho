"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CreditCard, CheckCircle, Loader2, Navigation, Package } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, getImageUrl, validatePincode } from "@/lib/utils";
import { createOrder, validateCoupon } from "@/lib/orders";
import type { CheckoutFormData, Address, Coupon } from "@/types";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import Link from "next/link";

type Step = "address" | "payment" | "review";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, subtotal, shipping, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("address");
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [upiSettings, setUpiSettings] = useState<{ upi_id: string; qr_url: string | null; instructions: string } | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  const [form, setForm] = useState<CheckoutFormData>({
    full_name: "", phone: "", email: user?.email || "",
    line1: "", line2: "", city: "", state: "", pincode: "",
    save_address: false, payment_method: "cod",
  });

  useEffect(() => {
    if (!user) router.push("/login?next=/checkout");
  }, [user, router]);

  useEffect(() => {
    // Load saved addresses
    const fetchAddresses = async () => {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
      setSavedAddresses((data as Address[]) || []);
      if (data?.length) {
        const defaultAddr = (data as Address[]).find((a) => a.is_default) || (data as Address[])[0];
        setSelectedAddressId(defaultAddr.id);
        fillFromAddress(defaultAddr);
      }
    };
    // Load UPI settings
    const fetchUpi = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("settings").select("value").eq("key", "upi").single();
      if (data?.value) setUpiSettings(data.value as typeof upiSettings);
    };
    fetchAddresses();
    fetchUpi();
  }, [user]);

  const fillFromAddress = (addr: Address) => {
    setForm((p) => ({ ...p, full_name: addr.full_name, phone: addr.phone, line1: addr.line1, line2: addr.line2 || "", city: addr.city, state: addr.state, pincode: addr.pincode }));
  };

  const handlePincodeBlur = async () => {
    if (!validatePincode(form.pincode)) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`/api/pincode?pincode=${form.pincode}`);
      const data = await res.json();
      if (data.city) setForm((p) => ({ ...p, city: data.city, state: data.state }));
    } catch {}
    setPincodeLoading(false);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      toast("Location detected. Please enter your pincode manually for accuracy.", { icon: "📍" });
    }, () => toast.error("Could not get location"));
  };

  const orderTotal = total() - discount;

  const handleSubmit = async () => {
    setLoading(true);
    const formData: CheckoutFormData = { ...form, coupon_code: coupon?.code };
    if (screenshotFile) formData.payment_screenshot = screenshotFile;

    const result = await createOrder(formData, items, coupon);
    setLoading(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    clearCart();
    router.push(`/order-success?order=${(result as { orderNumber: string }).orderNumber}`);
  };

  if (items.length === 0) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <Package size={48} className="text-beige" />
      <p className="font-serif text-xl text-charcoal/40">Your cart is empty</p>
      <Link href="/products" className="btn-outline text-xs">Continue Shopping</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-beige/30 border-b border-beige">
        <div className="page-container py-8">
          <p className="section-label mb-2">Secure</p>
          <h1 className="font-serif text-4xl text-charcoal font-light">Checkout</h1>
          {/* Steps */}
          <div className="flex items-center gap-4 mt-5">
            {(["address", "payment", "review"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 flex items-center justify-center text-xs font-medium transition-all ${step === s ? "bg-charcoal text-cream" : ["address", "payment"].indexOf(step) > i ? "bg-sage text-cream" : "bg-beige text-charcoal/40"}`}>
                  {["address", "payment"].indexOf(step) > i ? "✓" : i + 1}
                </div>
                <span className={`text-xs tracking-wider uppercase ${step === s ? "text-charcoal" : "text-charcoal/30"}`}>{s}</span>
                {i < 2 && <div className="w-10 h-px bg-beige" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {step === "address" && (
                <motion.div key="address" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="border border-beige bg-cream p-7">
                    <h2 className="font-serif text-xl text-charcoal font-light flex items-center gap-2 mb-6">
                      <MapPin size={16} className="text-gold" /> Shipping Address
                    </h2>

                    {savedAddresses.length > 0 && (
                      <div className="mb-6 space-y-2">
                        <p className="text-[10px] tracking-widest uppercase text-charcoal/50 mb-3">Saved Addresses</p>
                        {savedAddresses.map((addr) => (
                          <label key={addr.id} className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${selectedAddressId === addr.id ? "border-charcoal" : "border-beige hover:border-charcoal/30"}`}>
                            <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => { setSelectedAddressId(addr.id); fillFromAddress(addr); }} className="mt-0.5 accent-charcoal" />
                            <div>
                              <p className="font-medium text-sm text-charcoal">{addr.full_name}</p>
                              <p className="text-xs text-charcoal/50 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} {addr.pincode}</p>
                              <p className="text-xs text-charcoal/40">{addr.phone}</p>
                            </div>
                          </label>
                        ))}
                        <label className={`flex items-center gap-3 p-4 border cursor-pointer ${!selectedAddressId ? "border-charcoal" : "border-beige hover:border-charcoal/30"}`}>
                          <input type="radio" name="address" checked={!selectedAddressId} onChange={() => setSelectedAddressId(null)} className="accent-charcoal" />
                          <span className="text-sm text-charcoal/70">+ Use a new address</span>
                        </label>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-6">
                      {[
                        { label: "Full Name", key: "full_name", type: "text", col: "sm:col-span-2" },
                        { label: "Phone", key: "phone", type: "tel" },
                        { label: "Email", key: "email", type: "email" },
                        { label: "Address Line 1", key: "line1", type: "text", col: "sm:col-span-2" },
                        { label: "Address Line 2 (optional)", key: "line2", type: "text", col: "sm:col-span-2" },
                        { label: "Pincode", key: "pincode", type: "text" },
                        { label: "City", key: "city", type: "text" },
                        { label: "State", key: "state", type: "text" },
                      ].map((field) => (
                        <div key={field.key} className={field.col || ""}>
                          <label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">{field.label}</label>
                          <div className="relative">
                            <input
                              type={field.type}
                              value={(form as Record<string, unknown>)[field.key] as string}
                              onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                              onBlur={field.key === "pincode" ? handlePincodeBlur : undefined}
                              className="input-luxury"
                            />
                            {field.key === "pincode" && (
                              <button type="button" onClick={handleCurrentLocation} className="absolute right-0 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-gold transition-colors">
                                <Navigation size={13} />
                              </button>
                            )}
                            {field.key === "pincode" && pincodeLoading && (
                              <Loader2 size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gold animate-spin" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <label className="flex items-center gap-2 mt-6 cursor-pointer">
                      <input type="checkbox" checked={form.save_address} onChange={(e) => setForm((p) => ({ ...p, save_address: e.target.checked }))} className="accent-charcoal" />
                      <span className="text-xs text-charcoal/60">Save this address for future orders</span>
                    </label>

                    <button onClick={() => setStep("payment")} disabled={!form.full_name || !form.phone || !form.line1 || !form.city || !form.state || !form.pincode} className="btn-primary mt-8 disabled:opacity-40">
                      Continue to Payment →
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="border border-beige bg-cream p-7">
                    <h2 className="font-serif text-xl text-charcoal font-light flex items-center gap-2 mb-6">
                      <CreditCard size={16} className="text-gold" /> Payment Method
                    </h2>

                    <div className="space-y-3 mb-8">
                      {/* COD */}
                      <label className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${form.payment_method === "cod" ? "border-charcoal" : "border-beige hover:border-charcoal/30"}`}>
                        <input type="radio" name="payment" value="cod" checked={form.payment_method === "cod"} onChange={() => setForm((p) => ({ ...p, payment_method: "cod" }))} className="mt-0.5 accent-charcoal" />
                        <div>
                          <p className="font-medium text-sm text-charcoal">Cash on Delivery</p>
                          <p className="text-xs text-charcoal/50 mt-0.5">Pay in cash when your order arrives</p>
                        </div>
                      </label>

                      {/* UPI */}
                      <label className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${form.payment_method === "upi" ? "border-charcoal" : "border-beige hover:border-charcoal/30"}`}>
                        <input type="radio" name="payment" value="upi" checked={form.payment_method === "upi"} onChange={() => setForm((p) => ({ ...p, payment_method: "upi" }))} className="mt-0.5 accent-charcoal" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-charcoal">UPI Payment</p>
                          <p className="text-xs text-charcoal/50 mt-0.5">Pay via UPI — instant, secure</p>

                          <AnimatePresence>
                            {form.payment_method === "upi" && upiSettings && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-5 space-y-4">
                                <div className="bg-beige/30 p-4 space-y-3">
                                  <p className="text-xs text-charcoal/60">{upiSettings.instructions}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] tracking-wider uppercase text-charcoal/40">UPI ID:</span>
                                    <code className="text-sm font-mono font-medium text-charcoal">{upiSettings.upi_id}</code>
                                  </div>
                                  {upiSettings.qr_url && (
                                    <div className="relative w-32 h-32">
                                      <Image src={getImageUrl(upiSettings.qr_url)} alt="UPI QR Code" fill className="object-contain" sizes="128px" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Transaction Reference (optional)</label>
                                  <input value={form.upi_transaction_ref || ""} onChange={(e) => setForm((p) => ({ ...p, upi_transaction_ref: e.target.value }))} placeholder="UPI transaction ID" className="input-luxury" />
                                </div>
                                <div>
                                  <label className="text-[10px] tracking-widest uppercase text-charcoal/50 block mb-2">Upload Payment Screenshot *</label>
                                  <input type="file" accept="image/*" onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)} className="text-xs text-charcoal/60 file:mr-3 file:py-1.5 file:px-3 file:border file:border-beige file:text-xs file:text-charcoal file:bg-cream hover:file:bg-beige transition-colors cursor-pointer" />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep("address")} className="btn-outline text-xs">← Back</button>
                      <button onClick={() => setStep("review")} className="btn-primary">Review Order →</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "review" && (
                <motion.div key="review" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="border border-beige bg-cream p-7">
                    <h2 className="font-serif text-xl text-charcoal font-light flex items-center gap-2 mb-6">
                      <CheckCircle size={16} className="text-gold" /> Order Review
                    </h2>

                    <div className="space-y-4 mb-6">
                      {/* Address summary */}
                      <div className="bg-beige/30 p-4">
                        <p className="text-[10px] tracking-widest uppercase text-charcoal/50 mb-2">Delivery To</p>
                        <p className="text-sm text-charcoal font-medium">{form.full_name}</p>
                        <p className="text-xs text-charcoal/60">{form.line1}{form.line2 ? `, ${form.line2}` : ""}, {form.city}, {form.state} — {form.pincode}</p>
                        <p className="text-xs text-charcoal/60">{form.phone}</p>
                      </div>
                      {/* Payment summary */}
                      <div className="bg-beige/30 p-4">
                        <p className="text-[10px] tracking-widest uppercase text-charcoal/50 mb-2">Payment</p>
                        <p className="text-sm text-charcoal">{form.payment_method === "cod" ? "Cash on Delivery" : "UPI Payment"}</p>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="border border-beige divide-y divide-beige/60 mb-6">
                      {items.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-3 p-3">
                          <div className="relative w-12 h-14 bg-beige/40">
                            <Image src={getImageUrl(item.product.thumbnail)} alt={item.product.name} fill className="object-cover" sizes="48px" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-charcoal">{item.product.name}</p>
                            <p className="text-xs text-charcoal/40">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-charcoal">{formatPrice(item.product.sale_price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep("payment")} className="btn-outline text-xs">← Back</button>
                      <button onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Place Order · {formatPrice(orderTotal)}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="border border-beige bg-cream p-6 h-fit sticky top-24 space-y-4">
            <h3 className="font-serif text-lg text-charcoal font-light">Order Summary</h3>
            <div className="space-y-3 divide-y divide-beige/60">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 pt-3 first:pt-0">
                  <div className="relative w-10 h-12 bg-beige/40 flex-shrink-0">
                    <Image src={getImageUrl(item.product.thumbnail)} alt={item.product.name} fill className="object-cover" sizes="40px" />
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-charcoal text-cream text-[8px] flex items-center justify-center rounded-full">{item.quantity}</div>
                  </div>
                  <p className="flex-1 text-xs text-charcoal leading-tight">{item.product.name}</p>
                  <p className="text-xs font-medium">{formatPrice(item.product.sale_price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-beige pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-charcoal/60">Subtotal</span><span>{formatPrice(subtotal())}</span></div>
              <div className="flex justify-between text-sm"><span className="text-charcoal/60">Shipping</span><span>{shipping() === 0 ? <span className="text-sage-700 text-xs">FREE</span> : formatPrice(shipping())}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm text-sage-700"><span>Discount</span><span>-{formatPrice(discount)}</span></div>}
              <div className="flex justify-between font-medium border-t border-beige pt-2"><span className="font-serif">Total</span><span>{formatPrice(orderTotal)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
