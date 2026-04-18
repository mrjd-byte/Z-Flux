"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, PieChart, Sparkles, User, Users, Layers, Rss } from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";

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

  const initial = userEmail ? userEmail[0].toUpperCase() : "U";


  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { name: "Budget", href: "/budget", icon: PieChart },
    { name: "AI Advisor", href: "/ai-advisor", icon: Sparkles },
    { name: "Friends", href: "/friends", icon: Users },
    { name: "Groups", href: "/groups", icon: Layers },
    { name: "Social Feed", href: "/activity", icon: Rss },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="flex h-screen bg-slate-950 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
      {/* Background Glow Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white/5 backdrop-blur-md border-r border-white/10 relative z-10">
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-2 mb-8 px-2 font-bold text-xl text-white tracking-tight">
            <div className="p-1.5 bg-blue-500/10 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <span>Z-Flux</span>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out ${
                    isActive
                      ? "bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/10"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
                  <span className="font-medium text-sm tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        {/* Header */}
        <header className="sticky top-0 z-20 px-8 py-4 bg-slate-950/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
             <Sparkles className="w-3.5 h-3.5" />
             AI Financial Portal
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown />
            <Link 
              href="/profile"
              className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold transition-all duration-200 hover:bg-blue-500/30 hover:scale-110 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]"
              title="View Profile"
            >
              {initial}
            </Link>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
