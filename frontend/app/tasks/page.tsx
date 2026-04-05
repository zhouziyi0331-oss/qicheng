"use client";
import { useState, useEffect } from "react";
import { taskApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string;
  budget_net: number;
  level_required: number;
  track_type: string;
  estimated_hours: number;
  tags: string[];
  status: string;
  assignee_count: number;
  max_assignees: number;
}

const LEVEL_NAMES = ["入门", "初级", "中级", "高级", "专家", "大师"];
const TRACK_COLORS: Record<string, "blue" | "purple" | "green"> = {
  A: "blue", B: "purple", AB: "green",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    taskApi.market().then(({ data }) => {
      setTasks(data.data || []);
    }).catch(() => show("加载任务失败", "error")).finally(() => setLoading(false));
  }, []);

  const handleAccept = async (taskId: string) => {
    setAccepting(taskId);
    try {
      await taskApi.accept(taskId);  // POST /tasks/:id/accept
      show("接单成功！AI正在为你拆解步骤 🎯", "success");
      setTasks((ts) => ts.filter((t) => t.id !== taskId));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "接单失败，请重试", "error");
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>任务市场</h1>
          <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
            {loading ? "加载中..." : `共 ${tasks.length} 个任务待接取`}
          </p>
        </div>
        <Link
          href="/my-tasks"
          className="text-sm no-underline px-3 py-1.5 rounded-md"
          style={{ background: "#21262d", border: "1px solid #30363d", color: "#8b949e" }}
        >
          我的任务
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <div className="text-center py-24" style={{ color: "#484f58" }}>
          <div className="text-4xl mb-4">📭</div>
          <p>暂无可接任务</p>
          <p className="text-sm mt-2">新任务每天更新，常来看看</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-5 rounded-lg fade-in"
            style={{ background: "#161b22", border: "1px solid #30363d" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge color={TRACK_COLORS[task.track_type] || "gray"}>
                    赛道 {task.track_type}
                  </Badge>
                  <Badge color="gray">
                    {LEVEL_NAMES[task.level_required] || "未知"}等级
                  </Badge>
                  {task.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} color="gray">{tag}</Badge>
                  ))}
                </div>
                <h3 className="font-semibold mb-1.5" style={{ color: "#e6edf3" }}>
                  {task.title}
                </h3>
                <p className="text-sm line-clamp-2" style={{ color: "#8b949e" }}>
                  {task.description}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-xl font-bold" style={{ color: "#3fb950" }}>
                  ¥{task.budget_net}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#8b949e" }}>
                  预计 {task.estimated_hours}h
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs" style={{ color: "#484f58" }}>
                {task.assignee_count}/{task.max_assignees} 人已接
              </span>
              <Button
                size="sm"
                loading={accepting === task.id}
                onClick={() => handleAccept(task.id)}
              >
                立即接单
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
