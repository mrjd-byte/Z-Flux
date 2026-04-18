"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, IndianRupee, Wallet, TrendingDown, PiggyBank, Edit2, LogOut, Check, X, Copy, CheckCheck, Trash2 } from "lucide-react";

type ProfileData = {
  email: string;
  income: number;
  wallet: number;
  walletId: string;
  expenses: number;
};

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [editIncomeVal, setEditIncomeVal] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "WARNING: This action is permanent and irreversible. All your transactions, groups, and friend data will be deleted. Are you sure you want to proceed?"
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        localStorage.removeItem("token");
        window.location.href = "/";
      } else {
        const result = await res.json();
        alert(result.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Deletion error:", error);
      alert("An unexpected error occurred during account deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Profile Settings</h1>
        <div className="flex flex-col gap-2 min-w-[160px]">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all ring-1 ring-white/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Log Out</span>
          </button>
          
          <button 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all ring-1 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)] disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span className="text-sm font-medium">Delete Account</span>
          </button>
        </div>
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

        {/* Wallet ID Card */}
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 group">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl ring-1 ring-purple-500/20 transition-all">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Your Wallet ID</h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xl font-mono font-bold text-white tracking-widest">{data.walletId}</p>
              <button 
                onClick={() => copyToClipboard(data.walletId)}
                className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-all"
                title="Copy Wallet ID"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Income Card */}
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4 group">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-xl ring-1 ring-green-500/20 transition-all">
            <IndianRupee className="w-6 h-6" />
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
                <p className="text-2xl font-bold text-white tracking-tight">₹{data.income.toFixed(2)}</p>
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
            <p className="text-xl font-bold mt-1 text-white tracking-tight">₹{data.wallet.toFixed(2)}</p>
          </div>
        </div>

        {/* Expenses */}
        <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl ring-1 ring-red-500/20">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Total Expenses</h3>
            <p className="text-xl font-bold mt-1 text-white tracking-tight">₹{data.expenses.toFixed(2)}</p>
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
              ₹{savings.toFixed(2)}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
