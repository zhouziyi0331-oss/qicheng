"use client";
import { useState, useEffect } from "react";
import { notificationApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  meta?: Record<string, unknown>;
}

const TYPE_ICON: Record<string, string> = {
  task_assigned: "🎯",
  task_approved: "✅",
  task_rejected: "📝",
  first_task_settled: "🎉",
  emotion_signal: "💙",
  contact_unlocked: "🤝",
  level_up: "⬆️",
  system: "📢",
};

const TYPE_COLOR: Record<string, "blue" | "green" | "orange" | "purple" | "gray"> = {
  task_approved: "green",
  first_task_settled: "green",
  task_assigned: "blue",
  task_rejected: "orange",
  contact_unlocked: "purple",
  level_up: "blue",
  system: "gray",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    notificationApi.list().then(({ data }) => {
      setNotifications(data.data || []);
    }).catch(() => show("加载通知失败", "error")).finally(() => setLoading(false));
  }, []);

  const handleRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((ns) =>
        ns.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // 静默失败
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>通知中心</h1>
          {unreadCount > 0 && (
            <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
              {unreadCount} 条未读
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={async () => {
              await Promise.allSettled(
                notifications.filter((n) => !n.isRead).map((n) => notificationApi.markRead(n.id))
              );
              setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
            }}
            className="text-xs px-3 py-1.5 rounded-md"
            style={{ background: "#21262d", border: "1px solid #30363d", color: "#8b949e" }}
          >
            全部标为已读
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-24" style={{ color: "#484f58" }}>
          <div className="text-4xl mb-4">🔔</div>
          <p>暂无通知</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.isRead && handleRead(n.id)}
            className="p-4 rounded-lg transition-colors cursor-pointer"
            style={{
              background: n.isRead ? "#161b22" : "#1a2535",
              border: `1px solid ${n.isRead ? "#30363d" : "#1f4a8a"}`,
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">
                {TYPE_ICON[n.type] || "📢"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium" style={{ color: "#e6edf3" }}>{n.title}</p>
                  <Badge color={TYPE_COLOR[n.type] || "gray"}>
                    {n.type.replace(/_/g, " ")}
                  </Badge>
                  {!n.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: "#58a6ff" }} />
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#8b949e" }}>{n.body}</p>
                <p className="text-xs mt-2" style={{ color: "#484f58" }}>
                  {new Date(n.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
