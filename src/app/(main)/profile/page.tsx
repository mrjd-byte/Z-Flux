"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, DollarSign, Wallet, TrendingDown, PiggyBank, Edit2, LogOut, Check, X } from "lucide-react";

type ProfileData = {
  email: string;
  income: number;
  wallet: number;
  expenses: number;
};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [editIncomeVal, setEditIncomeVal] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setEditIncomeVal(result.income.toString());
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIncome = async () => {
    const newIncome = parseFloat(editIncomeVal);
    if (isNaN(newIncome) || newIncome < 0) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ income: newIncome })
      });
      if (res.ok) {
        const result = await res.json();
        setData(prev => prev ? { ...prev, income: result.income } : null);
        setIsEditingIncome(false);
        // Force dashboard or UI to notice updated core metrics
        window.dispatchEvent(new Event("financial-data-updated"));
      }
    } catch (error) {
      console.error("Failed to update income:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-gray-500 dark:text-gray-400">Failed to load profile data.</div>;
  }

  const savings = data.income - data.expenses;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Profile Settings</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all ring-1 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Email Card */}
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 group">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl ring-1 ring-blue-500/20 transition-all">
            <Mail className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Account Email</h3>
            <p className="text-lg font-semibold mt-1 text-white">{data.email}</p>
          </div>
        </div>

        {/* Income Card */}
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 group">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-xl ring-1 ring-green-500/20 transition-all">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Monthly Income</h3>
            
            {isEditingIncome ? (
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="number" 
                  value={editIncomeVal}
                  onChange={e => setEditIncomeVal(e.target.value)}
                  className="w-32 bg-black/20 border border-white/10 rounded-md px-2 py-1 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  autoFocus
                />
                <button disabled={isSaving} onClick={handleSaveIncome} className="text-green-400 hover:bg-green-500/10 p-1.5 rounded-md transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button disabled={isSaving} onClick={() => { setIsEditingIncome(false); setEditIncomeVal(data.income.toString()); }} className="text-red-400 hover:bg-red-500/10 p-1.5 rounded-md transition-colors disabled:opacity-50">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-bold text-white tracking-tight">${data.income.toFixed(2)}</p>
                <button 
                  onClick={() => setIsEditingIncome(true)}
                  className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Wallet Balance */}
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl ring-1 ring-indigo-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Wallet Balance</h3>
            <p className="text-xl font-bold mt-1 text-white tracking-tight">${data.wallet.toFixed(2)}</p>
          </div>
        </div>

        {/* Expenses */}
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl ring-1 ring-red-500/20">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Total Expenses</h3>
            <p className="text-xl font-bold mt-1 text-white tracking-tight">${data.expenses.toFixed(2)}</p>
          </div>
        </div>

        {/* Savings */}
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl ring-1 ring-purple-500/20">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Savings</h3>
            <p className={`text-xl font-bold mt-1 tracking-tight ${savings < 0 ? 'text-red-400' : 'text-white'}`}>
              ${savings.toFixed(2)}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
