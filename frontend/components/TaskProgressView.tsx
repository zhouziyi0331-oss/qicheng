"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { taskApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface TaskProgress {
  id: string;
  title: string;
  status: string;
  current_step: number;
  total_steps: number;
  steps: Array<{
    step_number: number;
    title: string;
    description: string;
    status: "pending" | "in_progress" | "completed";
    completed_at?: string;
  }>;
  assignee: {
    id: string;
    nickname: string;
  };
  deadline: string;
  progress_percentage: number;
}

const STATUS_MAP: Record<string, { label: string; color: "blue" | "orange" | "green" | "gray" }> = {
  pending: { label: "待开始", color: "gray" },
  in_progress: { label: "进行中", color: "blue" },
  submitted: { label: "已提交", color: "orange" },
  completed: { label: "已完成", color: "green" },
};

export default function TaskProgressPage({ taskId, assigneeId }: { taskId: string; assigneeId: string }) {
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  const router = useRouter();

  const loadProgress = () => {
    taskApi.getProgress(taskId, assigneeId)
      .then(({ data }) => setProgress(data.data))
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProgress();
    // 每30秒自动刷新
    const interval = setInterval(loadProgress, 30000);
    return () => clearInterval(interval);
  }, [taskId, assigneeId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-64 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ color: "#484f58" }}>
        <div className="text-4xl mb-4">🔍</div>
        <p>任务进度不存在</p>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[progress.status];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 返回 */}
      <Link href="/company/tasks" className="inline-flex items-center gap-1 text-sm mb-6 no-underline"
        style={{ color: "#8b949e" }}>
        ← 返回任务列表
      </Link>

      {/* 任务信息 */}
      <div className="p-6 rounded-lg mb-6" style={{ background: "#161b22", border: "1px solid #30363d" }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
              <span className="text-xs" style={{ color: "#484f58" }}>
                执行人：{progress.assignee.nickname}
              </span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>{progress.title}</h1>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: "#8b949e" }}>
              整体进度
            </span>
            <span className="text-sm font-bold" style={{ color: "#58a6ff" }}>
              {progress.progress_percentage}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#21262d" }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${progress.progress_percentage}%`,
                background: "linear-gradient(90deg, #58a6ff 0%, #3fb950 100%)",
              }}
            />
          </div>
        </div>

        {/* 截止时间 */}
        <div className="flex items-center gap-2 text-sm" style={{ color: "#8b949e" }}>
          <span>⏰</span>
          <span>截止时间：{new Date(progress.deadline).toLocaleString("zh-CN")}</span>
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: "#e6edf3" }}>执行步骤</h2>
        {progress.steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isInProgress = step.status === "in_progress";
          const isPending = step.status === "pending";

          return (
            <div
              key={step.step_number}
              className="p-5 rounded-lg relative"
              style={{
                background: isCompleted ? "#1a3a2a" : isInProgress ? "#1f3358" : "#161b22",
                border: `1px solid ${isCompleted ? "#2ea043" : isInProgress ? "#58a6ff" : "#30363d"}`,
              }}
            >
              {/* 连接线 */}
              {index < progress.steps.length - 1 && (
                <div
                  className="absolute left-8 top-full h-4 w-0.5"
                  style={{
                    background: isCompleted ? "#2ea043" : "#30363d",
                  }}
                />
              )}

              <div className="flex items-start gap-4">
                {/* 步骤图标 */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                  style={{
                    background: isCompleted ? "#2ea043" : isInProgress ? "#58a6ff" : "#21262d",
                    color: isCompleted || isInProgress ? "#FFFFFF" : "#484f58",
                    border: `2px solid ${isCompleted ? "#2ea043" : isInProgress ? "#58a6ff" : "#30363d"}`,
                  }}
                >
                  {isCompleted ? "✓" : step.step_number}
                </div>

                {/* 步骤内容 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold" style={{ color: "#e6edf3" }}>
                      {step.title}
                    </h3>
                    {isInProgress && (
                      <Badge color="blue">进行中</Badge>
                    )}
                  </div>
                  <p className="text-sm mb-2" style={{ color: "#8b949e" }}>
                    {step.description}
                  </p>
                  {step.completed_at && (
                    <p className="text-xs" style={{ color: "#3fb950" }}>
                      ✓ 完成于 {new Date(step.completed_at).toLocaleString("zh-CN")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 刷新提示 */}
      <div className="mt-6 p-4 rounded-lg text-sm text-center" style={{ background: "#21262d", border: "1px solid #30363d", color: "#8b949e" }}>
        💡 进度每30秒自动刷新，或点击
        <button
          onClick={loadProgress}
          className="mx-1 px-2 py-1 rounded"
          style={{ background: "#30363d", color: "#58a6ff" }}
        >
          手动刷新
        </button>
      </div>
    </div>
  );
}
