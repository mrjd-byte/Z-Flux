"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [generateSampleData, setGenerateSampleData] = useState(false);

  const [budgets, setBudgets] = useState({
    Food: 0,
    Travel: 0,
    Shopping: 0,
    Bills: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Basic guard
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleBudgetChange = (category: string, value: string) => {
    setBudgets((prev: any) => ({
      ...prev,
      [category]: Number(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    const formattedBudgets = Object.keys(budgets).map(key => ({
      category: key,
      amount: (budgets as any)[key]
    }));

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          monthlyIncome,
          budgets: formattedBudgets,
          generateSampleData
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to onboard.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white selection:bg-indigo-500/30 p-6 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="fixed inset-0 min-h-screen z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      <GlassCard className="max-w-md w-full p-8 md:p-12 relative z-10 group rounded-[2.5rem]">
        {/* Subtle Brand Accent Glow */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-500">
            <span className="text-white font-black text-xl">Z</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2 text-center">Initialize Vault</h2>
          <p className="text-zinc-500 font-medium tracking-wide text-center text-base">Configure your starting parameters</p>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Input
            label="Monthly Inflow Base (₹)"
            type="number"
            min="0"
            value={monthlyIncome || ""}
            onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            required
            placeholder="0"
          />

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Target Allocations</h3>
            <div className="space-y-3">
              {Object.keys(budgets).map((category) => (
                <div key={category} className="flex items-center justify-between gap-6">
                  <span className="text-base font-bold text-zinc-400 w-1/3">{category}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={(budgets as any)[category] || ""}
                    onChange={(e) => handleBudgetChange(category, e.target.value)}
                    className="w-2/3 px-4 py-2 border border-white/10 rounded-xl bg-white/5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium text-right shadow-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => setGenerateSampleData(!generateSampleData)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all mr-3 ${generateSampleData ? "bg-indigo-500 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-transparent border-white/20 group-hover:border-indigo-400"}`}>
              {generateSampleData && <div className="w-2 h-2 bg-white rounded-sm" />}
            </div>
            <label className="text-base font-medium text-zinc-300 cursor-pointer">
              Provision Sample Datasets
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] h-16 mt-6"
            variant="primary"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "Finalize Configuration"
            )}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
