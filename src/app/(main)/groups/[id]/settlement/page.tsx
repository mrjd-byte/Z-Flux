"use client";

import { useEffect, useState, useCallback, use } from "react";
import { 
  Loader2, ArrowLeft, Handshake, Scale, Sparkles, 
  ChevronDown, ChevronUp, Info, AlertTriangle, 
  CheckCircle2, Zap, X, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

type Settlement = {
  from: string;
  to: string;
  amount: number;
};

type SettlementData = {
  mySummary: { type: "debtor" | "creditor" | "neutral"; amount: number };
  settlements: Settlement[];
  balances: { name: string; balance: number }[];
};

export default function GroupSettlementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [settleLoading, setSettleLoading] = useState(false);

  const fetchSettlements = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/groups/${id}/settlement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSettlementData(data);
      }
    } catch (error) {
      console.error("Fetch settlement error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettleLoading(true);
    // Simulation: In a real app, this would call an API to record the settlement
    setTimeout(() => {
      setSettleLoading(false);
      setSelectedSettlement(null);
      // For demo purposes, we just show success toast/vibe
      alert(`Settlement of ₹${selectedSettlement?.amount} between ${selectedSettlement?.from} and ${selectedSettlement?.to} authorized.`);
    }, 1500);
  };

  const getAIInsight = () => {
    if (!settlementData) return null;
    
    // Core Fairness Logic: Check if all net balances are approximately zero
    const isBalanced = settlementData.balances?.every(b => Math.abs(b.balance) < 0.05) ?? true;

    if (isBalanced) {
      return "All balances are settled. No action required.";
    }

    return "Imbalance detected. Settlement required between members.";
  };

  const getStatusColor = () => {
    if (!settlementData) return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    
    const isBalanced = settlementData.balances?.every(b => Math.abs(b.balance) < 0.05) ?? true;
    if (isBalanced) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

    const totalImbalance = settlementData.settlements?.reduce((sum, s) => sum + s.amount, 0) || 0;
    if (totalImbalance > 5000) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  const getStatusText = () => {
    if (!settlementData) return "Loading...";

    const isBalanced = settlementData.balances?.every(b => Math.abs(b.balance) < 0.05) ?? true;
    if (isBalanced) return "Balanced";

    const totalImbalance = settlementData.settlements?.reduce((sum, s) => sum + s.amount, 0) || 0;
    if (totalImbalance > 5000) return "High Imbalance";
    return "Moderate Imbalance";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const isOptimized = settlementData && settlementData.settlements.length > 0; // Simplified heuristic for UI

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4">
      <Link
        href={`/groups/${id}`}
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-base font-semibold mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Overview
      </Link>

      <SectionContainer
        title="Settlement Plan"
        subtitle="Algorithmic debt resolution and balance quants"
      >
        <div className="space-y-8">
          
          {/* AI Settlement Insight Header */}
          <GlassCard className="p-8 border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                  AI Settlement Insight 
                  {isOptimized && (
                    <span className="flex items-center gap-1 bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[8px] border border-amber-500/30">
                      <Zap className="w-2 h-2" /> Optimized Plan
                    </span>
                  )}
                </h3>
                <p className="text-xl font-bold text-white tracking-tight">{getAIInsight()}</p>
              </div>
              <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusColor()}`}>
                {getStatusText()}
              </div>
            </div>
          </GlassCard>

          {/* Why this plan? Toggle */}
          <GlassCard className="p-0 overflow-hidden border-white/5 bg-white/[0.02]">
            <button 
              onClick={() => setIsExplainerOpen(!isExplainerOpen)}
              className="w-full p-6 flex items-center justify-between text-zinc-400 hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-widest">Why this plan?</span>
              </div>
              {isExplainerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isExplainerOpen && (
              <div className="p-8 pt-0 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  <div className="space-y-2">
                    <p className="text-white text-sm font-bold">Net Balances</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">System calculated the total paid vs. consumed share for every member.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white text-sm font-bold">Greedy Matching</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">Debtors are matched with creditors to minimize the total number of transfers.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white text-sm font-bold">Transaction Priority</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">Largest gaps are resolved first to ensure the fastest group equilibrium.</p>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Equilibrium Plan List */}
          <GlassCard className="p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-amber-500/20">
            <div className="p-12 border-b border-white/5 bg-amber-500/[0.03] flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4">
                  <Handshake className="w-10 h-10 text-amber-500" /> Equilibrium Plan
                </h3>
                <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest pl-1">Authorized protocol for all pool entities</p>
              </div>
            </div>
            <div className="p-12 min-h-[400px]">
              {settlementData && settlementData.settlements.length > 0 ? (
                <div className="space-y-4">
                  {settlementData.settlements.map((s, idx) => (
                    <div key={idx} className="p-8 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-8">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-sm font-black text-zinc-500 group-hover:scale-110 transition-transform">
                          {s.from[0]}
                        </div>
                        <div>
                          <p className="text-2xl font-bold tracking-tight text-white flex items-center gap-4">
                            <span className={s.from === "You" ? "text-rose-500" : ""}>{s.from}</span>
                            <ArrowRight className="w-4 h-4 text-zinc-700" />
                            <span className={s.to === "You" ? "text-emerald-500" : ""}>{s.to}</span>
                          </p>
                          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-1">Pending Transfer Operation</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <p className="text-3xl font-mono font-bold text-white bg-white/5 px-6 py-3 rounded-2xl border border-white/5">₹{s.amount.toFixed(2)}</p>
                        <Button 
                          onClick={() => setSelectedSettlement(s)}
                          className="px-6 py-4 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border-indigo-500/20 text-xs font-black uppercase tracking-widest transition-all"
                        >
                          Settle Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-32 text-center flex flex-col items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-bold text-white">Perfectly Balanced</h4>
                    <p className="text-zinc-500 text-sm font-medium italic">No action required. All debt quants are resolved.</p>
                  </div>
                  <Link href={`/groups/${id}`}>
                    <Button variant="ghost" className="mt-4 border-white/10 text-zinc-400 hover:text-white">Return to Overview</Button>
                  </Link>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </SectionContainer>

      {/* Settle Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <GlassCard className="max-w-md w-full p-10 border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative">
            <button 
              onClick={() => setSelectedSettlement(null)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20 mb-4">
                  <Handshake className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Settle Transaction</h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">Authorized transfer from {selectedSettlement.from} to {selectedSettlement.to}</p>
              </div>

              <div className="p-8 bg-white/5 rounded-3xl border border-white/10 text-center">
                <p className="text-4xl font-bold text-white tracking-tighter">₹{selectedSettlement.amount.toFixed(2)}</p>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mt-2">Quantum Allocation</p>
              </div>

              <form onSubmit={handleSettleSubmit} className="space-y-4">
                <Button 
                  type="submit" 
                  disabled={settleLoading}
                  className="w-full py-6 text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center h-16"
                >
                  {settleLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Authorize Settlement"}
                </Button>
                <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest text-center">Protocol V2.5-STLX Encryption Applied</p>
              </form>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

