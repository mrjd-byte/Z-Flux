"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, UserPlus, Check, X, ShieldAlert, Mail, Clock, UserCheck, Trophy, Eye, EyeOff } from "lucide-react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isScoreVisible, setIsScoreVisible] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

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
        const currentUser = data.find((item: LeaderboardItem) => item.isCurrentUser);
        if (currentUser) {
          // Note: The leaderboard only contains the user if they are visible or if it's their own view.
          // But our API always returns current user. We can't strictly infer 'isScoreVisible' from it 
          // unless we check if other friends see it. 
          // For simplicity, we'll fetch visibility from a dedicated profile call or user settings if available.
        }
      }
    } catch (error) {
      console.error("Fetch leaderboard error:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchLeaderboard();
  }, [fetchFriends, fetchLeaderboard]);

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Friend request sent!", type: "success" });
        setInviteEmail("");
        fetchFriends();
      } else {
        setMessage({ text: data.error || "Failed to send request", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Connection error", type: "error" });
    } finally {
      setInviteLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requestId, status })
      });

      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error("Respond error:", error);
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
      }
    } catch (error) {
      console.error("Toggle visibility error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <SectionContainer
      title="Social Network"
      subtitle="Connect with friends and track financial standings together"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-start gap-6 mb-8">
        <div>
        </div>

        {/* Invite Form */}
        <GlassCard className="p-2 flex max-w-md w-full">
          <form onSubmit={sendInvite} className="flex gap-2 w-full">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                placeholder="Connect via email..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium w-full placeholder:text-zinc-600"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={inviteLoading}
              className="px-6 py-3 flex items-center gap-2"
            >
              {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Invite
            </Button>
          </form>
        </GlassCard>
      </div>

      <div className="flex justify-start">
        <Button
          onClick={toggleVisibility}
          variant={isScoreVisible ? "success" : "secondary"}
          size="sm"
          className="text-xs flex items-center gap-2"
        >
          {isScoreVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {isScoreVisible ? "Score visible to friends" : "Score hidden from friends"}
        </Button>
      </div>

      {message.text && (
        <div className={`p-6 rounded-xl border flex gap-3 items-center ${message.type === "success"
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}>
          {message.type === "success" ? <Check className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          <p className="text-base font-semibold">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Friends List Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 text-white border-b border-white/5 pb-4">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold tracking-tight">Active Network</h2>
            <span className="ml-auto text-[10px] font-black bg-white/5 px-3 py-1 rounded-full text-zinc-500 uppercase tracking-widest border border-white/5">
              {friends.length} Friends
            </span>
          </div>

          {friends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {friends.map((friend) => (
                <GlassCard key={friend.id} className="p-6 flex items-center gap-6" hoverEffect>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                    {friend.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-base truncate tracking-wide">{friend.email}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em] mt-1">
                      Friend since {new Date(friend.since).toLocaleDateString()}
                    </p>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="p-12 border-dashed border-white/10 text-center flex flex-col items-center">
              <p className="text-zinc-500 text-base font-medium italic">Your circle is empty. Start by inviting colleagues or friends.</p>
            </GlassCard>
          )}
        </div>

        {/* Requests Sidebars */}
        <div className="space-y-8">

          {/* Incoming Requests */}
          <GlassCard className="space-y-4">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Incoming Requests</h2>
            {pendingIncoming.length > 0 ? (
              <div className="space-y-3">
                {pendingIncoming.map((req) => (
                  <div key={req.id} className="p-6 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between gap-6 transition-all hover:bg-white/10">
                    <div className="min-w-0">
                      <p className="text-white text-base font-bold truncate tracking-wide">{req.email}</p>
                      <p className="text-zinc-500 text-[10px] flex items-center gap-1.5 mt-1 font-black uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> {new Date(req.at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToRequest(req.id, "ACCEPTED")}
                        className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors"
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => respondToRequest(req.id, "REJECTED")}
                        className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-white/5 rounded-xl bg-white/5">
                <p className="text-zinc-600 text-xs italic font-medium">No pending invitations.</p>
              </div>
            )}
          </GlassCard>

          {/* Sent Requests */}
          <GlassCard className="space-y-4">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sent Invites</h2>
            {sentRequests.length > 0 ? (
              <div className="space-y-3">
                {sentRequests.map((req) => (
                  <div key={req.id} className="p-6 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-6 opacity-75">
                    <div className="min-w-0">
                      <p className="text-zinc-300 text-base font-bold truncate tracking-wide">{req.email}</p>
                      <div className="mt-2 text-[10px] inline-block px-2 py-0.5 rounded-md font-black uppercase tracking-[0.2em] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {req.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-white/5 rounded-xl bg-white/5">
                <p className="text-zinc-600 text-xs italic font-medium">You haven't sent any invites.</p>
              </div>
            )}
          </GlassCard>

          {/* Leaderboard Section */}
          <div className="space-y-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] rounded-full" />
              <h2 className="text-lg font-bold text-white tracking-tight">Social Rankings</h2>
            </div>

            <GlassCard className="p-0 overflow-hidden min-h-[300px]">
              {leaderboardLoading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {leaderboard.map((item) => (
                    <div
                      key={item.email}
                      className={`p-6 flex items-center justify-between transition-colors ${item.isCurrentUser ? "bg-indigo-500/10" : "hover:bg-white/5"
                        }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${item.rank === 1 ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                          item.rank === 2 ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" :
                            item.rank === 3 ? "bg-orange-500/10 text-orange-400 border-orange-500/30" : "bg-white/5 text-zinc-500 border-white/10"
                          }`}>
                          {item.rank}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-base tracking-wide font-bold truncate ${item.isCurrentUser ? "text-indigo-400" : "text-white"}`}>
                            {item.name} {item.isCurrentUser && "(You)"}
                          </p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mt-0.5">Financial Wellness</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold tracking-tight tabular-nums ${item.score >= 80 ? "text-emerald-400" :
                          item.score >= 60 ? "text-indigo-400" :
                            item.score >= 40 ? "text-amber-400" : "text-rose-400"
                          }`}>
                          {item.score}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-600">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-xs italic font-medium tracking-wide">Competing requires connections. Invite friends to start the rank!</p>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
