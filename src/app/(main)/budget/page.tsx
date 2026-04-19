"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2, Target, CalendarDays, TrendingUp } from "lucide-react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type BudgetData = {
  id: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  dailyAllowance: number;
};

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [daysLeft, setDaysLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal States
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "General", "Salary"]; // Reusing standard set

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/budget", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBudgets(data.budgets || []);
        setDaysLeft(data.daysLeft || 0);
      }
    } catch (error) {
      console.error("Failed to fetch budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ category, amount })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setAmount("");
        fetchBudgets(); // Refresh math
        window.dispatchEvent(new Event("financial-data-updated"));
      }
    } catch (error) {
      console.error("Failed to save budget:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalLimit = budgets.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + curr.spent, 0);
  const totalRemaining = totalLimit - totalSpent;
  const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  return (
    <SectionContainer
      title="Budget Categories"
      subtitle="Set limits and track your monthly spending"
    >
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 group"
          size="lg"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>Add Budget</span>
        </Button>
      </div>

      {/* Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex items-center gap-6 p-6 hoverEffect">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Limit</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">₹{totalLimit.toFixed(2)}</p>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-6 p-6 hoverEffect">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Spent</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">₹{totalSpent.toFixed(2)}</p>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-6 p-6 hoverEffect">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Days Remaining</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">{daysLeft} Days</p>
          </div>
        </GlassCard>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.length === 0 ? (
            <GlassCard className="col-span-full p-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5 mb-6">
                <Plus className="w-8 h-8 text-zinc-500" />
              </div>
              <p className="font-bold text-lg text-white">No budget targets set</p>
              <p className="text-base text-zinc-500 mt-2">Click Add Budget above to get started with categorization.</p>
            </GlassCard>
          ) : (
            budgets.map((b) => {
              const isOver = b.percentage > 100;
              const barColor = isOver ? 'bg-red-600' : b.percentage > 85 ? 'bg-amber-600' : 'bg-blue-600';

              return (
                <GlassCard key={b.id} className="flex flex-col justify-between" hoverEffect>
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold tracking-tight text-white uppercase">{b.category}</h3>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${isOver ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                        {b.percentage}% Used
                      </span>
                    </div>

                    <div className="flex justify-between text-xs mb-3 font-bold uppercase tracking-widest text-zinc-500">
                      <span>Spent: <strong className="text-white">₹{b.spent.toFixed(2)}</strong></span>
                      <span>Limit: <strong className="text-white">₹{b.limit.toFixed(2)}</strong></span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-black/40 rounded-full h-3 mb-8 overflow-hidden border border-white/5 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-2 border-t pt-6 border-white/5">
                    <div className="p-6 bg-white/5 rounded-2xl text-center border border-white/5">
                      <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-black">Remaining</span>
                      <span className={`text-xl font-bold tracking-tight ${b.remaining < 0 ? 'text-red-400' : 'text-white'}`}>
                        ₹{b.remaining.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl text-center border border-white/5">
                      <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-black">Safe to Spend / Day</span>
                      <span className="text-xl font-bold tracking-tight text-white">
                        ₹{b.dailyAllowance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              )
            })
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-center p-12 pb-8 relative z-10">
              <h3 className="text-3xl font-bold text-white tracking-tight">Set Budget Limit</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-12 pt-0 space-y-8 relative z-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block pl-1">Category</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-base font-bold appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block pl-1">Monthly Limit (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-0 py-4 bg-transparent border-b-2 border-white/10 focus:border-indigo-500 text-white focus:outline-none transition-all text-5xl font-bold tracking-tighter placeholder:text-white/5"
                  placeholder="500.00"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 font-black uppercase tracking-[0.2em] flex justify-center items-center h-16"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Target"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </SectionContainer>
  );
}
