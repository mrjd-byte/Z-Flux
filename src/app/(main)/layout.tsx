"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Sparkles,
  User,
  Users,
  Layers,
  Rss,
  Search,
  Bell,
  LogOut
} from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setUserEmail(result.email);
        }
      } catch (error) {
        console.error("Failed to load profile for layout:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const initial = userEmail ? userEmail[0].toUpperCase() : "U";

  const menuGroups = [
    {
      label: "Core",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
        { name: "Budget", href: "/budget", icon: PieChart },
      ]
    },
    {
      label: "AI",
      items: [
        { name: "AI Advisor", href: "/ai-advisor", icon: Sparkles },
      ]
    },
    {
      label: "Social",
      items: [
        { name: "Friends", href: "/friends", icon: Users },
        { name: "Groups", href: "/groups", icon: Layers },
        { name: "Social Feed", href: "/activity", icon: Rss },
      ]
    },
    {
      label: "Account",
      items: [
        { name: "Profile", href: "/profile", icon: User },
      ]
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans relative">
      {/* Sidebar */}
      <aside className="relative z-30 w-[240px] flex-shrink-0 bg-white/5 backdrop-blur-3xl border-r border-white/10 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Z-Flux</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <h3 className="px-3 text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-3 font-black">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-base font-medium transition-all group ${isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-indigo-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-base font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Topbar */}
        <header className="h-16 flex-shrink-0 bg-black/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-20">
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Find operations..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ThemeToggle />
            <NotificationDropdown />

            <div className="h-8 w-[1px] bg-white/5 mx-2" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-base font-bold text-white leading-none tracking-tight">
                  {userEmail?.split('@')[0] || "User"}
                </p>
                <p className="text-[10px] text-indigo-400 mt-1 uppercase font-black tracking-widest opacity-80">
                  Secure Access
                </p>
              </div>
              <Link
                href="/profile"
                className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl text-white text-base font-bold shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all active:scale-95"
              >
                {initial}
              </Link>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 max-w-7xl mx-auto min-h-full">
            {children}
          </div>

          <footer className="p-8 border-t border-white/5 max-w-7xl mx-auto flex items-center justify-between opacity-40">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
              © 2026 Z-FLUX PROTOCOL
            </p>
            <div className="flex gap-8">
              <Link href="#" className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors">Privacy</Link>
              <Link href="#" className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors">Terms</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
