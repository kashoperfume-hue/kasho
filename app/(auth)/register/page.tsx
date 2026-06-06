"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error("Passwords match nahi kar rahe");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password kam se kam 6 characters ka hona chahiye");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      setLoading(false);
      toast.error(result.error || "Registration fail hui. Dobara try karein.");
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (signInError) {
      toast.success("Account ban gaya! Ab login karein.");
      router.push("/login");
    } else {
      toast.success("Welcome to Kasho! Account ready hai.");
      router.push("/account");
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border border-beige bg-cream p-8 lg:p-12"
      >
        <p className="section-label mb-4">New Customer</p>
        <h1 className="font-serif text-3xl text-charcoal font-light mb-2">
          Create Account
        </h1>
        <p className="text-sm text-charcoal/50 mb-8">
          Apna account banayein aur shopping shuru karein
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-charcoal/30" />
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Full Name"
              className="input-luxury pl-7"
            />
          </div>

          <div className="relative">
            <Mail size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-charcoal/30" />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email Address"
              className="input-luxury pl-7"
            />
          </div>

          <div className="relative">
            <Phone size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-charcoal/30" />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Phone Number (optional)"
              className="input-luxury pl-7"
            />
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-charcoal/30" />
            <input
              type={showPass ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Password (min 6 characters)"
              className="input-luxury pl-7 pr-8"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal transition-colors"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="relative">
            <Lock size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-charcoal/30" />
            <input
              type={showPass ? "text" : "password"}
              required
              value={form.confirm_password}
              onChange={(e) => setForm((p) => ({ ...p, confirm_password: e.target.value }))}
              placeholder="Confirm Password"
              className="input-luxury pl-7"
            />
          </div>

          <p className="text-[10px] text-charcoal/40 leading-relaxed">
            Account banake aap Kasho ki{" "}
            <Link href="/terms" className="underline">Terms</Link> aur{" "}
            <Link href="/privacy" className="underline">Privacy Policy</Link>{" "}
            se agree karte hain.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-charcoal/40 mt-8">
          Pehle se account hai?{" "}
          <Link href="/login" className="text-charcoal hover:text-gold transition-colors underline">
            Sign in karein
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
