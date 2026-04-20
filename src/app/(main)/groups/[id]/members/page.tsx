"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Loader2, ArrowLeft, Users, UserPlus } from "lucide-react";
import Link from "next/link";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

type Member = { id: string; userId: string; email: string };
type Settlement = { userId: string; email: string; paid: number; owes: number };

export default function GroupMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [members, setMembers] = useState<Member[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
        setSettlements(data.settlements || []);
      }
    } catch (error) {
      console.error("Fetch members error:", error);
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
        title="Participating Circle"
        subtitle="Full entity directory and share distributions"
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settlements.map((s) => (
              <GlassCard key={s.userId} className="p-6 transition-all border-white/5 bg-white/5 hover:border-indigo-500/30">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-white truncate uppercase tracking-widest">{s.email.split("@")[0]}</span>
                  <div className={`w-2 h-2 rounded-full ${s.owes > 0 ? "bg-rose-500" : s.owes < 0 ? "bg-emerald-500" : "bg-zinc-500"}`} />
                </div>
                <div className="flex items-end justify-between font-mono">
                  <div>
                    <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] mb-1">Paid</p>
                    <p className="text-lg font-bold text-white">₹{s.paid}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] mb-1">{s.owes > 0 ? "Debt" : "Credit"}</p>
                    <p className={`text-lg font-bold tracking-wide ${s.owes > 0 ? "text-rose-400" : s.owes < 0 ? "text-emerald-400" : "text-zinc-400"}`}>
                      ₹{Math.abs(s.owes)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="p-8 space-y-4">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Member Entities</h3>
            <div className="flex flex-wrap gap-4">
              {members.map((m) => (
                <div key={m.id} className="px-5 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400">{m.email[0].toUpperCase()}</div>
                  <span className="text-sm text-white font-bold tracking-wide">{m.email}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </SectionContainer>
    </div>
  );
}
