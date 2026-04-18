"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, Check, Clock, Loader2, Mail, Users, Layers, TrendingDown, IndianRupee } from "lucide-react";

type Notification = {
  id: string;
  type: "FRIEND_REQUEST" | "GROUP_INVITE" | "CONTRIBUTION" | "EXPENSE";
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id?: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId: id })
      });

      if (res.ok) {
        if (id) {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "FRIEND_REQUEST": return <Users className="w-4 h-4 text-blue-400" />;
      case "GROUP_INVITE": return <Layers className="w-4 h-4 text-purple-400" />;
      case "CONTRIBUTION": return <IndianRupee className="w-4 h-4 text-green-400" />;
      case "EXPENSE": return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Bell className="w-4 h-4 text-white/40" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition-all relative ${
          isOpen ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/5">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 className="text-sm font-bold text-white tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`p-4 hover:bg-white/5 transition-colors cursor-pointer group flex gap-3 ${
                      !n.read ? "bg-blue-500/[0.03]" : "opacity-60"
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0 p-2 bg-white/5 rounded-lg border border-white/5 group-hover:scale-110 transition-transform">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!n.read ? "text-white font-medium" : "text-white/60"}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 opacity-40">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-white/20 text-xs italic">No new notifications.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
