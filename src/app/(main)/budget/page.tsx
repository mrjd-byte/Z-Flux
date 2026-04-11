"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2, Target, CalendarDays, TrendingUp } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Budget Categories</h1>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ease-in-out font-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Budget</span>
        </button>
      </div>
      
      {/* Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 group before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all">
            <Target className="w-6 h-6 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>
          <div className="relative z-10">
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Total Allocated Limit</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">${totalLimit.toFixed(2)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 group before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">
            <TrendingUp className="w-6 h-6 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          <div className="relative z-10">
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Total Spent (Allocated)</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">${totalSpent.toFixed(2)}</p>
          </div>
        </div>

        <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 hover:scale-[1.01] transition-all duration-300 group before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
          <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/20 group-hover:bg-orange-500/20 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all">
            <CalendarDays className="w-6 h-6 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          </div>
          <div className="relative z-10">
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Days Remaining</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">{daysLeft} Days</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
               You haven't set up any strict categorization budgets yet. Click Add Budget above to get started.
            </div>
          ) : (
            budgets.map((b) => {
              const isOver = b.percentage > 100;
              const barColor = isOver ? 'bg-red-500' : b.percentage > 85 ? 'bg-orange-500' : 'bg-blue-500';
              
              return (
                <div key={b.id} className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none group">
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white tracking-tight">{b.category}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ring-1 ${isOver ? 'bg-red-500/10 text-red-400 ring-red-500/20' : 'bg-white/10 text-white/70 ring-white/20'}`}>
                        {b.percentage}% Used
                      </span>
                    </div>

                    <div className="flex justify-between text-sm mb-2">
                       <span className="text-white/60">Spent: <strong className="text-white">${b.spent.toFixed(2)}</strong></span>
                       <span className="text-white/60">Limit: <strong className="text-white">${b.limit.toFixed(2)}</strong></span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="w-full bg-white/10 rounded-full h-3 mb-4 overflow-hidden ring-1 ring-white/5">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : b.percentage > 85 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'}`} 
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2 border-t pt-4 border-white/10 relative z-10">
                     <div className="bg-white/5 p-3 rounded-xl text-center transition-all duration-200 group-hover:bg-white/10 ring-1 ring-white/5">
                        <span className="block text-xs uppercase tracking-wider text-white/50 mb-1">Remaining</span>
                        <span className={`font-bold tracking-tight ${b.remaining < 0 ? 'text-red-400' : 'text-white'}`}>
                          ${b.remaining.toFixed(2)}
                        </span>
                     </div>
                     <div className="bg-white/5 p-3 rounded-xl text-center transition-all duration-200 group-hover:bg-white/10 ring-1 ring-white/5">
                        <span className="block text-xs uppercase tracking-wider text-white/50 mb-1">Daily Safe to Spend</span>
                        <span className="font-bold tracking-tight text-white">
                          ${b.dailyAllowance.toFixed(2)}
                        </span>
                     </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="font-semibold text-white tracking-tight">Set Budget Limit</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBudget} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/70">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl bg-black/20 backdrop-blur-md border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200"
                >
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/70">Monthly Limit ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl bg-black/20 backdrop-blur-md border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 placeholder:text-white/30"
                  placeholder="500.00"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 text-white rounded-xl py-2.5 mt-2 transition-all duration-300 ease-in-out disabled:opacity-50 flex justify-center items-center h-11 font-medium"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Target"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
