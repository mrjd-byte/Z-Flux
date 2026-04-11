"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Wallet, DollarSign, TrendingDown, PiggyBank, ArrowDownRight, ArrowUpRight, Sparkles, X, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type DashboardData = {
  walletBalance: number;
  monthlyIncome: number;
  totalExpenses: number;
  remainingBudget: number;
  categoryBreakdown: { name: string; value: number }[];
  expenseTrend: { date: string; amount: number }[];
  recentTransactions: any[];
};

type InsightData = {
  message: string;
  type: "danger" | "warning" | "good";
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) setData(result);

      // Fetch companion AI Insights
      const insightRes = await fetch("/api/ai/insights", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (insightRes.ok) {
         const insightData = await insightRes.json();
         setInsights((insightData.insights || []).slice(0, 3));
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-gray-500 dark:text-gray-400">Failed to load dashboard data.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>

      {/* AI Insights Section */}
      {insights.length > 0 && (
        <div className="space-y-4 mb-4">
          <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> 
            AI Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, idx) => {
              let colors = "";
              let Icon = Sparkles;
              if (insight.type === "danger") {
                colors = "bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                Icon = AlertCircle;
              } else if (insight.type === "warning") {
                colors = "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
                Icon = AlertTriangle;
              } else {
                colors = "bg-green-500/10 border-green-500/20 text-green-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                Icon = CheckCircle2;
              }
              
              return (
                <div key={idx} className={`p-4 rounded-xl border ${colors} flex gap-3 hover:scale-[1.02] transition-all duration-200 items-start backdrop-blur-sm`}>
                  <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-90" />
                  <p className="text-sm font-medium text-white/90 leading-relaxed">{insight.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 group before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all">
            <Wallet className="w-6 h-6 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Wallet Balance</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">${data.walletBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 group before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-green-500/20 group-hover:bg-green-500/20 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">
            <DollarSign className="w-6 h-6 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Monthly Income</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">${data.monthlyIncome.toFixed(2)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 group before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20 group-hover:bg-red-500/20 group-hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all">
            <TrendingDown className="w-6 h-6 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Total Expenses</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">${data.totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 group before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20 group-hover:bg-purple-500/20 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all">
            <PiggyBank className="w-6 h-6 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Remaining</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">${data.remainingBudget.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
          <h3 className="text-lg font-semibold text-white mb-6 tracking-tight relative z-10">Expense Trend</h3>
          <div className="h-[250px] relative z-10">
            {data.expenseTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.expenseTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Expense']}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No trend data available</div>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
          <h3 className="text-lg font-semibold text-white mb-6 tracking-tight relative z-10">Category Breakdown</h3>
          <div className="h-[250px] relative z-10">
             {data.categoryBreakdown.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">No expenses to breakdown</div>
             )}
          </div>
          {/* Custom Legend */}
          {data.categoryBreakdown.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {data.categoryBreakdown.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
        <h3 className="text-lg font-semibold text-white mb-6 tracking-tight relative z-10">Recent Transactions</h3>
        {data.recentTransactions.length > 0 ? (
          <div className="divide-y divide-white/10 relative z-10">
            {data.recentTransactions.map((tx) => {
              const isCredit = tx.type === "CREDIT" || tx.type === "INCOME";
              return (
                <div key={tx.id} className="py-4 px-2 -mx-2 first:pt-0 last:pb-0 flex items-center justify-between rounded-lg hover:bg-white/5 transition-all duration-200 ease-in-out">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-full ring-1 shadow-[0_0_15px_rgba(0,0,0,0.1)] ${isCredit ? 'bg-green-500/10 text-green-400 ring-green-500/20' : 'bg-red-500/10 text-red-400 ring-red-500/20'}`}>
                      {isCredit ? <ArrowDownRight className="w-4 h-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> : <ArrowUpRight className="w-4 h-4 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-white tracking-wide">{tx.category || "General"}</h4>
                      <p className="text-xs text-white/50">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold text-sm tracking-tight ${isCredit ? 'text-green-400' : 'text-white'}`}>
                    {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-white/50 text-sm italic relative z-10">No recent transactions to display.</div>
        )}
      </div>

    </div>
  );
}
