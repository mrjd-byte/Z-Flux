"use client";

import { useEffect, useState, useCallback, use } from "react";
import { Loader2, ArrowLeft, Users, History, Handshake, Mail, Calendar, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

type Friend = {
  id: string;
  friendId: string;
  email: string;
  since: string;
};

type Group = {
  id: string;
  name: string;
  memberCount: number;
};

export default function FriendDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [friend, setFriend] = useState<Friend | null>(null);
  const [sharedGroups, setSharedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch friends list to find this friend
      const friendsRes = await fetch("/api/friends/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const friendsData = await friendsRes.json();
      
      if (friendsRes.ok) {
        const foundFriend = friendsData.friends.find((f: Friend) => f.id === id);
        setFriend(foundFriend || null);
        
        if (foundFriend) {
          // Fetch groups and filter for those containing this friend
          const groupsRes = await fetch("/api/groups/list", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const groupsData = await groupsRes.json();
          
          if (groupsRes.ok) {
            // Since we can't easily check members from groups/list, 
            // we'd normally need a more efficient way. 
            // For now, we'll fetch details of each group to check membership, 
            // but that's potentially slow. 
            // Optimization: Only fetch if we really need it or if the API supports filtering.
            // As a fallback, we'll show all groups as "Shared Pools" if we can't filter.
            // However, let's try to fetch group details in parallel for a small subset.
            
            const shared = [];
            for (const group of groupsData.groups) {
              const detailRes = await fetch(`/api/groups/${group.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const detail = await detailRes.json();
              if (detail.members?.some((m: any) => m.email === foundFriend.email)) {
                shared.push(group);
              }
            }
            setSharedGroups(shared);
          }
        }
      }
    } catch (error) {
      console.error("Fetch friend detail error:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!friend) return <div className="p-10 text-center text-zinc-500 font-medium">Friend connection not found.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-32 px-4">
      <Link
        href="/friends"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-base font-semibold mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Network
      </Link>

      <SectionContainer
        title={friend.email.split("@")[0]}
        subtitle={
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4" /> {friend.email}
          </span>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Friend Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="p-8 text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-indigo-500/10 flex items-center justify-center text-3xl font-bold text-indigo-400 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                {friend.email[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{friend.email.split("@")[0]}</h3>
                <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mt-1 flex items-center justify-center gap-2">
                  <Calendar className="w-3 h-3" /> Connected {new Date(friend.since).toLocaleDateString()}
                </p>
              </div>
              
              <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Shared Pools</p>
                  <p className="text-2xl font-bold text-white mt-1">{sharedGroups.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Net Balance</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">₹0.00</p>
                </div>
              </div>
            </GlassCard>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] pl-1">Actions</h4>
              <div className="space-y-3">
                <Button variant="primary" className="w-full justify-start gap-3 py-6 rounded-2xl">
                  <Plus className="w-5 h-5" /> Add to New Group
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 py-6 rounded-2xl border-white/5 hover:bg-white/5">
                  <Handshake className="w-5 h-5 text-amber-500" /> Settle All Debts
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 py-6 rounded-2xl border-white/5 hover:bg-white/5">
                  <History className="w-5 h-5 text-indigo-400" /> View Shared History
                </Button>
              </div>
            </div>
          </div>

          {/* Shared Activity/Groups */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" /> Common Liquidity Pools
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sharedGroups.length > 0 ? (sharedGroups.map(group => (
                  <Link key={group.id} href={`/groups/${group.id}`}>
                    <GlassCard className="p-6 transition-all group" hoverEffect>
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-500/20">
                          {group.memberCount} Nodes
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{group.name}</h4>
                    </GlassCard>
                  </Link>
                ))) : (
                  <div className="col-span-full p-12 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                    <p className="text-zinc-500 text-sm italic font-medium">No shared pools detected yet. Start a group to manage common expenses.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" /> Recent Nexus Transactions
              </h3>
              <GlassCard className="p-12 text-center opacity-30 border-dashed border-white/10">
                <p className="text-sm font-bold tracking-widest text-zinc-500 uppercase">Synchronization History Unavailable</p>
              </GlassCard>
            </div>
          </div>

        </div>
      </SectionContainer>
    </div>
  );
}
