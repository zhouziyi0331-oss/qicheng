"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";

interface LogEntry {
  id: string;
  admin_id: string;
  admin_nickname: string;
  action: string;
  target_type: string;
  target_id: string;
  note: string;
  created_at: string;
}

const ACTION_COLOR: Record<string, "blue" | "orange" | "red" | "green" | "gray"> = {
  task_takedown: "red",
  company_blacklist: "red",
  withdrawal_approve: "green",
  broadcast_notification: "blue",
  task_intervene: "orange",
  send_notification: "blue",
  config_update: "orange",
  student_data_export: "gray",
  tag_update: "gray",
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { show } = useToast();

  const load = (p: number) => {
    setLoading(true);
    adminApi.getLogs(p)
      .then(({ data }) => {
        const items = data.data || [];
        if (p === 1) setLogs(items);
        else setLogs((prev) => [...prev, ...items]);
        setHasMore(items.length === 50);
      })
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin" className="text-sm no-underline" style={{ color: "#8b949e" }}>← 后台</Link>
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>操作日志</h1>
      </div>
      <p className="text-xs mb-6" style={{ color: "#484f58" }}>
        所有管理员操作均不可删除、不可修改 · 仅超级管理员可查看全部日志
      </p>

      {loading && page === 1 ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 rounded-lg flex items-start gap-3"
                style={{ background: "#161b22", border: "1px solid #30363d" }}>
                <Badge color={ACTION_COLOR[log.action] || "gray"}>{log.action.replace(/_/g, " ")}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm" style={{ color: "#e6edf3" }}>{log.admin_nickname}</span>
                    <span className="text-xs" style={{ color: "#484f58" }}>
                      {log.target_type} #{log.target_id?.slice(0, 8)}
                    </span>
                  </div>
                  {log.note && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#8b949e" }}>{log.note}</p>
                  )}
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "#484f58" }}>
                  {new Date(log.created_at).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-center py-16 text-sm" style={{ color: "#484f58" }}>暂无操作记录</p>
            )}
          </div>
          {hasMore && (
            <button
              onClick={() => { const next = page + 1; setPage(next); load(next); }}
              disabled={loading}
              className="w-full mt-4 py-3 rounded-lg text-sm"
              style={{ background: "#21262d", border: "1px solid #30363d", color: "#8b949e" }}
            >
              {loading ? "加载中..." : "加载更多"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
