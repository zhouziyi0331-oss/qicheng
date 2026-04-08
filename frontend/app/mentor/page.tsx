"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Button from "@/components/ui/Button";

interface Message {
  id: string;
  type: "user" | "mentor";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

function MentorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 加载历史对话
    if (taskId) {
      loadConversations();
    } else {
      // 通用导师模式，显示欢迎消息
      setMessages([
        {
          id: "welcome",
          type: "mentor",
          content: "你好！我是启程小猫，你的AI导师。\n\n我可以帮你：\n• 解答任务中的疑问\n• 提供思路和建议\n• 陪你度过卡点时刻\n• 庆祝你的每一个进步\n\n有什么想聊的吗？",
          timestamp: new Date(),
        },
      ]);
    }
  }, [taskId]);

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/v1/mentor/conversations/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        const msgs: Message[] = [];
        data.data.forEach((c: any) => {
          if (c.user_message) {
            msgs.push({
              id: c.id + "-user",
              type: "user",
              content: c.user_message,
              timestamp: new Date(c.created_at),
            });
          }
          msgs.push({
            id: c.id,
            type: "mentor",
            content: c.mentor_response,
            timestamp: new Date(c.created_at),
          });
        });
        setMessages(msgs);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const typeMessage = async (content: string, messageId: string) => {
    setIsTyping(true);
    const words = content.split("");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += words[i];
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: currentText, isTyping: true } : msg
        )
      );
      // 中文50ms/字，标点30ms/字
      const delay = /[，。！？、；：]/.test(words[i]) ? 30 : 50;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isTyping: false } : msg))
    );
    setIsTyping(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const endpoint = taskId ? "/api/v1/mentor/message" : "/api/v1/mentor/general";
      const body = taskId ? { taskId, message: userInput } : { message: userInput };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        const mentorMessageId = Date.now().toString() + "-mentor";
        const mentorMessage: Message = {
          id: mentorMessageId,
          type: "mentor",
          content: "",
          timestamp: new Date(),
          isTyping: true,
        };
        setMessages((prev) => [...prev, mentorMessage]);

        // 打字机效果
        await typeMessage(data.data.response || data.data.message, mentorMessageId);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: Date.now().toString() + "-error",
        type: "mentor",
        content: "抱歉，我遇到了一些问题。请稍后再试。",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0d1117" }}>
      {/* 头部 */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ background: "#161b22", borderColor: "#30363d" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "#21262d", color: "#8b949e" }}
          >
            ←
          </button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: "#21262d" }}
            >
              <Image src="/cat-logo.png" alt="启程小猫" width={40} height={40} />
            </div>
            <div>
              <h1 className="font-bold" style={{ color: "#e6edf3" }}>
                启程小猫
              </h1>
              <p className="text-xs" style={{ color: "#8b949e" }}>
                {taskId ? "任务专属导师" : "通用AI导师"} · 随时为你解答
              </p>
            </div>
          </div>
        </div>
        {taskId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/tasks/${taskId}`)}
          >
            返回任务
          </Button>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div
                className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: "#21262d" }}
              >
                <Image src="/cat-logo.png" alt="启程小猫" width={80} height={80} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "#e6edf3" }}>
                你好！我是启程小猫
              </h2>
              <p className="text-sm" style={{ color: "#8b949e" }}>
                有什么问题随时问我，我会一直陪着你
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* 头像 */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: msg.type === "mentor" ? "#21262d" : "#1f6feb",
                }}
              >
                {msg.type === "mentor" ? (
                  <Image src="/cat-logo.png" alt="AI导师" width={32} height={32} />
                ) : (
                  <span style={{ color: "#ffffff", fontSize: "14px", fontWeight: "bold" }}>
                    我
                  </span>
                )}
              </div>

              {/* 消息气泡 */}
              <div
                className="max-w-[70%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: msg.type === "mentor" ? "#161b22" : "#1f6feb",
                  border: msg.type === "mentor" ? "1px solid #30363d" : "none",
                  color: "#e6edf3",
                }}
              >
                {msg.content}
                {msg.isTyping && (
                  <span
                    className="inline-block w-0.5 h-4 ml-1 animate-pulse"
                    style={{ background: "#58a6ff" }}
                  />
                )}
              </div>
            </div>
          ))}

          {loading && !isTyping && (
            <div className="flex gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: "#21262d" }}
              >
                <Image src="/cat-logo.png" alt="AI导师" width={32} height={32} />
              </div>
              <div
                className="px-5 py-3.5 rounded-2xl"
                style={{ background: "#161b22", border: "1px solid #30363d" }}
              >
                <div className="flex gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#58a6ff", animationDelay: "0s" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#58a6ff", animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: "#58a6ff", animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入框 */}
      <div
        className="border-t px-6 py-4"
        style={{ background: "#161b22", borderColor: "#30363d" }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="有什么问题随时问我..."
              className="flex-1 px-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                background: "#0d1117",
                border: "1px solid #30363d",
                color: "#e6edf3",
              }}
              disabled={loading || isTyping}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || isTyping || !input.trim()}
              className="px-6"
            >
              发送
            </Button>
          </div>
          <p className="text-xs mt-2" style={{ color: "#484f58" }}>
            💡 提示：说「我卡住了」「不知道怎么做」，我会给你线索
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MentorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1117" }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full animate-pulse" style={{ background: "#21262d" }} />
          <p style={{ color: "#8b949e" }}>加载中...</p>
        </div>
      </div>
    }>
      <MentorContent />
    </Suspense>
  );
}
