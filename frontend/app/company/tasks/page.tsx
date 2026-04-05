"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { taskApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface CompanyTask {
  id: string;
  title: string;
  status: string;
  budget_gross: number;
  budget_net: number;
  assignee_count: number;
  max_assignees: number;
  created_at: string;
  submissions?: Array<{
    assignee_id: string;
    nickname: string;
    submission_count: number;
    status: string;
  }>;
}

const STATUS_MAP: Record<string, { label: string; color: "blue" | "orange" | "green" | "gray" | "red" }> = {
  draft: { label: "草稿", color: "gray" },
  pending_review: { label: "待审核", color: "orange" },
  active: { label: "招募中", color: "blue" },
  in_progress: { label: "进行中", color: "blue" },
  completed: { label: "已完成", color: "green" },
  cancelled: { label: "已取消", color: "red" },
};

export default function CompanyTasksPage() {
  const [tasks, setTasks] = useState<CompanyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    taskApi.companyTasks().then(({ data }) => {
      setTasks(data.data || []);
    }).catch(() => show("加载失败", "error")).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (taskId: string, assigneeId: string) => {
    setApproving(`${taskId}-${assigneeId}`);
    try {
      await taskApi.approve(taskId, assigneeId);
      show("已审核通过，款项已结算 ✅", "success");
      setTasks((ts) => ts.map((t) =>
        t.id === taskId ? { ...t, status: "completed" } : t
      ));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "操作失败", "error");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (taskId: string, assigneeId: string) => {
    const reason = window.prompt("请输入打回原因（学生会看到，请友好表达）：");
    if (!reason) return;
    try {
      await taskApi.reject(taskId, assigneeId, reason);
      show("已打回，学生将收到AI优化后的反馈 📝", "info");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "操作失败", "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>我的任务</h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>管理已发布的任务和提交审核</p>
        </div>
        <Link
          href="/company/post"
          className="inline-flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium text-white no-underline"
          style={{ background: "#238636", border: "1px solid #2ea043" }}
        >
          + 发布新任务
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-24" style={{ color: "#484f58" }}>
          <div className="text-4xl mb-4">📦</div>
          <p>还没有发布任何任务</p>
          <Link href="/company/post" className="text-sm mt-2 block" style={{ color: "#58a6ff" }}>
            发布第一个任务 →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tasks.map((task) => {
            const s = STATUS_MAP[task.status] || { label: task.status, color: "gray" as const };
            return (
              <div
                key={task.id}
                className="p-5 rounded-lg"
                style={{ background: "#161b22", border: "1px solid #30363d" }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color={s.color}>{s.label}</Badge>
                      <span className="text-xs" style={{ color: "#484f58" }}>
                        {task.assignee_count}/{task.max_assignees} 人接单
                      </span>
                    </div>
                    <h3 className="font-semibold" style={{ color: "#e6edf3" }}>{task.title}</h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold" style={{ color: "#3fb950" }}>¥{task.budget_gross}</div>
                    <div className="text-xs" style={{ color: "#484f58" }}>预算</div>
                  </div>
                </div>

                {/* 待审核的提交 */}
                {task.submissions && task.submissions.filter((s) => s.status === "submitted").length > 0 && (
                  <div className="border-t pt-3 mt-1" style={{ borderColor: "#30363d" }}>
                    <p className="text-xs font-medium mb-2" style={{ color: "#d29922" }}>
                      ⏳ 待审核提交
                    </p>
                    {task.submissions.filter((s) => s.status === "submitted").map((sub) => (
                      <div key={sub.assignee_id} className="flex items-center justify-between p-3 rounded-lg mb-2"
                        style={{ background: "#21262d", border: "1px solid #30363d" }}>
                        <div>
                          <p className="text-sm" style={{ color: "#e6edf3" }}>{sub.nickname}</p>
                          <p className="text-xs" style={{ color: "#8b949e" }}>第{sub.submission_count}次提交</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={approving === `${task.id}-${sub.assignee_id}`}
                            onClick={() => handleApprove(task.id, sub.assignee_id)}
                          >
                            通过
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(task.id, sub.assignee_id)}
                          >
                            打回
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
