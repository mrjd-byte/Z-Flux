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
  LogOut,
  Menu,
  X as CloseIcon,
  Settings,
  ChevronDown as ChevronIcon
} from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import { InsightToastProvider } from "@/context/InsightToastContext";
import { InsightToastController } from "@/components/InsightToastController";
import { SmartFeedbackProvider } from "@/context/SmartFeedbackContext";
import { SmartFeedbackController } from "@/components/SmartFeedbackController";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

    // Close dropdown on click outside
    const handleClickOutside = () => setIsProfileOpen(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
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
        { name: "AI Decision Engine", href: "/ai", icon: Sparkles },
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
    <InsightToastProvider>
      <SmartFeedbackProvider>
        <div className="flex h-screen overflow-hidden font-sans relative bg-[#050505]">
          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              fixed md:relative z-50 h-full flex flex-col 
              bg-white/5 backdrop-blur-3xl border-r border-white/10 
              sidebar-transition group/sidebar overflow-hidden
              ${isMobileMenuOpen ? "translate-x-0 w-[240px]" : "-translate-x-full md:translate-x-0 w-[72px] hover:w-[220px]"}
            `}
          >
            <div className="h-16 flex items-center px-6 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-white sidebar-label opacity-0 group-hover/sidebar:opacity-100 whitespace-nowrap overflow-hidden">
                  Z-Flux
                </span>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar overflow-x-hidden">
              {menuGroups.map((group) => (
                <div key={group.label} className="space-y-2">
                  <h3 className="px-3 text-[9px] text-zinc-600 uppercase tracking-[0.3em] font-black sidebar-label opacity-0 group-hover/sidebar:opacity-100 whitespace-nowrap overflow-hidden">
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
                          className={`
                            relative flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-bold transition-all sidebar-item group
                            ${isActive
                              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                              : "text-zinc-500 hover:text-white hover:bg-white/5"
                            }
                          `}
                        >
                          <div className={`relative flex items-center justify-center flex-shrink-0 ${!isActive && "group-hover:text-indigo-400"} transition-colors`}>
                            <Icon className={`w-4 h-4 transition-transform group-hover:scale-110`} />
                            {/* Active Glow for Collapsed Mode */}
                            {isActive && (
                              <div className="absolute inset-0 bg-white/20 blur-md rounded-full opacity-0 group-hover/sidebar:opacity-0 opacity-100 block md:hidden md:group-hover/sidebar:hidden" />
                            )}
                          </div>
                          
                          <span className="sidebar-label opacity-0 group-hover/sidebar:opacity-100 whitespace-nowrap overflow-hidden translate-x-[-10px] group-hover/sidebar:translate-x-0">
                            {item.name}
                          </span>

                          {/* Custom Tooltip (visible only when collapsed) */}
                          <div className="sidebar-tooltip md:block hidden group-hover/sidebar:hidden">
                            {item.name}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-white/5 mt-auto">
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-3 py-2.5 w-full text-sm font-bold text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group relative sidebar-item"
              >
                <div className="flex-shrink-0">
                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
                <span className="sidebar-label opacity-0 group-hover/sidebar:opacity-100 whitespace-nowrap overflow-hidden translate-x-[-10px] group-hover/sidebar:translate-x-0">
                  Sign Out
                </span>
                <div className="sidebar-tooltip md:block hidden group-hover/sidebar:hidden">
                  Sign Out
                </div>
              </button>
            </div>
          </aside>

          {/* Main Container */}
          <div className="flex-1 flex flex-col min-w-0 relative z-10">
            {/* Topbar */}
            <header className="h-16 flex-shrink-0 bg-black/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-50">
              {/* Mobile Menu Toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(!isMobileMenuOpen); }}
                className="md:hidden p-2 bg-white/5 border border-white/10 rounded-lg text-zinc-400"
              >
                {isMobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex-1" /> {/* Spacer */}

              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-2 md:gap-4">
                  <ThemeToggle />
                  <NotificationDropdown />
                </div>

                <div className="h-6 w-[1px] bg-white/5 mx-1" />

                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }}
                    className="flex items-center gap-3 p-1 rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-bold text-white leading-none tracking-tight">
                        {userEmail?.split('@')[0] || "User"}
                      </p>
                      <p className="text-[9px] text-indigo-400 mt-1 uppercase font-black tracking-widest opacity-80">
                        PRO ACCOUNT
                      </p>
                    </div>
                    <div className="relative">
                      <div className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl text-white text-base font-bold shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-all border border-white/10">
                        {initial}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#050505] rounded-full flex items-center justify-center">
                        <ChevronIcon className={`w-2 h-2 text-zinc-500 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-full right-0 mt-3 w-56 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]"
                    >
                      <div className="px-4 py-3 border-b border-white/5 mb-1">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Connected as</p>
                        <p className="text-xs font-bold text-white truncate">{userEmail}</p>
                      </div>

                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all group"
                      >
                        <User className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" />
                        Account Profile
                      </Link>

                      <button
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all group"
                      >
                        <Settings className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" />
                        Fast Settings
                      </button>

                      <div className="h-px bg-white/5 my-1" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-all group"
                      >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Terminate Session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Content Area */}
            <main className={`flex-1 ${pathname === '/ai-advisor' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
              <div className={`${pathname === '/ai-advisor' ? 'h-full' : 'p-8 max-w-7xl mx-auto min-h-full'}`}>
                {children}
              </div>

              {pathname !== '/ai-advisor' && (
                <footer className="p-8 border-t border-white/5 max-w-7xl mx-auto flex items-center justify-between opacity-40">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                    © 2026 Z-FLUX PROTOCOL
                  </p>
                  <div className="flex gap-8">
                    <Link href="#" className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors">Privacy</Link>
                    <Link href="#" className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-indigo-400 transition-colors">Terms</Link>
                  </div>
                </footer>
              )}
            </main>
          </div>
        </div>
        <InsightToastController />
        <SmartFeedbackController />
      </SmartFeedbackProvider>
    </InsightToastProvider>
  );
}
