"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Loader2, ArrowLeft, Plus, Users, Wallet, TrendingDown, IndianRupee, PieChart, UserPlus, Scale, AlertCircle, Handshake } from "lucide-react";
import Link from "next/link";

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
    <div className="space-y-8 pb-20">
      <Link
        href="/groups"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tighter">{group?.name}</h1>
          <p className="text-white/40 text-sm mt-1 flex items-center gap-2 font-medium uppercase tracking-widest italic">
            <Users className="w-3.5 h-3.5" /> {group?.members?.length || 0} Members Sharing This Pool
          </p>
        </div>

        <div className="p-6 bg-blue-500/10 backdrop-blur-md rounded-2xl border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)] ring-1 ring-blue-500/20 text-right min-w-[240px]">
          <h2 className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Pool Balance</h2>
          <p className="text-4xl font-black text-white tracking-tighter">₹{group?.totalPool?.toFixed(2) || "0.00"}</p>
        </div>
      </div>

      {/* Settlement Summary Banner */}
      {settlementData && settlementData.mySummary.type !== "neutral" && (
        <div className={`p-4 md:p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md transition-all ${
          settlementData.mySummary.type === "creditor" 
            ? "bg-green-500/10 border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]" 
            : "bg-red-500/10 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              settlementData.mySummary.type === "creditor" ? "bg-green-500/20" : "bg-red-500/20"
            }`}>
              <Scale className={`w-6 h-6 ${
                settlementData.mySummary.type === "creditor" ? "text-green-400" : "text-red-400"
              }`} />
            </div>
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Your Position</p>
              <h3 className={`text-xl font-bold ${
                settlementData.mySummary.type === "creditor" ? "text-green-400" : "text-red-400"
              }`}>
                {settlementData.mySummary.type === "creditor" ? "Others owe you" : "You owe others"} ₹{settlementData.mySummary.amount.toFixed(2)}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/40 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <AlertCircle className="w-3.5 h-3.5" />
            Based on equal split across {group?.members?.length || 0} members
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Actions Column */}
        <div className="space-y-6">
          <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-400" /> Contribute to Pool
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="0.00"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
              />
              <button
                onClick={() => handleAction("contribute", { amount: contributionAmount })}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-500/80 hover:bg-green-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20"
              >
                Add
              </button>
            </div>
          </div>

          <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" /> Record Group Expense
            </h3>
            <input
              type="text"
              placeholder="Expense title"
              value={expenseTitle}
              onChange={(e) => setExpenseTitle(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
              />
              <button
                onClick={() => handleAction("expense", { title: expenseTitle, amount: expenseAmount })}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20"
              >
                Log
              </button>
            </div>
          </div>

          <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400" /> Invite Member
            </h3>
            <div className="flex gap-2">
              <select
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a friend</option>
                {friends.map((f) => (
                  <option key={f.id} value={f.email}>
                    {f.email}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleAction("add-member", { email: newMemberEmail })}
                disabled={actionLoading || !newMemberEmail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all"
              >
                Invite
              </button>
            </div>
          </div>

          {/* Settlement Details */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Handshake className="w-5 h-5 text-yellow-400" /> Settlement Plan
            </h3>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
               {settlementLoading ? (
                 <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                 </div>
               ) : settlementData && settlementData.settlements.length > 0 ? (
                 <div className="divide-y divide-white/5">
                    {settlementData.settlements.map((s, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/60">
                              {s.from[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm text-white font-medium">
                                 <span className={s.from === "You" ? "text-red-400" : "text-white"}>{s.from}</span>
                                 <span className="text-white/30 mx-2 tracking-widest text-[10px] font-black italic">OWES</span>
                                 <span className={s.to === "You" ? "text-green-400" : "text-white"}>{s.to}</span>
                               </p>
                            </div>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-black text-white tracking-tight">₹{s.amount.toFixed(2)}</p>
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                <div className="p-10 text-center">
                   <p className="text-white/30 text-sm italic">All balances are settled! Everyone has paid their fair share.</p>
                </div>
               )}
            </div>
          </div>

          {/* Activity Feed Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-purple-400" /> Circle Activity
            </h3>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
              {group.activity && group.activity.length > 0 ? (
                <div className="divide-y divide-white/5">
                   {group.activity.map((a, idx) => (
                     <div key={idx} className="p-4 hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-bold text-white">{a.email.split("@")[0]}</span>
                           <span className={`text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                             a.type === "CONTRIBUTION" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                           }`}>
                             {a.type}
                           </span>
                        </div>
                        <p className="text-xs text-white/60">
                          {a.type === "CONTRIBUTION" 
                            ? `Added ₹${a.amount.toFixed(2)} to the pool` 
                            : `Spent ₹${a.amount.toFixed(2)} for ${a.title}`}
                        </p>
                        <p className="text-[10px] text-white/20 mt-1 uppercase font-bold tracking-widest">
                          {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <p className="text-white/20 text-xs italic">No activity yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Ledger Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-blue-400" /> Group Ledger
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Contributions */}
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col h-[400px]">
                <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                  Contributions
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </h4>
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                  {group?.contributions && group.contributions.length > 0 ? (
                    group.contributions.map((c) => (
                      <div key={c.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                        <div className="min-w-0">
                          <p className="text-xs text-white font-medium truncate">{c.email}</p>
                          <p className="text-[10px] text-white/30 uppercase font-bold tracking-tight">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-green-400">+₹{c.amount.toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/20 text-xs italic">No contributions yet.</p>
                  )}
                </div>
              </div>

              {/* Expenses */}
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col h-[400px]">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                  Group Expenses
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </h4>
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                   {group?.expenses && group.expenses.length > 0 ? (
                    group.expenses.map((e) => (
                      <div key={e.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                        <div className="min-w-0">
                          <p className="text-xs text-white font-bold truncate leading-none mb-1">{e.title}</p>
                          <p className="text-[10px] text-white/30 truncate">Log by {e.email}</p>
                        </div>
                        <p className="text-sm font-bold text-red-400">-₹{e.amount.toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-white/20 text-xs italic">No expenses recorded yet.</p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Member Settlement Ledger */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Scale className="w-5 h-5 text-purple-400" /> Member Balances
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {group.settlements?.map((s) => (
                 <div key={s.userId} className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 group hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold text-white truncate">{s.email.split("@")[0]}</span>
                       <div className={`w-2 h-2 rounded-full ${s.owes > 0 ? "bg-red-400" : s.owes < 0 ? "bg-green-400" : "bg-white/20"}`} />
                    </div>
                    <div className="flex items-end justify-between">
                       <div>
                          <p className="text-[10px] text-white/40 uppercase font-black">Paid</p>
                          <p className="text-sm font-bold text-white">₹{s.paid}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-white/40 uppercase font-black">{s.owes > 0 ? "Owes" : "Receives"}</p>
                          <p className={`text-sm font-black ${s.owes > 0 ? "text-red-400" : s.owes < 0 ? "text-green-400" : "text-white/40"}`}>
                             ₹{Math.abs(s.owes)}
                          </p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> Circle Members
            </h3>
            <div className="flex flex-wrap gap-3">
              {group?.members.map((m) => (
                <div key={m.id} className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                    {m.email[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-white/80 font-medium">{m.email}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
