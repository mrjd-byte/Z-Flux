"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Loader2, ArrowLeft, IndianRupee } from "lucide-react";
import Link from "next/link";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";

type Contribution = { id: string; userId: string; email: string; amount: number; createdAt: string };
type Expense = { id: string; title: string; amount: number; email: string; createdAt: string };

export default function GroupLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setContributions(data.contributions || []);
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error("Fetch ledger error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

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
        title="Financial Ledger"
        subtitle="Detailed analysis of system inflows and outflows"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard className="p-0 flex flex-col h-[700px] overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-emerald-500/[0.03] flex items-center justify-between">
              <h4 className="text-base font-black text-emerald-400 uppercase tracking-[0.3em]">System Inflow</h4>
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              {contributions.length > 0 ? (
                contributions.map((c) => (
                  <div key={c.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-emerald-500/10 transition-colors">
                    <div>
                      <p className="text-base font-bold text-white tracking-wide">{c.email.split("@")[0]}</p>
                      <p className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.2em] mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-lg font-mono font-bold text-emerald-400">+₹{c.amount.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center opacity-20">No Inflow Data</div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-0 flex flex-col h-[700px] overflow-hidden">
            <div className="p-8 border-b border-white/5 bg-rose-500/[0.03] flex items-center justify-between">
              <h4 className="text-base font-black text-rose-400 uppercase tracking-[0.3em]">System Outflow</h4>
              <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              {expenses.length > 0 ? (
                expenses.map((e) => (
                  <div key={e.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-rose-500/10 transition-colors">
                    <div>
                      <p className="text-base font-bold text-white tracking-wide">{e.title}</p>
                      <p className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.2em] mt-1">Source: {e.email.split("@")[0]}</p>
                    </div>
                    <p className="text-lg font-mono font-bold text-rose-400">-₹{e.amount.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center opacity-20">No Outflow Data</div>
              )}
            </div>
          </GlassCard>
        </div>
      </SectionContainer>
    </div>
  );
}
