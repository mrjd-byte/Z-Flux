"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Loader2, ArrowLeft, Plus, Users, Wallet, TrendingDown, IndianRupee, PieChart, UserPlus, Scale, AlertCircle, Handshake } from "lucide-react";
import Link from "next/link";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type GroupDetail = {
  id: string;
  name: string;
  totalPool: number;
  members: { id: string; userId: string; email: string }[];
  contributions: { id: string; userId: string; email: string; amount: number; createdAt: string }[];
  expenses: { id: string; title: string; amount: number; email: string; createdAt: string }[];

  // 🔥 Safe additions from enhanced API
  settlements?: { userId: string; email: string; paid: number; owes: number }[];
  activity?: { type: string; email: string; amount: number; title?: string; createdAt: string }[];
};

type Settlement = {
  from: string;
  to: string;
  amount: number;
};

type SettlementData = {
  mySummary: { type: "debtor" | "creditor" | "neutral"; amount: number };
  settlements: Settlement[];
};

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [contributionAmount, setContributionAmount] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(true);
  const [friends, setFriends] = useState<{ id: string; friendId: string; email: string; since: string }[]>([]);
  const [activeView, setActiveView] = useState<"MAIN" | "CONTRIBUTION" | "EXPENSE" | "INVITE" | "MEMBERS" | "ACTIVITY" | "LEDGER" | "SETTLE">("MAIN");

  const fetchGroupDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setGroup(data);
      }
    } catch (error) {
      console.error("Fetch group detail error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchSettlements = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/groups/${id}/settlement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSettlementData(data);
      }
    } catch (error) {
      console.error("Fetch settlement error:", error);
    } finally {
      setSettlementLoading(false);
    }
  }, [id]);

  const fetchFriends = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/friends/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error("Fetch friends error:", error);
    }
  }, []);

  useEffect(() => {
    fetchGroupDetail();
    fetchSettlements();
    fetchFriends();
  }, [fetchGroupDetail, fetchSettlements, fetchFriends]);

  const handleAction = async (endpoint: string, body: object) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/groups/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ groupId: id, ...body })
      });

      if (res.ok) {
        setContributionAmount("");
        setExpenseTitle("");
        setExpenseAmount("");
        setNewMemberEmail("");
        fetchGroupDetail();
        fetchSettlements();
        setActiveView("MAIN");
      }
    } catch (error) {
      console.error(endpoint, "error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!group) return <div>Group not found or access denied.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4">
      {/* Dynamic View Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={activeView === "MAIN" ? "/groups" : "#"}
          onClick={(e) => {
            if (activeView !== "MAIN") {
              e.preventDefault();
              setActiveView("MAIN");
            }
          }}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-base font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          {activeView === "MAIN" ? "Back to Wallets" : "Dismiss View"}
        </Link>
        {activeView !== "MAIN" && (
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            Active Sub-Protocol
          </span>
        )}
      </div>

      <SectionContainer
        title={activeView === "MAIN" ? (group?.name || "Group") : activeView.replace(/_/g, " ")}
        subtitle={
          activeView === "MAIN" ? (
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" /> {group?.members?.length || 0} Contributors active in this pool
            </span>
          ) : (
            `Protocol ID: ${id.slice(0, 8)}...`
          )
        }
      >
        {activeView === "MAIN" ? (
          /* --- MAIN VIEW --- */
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mt-[-3rem]">
              <div className="ml-auto">
                <GlassCard className="px-8 py-6 bg-indigo-600/10 text-white min-w-[260px] text-right border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] flex flex-col justify-center">
                  <h2 className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Shared Pool Balance</h2>
                  <p className="text-3xl font-bold tracking-tight text-white drop-shadow-md">₹{group?.totalPool?.toFixed(2) || "0.00"}</p>
                </GlassCard>
              </div>
            </div>

            {/* Split Status Banner */}
            {settlementData && settlementData.mySummary.type !== "neutral" && (
              <GlassCard 
                className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:scale-[1.01] ${
                  settlementData.mySummary.type === "creditor" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
                }`}
                onClick={() => setActiveView("SETTLE")}
              >
                <div className="flex items-center gap-6">
                  <div className={`p-3 rounded-xl ${settlementData.mySummary.type === "creditor" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Split Status (Click to Settle)</p>
                    <h3 className={`text-xl font-bold tracking-wide ${settlementData.mySummary.type === "creditor" ? "text-emerald-400" : "text-rose-400"}`}>
                      {settlementData.mySummary.type === "creditor" ? "Others owe you" : "You owe others"} ₹{settlementData.mySummary.amount.toFixed(2)}
                    </h3>
                  </div>
                </div>
                <Button variant="ghost" className="text-zinc-400 hover:text-white border-zinc-500/20">View Plan</Button>
              </GlassCard>
            )}

            {/* Action Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <GlassCard 
                hoverEffect 
                className="flex flex-col items-center justify-center gap-4 py-10 cursor-pointer group active:scale-95 transition-transform"
                onClick={() => setActiveView("EXPENSE")}
              >
                <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Log Expense</span>
              </GlassCard>

              <GlassCard 
                hoverEffect 
                className="flex flex-col items-center justify-center gap-4 py-10 cursor-pointer group active:scale-95 transition-transform"
                onClick={() => setActiveView("CONTRIBUTION")}
              >
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Contribute</span>
              </GlassCard>

              <GlassCard 
                hoverEffect 
                className="flex flex-col items-center justify-center gap-4 py-10 cursor-pointer group active:scale-95 transition-transform text-center"
                onClick={() => setActiveView("MEMBERS")}
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">View Members</span>
              </GlassCard>

              <GlassCard 
                hoverEffect 
                className="flex flex-col items-center justify-center gap-4 py-10 cursor-pointer group active:scale-95 transition-transform text-center"
                onClick={() => setActiveView("LEDGER")}
              >
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Full Ledger</span>
              </GlassCard>

              <GlassCard 
                hoverEffect 
                className="flex flex-col items-center justify-center gap-4 py-10 cursor-pointer group active:scale-95 transition-transform text-center"
                onClick={() => setActiveView("ACTIVITY")}
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <PieChart className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Full History</span>
              </GlassCard>

              <GlassCard 
                hoverEffect 
                className="flex flex-col items-center justify-center gap-4 py-10 cursor-pointer group active:scale-95 transition-transform text-center"
                onClick={() => setActiveView("INVITE")}
              >
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <UserPlus className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Add Member</span>
              </GlassCard>
            </div>

            {/* Recent Pulse Summary */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Recent Pulse Activity</h3>
                <button onClick={() => setActiveView("ACTIVITY")} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">See Exhaustive Log</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.activity && group.activity.length > 0 ? (
                  group.activity.slice(0, 4).map((a, idx) => (
                    <GlassCard key={idx} className="p-4 flex items-center justify-between border-white/5 bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.type === "CONTRIBUTION" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                          {a.type === "CONTRIBUTION" ? <Plus className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white tracking-wide">{a.type === "CONTRIBUTION" ? "Contribution" : a.title}</p>
                          <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{a.email.split("@")[0]} · {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${a.type === "CONTRIBUTION" ? "text-emerald-400" : "text-rose-400"}`}>
                        {a.type === "CONTRIBUTION" ? "+" : "-"}₹{a.amount.toFixed(2)}
                      </p>
                    </GlassCard>
                  ))
                ) : (
                  <p className="text-zinc-600 text-xs italic">No activity detected yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* --- SUB-VIEW MODAL WRAPPER --- */
          <div className="max-w-4xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {activeView === "CONTRIBUTION" && (
              <GlassCard className="p-12 space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Plus className="w-8 h-8 text-emerald-400" /> Contribute to Pool
                  </h3>
                  <p className="text-zinc-500 text-sm">Inject global assets into the shared liquidity pool for all project participants.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3 font-mono">
                    <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest pl-1">Amount Quants (₹)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="w-full px-6 py-5 bg-white/5 border-2 border-white/10 rounded-2xl text-4xl font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono placeholder:text-zinc-800"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => setActiveView("MAIN")} variant="ghost" className="flex-1 py-5">Cancel</Button>
                    <Button
                      onClick={() => handleAction("contribute", { amount: contributionAmount })}
                      disabled={actionLoading || !contributionAmount}
                      variant="success"
                      className="flex-[2] py-5 text-base font-black uppercase tracking-widest"
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Authorize Injection"}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeView === "EXPENSE" && (
              <GlassCard className="p-12 space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                    <TrendingDown className="w-8 h-8 text-rose-400" /> Log Pool Expense
                  </h3>
                  <p className="text-zinc-500 text-sm">Record a withdrawal from the shared liquidity pool for specific project requirements.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest pl-1">Object Description</label>
                      <input
                        type="text"
                        placeholder="What was this for?"
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-all font-medium placeholder:text-zinc-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest pl-1">Quantum Value (₹)</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-2xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-all font-mono placeholder:text-zinc-800"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => setActiveView("MAIN")} variant="ghost" className="flex-1 py-5">Cancel</Button>
                    <Button
                      onClick={() => handleAction("expense", { title: expenseTitle, amount: expenseAmount })}
                      disabled={actionLoading || !expenseAmount || !expenseTitle}
                      variant="danger"
                      className="flex-[2] py-5 text-base font-black uppercase tracking-widest"
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm Withdrawal"}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeView === "INVITE" && (
              <GlassCard className="p-12 space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                    <UserPlus className="w-8 h-8 text-indigo-400" /> Add Contributor
                  </h3>
                  <p className="text-zinc-500 text-sm">Invite a known friend to participate in this group liquidity pool.</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-zinc-600 tracking-widest pl-1">Target Entity Email</label>
                    <select
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white text-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-semibold appearance-none"
                    >
                      <option value="" className="bg-[#0f0f11] text-zinc-400">Select from Pulse List</option>
                      {friends.map((f) => (
                        <option key={f.id} value={f.email} className="bg-[#0f0f11] text-white">{f.email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => setActiveView("MAIN")} variant="ghost" className="flex-1 py-5">Cancel</Button>
                    <Button
                      onClick={() => handleAction("add-member", { email: newMemberEmail })}
                      disabled={actionLoading || !newMemberEmail}
                      variant="primary"
                      className="flex-[2] py-5 text-base font-black uppercase tracking-widest"
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Authorize Invite"}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}

            {activeView === "MEMBERS" && (
              <div className="space-y-8">
                <GlassCard className="p-0 overflow-hidden">
                  <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest">Share Distributions</h3>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.settlements?.map((s) => (
                      <GlassCard key={s.userId} className="p-6 transition-all border-white/5 bg-white/5 hover:border-indigo-500/30">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                          <span className="text-xs font-bold text-white truncate uppercase tracking-widest">{s.email.split("@")[0]}</span>
                          <div className={`w-2 h-2 rounded-full ${s.owes > 0 ? "bg-rose-500" : s.owes < 0 ? "bg-emerald-500" : "bg-zinc-500"}`} />
                        </div>
                        <div className="flex items-end justify-between font-mono">
                          <div>
                            <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] mb-1">Paid</p>
                            <p className="text-lg font-bold text-white">₹{s.paid}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-zinc-500 text-[9px] uppercase font-black tracking-[0.2em] mb-1">{s.owes > 0 ? "Debt" : "Credit"}</p>
                            <p className={`text-lg font-bold tracking-wide ${s.owes > 0 ? "text-rose-400" : s.owes < 0 ? "text-emerald-400" : "text-zinc-400"}`}>
                              ₹{Math.abs(s.owes)}
                            </p>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </GlassCard>
                <GlassCard className="p-8 space-y-4">
                  <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">Full Circle Entities</h3>
                  <div className="flex flex-wrap gap-4">
                    {group?.members.map((m) => (
                      <div key={m.id} className="px-5 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400">{m.email[0].toUpperCase()}</div>
                        <span className="text-sm text-white font-bold tracking-wide">{m.email}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}

            {activeView === "ACTIVITY" && (
              <GlassCard className="p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                <div className="p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Financial Chronicle</h3>
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mt-1">Complete operation ledger for this pool</p>
                  </div>
                  <Scale className="w-6 h-6 text-zinc-700" />
                </div>
                <div className="p-0 min-h-[600px] overflow-y-auto max-h-[70vh] custom-scrollbar">
                  {group.activity && group.activity.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {group.activity.map((a, idx) => (
                        <div key={idx} className="p-8 hover:bg-white/5 transition-all flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border border-white/10 ${a.type === "CONTRIBUTION" ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {a.type === "CONTRIBUTION" ? <Plus className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-lg text-white uppercase tracking-wide">{a.type === "CONTRIBUTION" ? "Inflow Injection" : a.title}</h4>
                              <div className="flex items-center gap-3">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{a.email.split("@")[0]}</p>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-60">
                                  {new Date(a.createdAt).toLocaleDateString()} · {new Date(a.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className={`text-2xl font-bold tracking-tighter tabular-nums ${a.type === "CONTRIBUTION" ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {a.type === "CONTRIBUTION" ? '+' : '-'}₹{a.amount.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-32 text-center opacity-30">
                      <p className="text-white text-lg font-bold italic">Chronicle is currently silent.</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {activeView === "LEDGER" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard className="p-0 flex flex-col h-[700px] overflow-hidden">
                  <div className="p-8 border-b border-white/5 bg-emerald-500/[0.03] flex items-center justify-between">
                    <h4 className="text-base font-black text-emerald-400 uppercase tracking-[0.3em]">System Inflow</h4>
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                    {group?.contributions && group.contributions.length > 0 ? (
                      group.contributions.map((c) => (
                        <div key={c.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-emerald-500/10 transition-colors">
                          <div>
                            <p className="text-base font-bold text-white tracking-wide">{c.email.split("@")[0]}</p>
                            <p className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.2em] mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                          </div>
                          <p className="text-lg font-mono font-bold text-emerald-400">+₹{c.amount.toFixed(2)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-20">No Inflow Data</div>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="p-0 flex flex-col h-[700px] overflow-hidden">
                  <div className="p-8 border-b border-white/5 bg-rose-500/[0.03] flex items-center justify-between">
                    <h4 className="text-base font-black text-rose-400 uppercase tracking-[0.3em]">System Outflow</h4>
                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                    {group?.expenses && group.expenses.length > 0 ? (
                      group.expenses.map((e) => (
                        <div key={e.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-rose-500/10 transition-colors">
                          <div>
                            <p className="text-base font-bold text-white tracking-wide">{e.title}</p>
                            <p className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.2em] mt-1">Source: {e.email.split("@")[0]}</p>
                          </div>
                          <p className="text-lg font-mono font-bold text-rose-400">-₹{e.amount.toFixed(2)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-20">No Outflow Data</div>
                    )}
                  </div>
                </GlassCard>
              </div>
            )}

            {activeView === "SETTLE" && (
              <GlassCard className="p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-amber-500/20">
                <div className="p-12 border-b border-white/5 bg-amber-500/[0.03] flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4">
                      <Handshake className="w-10 h-10 text-amber-500" /> Equilibrium Plan
                    </h3>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest pl-1">Algorithmic debt resolution for all pool entities</p>
                  </div>
                </div>
                <div className="p-12 min-h-[400px]">
                  {settlementLoading ? (
                    <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>
                  ) : settlementData && settlementData.settlements.length > 0 ? (
                    <div className="space-y-4">
                      {settlementData.settlements.map((s, idx) => (
                        <div key={idx} className="p-8 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-8">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-sm font-black text-zinc-500 group-hover:scale-110 transition-transform">
                              {s.from[0]}
                            </div>
                            <div>
                              <p className="text-2xl font-bold tracking-tight text-white">
                                <span className={s.from === "You" ? "text-rose-500" : ""}>{s.from}</span>
                                <span className="text-zinc-700 mx-4 font-black uppercase text-[10px] tracking-widest">Authorized to pay</span>
                                <span className={s.to === "You" ? "text-emerald-500" : ""}>{s.to}</span>
                              </p>
                            </div>
                          </div>
                          <p className="text-3xl font-mono font-bold text-white bg-white/5 px-6 py-3 rounded-2xl border border-white/5">₹{s.amount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-32 text-center flex flex-col items-center gap-6">
                      <Scale className="w-16 h-16 text-emerald-500 opacity-20" />
                      <p className="text-zinc-500 text-xl font-medium italic">Protocol Balanced. All debt quants are currently resolved.</p>
                      <Button onClick={() => setActiveView("MAIN")} variant="ghost">Return to Sector Overview</Button>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </SectionContainer>
    </div>
  );
}
