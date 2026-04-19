"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      localStorage.setItem("token", data.token);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white selection:bg-emerald-500/30 p-6 relative overflow-hidden">
      {/* Background glowing effects copied from homepage */}
      <div className="fixed inset-0 min-h-screen z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      <GlassCard className="max-w-md w-full p-12 relative z-10 group rounded-[2.5rem]">
        {/* Subtle Brand Accent Glow */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        <div className="flex flex-col items-center mb-12">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform duration-500">
            <span className="text-white font-black text-2xl">Z</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white mb-2">Join Z-Flux</h2>
          <p className="text-zinc-500 font-medium tracking-wide">Create your profile</p>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@gmail.com"
          />
          <Input
            label="Create a strong Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] h-16 mt-6"
            variant="success"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "SIGN UP"
            )}
          </Button>
        </form>

        <p className="mt-12 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
          Already have Account? <a href="/login" className="text-emerald-400 hover:text-white transition-colors underline underline-offset-4">Login</a>
        </p>
      </GlassCard>
    </div>
  );
}
