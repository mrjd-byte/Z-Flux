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
        className={`p-2 rounded-lg transition-all relative ${isOpen ? "bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400" : "text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-slate-900/50">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer flex gap-3 ${!n.read ? "bg-blue-50/30 dark:bg-blue-900/5" : "opacity-75"
                      }`}
                  >
                    <div className="mt-1 flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-base leading-relaxed ${!n.read ? "text-slate-900 dark:text-white font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-gray-400 text-base italic">No new notifications.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
