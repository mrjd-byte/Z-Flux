"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, UserPlus, Check, X, ShieldAlert, Mail, Clock, UserCheck, Trophy, Eye, EyeOff } from "lucide-react";

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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Friends</h1>
          <p className="text-white/50 text-sm mt-1">Manage your network and connect with others.</p>
        </div>

        {/* Invite Form */}
        <form onSubmit={sendInvite} className="flex gap-2">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              placeholder="Friend's email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full md:w-64 transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={inviteLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
          >
            {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Invite
          </button>
        </form>
      </div>

      <div className="flex justify-end">
        <button
          onClick={toggleVisibility}
          className={`text-xs flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
            isScoreVisible 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : "bg-white/5 border-white/10 text-white/40"
          }`}
        >
          {isScoreVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {isScoreVisible ? "Score visible to friends" : "Score hidden from friends"}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border flex gap-3 items-center backdrop-blur-sm ${
          message.type === "success" 
            ? "bg-green-500/10 border-green-500/20 text-green-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {message.type === "success" ? <Check className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Friends List Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-400" />
            Your Friends
          </h2>
          {friends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <div key={friend.id} className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                      {friend.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{friend.email}</p>
                      <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                        Added {new Date(friend.since).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
              <p className="text-white/30 text-sm">No friends added yet. Start connecting!</p>
            </div>
          )}
        </div>

        {/* Requests Sidebars */}
        <div className="space-y-8">
          
          {/* Incoming Requests */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white tracking-tight">Incoming Requests</h2>
            {pendingIncoming.length > 0 ? (
              <div className="space-y-3">
                {pendingIncoming.map((req) => (
                  <div key={req.id} className="p-4 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{req.email}</p>
                      <p className="text-white/40 text-[10px] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {new Date(req.at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => respondToRequest(req.id, "ACCEPTED")}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                        title="Accept"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                         onClick={() => respondToRequest(req.id, "REJECTED")}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/20 text-xs italic">No pending invitations.</p>
            )}
          </div>

          {/* Sent Requests */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white tracking-tight">Sent Invites</h2>
            {sentRequests.length > 0 ? (
              <div className="space-y-3">
                {sentRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between gap-4 opacity-80">
                    <div className="min-w-0">
                      <p className="text-white/70 text-sm truncate">{req.email}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        req.status === "PENDING" ? "bg-yellow-500/10 text-yellow-500" :
                        req.status === "REJECTED" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/20 text-xs italic">You haven't sent any invites.</p>
            )}
          </div>

          {/* Leaderboard Section */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Social Leaderboard
            </h2>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
               {leaderboardLoading ? (
                 <div className="p-8 flex justify-center">
                   <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                 </div>
               ) : leaderboard.length > 0 ? (
                 <div className="divide-y divide-white/5">
                   {leaderboard.map((item) => (
                     <div 
                      key={item.email} 
                      className={`p-4 flex items-center justify-between transition-colors ${
                        item.isCurrentUser ? "bg-blue-500/10" : "hover:bg-white/5"
                      }`}
                     >
                        <div className="flex items-center gap-4">
                          <span className={`w-6 text-center font-bold ${
                            item.rank === 1 ? "text-yellow-400 text-lg" : 
                            item.rank === 2 ? "text-slate-300" : 
                            item.rank === 3 ? "text-amber-600" : "text-white/20"
                          }`}>
                            {item.rank === 1 ? "🏆" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : item.rank}
                          </span>
                          <div className="min-w-0">
                            <p className={`text-sm font-medium truncate ${item.isCurrentUser ? "text-blue-400" : "text-white"}`}>
                              {item.name} {item.isCurrentUser && "(You)"}
                            </p>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Financial Health</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            item.score >= 80 ? "text-green-400" : 
                            item.score >= 60 ? "text-blue-400" : 
                            item.score >= 40 ? "text-yellow-400" : "text-red-400"
                          }`}>
                            {item.score}
                          </p>
                        </div>
                     </div>
                   ))}
                 </div>
               ) : (
                <div className="p-8 text-center text-white/30 text-sm italic">
                  No scores available. Add friends to compete!
                </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
