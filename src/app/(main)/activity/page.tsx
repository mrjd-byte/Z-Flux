"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, IndianRupee, TrendingDown, Sparkles, Clock, Layout } from "lucide-react";

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
      case "FRIEND_ADDED": return <Users className="w-5 h-5 text-blue-400" />;
      case "CONTRIBUTION": return <IndianRupee className="w-5 h-5 text-green-400" />;
      case "EXPENSE": return <TrendingDown className="w-5 h-5 text-red-400" />;
      case "SCORE_UPDATE": return <Sparkles className="w-5 h-5 text-yellow-400" />;
      default: return <Clock className="w-5 h-5 text-white/40" />;
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
    <div className="space-y-8 pb-20 max-w-2xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tighter">Social Feed</h1>
        <p className="text-white/40 text-sm mt-1 font-medium tracking-widest uppercase italic border-l-2 border-blue-500/50 pl-3">
          See what your financial circle is up to
        </p>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((a, idx) => (
            <div 
              key={a.id} 
              className="group relative p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 shadow-xl overflow-hidden"
            >
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] group-hover:bg-blue-500/10 transition-all pointer-events-none" />
              
              <div className="flex gap-4 relative z-10">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    {getIcon(a.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-black text-white">{a.userName}</span>
                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {a.message}
                  </p>
                </div>
              </div>

              {/* Connecting line for timeline effect */}
              {idx < activities.length - 1 && (
                <div className="absolute left-[2.2rem] top-20 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
              )}
            </div>
          ))
        ) : (
          <div className="p-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Layout className="w-12 h-12 text-white/5 mx-auto mb-4" />
            <p className="text-white/20 text-sm italic">The feed is silent... Try inviting friends or joining a group!</p>
          </div>
        )}
      </div>
    </div>
  );
}
