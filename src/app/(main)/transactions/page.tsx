"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, X, Loader2 } from "lucide-react";

type Transaction = {
  id: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  createdAt: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("EXPENSE"); // EXPENSE/DEBIT or INCOME/CREDIT
  const [category, setCategory] = useState("Food");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "General", "Salary"];

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      const mappedType = type === "EXPENSE" ? "DEBIT" : "CREDIT";

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ amount, type: mappedType, category })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setAmount("");
        fetchTransactions(); // Refetch latest immediately
        window.dispatchEvent(new Event("financial-data-updated"));
      }
    } catch (error) {
      console.error("Failed to add transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Transactions</h1>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ease-in-out font-medium"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Transaction</span>
        </button>
      </div>
      
      <div className="relative overflow-hidden bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] min-h-[400px] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
        {loading ? (
          <div className="flex items-center justify-center h-48 relative z-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/50 relative z-10">
            <p>No transactions found.</p>
            <p className="text-sm mt-1">Add your first transaction above.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10 relative z-10">
            {transactions.map((tx) => {
              const isCredit = tx.type === "CREDIT" || tx.type === "INCOME";
              return (
                <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-all duration-200 ease-in-out">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ring-1 shadow-[0_0_15px_rgba(0,0,0,0.1)] ${isCredit ? 'bg-green-500/10 text-green-400 ring-green-500/20' : 'bg-red-500/10 text-red-400 ring-red-500/20'}`}>
                      {isCredit ? <ArrowDownRight className="w-5 h-5 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> : <ArrowUpRight className="w-5 h-5 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-white tracking-wide">{tx.category}</h4>
                      <p className="text-xs text-white/50">
                        {new Date(tx.createdAt).toLocaleDateString()} &middot; {tx.description}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold tracking-tight ${isCredit ? 'text-green-400' : 'text-white'}`}>
                    {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="font-semibold text-white tracking-tight">New Transaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-white/70">Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl bg-black/20 backdrop-blur-md border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 placeholder:text-white/30"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("EXPENSE")}
                  className={`py-2 rounded-xl font-medium text-sm transition-all duration-200 ease-in-out ring-1 ${
                    type === "EXPENSE" ? "bg-red-500/10 text-red-400 ring-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]" : "bg-white/5 text-white/50 ring-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType("INCOME")}
                  className={`py-2 rounded-xl font-medium text-sm transition-all duration-200 ease-in-out ring-1 ${
                    type === "INCOME" ? "bg-green-500/10 text-green-400 ring-green-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "bg-white/5 text-white/50 ring-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Income
                </button>
              </div>

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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 text-white rounded-xl py-2.5 mt-2 transition-all duration-300 ease-in-out disabled:opacity-50 flex justify-center items-center h-11 font-medium"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
