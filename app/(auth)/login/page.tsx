"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Mode = "login" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (error.message.includes("Invalid login")) {
        toast.error("Email ya password galat hai");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Welcome back!");
    router.push(next);
    router.refresh();
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link aapki email pe bhej diya gaya hai");
    setMode("login");
  };

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border border-beige bg-cream p-8 lg:p-12"
      >
        {mode === "login" ? (
          <>
            <p className="section-label mb-4">Welcome Back</p>
            <h1 className="font-serif text-3xl text-charcoal font-light mb-2">
              Sign In
            </h1>
            <p className="text-sm text-charcoal/50 mb-8">
              Apna email aur password daaliyen
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <Mail size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-charcoal/30" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="input-luxury pl-7"
                />
              </div>

              <div className="relative">
                <Lock size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-charcoal/30" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-charcoal/40 hover:text-charcoal transition-colors"
                >
                  Password bhool gaye?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-charcoal/40 mt-8">
              New customer?{" "}
              <Link href="/register" className="text-charcoal hover:text-gold transition-colors underline">
                Account banayein
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="section-label mb-4">Password Reset</p>
            <h1 className="font-serif text-3xl text-charcoal font-light mb-2">
              Reset Password
            </h1>
            <p className="text-sm text-charcoal/50 mb-8">
              Apna email daaliyen — hum reset link bhejenge
            </p>

            <form onSubmit={handleForgot} className="space-y-6">
              <div className="relative">
                <Mail size={15} className="absolute left-0 top-1/2 -translate-y-1/2 text-charcoal/30" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="input-luxury pl-7"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : "Reset Link Bhejo"}
              </button>
            </form>

            <button
              onClick={() => setMode("login")}
              className="block text-center text-xs text-charcoal/40 hover:text-charcoal transition-colors mt-6 mx-auto"
            >
              ← Wapas Sign In pe jaao
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
