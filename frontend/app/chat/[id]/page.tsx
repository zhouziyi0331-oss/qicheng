"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface Message {
  id: string;
  sender_type: "student" | "company";
  content: string;
  is_filtered: boolean;
  created_at: string;
}

export default function ChatPage() {
  const params = useParams();
  const taskId = params.id as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();

  useEffect(() => {
    fetchMessages();
    // 只在页面可见时轮询，减少后台请求
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMessages();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [taskId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/${taskId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        setContactUnlocked(data.meta?.contactUnlocked || false);
      }
    } catch (err) {
      // 静默失败，避免频繁提示
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/${taskId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: input }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.data.wasFiltered) {
          show(data.data.filterNotice, "warning");
        }
        setInput("");
        fetchMessages();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      show("发送失败", "error");
    } finally {
      setSending(false);
    }
  };

  const role = localStorage.getItem("role");

  return (
    <div className="flex flex-col h-screen" style={{ background: "#0d1117" }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b" style={{ borderColor: "#30363d" }}>
        <h1 className="text-lg font-semibold" style={{ color: "#e6edf3" }}>任务沟通</h1>
        {!contactUnlocked && (
          <p className="text-xs mt-1" style={{ color: "#8b949e" }}>
            💡 完成 2 单合作后可解锁直接联系方式
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12" style={{ color: "#484f58" }}>
            <div className="text-3xl mb-2">💬</div>
            <p>还没有消息，开始对话吧</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_type === role;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-md px-4 py-2 rounded-lg"
                style={{
                  background: isMe ? "#1f6feb" : "#21262d",
                  color: isMe ? "#fff" : "#e6edf3",
                }}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                {msg.is_filtered && (
                  <p className="text-xs mt-1 opacity-70">⚠️ 已过滤联系方式</p>
                )}
                <p className="text-xs mt-1 opacity-60">
                  {new Date(msg.created_at).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t" style={{ borderColor: "#30363d" }}>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-md text-sm"
            placeholder="输入消息..."
            style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            style={{ background: "#238636", color: "#fff" }}
          >
            {sending ? "..." : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
