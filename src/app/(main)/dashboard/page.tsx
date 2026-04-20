"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Loader2, Wallet, IndianRupee, TrendingDown, PiggyBank,
  ArrowDownRight, ArrowUpRight, Sparkles, X,
  AlertCircle, AlertTriangle, CheckCircle2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import FinancialHealthCard from "@/components/FinancialHealthCard";
import { useInsightToast } from "@/context/InsightToastContext";
import { InsightExplanationModal } from "@/components/InsightExplanationModal";
import { InsightExplanation, ScoreExplanation } from "@/lib/services/analytics";

import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";

type DashboardData = {
  walletBalance: number;
  monthlyIncome: number;
  totalExpenses: number;
  savings: number;
  categoryBreakdown: { name: string; value: number }[];
  expenseTrend: { date: string; amount: number }[];
  recentTransactions: any[];
  financialHealth: {
    score: number;
    label: string;
    aiSummary: string;
    vitalityMessage: string;
    scoreExplanation: ScoreExplanation;
    topCategory: string;
    prediction: string;
  };
  weeklySummary: {
    currentWeekExpenses: number;
    lastWeekExpenses: number;
    weeklyChange: number;
    topCategory: string;
  };
};

type InsightData = {
  message: string;
  type: "danger" | "warning" | "good";
  explanation?: InsightExplanation;
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInsightXaiOpen, setIsInsightXaiOpen] = useState(false);
  const [activeInsight, setActiveInsight] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { addInsight } = useInsightToast();

  const fetchDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) setData(result);

      // Fetch user profile for relative sign computation
      const userRes = await fetch("/api/user/profile", {
         headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (userData.id) setCurrentUserId(userData.id);

      // Fetch companion AI Insights
      const insightRes = await fetch("/api/ai/insights", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (insightRes.ok) {
        const insightData = await insightRes.json();
        const rawInsights = (insightData.insights || []).slice(0, 3);
        setInsights(rawInsights);

        // Add to global toast system
        rawInsights.forEach((ins: any) => {
          addInsight({
            message: ins.message,
            type: ins.type === "danger" ? "warning" : (ins.type === "good" ? "success" : "info"),
            priority: ins.type === "danger" ? "HIGH" : "MEDIUM"
          });
        });
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const handleDataUpdate = () => {
      fetchDashboard();
    };

    window.addEventListener("financial-data-updated", handleDataUpdate);
    return () => window.removeEventListener("financial-data-updated", handleDataUpdate);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-zinc-500">Failed to load dashboard data.</div>;
  }

  return (
    <SectionContainer
      title="Your Dashboard"
    >

      {/* Metrics Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Wallet Balance", value: data.walletBalance, icon: Wallet, color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Monthly Income", value: data.monthlyIncome, icon: IndianRupee, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total Expenses", value: data.totalExpenses, icon: TrendingDown, color: "text-rose-400", bg: "bg-rose-500/10" },
          { label: "Projected Savings", value: data.savings, icon: PiggyBank, color: "text-sky-400", bg: "bg-sky-500/10" }
        ].map((metric, idx) => (
          <GlassCard key={idx} hoverEffect>
            <div className={`w-12 h-12 rounded-2xl ${metric.bg}flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-white/5`}>
              <metric.icon className={`mt-3 ml-3 w-6 h-6 ${metric.color}`} />
            </div>
            <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mb-3">{metric.label}</h3>
            <p className="text-3xl font-bold text-white tracking-tighter tabular-nums">
              ₹{metric.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </GlassCard>
        ))}
      </div>

      {/* Analytics Section - Refactored to Glass Hub */}
      <div className="mt-12 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl">
        <div className="p-10 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white tracking-wide uppercase ">Financial Overview</h2>
        </div>
        <div className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

            {/* Trend Chart */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                <h3 className="text-lg font-black text-zinc-500 uppercase tracking-[0.2em]">Expense Flow</h3>
              </div>
              <div className="h-[300px] w-full">
                {data.expenseTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.expenseTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tick={{ dy: 10 }} />
                      <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `₹${v}`} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '1.5rem',
                          border: '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: '#0a0a0a',
                          backdropFilter: 'blur(16px)',
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: '700', color: '#818cf8' }}
                        labelStyle={{ fontSize: '10px', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }}
                        formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Value']}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#818cf8"
                        strokeWidth={4}
                        dot={false}
                        activeDot={{ r: 6, fill: '#818cf8', stroke: 'white', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600 text-xs font-bold uppercase tracking-widest italic bg-white/5 rounded-3xl">No signal data</div>
                )}
              </div>
            </div>

            {/* Category Pie */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-blue-500 rounded-full" />
                <h3 className="text-lg font-black text-zinc-500 uppercase tracking-[0.2em]">Spending Breakdown</h3>
              </div>
              <div className="h-[300px] w-full flex items-center justify-center">
                {data.categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={85}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.categoryBreakdown.map((entry: { name: string; value: number }, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '1.5rem',
                          border: '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: '#0a0a0a',
                          backdropFilter: 'blur(16px)'
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: '700' }}
                        formatter={(value: any) => `₹${Number(value).toFixed(2)}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-600 text-xs font-bold uppercase tracking-widest italic bg-white/5 rounded-3xl w-full">Empty Sector</div>
                )}
              </div>
              {/* Custom Legend */}
              <div className="flex flex-wrap justify-center gap-6 pt-4">
                {data.categoryBreakdown.map((entry: { name: string; value: number }, index: number) => (
                  <div key={entry.name} className="flex items-center gap-2 text-[10px] text-zinc-400 font-black uppercase tracking-[0.1em]">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Financial Health Integration */}
      {data.financialHealth && (
        <FinancialHealthCard data={data.financialHealth} />
      )}

      {/* Weekly Summary Strategy - New High-Level Focus */}
      <div className="mt-12">
        <GlassCard className="p-8 border-indigo-500/20 bg-indigo-500/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Weekly Chronicle</h2>
              </div>
              <p className="text-zinc-300 text-sm font-medium leading-relaxed max-w-xl">
                This week you spent <span className="text-white font-bold">₹{data.weeklySummary.currentWeekExpenses.toLocaleString()}</span>,
                mostly on <span className="text-indigo-400 font-bold capitalize">{data.weeklySummary.topCategory}</span>.
                Your spending is <span className={data.weeklySummary.weeklyChange > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {Math.abs(data.weeklySummary.weeklyChange).toFixed(0)}% {data.weeklySummary.weeklyChange > 0 ? "higher" : "lower"}
                </span> than last week.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-center min-w-[120px]">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Savings Rate</p>
                <p className="text-xl font-bold text-white">{((1 - (data.totalExpenses / (data.monthlyIncome || 1))) * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>












      {/* AI Insights Section - Redesigned like Homepage CTA */}
      {insights.length > 0 && (
        <div className="mt-12 relative overflow-hidden rounded-3xl p-10 md:p-12 bg-gradient-to-br from-indigo-900/40 via-[#0a0a0a] to-black border border-white/10 shadow-2xl">
          {/* Internal glowing blobs for premium feel */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">AI-Insights</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {insights.map((insight: InsightData, idx: number) => (
                <GlassCard key={idx} hoverEffect className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                      {insight.type === "danger" ? <AlertCircle className="w-5 h-5 text-rose-400" /> :
                        insight.type === "warning" ? <AlertTriangle className="w-5 h-5 text-amber-400" /> :
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${insight.type === "danger" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                            insight.type === "warning" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                              "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          }`}>AI Insight</span>
                        {insight.explanation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInsight(insight);
                              setIsInsightXaiOpen(true);
                            }}
                            className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/5 border border-white/10 rounded hover:text-indigo-400 hover:border-indigo-500/30 transition-all ml-2"
                          >
                            Why?
                          </button>
                        )}
                      </div>
                      <p className="text-sm font-bold text-zinc-200 leading-snug">{insight.message}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      )}

      <InsightExplanationModal
        isOpen={isInsightXaiOpen}
        onClose={() => setIsInsightXaiOpen(false)}
        explanation={activeInsight?.explanation}
      />





      {/* Activity Log - Refactored to Glass List */}
      <div className="mt-12 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden relative">
        <div className="p-10 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-lg font-bold text-white tracking-wide uppercase">Recent Transactions</h3>
          <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-500/20">
            Live Feed
          </span>
        </div>
        <div className="px-10 py-6">
          {data.recentTransactions.length > 0 ? (
            <div className="divide-y divide-white/5">
              {data.recentTransactions.map((tx: any) => {
                // Relative Sign Computation
                const isCredit = tx.receiverId 
                  ? (currentUserId === tx.receiverId) 
                  : (tx.type === "CREDIT" || tx.type === "INCOME" || tx.type === "TRANSFER_IN" || tx.type === "SALARY_TO_WALLET");
                
                return (
                  <div key={tx.id} className="py-6 flex items-center justify-between hover:bg-white/5 transition-all px-4 rounded-2xl -mx-4 group">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} group-hover:scale-110 border border-white/5`}>
                        {isCredit ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-white tracking-wide uppercase">{tx.category || "Network Operation"}</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`text-xl font-bold tracking-tight tabular-nums ${isCredit ? 'text-emerald-400' : 'text-white'}`}>
                      {isCredit ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-zinc-600 text-base font-bold uppercase tracking-[0.2em] italic">No detected transactions in this cycle.</div>
          )}
        </div>
      </div>
    </SectionContainer>
  );
}
