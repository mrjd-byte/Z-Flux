"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, IndianRupee, TrendingDown, Sparkles, Clock } from "lucide-react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";

type Activity = {
  id: string;
  type: "FRIEND_ADDED" | "CONTRIBUTION" | "EXPENSE" | "SCORE_UPDATE";
  message: string;
  userName: string;
  createdAt: string;
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/activity", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error("Fetch activities error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "FRIEND_ADDED": return <Users className="w-5 h-5 text-indigo-400" />;
      case "CONTRIBUTION": return <IndianRupee className="w-5 h-5 text-emerald-400" />;
      case "EXPENSE": return <TrendingDown className="w-5 h-5 text-rose-400" />;
      case "SCORE_UPDATE": return <Sparkles className="w-5 h-5 text-amber-400" />;
      default: return <Clock className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getIconBg = (type: Activity["type"]) => {
    switch (type) {
      case "FRIEND_ADDED": return "bg-indigo-500/10 border-indigo-500/20";
      case "CONTRIBUTION": return "bg-emerald-500/10 border-emerald-500/20";
      case "EXPENSE": return "bg-rose-500/10 border-rose-500/20";
      case "SCORE_UPDATE": return "bg-amber-500/10 border-amber-500/20";
      default: return "bg-white/5 border-white/10";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <SectionContainer
      title="Social Activity"
      subtitle="Real-time pulse of your financial network"
      className="max-w-3xl mx-auto"
    >
      <div className="space-y-6 relative">
        {activities.length > 0 ? (
          activities.map((a, idx) => (
            <GlassCard
              key={a.id}
              className="group relative p-6"
              hoverEffect
            >
              <div className="flex gap-8 relative z-10">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${getIconBg(a.type)}`}>
                    {getIcon(a.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-white tracking-wide">{a.userName}</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-base leading-relaxed font-medium">
                    {a.message}
                  </p>
                </div>
              </div>

              {/* Connecting line for timeline effect */}
              {idx < activities.length - 1 && (
                <div className="absolute left-[3.25rem] top-[5.5rem] w-px h-[calc(1.5rem+4px)] bg-white/10 pointer-events-none" />
              )}
            </GlassCard>
          ))
        ) : (
          <GlassCard className="p-20 text-center border-dashed border-white/10 flex flex-col items-center">
            <Clock className="w-16 h-16 text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-base font-medium italic">The activity stream is clear. Broaden your circle or group up!</p>
          </GlassCard>
        )}
      </div>
    </SectionContainer>
  );
}
