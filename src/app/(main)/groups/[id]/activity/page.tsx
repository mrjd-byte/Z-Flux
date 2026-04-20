"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Loader2, ArrowLeft, History, Plus, TrendingDown } from "lucide-react";
import Link from "next/link";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";

type Activity = {
  type: string;
  email: string;
  amount: number;
  title?: string;
  createdAt: string;
};

export default function GroupActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActivity(data.activity || []);
      }
    } catch (error) {
      console.error("Fetch activity error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getActivityMessage = (item: Activity) => {
    const name = item.email.split("@")[0];
    if (item.type === "CONTRIBUTION") {
      return (
        <p className="text-zinc-100 text-sm font-medium">
          <span className="text-indigo-400 font-bold">{name}</span> added ₹{item.amount.toFixed(2)} to the repository
        </p>
      );
    } else {
      return (
        <p className="text-zinc-100 text-sm font-medium">
          <span className="text-indigo-400 font-bold text-base">{name}</span> extracted ₹{item.amount.toFixed(2)} for <span className="text-white italic">{item.title}</span>
        </p>
      );
    }
  };

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
        title="Financial Chronicle"
        subtitle="Operation history and liquidity flow logs"
      >
        <GlassCard className="p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <div className="p-0 min-h-[600px] overflow-y-auto max-h-[80vh] custom-scrollbar">
            {activity.length > 0 ? (
              <div className="divide-y divide-white/5">
                {activity.map((item, idx) => (
                  <div key={idx} className="p-8 hover:bg-white/5 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border border-white/10 ${item.type === "CONTRIBUTION" ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'}`}>
                        {item.type === "CONTRIBUTION" ? <Plus className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        {getActivityMessage(item)}
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest opacity-60">
                          {new Date(item.createdAt).toLocaleDateString()} · {new Date(item.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold tracking-tighter tabular-nums ${item.type === "CONTRIBUTION" ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.type === "CONTRIBUTION" ? '+' : '-'}₹{item.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-32 text-center opacity-30">
                <p className="text-white text-lg font-bold italic">No operations recorded yet.</p>
              </div>
            )}
          </div>
        </GlassCard>
      </SectionContainer>
    </div>
  );
}
