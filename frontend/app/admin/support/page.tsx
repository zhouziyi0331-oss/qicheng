"use client";
import { useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Message {
  id: string;
  sender_role: string;
  content: string;
  is_filtered: boolean;
  created_at: string;
}

export default function AdminSupportPage() {
  const [taskId, setTaskId] = useState("");
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifBody, setNotifBody] = useState("");
  const [notifLoading, setNotifLoading] = useState(false);
  const [interveneNote, setInterveneNote] = useState("");
  const [interveneLoading, setInterveneLoading] = useState(false);
  const { show } = useToast();

  const loadMessages = async () => {
    if (!taskId.trim()) return show("请输入任务ID", "error");
    setMsgLoading(true);
    try {
      const { data } = await adminApi.getTaskMessages(taskId.trim());
      setMessages(data.data || []);
    } catch {
      show("加载失败，请确认任务ID", "error");
    } finally {
      setMsgLoading(false);
    }
  };

  const handleIntervene = async () => {
    if (!taskId.trim() || !interveneNote.trim()) return show("请填写任务ID和介入说明", "error");
    setInterveneLoading(true);
    try {
      await adminApi.interveneTask(taskId.trim(), "intervene", interveneNote.trim());
      show("介入成功，已记录日志", "success");
      setInterveneNote("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "操作失败", "error");
    } finally {
      setInterveneLoading(false);
    }
  };

  const handleSendNotif = async () => {
    if (!userId.trim() || !notifTitle.trim() || !notifBody.trim()) return show("请填写用户ID和通知内容", "error");
    setNotifLoading(true);
    try {
      await adminApi.sendNotification(userId.trim(), notifTitle.trim(), notifBody.trim());
      show("通知已发送", "success");
      setNotifTitle("");
      setNotifBody("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "发送失败", "error");
    } finally {
      setNotifLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm no-underline" style={{ color: "#8b949e" }}>← 后台</Link>
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>客服工具</h1>
      </div>

      <div className="flex flex-col gap-5">
        {/* 查看聊天记录 */}
        <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h2 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>查看任务沟通记录</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="任务 ID (UUID)"
              className="flex-1 p-2.5 rounded-lg text-sm"
              style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
            />
            <Button size="sm" loading={msgLoading} onClick={loadMessages}>查询</Button>
          </div>
          {messages.length > 0 && (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className="flex gap-2 text-sm p-2 rounded"
                  style={{ background: "#21262d" }}>
                  <span className="flex-shrink-0 text-xs font-medium w-12" style={{ color: "#8b949e" }}>
                    {m.sender_role === "company" ? "🏢" : "🎓"}
                  </span>
                  <p style={{ color: m.is_filtered ? "#d29922" : "#e6edf3" }}>
                    {m.content}
                    {m.is_filtered && " [含过滤内容]"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 任务介入 */}
        <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h2 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>任务介入</h2>
          <textarea
            className="w-full h-20 resize-none p-3 rounded-lg text-sm mb-3"
            placeholder="介入说明（将记入操作日志）..."
            style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
            value={interveneNote}
            onChange={(e) => setInterveneNote(e.target.value)}
          />
          <Button size="sm" variant="secondary" loading={interveneLoading} onClick={handleIntervene}>
            执行介入（任务 ID 同上）
          </Button>
        </div>

        {/* 点对点通知 */}
        <div className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h2 className="text-sm font-medium mb-3" style={{ color: "#8b949e" }}>发送点对点通知</h2>
          <div className="flex flex-col gap-3">
            <Input
              label="用户 ID"
              placeholder="用户 UUID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <Input
              label="通知标题"
              placeholder="如：关于你的任务有重要更新"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
            />
            <Input
              label="通知内容"
              placeholder="通知正文..."
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
            />
            <Button size="sm" loading={notifLoading} onClick={handleSendNotif}>
              发送通知
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
