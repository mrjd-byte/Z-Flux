"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Loader2, ArrowLeft, Plus, Users, TrendingDown, IndianRupee, PieChart, UserPlus, Scale, Handshake, X, Sparkles, History, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { useInsightToast } from "@/context/InsightToastContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

type Activity = {
  type: string;
  email: string;
  amount: number;
  title?: string;
  createdAt: string;
};

type GroupDetail = {
  id: string;
  name: string;
  totalPool: number;
  members: { id: string; userId: string; email: string }[];
  settlements: any[];
  activity?: Activity[];
};

type AISuggestion = {
  from: string;
  to: string;
  amount: number;
};

type SettlementData = {
  mySummary: { type: "debtor" | "creditor" | "neutral"; amount: number };
};

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);
  const [friends, setFriends] = useState<{ id: string; email: string }[]>([]);
  
  // Modal states
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Form states
  const [contributionAmount, setContributionAmount] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const { addInsight } = useInsightToast();

  const calculateAiSettlements = useCallback(() => {
    if (!group?.settlements) return;

    const debtors = group.settlements
      .filter(s => s.owes > 0)
      .map(s => ({ ...s }));
    const creditors = group.settlements
      .filter(s => s.owes < 0)
      .map(s => ({ ...s, owes: Math.abs(s.owes) }));

    const suggestions: AISuggestion[] = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.owes, creditor.owes);

      if (amount > 0) {
        suggestions.push({
          from: debtor.email === "You" ? "You" : debtor.email.split("@")[0],
          to: creditor.email === "You" ? "You" : creditor.email.split("@")[0],
          amount
        });
      }

      debtors[i].owes -= amount;
      creditors[j].owes -= amount;

      if (debtors[i].owes === 0) i++;
      if (creditors[j].owes === 0) j++;
    }

    // Set state for local UI
    setAiSuggestions(suggestions);
    setShowAiSuggestions(true);

    // Push to global AI Copilot
    suggestions.forEach(s => {
      addInsight({
        message: `Optimization: ${s.from} should settle ₹${s.amount} with ${s.to}`,
        type: "info",
        priority: "HIGH",
        route: `/groups/${id}/settlement`
      });
    });
  }, [group, id, addInsight]);

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
        setShowContributionModal(false);
        setShowExpenseModal(false);
        setShowInviteModal(false);
        fetchGroupDetail();
        fetchSettlements();
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
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-base font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Wallets
        </Link>
      </div>

      <SectionContainer
        title={group.name}
        subtitle={
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" /> {group.members?.length || 0} Contributors active
          </span>
        }
      >
        <div className="space-y-12">
          
          {/* Main Overview Stats */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mt-[-3rem]">
            <div className="ml-auto">
              <GlassCard className="px-8 py-6 bg-indigo-600/10 text-white min-w-[260px] text-right border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)] flex flex-col justify-center">
                <h2 className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Shared Pool Balance</h2>
                <p className="text-3xl font-bold tracking-tight text-white drop-shadow-md">₹{group.totalPool.toFixed(2)}</p>
              </GlassCard>
            </div>
          </div>

          {/* Settlement Summary Banner */}
          {settlementData && settlementData.mySummary.type !== "neutral" && (
            <Link href={`/groups/${id}/settlement`}>
              <GlassCard 
                className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:scale-[1.01] ${
                  settlementData.mySummary.type === "creditor" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`p-3 rounded-xl ${settlementData.mySummary.type === "creditor" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Current Liquidity standing</p>
                    <h3 className={`text-xl font-bold tracking-wide ${settlementData.mySummary.type === "creditor" ? "text-emerald-400" : "text-rose-400"}`}>
                      {settlementData.mySummary.type === "creditor" ? "Others owe you" : "You owe others"} ₹{settlementData.mySummary.amount.toFixed(2)}
                    </h3>
                  </div>
                </div>
                <Button variant="ghost" className="text-zinc-400 hover:text-white border-zinc-500/20">View Plan</Button>
              </GlassCard>
            </Link>
          )}

          {/* AI Settlement Suggestions - Contextual Copilot */}
          {showAiSuggestions && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <GlassCard className="p-8 border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <button onClick={() => setShowAiSuggestions(false)} className="text-zinc-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Settlement Protocol</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Optimized 1:1 transfer suggestions</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiSuggestions.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-3">
                         <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-white max-w-[60px] truncate">{s.from}</span>
                            <ArrowDownRight className="w-3 h-3 text-rose-400 my-0.5" />
                            <span className="text-[10px] font-bold text-indigo-400 max-w-[60px] truncate">{s.to}</span>
                         </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1 px-2 border border-white/10 rounded">Optimal Path</span>
                        <p className="text-lg font-bold text-white">₹{s.amount.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* Action Grid */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard 
              hoverEffect 
              className="flex flex-col items-center justify-center gap-4 py-8 cursor-pointer group active:scale-95 transition-transform"
              onClick={() => setShowExpenseModal(true)}
            >
              <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <TrendingDown className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white uppercase tracking-widest">Log Expense</span>
            </GlassCard>

            <GlassCard 
              hoverEffect 
              className="flex flex-col items-center justify-center gap-4 py-8 cursor-pointer group active:scale-95 transition-transform"
              onClick={() => setShowContributionModal(true)}
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white uppercase tracking-widest">Contribute</span>
            </GlassCard>

            <Link href={`/groups/${id}/members`} className="h-full">
              <GlassCard 
                hoverEffect 
                className="flex flex-col items-center justify-center gap-4 py-8 h-full cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">View Members</span>
              </GlassCard>
            </Link>

            <Link href={`/groups/${id}/ledger`} className="h-full">
              <GlassCard 
                hoverEffect 
                className="flex flex-col items-center justify-center gap-4 py-8 h-full cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Full Ledger</span>
              </GlassCard>
            </Link>

            <Link href={`/groups/${id}/activity`} className="h-full">
              <GlassCard 
                hoverEffect 
                className="flex flex-col items-center justify-center gap-4 py-8 h-full cursor-pointer group active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <History className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">Full Activity</span>
              </GlassCard>
            </Link>

            <GlassCard 
              hoverEffect 
              className="flex flex-col items-center justify-center gap-4 py-8 cursor-pointer group active:scale-95 transition-transform"
              onClick={() => setShowInviteModal(true)}
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
              <Link href={`/groups/${id}/activity`} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">See full feed</Link>
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
                        <p className="text-xs font-bold text-white tracking-wide">{a.type === "CONTRIBUTION" ? "Inflow Injection" : a.title}</p>
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
      </SectionContainer>

      {/* --- MODALS --- */}
      
      {/* Contribution Modal */}
      {showContributionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="max-w-xl w-full p-12 space-y-8 shadow-[0_0_80px_rgba(0,0,0,0.5)] border-white/10 relative">
            <button onClick={() => setShowContributionModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                <Plus className="w-8 h-8 text-emerald-400" /> Contribute to Pool
              </h3>
              <p className="text-zinc-500 text-sm">Inject assets into the shared liquidity pool for all project participants.</p>
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
                <Button onClick={() => setShowContributionModal(false)} variant="ghost" className="flex-1 py-5">Cancel</Button>
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
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="max-w-xl w-full p-12 space-y-8 shadow-[0_0_80px_rgba(0,0,0,0.5)] border-white/10 relative">
            <button onClick={() => setShowExpenseModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-rose-400" /> Log Pool Expense
              </h3>
              <p className="text-zinc-500 text-sm">Record a withdrawal from the shared liquidity pool for project requirements.</p>
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
                <Button onClick={() => setShowExpenseModal(false)} variant="ghost" className="flex-1 py-5">Cancel</Button>
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
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="max-w-xl w-full p-12 space-y-8 shadow-[0_0_80px_rgba(0,0,0,0.5)] border-white/10 relative">
            <button onClick={() => setShowInviteModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
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
                  className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white text-lg focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-semibold appearance-none select-none"
                >
                  <option value="" className="bg-[#0f0f11] text-zinc-400">Select from Pulse List</option>
                  {friends.map((f) => (
                    <option key={f.id} value={f.email} className="bg-[#0f0f11] text-white">{f.email}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => setShowInviteModal(false)} variant="ghost" className="flex-1 py-5">Cancel</Button>
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
        </div>
      )}

    </div>
  );
}
