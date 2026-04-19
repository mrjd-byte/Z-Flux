"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, IndianRupee, Wallet, TrendingDown, PiggyBank, Edit2, LogOut, Check, X, Copy, CheckCheck, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { SectionContainer } from "@/components/ui/SectionContainer";

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
    <SectionContainer
      title="Profile Settings"
      subtitle="Manage your account details and financial preferences"
      className="max-w-4xl mx-auto pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
        </div>
        <div className="flex flex-row gap-3">
          <Button
            onClick={handleLogout}
            variant="secondary"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>

          <Button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            variant="danger"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete Account
          </Button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Email Card */}
        <GlassCard className="flex items-center gap-5 p-6">
          <div className="p-6 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Mail className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Account Identification</h3>
            <p className="text-lg font-semibold mt-1 text-white">{data.email}</p>
          </div>
        </GlassCard>

        {/* Wallet ID Card */}
        <GlassCard className="flex items-center gap-5 p-6">
          <div className="p-6 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Public Wallet ID</h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xl font-mono font-bold text-white tracking-widest truncate">{data.walletId}</p>
              <button
                onClick={() => copyToClipboard(data.walletId)}
                className="ml-4 p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all border border-white/10"
                title="Copy Wallet ID"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Income Card */}
        <GlassCard className="flex items-center gap-5 p-6">
          <div className="p-6 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Expected Income</h3>

            {isEditingIncome ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  value={editIncomeVal}
                  onChange={e => setEditIncomeVal(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-1 focus:ring-indigo-500/50 font-semibold"
                  autoFocus
                />
                <button disabled={isSaving} onClick={handleSaveIncome} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button disabled={isSaving} onClick={() => { setIsEditingIncome(false); setEditIncomeVal(data.income.toString()); }} className="bg-white/5 text-zinc-400 hover:text-white p-2 rounded-xl transition-colors disabled:opacity-50 border border-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-bold text-white tracking-tight">₹{data.income.toFixed(2)}</p>
                <button
                  onClick={() => setIsEditingIncome(true)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-all border border-white/10"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </GlassCard>

      </div>

      <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Wallet Balance */}
        <GlassCard className="flex flex-col items-center text-center space-y-3 p-6 md:p-8">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Available Balance</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">₹{data.wallet.toFixed(2)}</p>
          </div>
        </GlassCard>

        {/* Expenses */}
        <GlassCard className="flex flex-col items-center text-center space-y-3 p-6 md:p-8">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Cumulative Expenses</h3>
            <p className="text-2xl font-bold mt-1 text-white tracking-tight">₹{data.expenses.toFixed(2)}</p>
          </div>
        </GlassCard>

        {/* Savings */}
        <GlassCard className="flex flex-col items-center text-center space-y-3 p-6 md:p-8">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Net Surplus</h3>
            <p className={`text-2xl font-bold mt-1 tracking-tight ${savings < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              ₹{savings.toFixed(2)}
            </p>
          </div>
        </GlassCard>

      </div>

    </SectionContainer>
  );
}
