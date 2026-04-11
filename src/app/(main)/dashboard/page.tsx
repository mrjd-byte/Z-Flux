"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet, DollarSign, TrendingDown, PiggyBank, ArrowDownRight, ArrowUpRight, Sparkles, X } from "lucide-react";
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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [showInsightsPopup, setShowInsightsPopup] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
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
           setInsights((insightData.insights || []).slice(0, 2));
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

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
      <h1 className="text-2xl font-bold dark:text-white">Overview</h1>
      
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:scale-[1.01] transition-all duration-200 ease-in-out">
          <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Wallet Balance</h3>
            <p className="text-2xl font-semibold mt-1 dark:text-white">${data.walletBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:scale-[1.01] transition-all duration-200 ease-in-out">
          <div className="p-3 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Monthly Income</h3>
            <p className="text-2xl font-semibold mt-1 dark:text-white">${data.monthlyIncome.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:scale-[1.01] transition-all duration-200 ease-in-out">
          <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Total Expenses</h3>
            <p className="text-2xl font-semibold mt-1 dark:text-white">${data.totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:scale-[1.01] transition-all duration-200 ease-in-out">
          <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-xl">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Remaining</h3>
            <p className="text-2xl font-semibold mt-1 dark:text-white">${data.remainingBudget.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-[1.01] transition-all duration-200 ease-in-out">
          <h3 className="text-gray-900 dark:text-white font-medium mb-6">Expense Trend</h3>
          <div className="h-[250px]">
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

        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-[1.01] transition-all duration-200 ease-in-out">
          <h3 className="text-gray-900 dark:text-white font-medium mb-6">Category Breakdown</h3>
          <div className="h-[250px]">
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
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-[1.01] transition-all duration-200 ease-in-out">
        <h3 className="text-gray-900 dark:text-white font-medium mb-6">Recent Transactions</h3>
        {data.recentTransactions.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.recentTransactions.map((tx) => {
              const isCredit = tx.type === "CREDIT" || tx.type === "INCOME";
              return (
                <div key={tx.id} className="py-4 px-2 -mx-2 first:pt-0 last:pb-0 flex items-center justify-between rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 ease-in-out">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-full ${isCredit ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {isCredit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 dark:text-white">{tx.category || "General"}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold text-sm ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-sm italic">No recent transactions to display.</div>
        )}
      </div>

      {/* Floating AI Insights Popup */}
      {showInsightsPopup && insights.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 w-80 bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-blue-500" />
              AI Advisor
            </h3>
            <button 
              onClick={() => setShowInsightsPopup(false)} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            >
              <X className="w-4 h-4"/>
            </button>
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <p key={idx} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-l-2 border-blue-500 pl-3">
                {insight}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
