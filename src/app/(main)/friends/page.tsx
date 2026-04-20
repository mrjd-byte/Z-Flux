"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Loader2, UserPlus, Check, X, ShieldAlert, Mail, Clock,
  UserCheck, Trophy, Eye, EyeOff, Search, ChevronDown,
  ChevronUp, UserMinus, Info, Handshake, IndianRupee,
  TrendingUp, TrendingDown, ArrowRight, History, Sparkles
} from "lucide-react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useSmartFeedback } from "@/context/SmartFeedbackContext";

type Friend = {
  id: string;
  friendId: string;
  email: string;
  since: string;
};

type PendingRequest = {
  id: string;
  senderId: string;
  email: string;
  at: string;
};

type SentRequest = {
  id: string;
  receiverId: string;
  email: string;
  status: string;
  at: string;
};

type LeaderboardItem = {
  name: string;
  email: string;
  score: number;
  rank: number;
  isCurrentUser: boolean;
};

type SharedActivity = {
  type: "CONTRIBUTION" | "EXPENSE" | "TRANSFER";
  amount: number;
  title?: string;
  email: string;
  createdAt: string;
  senderId?: string;
  receiverId?: string;
};

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isScoreVisible, setIsScoreVisible] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [isIncomingOpen, setIsIncomingOpen] = useState(false);
  const [isSentOpen, setIsSentOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sharedStats, setSharedStats] = useState<{ owesYou: number; youOwe: number; activity: SharedActivity[] } | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isGroupProtocolsOpen, setIsGroupProtocolsOpen] = useState(false);
  const [sharedGroupsDetails, setSharedGroupsDetails] = useState<any[]>([]);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { triggerFeedback } = useSmartFeedback();

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFriends = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/friends/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFriends(data.friends);
        setPendingIncoming(data.pendingIncoming);
        setSentRequests(data.sentRequests);
      }
    } catch (error) {
      console.error("Fetch friends error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/friends/leaderboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data);
      }
    } catch (error) {
      console.error("Fetch leaderboard error:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.id) setCurrentUserId(data.id);
    };
    fetchUser();
    fetchFriends();
    fetchLeaderboard();
  }, [fetchFriends, fetchLeaderboard]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Friend request sent!");
        setInviteEmail("");
        fetchFriends();
      } else {
        showToast(data.error || "Failed to send request", "error");
      }
    } catch (error) {
      showToast("Connection error", "error");
    } finally {
      setInviteLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId, status })
      });
      if (res.ok) {
        showToast(status === "ACCEPTED" ? "Request accepted!" : "Request rejected");
        fetchFriends();
      }
    } catch (error) {
      showToast("Operation failed", "error");
    }
  };

  const toggleVisibility = async () => {
    try {
      const token = localStorage.getItem("token");
      const newVisible = !isScoreVisible;
      const res = await fetch("/api/friends/visibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ visible: newVisible })
      });

      if (res.ok) {
        setIsScoreVisible(newVisible);
        fetchLeaderboard();
        showToast(`Score now ${newVisible ? "visible" : "hidden"}`);
      }
    } catch (error) {
      console.error("Toggle visibility error:", error);
    }
  };

  const fetchFriendDetails = async (friend: Friend) => {
    setSelectedFriend(friend);
    setDetailLoading(true);
    setSharedStats(null);
    try {
      const token = localStorage.getItem("token");
      const groupsRes = await fetch("/api/groups/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const groupsData = await groupsRes.json();

      let totalOwesYou = 0;
      let totalYouOwe = 0;
      let combinedActivity: SharedActivity[] = [];
      let shared: any[] = [];

      if (groupsRes.ok) {
        for (const group of groupsData.groups) {
          const detailRes = await fetch(`/api/groups/${group.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const detail = await detailRes.json();

          if (detail.members?.some((m: any) => m.email === friend.email)) {
            const friendSettlement = detail.settlements?.find((s: any) => s.email === friend.email);
            const mySettlement = detail.settlements?.find((s: any) => s.email === "You" || s.isCurrentUser);

            if (friendSettlement) {
              if (friendSettlement.owes > 0) totalOwesYou += friendSettlement.owes;
              else if (friendSettlement.owes < 0) totalYouOwe += Math.abs(friendSettlement.owes);
            }

            shared.push({
              id: group.id,
              name: group.name,
              yourBalance: mySettlement ? -mySettlement.owes : 0,
              friendBalance: friendSettlement ? -friendSettlement.owes : 0
            });

            if (detail.activity) {
              const sharedAct = detail.activity.filter((a: any) => a.email === friend.email || a.email === "You");
              combinedActivity = [...combinedActivity, ...sharedAct];
            }
          }
        }
      }

      // 🔥 NEW: Fetch direct shared transactions
      const directRes = await fetch(`/api/transactions?friendId=${friend.friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let directActivity = [];
      if (directRes.ok) {
        const directData = await directRes.json();
        directActivity = directData.transactions.map((tx: any) => ({
          type: "TRANSFER",
          amount: Math.abs(tx.amount),
          senderId: tx.senderId,
          receiverId: tx.receiverId,
          title: tx.senderId === currentUserId ? "Direct Payment Sent" : "Direct Payment Received",
          email: tx.senderId === currentUserId ? "You" : friend.email,
          createdAt: tx.createdAt
        }));
      }

      setSharedGroupsDetails(shared);
      setSharedStats({
        owesYou: totalOwesYou,
        youOwe: totalYouOwe,
        activity: [...combinedActivity, ...directActivity]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
      });
    } catch (error) {
      console.error("Fetch details error:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenTransferModal = () => {
    setTransferAmount("");
    setIsTransferring(true);
  };

  const handleTransferSubmit = async () => {
    if (!selectedFriend || !transferAmount) return;
    setTransferLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/friends/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          friendId: selectedFriend.friendId,
          amount: parseFloat(transferAmount)
        })
      });
      if (res.ok) {
        showToast("Direct transfer successful");
        setIsTransferring(false);
        setTransferAmount("");
        fetchFriends();
        if (selectedFriend) fetchFriendDetails(selectedFriend);
        window.dispatchEvent(new Event("financial-data-updated"));

        // Trigger Cinematic Smart Feedback
        triggerFeedback({
          type: "TRANSFER",
          amount: parseFloat(transferAmount),
          friendName: selectedFriend.email.split('@')[0]
        });
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to transfer", "error");
      }
    } catch (error) {
      showToast("Connection error", "error");
    } finally {
      setTransferLoading(false);
    }
  };

  const filteredFriends = useMemo(() => {
    return friends.filter(f => f.email.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [friends, searchQuery]);

  const syncedLeaderboard = useMemo(() => {
    // Add all friends to the leaderboard if missing, with score 0
    const combined = [...leaderboard];
    friends.forEach(f => {
      if (!combined.some(item => item.email === f.email)) {
        combined.push({
          name: f.email.split("@")[0],
          email: f.email,
          score: 0,
          rank: 0, // Will recalculate
          isCurrentUser: false
        });
      }
    });
    return combined.sort((a, b) => b.score - a.score).map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [friends, leaderboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <SectionContainer
      title="Network Nexus"
      subtitle="Collaborate and compete within your professional circle"
    >
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top-4 duration-300 flex items-center gap-3 backdrop-blur-xl ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}>
          {toast.type === "success" ? <Check className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          <span className="font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

        {/* LEFT COLUMN: Main Dashboard */}
        <div className="lg:col-span-2 space-y-10">

          {/* Top Actions: Search + Invite */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-2 flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter your network..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium w-full placeholder:text-zinc-600"
                />
              </div>
            </GlassCard>

            <GlassCard className="p-2 flex items-center">
              <form onSubmit={sendInvite} className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    placeholder="Invite via email..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium w-full placeholder:text-zinc-600"
                    required
                  />
                </div>
                <Button type="submit" disabled={inviteLoading} className="px-6 py-3 flex items-center gap-2">
                  {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                </Button>
              </form>
            </GlassCard>
          </div>

          {/* Pending Requests Accordion */}
          <div className="space-y-4">
            {(pendingIncoming.length > 0 || sentRequests.length > 0) && (
              <div className="space-y-4">
                <GlassCard className="p-0 overflow-hidden border-indigo-500/10">
                  <button
                    onClick={() => setIsIncomingOpen(!isIncomingOpen)}
                    className="w-full p-6 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-black uppercase tracking-widest">Incoming Requests</span>
                      <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full">{pendingIncoming.length}</span>
                    </div>
                    {isIncomingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {isIncomingOpen && (
                    <div className="p-6 pt-0 space-y-3 border-t border-white/5 bg-white/[0.02]">
                      {pendingIncoming.length > 0 ? pendingIncoming.map((req) => (
                        <div key={req.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-white text-sm font-bold truncate tracking-wide">{req.email}</p>
                            <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-1">Sent {new Date(req.at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => respondToRequest(req.id, "ACCEPTED")} className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => respondToRequest(req.id, "REJECTED")} className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      )) : <p className="text-zinc-600 text-xs italic py-4">No pending requests</p>}
                    </div>
                  )}
                </GlassCard>

                <GlassCard className="p-0 overflow-hidden border-indigo-500/10">
                  <button
                    onClick={() => setIsSentOpen(!isSentOpen)}
                    className="w-full p-6 flex items-center justify-between text-white hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-black uppercase tracking-widest">Sent Invites</span>
                      <span className="bg-indigo-500/20 text-indigo-500 text-[10px] px-2 py-0.5 rounded-full">{sentRequests.length}</span>
                    </div>
                    {isSentOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {isSentOpen && (
                    <div className="p-6 pt-0 space-y-3 border-t border-white/5 bg-white/[0.02]">
                      {sentRequests.length > 0 ? sentRequests.map((req) => (
                        <div key={req.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4 opacity-70">
                          <p className="text-zinc-300 text-sm font-bold truncate">{req.email}</p>
                          <span className="text-[8px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded text-zinc-500">{req.status}</span>
                        </div>
                      )) : <p className="text-zinc-600 text-xs italic py-4">No sent invitations</p>}
                    </div>
                  )}
                </GlassCard>
              </div>
            )}
          </div>

          {/* Friends List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Active Network</h2>
              </div>
              <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full text-zinc-500 uppercase tracking-widest border border-white/5">
                {filteredFriends.length} Results
              </span>
            </div>

            {filteredFriends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => fetchFriendDetails(friend)}
                    className="cursor-pointer group relative"
                  >
                    <GlassCard className="p-6 flex items-center gap-6 transition-all duration-300 group-hover:scale-[1.02] group-hover:border-indigo-500/30 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                        {friend.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-base truncate tracking-wide">{friend.email.split("@")[0]}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest">Nexus Active</p>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all"><Info className="w-4 h-4" /></button>
                        <button className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-500 transition-all"><UserMinus className="w-4 h-4" /></button>
                      </div>
                    </GlassCard>
                  </div>
                ))}
              </div>
            ) : (
              <GlassCard className="p-20 border-dashed border-white/10 text-center flex flex-col items-center">
                <p className="text-zinc-600 text-lg font-medium italic">Nexus directory is empty.</p>
              </GlassCard>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Rankings */}
        <div className="lg:sticky lg:top-24 space-y-6">
          <GlassCard className="p-0 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)] border-indigo-500/10 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                <h2 className="text-base font-black text-white uppercase tracking-widest">Social Rankings</h2>
              </div>
              <button onClick={toggleVisibility} className="text-zinc-500 hover:text-indigo-400 transition-colors">
                {isScoreVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="max-h-[600px] overflow-y-auto custom-scrollbar divide-y divide-white/5">
              {leaderboardLoading ? (
                <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : syncedLeaderboard.map((item) => (
                <div
                  key={item.email}
                  className={`p-5 flex items-center justify-between transition-all ${item.isCurrentUser ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] border ${item.rank === 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' :
                      item.rank === 2 ? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' :
                        item.rank === 3 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-white/5 text-zinc-500 border-white/10'
                      }`}>
                      {item.rank}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate tracking-wide ${item.isCurrentUser ? 'text-indigo-400' : 'text-white'}`}>
                        {item.name}
                      </p>
                      <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-0.5">Wellness Quotient</p>
                    </div>
                  </div>
                  <p className={`text-base font-black tabular-nums ${item.score >= 80 ? 'text-emerald-400' :
                    item.score >= 50 ? 'text-indigo-400' : 'text-zinc-600'
                    }`}>
                    {item.score}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-indigo-500/5 border-dashed border-indigo-500/20">
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mb-2">Rank Heuristic</p>
            <p className="text-zinc-500 text-[11px] leading-relaxed italic font-medium">Scores represent an algorithmic blend of financial health, transaction accuracy, and social collaboration.</p>
          </GlassCard>
        </div>
      </div>

      {/* --- FRIEND DETAIL MODAL --- */}
      {selectedFriend && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <GlassCard className="max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-white/10 relative">

            {/* Modal Header */}
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-3xl font-bold text-indigo-400 border border-indigo-500/20">
                  {selectedFriend.email[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{selectedFriend.email.split("@")[0]}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{selectedFriend.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFriend(null)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">

              {detailLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-500">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Nexus Data...</p>
                </div>
              ) : (
                <>
                  {/* Section 1: Financial Relation */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-amber-500" /> Flux Standings
                    </h4>

                    {/* AI Relationship Insight Tag */}
                    {sharedStats && (
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${sharedStats.owesYou > sharedStats.youOwe + 10 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                        sharedStats.youOwe > sharedStats.owesYou + 10 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                          "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                        }`}>
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          AI Insight: {
                            sharedStats.owesYou > sharedStats.youOwe + 10 ? `You have received ₹${(sharedStats.owesYou - sharedStats.youOwe).toFixed(2)} more from this partner` :
                              sharedStats.youOwe > sharedStats.owesYou + 10 ? "You have transferred more quants to this partner" :
                                "Transfer parity detected"
                          }
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <GlassCard className="p-8 bg-emerald-500/5 border-emerald-500/10">
                        <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest mb-1">Total Quants Received</p>
                        <p className="text-4xl font-bold text-emerald-400 tabular-nums">₹{sharedStats?.owesYou.toFixed(2) || "0.00"}</p>
                      </GlassCard>
                      <GlassCard className="p-8 bg-rose-500/5 border-rose-500/10">
                        <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-widest mb-1">Total Quants Sent</p>
                        <p className="text-4xl font-bold text-rose-400 tabular-nums">₹{sharedStats?.youOwe.toFixed(2) || "0.00"}</p>
                      </GlassCard>
                    </div>
                  </div>

                  {/* Section 2: Shared Activity */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-400" /> Nexus activity Feed
                      </h4>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Showing last 10 operations</span>
                    </div>
                    <div className="space-y-4">
                      {sharedStats?.activity.length ? sharedStats.activity.map((op, idx) => (
                        <div key={idx} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 ${op.type === "CONTRIBUTION" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                              }`}>
                              {op.type === "CONTRIBUTION" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white tracking-wide">{op.type === "CONTRIBUTION" ? "Nexus Injection" : op.title}</p>
                              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">
                                {op.email === "You" ? "You" : op.email.split("@")[0]} · {new Date(op.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className={`text-xl font-bold font-mono tracking-tighter ${(op.type === "CONTRIBUTION" || (op.type === "TRANSFER" && op.receiverId === currentUserId)) ? "text-emerald-400" : "text-rose-400"
                            }`}>
                            {(op.type === "CONTRIBUTION" || (op.type === "TRANSFER" && op.receiverId === currentUserId)) ? "+" : "-"}₹{op.amount.toFixed(2)}
                          </p>
                        </div>
                      )) : (
                        <div className="py-20 text-center opacity-30 italic font-medium">No activity detected in the nexus.</div>
                      )}
                    </div>
                  </div>

                  {/* Section 3: Actions */}
                  <div className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
                    <Button
                      onClick={() => handleOpenTransferModal()}
                      variant="primary"
                      className="flex-1 py-6 gap-2 text-sm font-black uppercase tracking-widest"
                    >
                      Send Money
                    </Button>
                    <Button
                      onClick={() => handleOpenTransferModal()}
                      variant="ghost"
                      className="flex-1 py-6 gap-2 text-sm font-black uppercase tracking-widest border-white/10 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all"
                    >
                      Transfer Quants
                    </Button>
                    <Button
                      onClick={() => setIsGroupProtocolsOpen(true)}
                      variant="ghost"
                      className="flex-1 py-6 gap-2 text-sm font-black uppercase tracking-widest border-white/10 hover:bg-white/10"
                    >
                      View Group Protocols
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/10 text-center">
              <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[1em]">Z-Flux Nexus Protocol v2.5</p>
            </div>
          </GlassCard>
        </div>
      )}
      {/* --- DIRECT TRANSFER MODAL --- */}
      {isTransferring && selectedFriend && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <GlassCard className="max-w-md w-full p-10 space-y-8 border-white/10 relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <button onClick={() => setIsTransferring(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-indigo-500/20 text-indigo-400">
                <ArrowRight className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Send money to {selectedFriend.email.split('@')[0]}</h3>
              <p className="text-zinc-500 text-sm italic">Direct Peer-to-Peer Transfer</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-1">Amount (₹)</label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-600">₹</div>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-12 pr-6 text-4xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Button
                onClick={handleTransferSubmit}
                disabled={transferLoading}
                className="w-full py-6 text-base font-black uppercase tracking-[0.2em] shadow-xl bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20"
              >
                {transferLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Send Money"}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* --- GROUP PROTOCOLS MODAL --- */}
      {isGroupProtocolsOpen && selectedFriend && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <GlassCard className="max-w-2xl w-full h-[60vh] flex flex-col p-0 overflow-hidden border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-indigo-400" /> Shared Group Protocols
              </h3>
              <button onClick={() => setIsGroupProtocolsOpen(false)} className="text-zinc-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {sharedGroupsDetails.length > 0 ? sharedGroupsDetails.map((group) => {
                const net = group.yourBalance - group.friendBalance;
                return (
                  <GlassCard key={group.id} className="p-6 transition-all hover:bg-white/5 border-white/5">
                    <div className="flex justify-between items-start mb-6">
                      <h4 className="text-lg font-bold text-white uppercase tracking-tight">{group.name}</h4>
                      <Link href={`/groups/${group.id}/settlement`}>
                        <Button variant="ghost" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">Settle via Group</Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-white/5 rounded-2xl text-center">
                        <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Your Standing</span>
                        <span className={`text-lg font-bold ${group.yourBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>₹{Math.abs(group.yourBalance).toFixed(2)}</span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl text-center">
                        <span className="block text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Friend Standing</span>
                        <span className={`text-lg font-bold ${group.friendBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>₹{Math.abs(group.friendBalance).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> AI Protocol Layer: {
                          net > 0 ? "You are owed more in this group" :
                            net < 0 ? "You owe more in this group" :
                              "Balance parity detected"
                        }
                      </p>
                    </div>
                  </GlassCard>
                );
              }) : (
                <div className="py-20 text-center opacity-30 italic font-medium">No shared groups detected between participants.</div>
              )}
            </div>
          </GlassCard>
        </div>
      )}

    </SectionContainer>
  );
}
