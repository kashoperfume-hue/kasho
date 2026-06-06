"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, Loader2, AlertCircle, Copy, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [sqlHint, setSqlHint] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const copySql = () => {
    navigator.clipboard.writeText(sqlHint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSqlHint("");

    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, password: form.password }),
    });

    const result = await res.json();

    if (!res.ok) {
      setLoading(false);
      if (res.status === 403 && result.error?.includes("UPDATE")) {
        setSqlHint(`UPDATE public.users SET is_admin = TRUE WHERE email = '${form.email}';`);
        toast.error("Admin access nahi mila — neeche SQL copy karein");
      } else {
        toast.error(result.error || "Login fail hua");
      }
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setLoading(false);
      toast.error("Login fail hua. Dobara try karein.");
      return;
    }

    toast.success(`Welcome back, Admin ${result.name}!`);
    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-12">
        <span className="font-display text-3xl font-light tracking-[0.4em] text-cream uppercase hover:text-gold transition-colors">
          Kasho
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="border border-cream/10 bg-cream/5 backdrop-blur-sm p-10">
          <div className="flex items-center gap-3 mb-8">
            <Lock size={16} className="text-gold" />
            <div>
              <h1 className="font-serif text-xl text-cream font-light">Admin Access</h1>
              <p className="text-xs text-cream/30 mt-0.5">Restricted area</p>
            </div>
          </div>

          {errorParam === "unauthorized" && (
            <div className="flex items-center gap-2 bg-rose/10 border border-rose/20 text-rose/80 text-xs p-3 mb-6">
              <AlertCircle size={13} />
              Access denied — admin account nahi hai
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail size={13} className="absolute left-0 top-1/2 -translate-y-1/2 text-cream/20" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Admin email"
                className="w-full bg-transparent border-b border-cream/15 pl-6 py-2.5 text-cream placeholder-cream/20 focus:outline-none focus:border-gold text-sm transition-colors"
              />
            </div>
            <div className="relative">
              <Lock size={13} className="absolute left-0 top-1/2 -translate-y-1/2 text-cream/20" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Password"
                className="w-full bg-transparent border-b border-cream/15 pl-6 py-2.5 text-cream placeholder-cream/20 focus:outline-none focus:border-gold text-sm transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold text-ink text-xs font-medium tracking-widest uppercase hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : "Enter Dashboard"}
            </button>
          </form>

          <p className="text-center text-xs text-cream/20 mt-8">
            This area is restricted to authorized personnel only.
          </p>
        </div>

        {sqlHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-amber-900/30 border border-amber-500/30"
          >
            <p className="text-xs text-amber-300 mb-3 font-medium">
              ⚠️ Supabase SQL Editor mein yeh run karein:
            </p>
            <div className="flex items-start gap-2">
              <code className="text-xs text-amber-200/80 break-all flex-1 font-mono">
                {sqlHint}
              </code>
              <button
                onClick={copySql}
                className="flex-shrink-0 text-amber-400 hover:text-amber-200 transition-colors"
                title="Copy SQL"
              >
                {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <p className="text-[10px] text-amber-400/60 mt-3">
              Run karne ke baad dobara login karein
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
