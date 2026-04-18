"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus, Users, ArrowRight, Layers } from "lucide-react";

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
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Group Wallets</h1>
          <p className="text-white/50 text-sm mt-1">Shared virtual pools for gifts, rent, or dining.</p>
        </div>

        <form onSubmit={handleCreateGroup} className="flex gap-2">
          <input
            type="text"
            placeholder="New group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full md:w-64"
          />
          <button
            type="submit"
            disabled={createLoading}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50 transition-all"
          >
            {createLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length > 0 ? (
          groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:scale-[1.02] transition-all duration-300 group hover:border-blue-500/30"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{group.name}</h3>
              <div className="flex items-center gap-2 text-white/40 text-xs font-medium uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                {group.memberCount} {group.memberCount === 1 ? "Member" : "Members"}
              </div>
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/20 transition-all pointer-events-none" />
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
            <Layers className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 italic">You don't have any group wallets yet. Create one to start!</p>
          </div>
        )}
      </div>
    </div>
  );
}
