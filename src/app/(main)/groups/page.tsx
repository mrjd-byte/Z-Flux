"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus, Users, ArrowRight, Layers } from "lucide-react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Group = {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/groups/list", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error("Fetch groups error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreateLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newGroupName })
      });

      if (res.ok) {
        setNewGroupName("");
        fetchGroups();
      }
    } catch (error) {
      console.error("Create group error:", error);
    } finally {
      setCreateLoading(false);
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
      title="Group Wallets"
      subtitle="Collaborative virtual pools for shared expenses and savings"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-start mb-8">
        <div>
        </div>

        <GlassCard className="p-2 flex items-center max-w-md w-full">
          <form onSubmit={handleCreateGroup} className="flex gap-2 w-full">
            <input
              type="text"
              placeholder="Enter pool name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-1 pl-4 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-zinc-600"
            />
            <Button
              type="submit"
              disabled={createLoading}
              className="px-6 py-3 flex items-center gap-2"
            >
              {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </Button>
          </form>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length > 0 ? (
          groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <GlassCard className="transition-all group" hoverEffect>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl transition-all border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] group-hover:scale-110">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="p-2 rounded-full bg-white/5 text-zinc-500 group-hover:text-white group-hover:bg-white/10 transition-colors border border-transparent group-hover:border-white/10">
                    <ArrowRight className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{group.name}</h3>
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mt-4">
                  <Users className="w-4 h-4" />
                  {group.memberCount} {group.memberCount === 1 ? "Contributor" : "Contributors"}
                </div>
              </GlassCard>
            </Link>
          ))
        ) : (
          <GlassCard className="col-span-full py-20 text-center border-dashed border-white/10 flex flex-col items-center">
            <Layers className="w-16 h-16 text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium italic">Your shared wallets inventory is empty. Launch a new pool to get started!</p>
          </GlassCard>
        )}
      </div>
    </SectionContainer>
  );
}
