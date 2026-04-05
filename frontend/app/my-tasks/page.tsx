"use client";
import { useState, useEffect } from "react";
import { taskApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FileUpload from "@/components/ui/FileUpload";

interface Step {
  id: string;
  step_number: number;
  title: string;
  description: string;
  tool: string;
  estimated_minutes: number;
  status: string;
}

interface MyTask {
  id: string;
  task_id: string;
  title: string;
  status: string;
  budget_net: number;
  steps: Step[];
  submission_count: number;
  accepted_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: "blue" | "orange" | "green" | "red" | "gray" }> = {
  in_progress: { label: "进行中", color: "blue" },
  submitted: { label: "已提交", color: "orange" },
  completed: { label: "已完成", color: "green" },
  cancelled: { label: "已取消", color: "red" },
};

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [completingStep, setCompletingStep] = useState<string | null>(null);
  const [submitNote, setSubmitNote] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const { show } = useToast();

  useEffect(() => {
    taskApi.myTasks().then(({ data }) => {
      setTasks(data.data || []);
    }).catch(() => show("加载失败", "error")).finally(() => setLoading(false));
  }, []);

  const handleCompleteStep = async (taskId: string, stepNum: number) => {
    const key = `${taskId}-${stepNum}`;
    setCompletingStep(key);
    try {
      await taskApi.completeStep(taskId, stepNum);
      setTasks((ts) => ts.map((t) =>
        t.task_id === taskId
          ? { ...t, steps: t.steps.map((s) => s.step_number === stepNum ? { ...s, status: "completed" } : s) }
          : t
      ));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "操作失败", "error");
    } finally {
      setCompletingStep(null);
    }
  };

  const handleSubmit = async (taskId: string) => {
    setSubmitting(taskId);
    try {
      const fileUrls = fileUrl.trim() ? [fileUrl.trim()] : [];
      await taskApi.submit(taskId, fileUrls, submitNote);
      show("提交成功！等待企业审核 🎉", "success");
      setTasks((ts) => ts.map((t) =>
        t.task_id === taskId ? { ...t, status: "submitted" } : t
      ));
      setExpanded(null);
      setFileUrl("");
      setSubmitNote("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "提交失败", "error");
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: "#e6edf3" }}>我的任务</h1>

      {tasks.length === 0 && (
        <div className="text-center py-24" style={{ color: "#484f58" }}>
          <div className="text-4xl mb-4">📋</div>
          <p>还没有任务</p>
          <a href="/tasks" className="text-sm mt-2 block" style={{ color: "#58a6ff" }}>
            去任务市场接单 →
          </a>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {tasks.map((task) => {
          const s = STATUS_MAP[task.status] || { label: task.status, color: "gray" as const };
          const completedSteps = task.steps?.filter((s) => s.status === "completed").length || 0;
          const totalSteps = task.steps?.length || 0;
          const isExpanded = expanded === task.id;

          return (
            <div
              key={task.id}
              className="rounded-lg overflow-hidden"
              style={{ background: "#161b22", border: "1px solid #30363d" }}
            >
              {/* Header */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : task.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color={s.color}>{s.label}</Badge>
                      {task.submission_count > 0 && (
                        <Badge color="yellow">第{task.submission_count}次提交</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold" style={{ color: "#e6edf3" }}>{task.title}</h3>
                    {totalSteps > 0 && task.status === "in_progress" && (
                      <p className="text-xs mt-1" style={{ color: "#58a6ff" }}>
                        你已完成 {completedSteps}/{totalSteps} 步，还差 {totalSteps - completedSteps} 步就能收款了
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold" style={{ color: "#3fb950" }}>¥{task.budget_net}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#484f58" }}>
                      {isExpanded ? "▲" : "▼"}
                    </div>
                  </div>
                </div>

                {/* 步骤进度条 */}
                {totalSteps > 0 && (
                  <div className="mt-3 flex gap-1">
                    {task.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex-1 h-1 rounded-full"
                        style={{
                          background: step.status === "completed" ? "#3fb950" :
                            step.status === "in_progress" ? "#58a6ff" : "#21262d"
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 展开的步骤详情 */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: "#30363d" }}>
                  <h4 className="text-xs font-medium mt-4 mb-3" style={{ color: "#8b949e" }}>
                    AI拆解步骤
                  </h4>
                  <div className="flex flex-col gap-2 mb-4">
                    {task.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex gap-3 p-3 rounded-lg text-sm"
                        style={{
                          background: step.status === "completed" ? "#1a3a2a" : "#21262d",
                          border: `1px solid ${step.status === "completed" ? "#2ea043" : "#30363d"}`,
                        }}
                      >
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs"
                          style={{
                            background: step.status === "completed" ? "#3fb950" : "#30363d",
                            color: step.status === "completed" ? "#0d1117" : "#8b949e",
                          }}>
                          {step.status === "completed" ? "✓" : step.step_number}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: "#e6edf3" }}>{step.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#8b949e" }}>{step.description}</p>
                          <p className="text-xs mt-1" style={{ color: "#484f58" }}>
                            工具：{step.tool} · 预计 {step.estimated_minutes} 分钟
                          </p>
                        </div>
                        {task.status === "in_progress" && step.status !== "completed" && (
                          <button
                            disabled={completingStep === `${task.task_id}-${step.step_number}`}
                            onClick={() => handleCompleteStep(task.task_id, step.step_number)}
                            className="flex-shrink-0 text-xs px-2 py-1 rounded self-center"
                            style={{ background: "#1f3358", border: "1px solid #58a6ff", color: "#58a6ff" }}
                          >
                            {completingStep === `${task.task_id}-${step.step_number}` ? "..." : "完成"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {task.status === "in_progress" && (
                    <div>
                      <div className="mb-3">
                        <p className="text-xs mb-2" style={{ color: "#8b949e" }}>上传交付物文件</p>
                        <FileUpload
                          onUpload={(url) => setFileUrl(url)}
                          label="选择文件"
                        />
                      </div>
                      <input
                        className="w-full p-3 rounded-lg text-sm mb-2"
                        placeholder="或填写交付物链接：如 Google Doc、飞书文档、GitHub 等"
                        style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                      />
                      <textarea
                        className="w-full h-20 resize-none p-3 rounded-lg text-sm mb-3"
                        placeholder="提交说明（选填）：描述你做了什么，有什么亮点..."
                        style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
                        value={submitNote}
                        onChange={(e) => setSubmitNote(e.target.value)}
                      />
                      <Button
                        className="w-full"
                        loading={submitting === task.task_id}
                        onClick={() => handleSubmit(task.task_id)}
                      >
                        提交交付物
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
