"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface AdminTask {
  id: string;
  title: string;
  status: string;
  track_type: string;
  budget_gross: number;
  company_name: string;
  assignee_count: number;
  max_assignees: number;
  created_at: string;
}

const STATUS_COLOR: Record<string, "blue" | "orange" | "green" | "gray" | "red"> = {
  pending_review: "orange",
  active: "blue",
  in_progress: "blue",
  completed: "green",
  cancelled: "red",
  draft: "gray",
};

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    adminApi.companyTasks()
      .then(({ data }) => setTasks(data.data || []))
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleTakedown = async (id: string) => {
    const reason = window.prompt("下架原因（学生和企业都会看到）：");
    if (!reason) return;
    setActing(id);
    try {
      await adminApi.takedownTask(id, reason);
      show("已下架", "success");
      setTasks((ts) => ts.filter((t) => t.id !== id));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "操作失败", "error");
    } finally {
      setActing(null);
    }
  };

  const handleBlacklist = async (task: AdminTask) => {
    const reason = window.prompt(`将企业「${task.company_name}」加入黑名单的原因：`);
    if (!reason) return;
    setActing(`bl-${task.id}`);
    try {
      await adminApi.blacklistCompany(task.id, reason);
      show("已加入黑名单", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "操作失败", "error");
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm no-underline" style={{ color: "#8b949e" }}>← 后台</Link>
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>需求管理</h1>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge color={STATUS_COLOR[task.status] || "gray"}>{task.status}</Badge>
                    <Badge color="gray">赛道 {task.track_type}</Badge>
                    <span className="text-xs" style={{ color: "#484f58" }}>{task.company_name}</span>
                  </div>
                  <p className="font-medium truncate" style={{ color: "#e6edf3" }}>{task.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#484f58" }}>
                    {task.assignee_count}/{task.max_assignees} 人接单 ·
                    {new Date(task.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold mb-2" style={{ color: "#3fb950" }}>¥{task.budget_gross}</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={acting === `bl-${task.id}`}
                      onClick={() => handleBlacklist(task)}
                    >
                      黑名单
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={acting === task.id}
                      onClick={() => handleTakedown(task.id)}
                    >
                      下架
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-center py-16 text-sm" style={{ color: "#484f58" }}>暂无任务</p>
          )}
        </div>
      )}
    </div>
  );
}
