"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowUpRight, ArrowDownRight, X, Loader2 } from "lucide-react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Transaction = {
  id: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  fromWalletId?: string;
  toWalletId?: string;
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

  // Send Money form states
  const [targetWalletId, setTargetWalletId] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  const expenseCategories = ["Food", "Travel", "Shopping", "Bills", "General"];

const incomeCategories = ["Salary", "Freelance", "Investment", "Bonus"];

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
      const mappedType = category === "Salary" && type === "INCOME" ? "SALARY_TO_WALLET" : (type === "EXPENSE" ? "DEBIT" : "CREDIT");

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

  const handleSendMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendError("");
    setSendSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ walletId: targetWalletId, amount: parseFloat(sendAmount) })
      });

      const data = await res.json();
      if (res.ok) {
        setSendSuccess("Transfer successful!");
        setTargetWalletId("");
        setSendAmount("");
        fetchTransactions();
        window.dispatchEvent(new Event("financial-data-updated"));
      } else {
        setSendError(data.error || "Transfer failed");
      }
    } catch (error) {
      setSendError("An error occurred");
    } finally {
      setIsSending(false);
    }
  };
  // Filtering states
  const [filterType, setFilterType] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filterType === "ALL" || tx.type === filterType || (filterType === "DEBIT" && tx.type === "EXPENSE") || (filterType === "CREDIT" && tx.type === "INCOME");
    const matchesCategory = filterCategory === "ALL" || tx.category === filterCategory;
    return matchesType && matchesCategory;
  });

  return (
    <SectionContainer
      title="Ledger Operations"
      subtitle="Monitor and authorize global vault activities"
    >
      <div className="flex justify-end mb-6">
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 group"
          size="lg"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>New Transaction</span>
        </Button>
      </div>

      {/* Main Content Grid (70/30 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">

        {/* Left Column: List (70%) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="p-0 overflow-hidden flex flex-col md:p-0">
            <div className="p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <h2 className="text-base font-black text-zinc-500 uppercase tracking-[0.2em]">Transaction Flux</h2>
              <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-500/20">
                {filteredTransactions.length} Nodes
              </span>
            </div>

            <div className="min-h-[600px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-[500px] gap-6">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] animate-pulse">Syncing Protocols...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-32 text-center space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                    <ArrowUpRight className="w-8 h-8 text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-white tracking-tight">Empty Sector</p>
                    <p className="text-base text-zinc-500 max-w-[200px] mx-auto font-medium">No signals detected in this range.</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredTransactions.map((tx) => {
                    const isCredit = tx.type === "CREDIT" || tx.type === "INCOME" || tx.type === "TRANSFER_IN" || tx.type === "SALARY_TO_WALLET";
                    return (
                      <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all group px-10">
                        <div className="flex items-center gap-8">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all border border-white/5 ${isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'} group-hover:scale-110 group-hover:rotate-3`}>
                            {isCredit ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                          </div>
                          <div className="space-y-1.5">
                            <h4 className="font-bold text-base text-white tracking-wide uppercase">{tx.category || "Network Op"}</h4>
                            <div className="flex items-center gap-3">
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString()}</p>
                              {tx.description && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-white/10" />
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-60 truncate max-w-[150px]">{tx.description}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className={`text-2xl font-bold tracking-tighter tabular-nums ${isCredit ? 'text-emerald-400' : 'text-white'}`}>
                            {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString()}
                          </div>
                          <div className="flex justify-end">
                            <span className="text-[9px] font-black text-zinc-600 bg-white/5 px-2 py-0.5 rounded-md uppercase tracking-[0.1em] border border-white/5">
                              {tx.type.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Sidebar (30%) */}
        <div className="lg:col-span-3 space-y-8">

          {/* Filters Card */}
          <GlassCard className="space-y-8">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3">
              <Plus className="w-4 h-4 rotate-45 text-indigo-400" /> Protocol Filter
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] block pl-1">Signal Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {["ALL", "DEBIT", "CREDIT", "TRANSFER_IN"].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${filterType === type ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10'}`}
                    >
                      {type.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] block pl-1">Sector</label>
                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none"
                  >
                    <option value="ALL" className="bg-[#0a0a0a]">All Sectors</option>
                    {expenseCategories.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
                    {incomeCategories.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)}
                  </select>
                  <Plus className="absolute right-5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none rotate-45" />
                </div>
              </div>
            </div>

            {(filterType !== "ALL" || filterCategory !== "ALL") && (
              <Button
                onClick={() => { setFilterType("ALL"); setFilterCategory("ALL"); }}
                variant="ghost"
                className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] border border-dashed border-indigo-500/30 rounded-2xl"
              >
                Reset Parameters
              </Button>
            )}
          </GlassCard>

          {/* Send Money Card */}
          <div className="p-8 bg-gradient-to-br from-indigo-900/20 to-black/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3 relative z-10">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Pulse Transfer
            </h3>
            <form onSubmit={handleSendMoney} className="space-y-6 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] block pl-1">Receiver Key</label>
                <input
                  type="text"
                  required
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value.toUpperCase())}
                  className="w-full px-5 py-4 bg-white/10 border border-white/10 rounded-2xl text-base font-bold tracking-[0.1em] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700 font-mono"
                  placeholder="ZF-AUTH-XXXX"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] block pl-1">Quants (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="w-full px-5 py-4 bg-white/10 border border-white/10 rounded-2xl text-3xl font-bold tracking-tighter text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-white/10"
                  placeholder="0.00"
                />
              </div>

              {sendError && <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[9px] font-bold text-rose-400 uppercase tracking-widest">{sendError}</div>}
              {sendSuccess && <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{sendSuccess}</div>}

              <Button
                type="submit"
                disabled={isSending}
                variant="primary"
                className="w-full py-5 font-black uppercase tracking-[0.2em] flex items-center justify-center h-16"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Pulse"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-[#0a0a0a] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-center p-12 pb-8 relative z-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-white tracking-tight">Post Activity</h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Manual Quantum Protocol Entry</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="p-12 pt-0 space-y-10 relative z-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] block pl-1">Amount (₹)</label>
                <div className="relative group">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-0 py-4 bg-transparent border-b-2 border-white/10 focus:border-indigo-500 text-white focus:outline-none transition-all text-6xl font-bold tracking-tighter placeholder:text-white/5"
                    placeholder="0.00"
                    autoFocus
                  />
                  <div className="mt-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Global Asset Exchange Rate Applied</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => { setType("EXPENSE"); setCategory("Food"); }}
                  className={`py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] transition-all border-2 ${type === "EXPENSE" ? "bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.1)]" : "bg-white/5 border-transparent text-zinc-500 hover:text-zinc-300"}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => { setType("INCOME"); setCategory("Salary"); }}
                  className={`py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] transition-all border-2 ${type === "INCOME" ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]" : "bg-white/5 border-transparent text-zinc-500 hover:text-zinc-300"}`}
                >
                  Income
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block pl-1">
                  {type === "EXPENSE" ? "Expense Category" : "Income Source"}
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-xs font-black uppercase tracking-[0.2em] appearance-none"
                  >
                    {type === "EXPENSE" 
                      ? expenseCategories.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)
                      : incomeCategories.map(c => <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>)
                    }
                  </select>
                  <Plus className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 rotate-45" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 font-black uppercase tracking-[0.4em] flex justify-center items-center h-20"
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Commit Flux"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </SectionContainer>
  );
}
