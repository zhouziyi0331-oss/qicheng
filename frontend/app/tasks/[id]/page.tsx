"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { taskApi, chatApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import MentorChat from "@/components/mentor/MentorChat";

interface Task {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: string;
  track: string;
  level_required: number;
  budget_gross: number;
  budget_net: number;
  estimated_minutes: number;
  max_assignees: number;
  assigned_count: number;
  tags: string[];
  status: string;
  my_status?: string;
  is_first_task?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  is_filtered: boolean;
  created_at: string;
}

const LEVEL_NAMES = ["入门", "初级", "中级", "高级", "专家", "大师"];
const TRACK_COLORS: Record<string, "blue" | "purple" | "green"> = {
  A: "blue", B: "purple", AB: "green",
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [task, setTask] = useState<Task | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [tab, setTab] = useState<"detail" | "chat">("detail");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMentor, setShowMentor] = useState(false);
  const { role, userId } = useAuthStore();
  const { show } = useToast();
  const router = useRouter();

  useEffect(() => {
    taskApi.detail(id)
      .then(({ data }) => setTask(data.data))
      .catch(() => show("任务不存在", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === "chat") {
      chatApi.getMessages(id)
        .then(({ data }) => setMessages(data.data || []))
        .catch(() => {});
    }
  }, [tab, id]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await taskApi.accept(id);
      show("接单成功！AI正在为你拆解步骤 🎯", "success");
      router.push("/my-tasks");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "接单失败", "error");
    } finally {
      setAccepting(false);
    }
  };

  const handleSend = async () => {
    if (!msgInput.trim()) return;
    setSending(true);
    try {
      await chatApi.send(id, msgInput);
      setMessages((m) => [...m, {
        id: Date.now().toString(),
        sender_id: userId || "",
        sender_role: role || "student",
        content: msgInput,
        is_filtered: false,
        created_at: new Date().toISOString(),
      }]);
      setMsgInput("");
    } catch {
      show("发送失败", "error");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="h-64 rounded-lg animate-pulse" style={{ background: "#161b22" }} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ color: "#484f58" }}>
        <div className="text-4xl mb-4">🔍</div>
        <p>任务不存在或已下架</p>
        <Link href="/tasks" className="text-sm mt-3 block" style={{ color: "#58a6ff" }}>← 返回任务市场</Link>
      </div>
    );
  }

  const canAccept = role === "student" && task.status === "active" && !task.my_status;
  const alreadyAccepted = !!task.my_status;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 fade-in">
      {/* 返回 */}
      <Link href="/tasks" className="inline-flex items-center gap-1 text-sm mb-6 no-underline"
        style={{ color: "#8b949e" }}>
        ← 返回任务市场
      </Link>

      {/* 标题区 */}
      <div className="p-6 rounded-lg mb-4" style={{ background: "#161b22", border: "1px solid #30363d" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge color={TRACK_COLORS[task.track] || "gray"}>赛道 {task.track}</Badge>
              <Badge color="gray">{LEVEL_NAMES[task.level_required] || "?"}等级</Badge>
              {task.is_first_task && <Badge color="green">适合首单</Badge>}
              {task.tags?.slice(0, 3).map((t) => <Badge key={t} color="gray">{t}</Badge>)}
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: "#e6edf3" }}>{task.title}</h1>
            <p className="text-sm" style={{ color: "#8b949e" }}>
              {task.assigned_count}/{task.max_assignees} 人已接 ·
              预计 {task.estimated_minutes >= 60
                ? `${Math.round(task.estimated_minutes / 60)}小时`
                : `${task.estimated_minutes}分钟`}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold" style={{ color: "#3fb950" }}>¥{task.budget_net}</div>
            <div className="text-xs mt-0.5" style={{ color: "#484f58" }}>学生实得</div>
          </div>
        </div>

        {/* 接单按钮 */}
        {role === "student" && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "#30363d" }}>
            {alreadyAccepted ? (
              <div className="flex items-center justify-between">
                <Badge color="blue">已接单 · {task.my_status}</Badge>
                <Link href="/my-tasks" className="text-sm no-underline" style={{ color: "#58a6ff" }}>
                  查看进度 →
                </Link>
              </div>
            ) : canAccept ? (
              <Button className="w-full" loading={accepting} onClick={handleAccept}>
                立即接单 · 开始赚取 ¥{task.budget_net}
              </Button>
            ) : (
              <p className="text-sm text-center" style={{ color: "#484f58" }}>
                {task.status !== "active" ? "该任务已结束" : "名额已满"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      {alreadyAccepted && (
        <div className="flex rounded-lg overflow-hidden mb-4" style={{ border: "1px solid #30363d" }}>
          {(["detail", "chat"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2 text-sm font-medium transition-colors"
              style={{
                background: tab === t ? "#21262d" : "#161b22",
                color: tab === t ? "#e6edf3" : "#8b949e",
              }}>
              {t === "detail" ? "📋 任务详情" : "💬 沟通记录"}
            </button>
          ))}
        </div>
      )}

      {/* AI导师悬浮按钮 */}
      {alreadyAccepted && (
        <button
          onClick={() => setShowMentor(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40"
          style={{
            background: "linear-gradient(135deg, #A78BFA 0%, #EC4899 100%)",
          }}
          title="问AI导师"
        >
          <Image src="/cat-logo.png" alt="AI导师" width={40} height={40} />
        </button>
      )}

      {/* 详情 */}
      {tab === "detail" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
            <h3 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>任务描述</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#e6edf3" }}>
              {task.description}
            </p>
          </div>
          <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
            <h3 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>验收标准</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#e6edf3" }}>
              {task.acceptance_criteria}
            </p>
          </div>
          <div className="p-4 rounded-lg text-xs" style={{ background: "#1a3a2a", border: "1px solid #2ea043", color: "#8b949e" }}>
            💡 平台会保护你的联系方式安全。完成 2 单后可解锁与企业的直接联系渠道。
          </div>
        </div>
      )}

      {/* 聊天 */}
      {tab === "chat" && (
        <div className="flex flex-col" style={{ height: "60vh" }}>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 rounded-lg mb-3"
            style={{ background: "#161b22", border: "1px solid #30363d" }}>
            {messages.length === 0 && (
              <p className="text-center text-sm my-auto" style={{ color: "#484f58" }}>
                暂无消息 · 可向企业提问任务细节
              </p>
            )}
            {messages.map((m) => {
              const isMine = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-xs px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: isMine ? "#1f3358" : "#21262d",
                      border: `1px solid ${isMine ? "#1f4a8a" : "#30363d"}`,
                      color: "#e6edf3",
                    }}>
                    {!isMine && (
                      <p className="text-xs mb-1" style={{ color: "#8b949e" }}>
                        {m.sender_role === "company" ? "🏢 企业" : "🎓 学生"}
                      </p>
                    )}
                    <p>{m.content}</p>
                    {m.is_filtered && (
                      <p className="text-xs mt-1" style={{ color: "#d29922" }}>⚠️ 含联系方式已屏蔽</p>
                    )}
                    <p className="text-xs mt-1 text-right" style={{ color: "#484f58" }}>
                      {new Date(m.created_at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="输入消息，Enter 发送 · 联系方式会被自动屏蔽"
              className="flex-1"
              style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
            />
            <Button onClick={handleSend} loading={sending} size="sm">发送</Button>
          </div>
        </div>
      )}

      {/* AI导师聊天弹窗 */}
      {showMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
            <MentorChat taskId={id} onClose={() => setShowMentor(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
