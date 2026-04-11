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
        <h1 className="text-2xl font-bold dark:text-white">Budget Categories</h1>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ease-in-out"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Budget</span>
        </button>
      </div>
      
      {/* Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:scale-[1.01] transition-all duration-200 ease-in-out">
          <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Total Allocated Limit</h3>
            <p className="text-2xl font-semibold mt-1 dark:text-white">${totalLimit.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:scale-[1.01] transition-all duration-200 ease-in-out">
          <div className="p-3 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Total Spent (Allocated)</h3>
            <p className="text-2xl font-semibold mt-1 dark:text-white">${totalSpent.toFixed(2)}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:scale-[1.01] transition-all duration-200 ease-in-out">
          <div className="p-3 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider">Days Remaining</h3>
            <p className="text-2xl font-semibold mt-1 dark:text-white">{daysLeft} Days</p>
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
                <div key={b.id} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:scale-[1.01] transition-all duration-200 ease-in-out hover:border-white/10">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg dark:text-white">{b.category}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${isOver ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {b.percentage}% Used
                      </span>
                    </div>

                    <div className="flex justify-between text-sm mb-2">
                       <span className="text-gray-500 dark:text-gray-400">Spent: <strong className="text-gray-900 dark:text-white">${b.spent.toFixed(2)}</strong></span>
                       <span className="text-gray-500 dark:text-gray-400">Limit: <strong className="text-gray-900 dark:text-white">${b.limit.toFixed(2)}</strong></span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${barColor}`} 
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2 border-t pt-4 border-gray-100 dark:border-gray-700">
                     <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl text-center transition-all duration-200 hover:dark:bg-white/10">
                        <span className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Remaining</span>
                        <span className={`font-semibold ${b.remaining < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                          ${b.remaining.toFixed(2)}
                        </span>
                     </div>
                     <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl text-center transition-all duration-200 hover:dark:bg-white/10">
                        <span className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Daily Safe to Spend</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold dark:text-white">Set Budget Limit</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBudget} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-white/5 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Monthly Limit ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-white/5 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                  placeholder="500.00"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white rounded-md py-2 mt-2 hover:bg-blue-500/90 dark:hover:bg-blue-500/80 transition-all duration-200 ease-in-out disabled:opacity-50 flex justify-center items-center h-10"
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
