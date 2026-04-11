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
        <h1 className="text-2xl font-bold dark:text-white">Transactions</h1>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ease-in-out"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Transaction</span>
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[400px] hover:scale-[1.01] transition-all duration-200 ease-in-out">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 dark:text-gray-400">
            <p>No transactions found.</p>
            <p className="text-sm mt-1">Add your first transaction above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {transactions.map((tx) => {
              const isCredit = tx.type === "CREDIT" || tx.type === "INCOME";
              return (
                <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 ease-in-out">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${isCredit ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {isCredit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{tx.category}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString()} &middot; {tx.description}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold dark:text-white">New Transaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-white/5 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("EXPENSE")}
                  className={`py-2 rounded-md font-medium text-sm transition-all duration-200 ease-in-out ${
                    type === "EXPENSE" ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:border dark:border-red-500/20" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType("INCOME")}
                  className={`py-2 rounded-md font-medium text-sm transition-all duration-200 ease-in-out ${
                    type === "INCOME" ? "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400 dark:border dark:border-green-500/20" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  Income
                </button>
              </div>

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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white rounded-md py-2 mt-2 hover:bg-blue-500/90 dark:hover:bg-blue-500/80 transition-all duration-200 ease-in-out disabled:opacity-50 flex justify-center items-center h-10"
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
