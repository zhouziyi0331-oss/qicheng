"use client";
import { useState } from "react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import AdminLayout, { Card, Button, Input } from "@/components/admin/AdminLayout";

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
    if (!taskId.trim()) return show("请输入任务编号", "error");
    setMsgLoading(true);
    try {
      const { data } = await adminApi.getTaskMessages(taskId.trim());
      setMessages(data.data || []);
      show("加载成功", "success");
    } catch {
      show("加载失败，请确认任务编号", "error");
    } finally {
      setMsgLoading(false);
    }
  };

  const handleIntervene = async () => {
    if (!taskId.trim() || !interveneNote.trim()) return show("请填写任务编号和介入说明", "error");
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
    if (!userId.trim() || !notifTitle.trim() || !notifBody.trim()) return show("请填写用户编号和通知内容", "error");
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
    <AdminLayout
      title="🛠️ 客服工具"
      subtitle="任务介入、沟通记录查看、点对点通知"
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "24px"
      }}>
        {/* 查看聊天记录 */}
        <Card style={{ padding: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>
              💬
            </div>
            <div>
              <h2 style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#F1F5F9",
                margin: 0
              }}>
                查看任务沟通记录
              </h2>
              <p style={{
                fontSize: "12px",
                color: "#8E96A5",
                margin: 0
              }}>
                查看学生和企业的沟通内容
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <Input
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="任务编号"
              style={{ flex: 1 }}
            />
            <Button loading={msgLoading} onClick={loadMessages}>
              查询
            </Button>
          </div>

          {messages.length > 0 && (
            <div style={{
              maxHeight: "400px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "16px",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.05)"
            }}>
              {messages.map((m) => (
                <div key={m.id} style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: m.sender_role === "company" ? "rgba(59, 130, 246, 0.1)" : "rgba(16, 185, 129, 0.1)",
                  border: `1px solid ${m.sender_role === "company" ? "rgba(59, 130, 246, 0.2)" : "rgba(16, 185, 129, 0.2)"}`,
                  display: "flex",
                  gap: "12px"
                }}>
                  <div style={{
                    fontSize: "24px",
                    flexShrink: 0
                  }}>
                    {m.sender_role === "company" ? "🏢" : "🎓"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "11px",
                      color: "#8E96A5",
                      marginBottom: "4px",
                      fontWeight: "600"
                    }}>
                      {m.sender_role === "company" ? "企业" : "学生"} · {new Date(m.created_at).toLocaleString("zh-CN")}
                    </div>
                    <p style={{
                      fontSize: "14px",
                      color: m.is_filtered ? "#F59E0B" : "#F1F5F9",
                      margin: 0,
                      lineHeight: "1.6"
                    }}>
                      {m.content}
                      {m.is_filtered && <span style={{ fontSize: "12px", marginLeft: "8px" }}>[含过滤内容]</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 任务介入 */}
        <Card style={{ padding: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>
              ⚡
            </div>
            <div>
              <h2 style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#F1F5F9",
                margin: 0
              }}>
                任务介入
              </h2>
              <p style={{
                fontSize: "12px",
                color: "#8E96A5",
                margin: 0
              }}>
                强制介入任务处理流程
              </p>
            </div>
          </div>

          <textarea
            style={{
              width: "100%",
              height: "120px",
              resize: "none",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#F1F5F9",
              fontSize: "14px",
              fontFamily: "inherit",
              marginBottom: "16px",
              outline: "none",
              transition: "all 0.2s"
            }}
            placeholder="介入说明（将记入操作日志）..."
            value={interveneNote}
            onChange={(e) => setInterveneNote(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
              e.currentTarget.style.background = "rgba(0,0,0,0.3)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.background = "rgba(0,0,0,0.2)";
            }}
          />

          <Button
            variant="secondary"
            loading={interveneLoading}
            onClick={handleIntervene}
            style={{ width: "100%" }}
          >
            执行介入（任务编号同上）
          </Button>
        </Card>

        {/* 点对点通知 */}
        <Card style={{ padding: "24px", gridColumn: "1 / -1" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>
              📨
            </div>
            <div>
              <h2 style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#F1F5F9",
                margin: 0
              }}>
                发送点对点通知
              </h2>
              <p style={{
                fontSize: "12px",
                color: "#8E96A5",
                margin: 0
              }}>
                向指定用户发送系统通知
              </p>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px"
          }}>
            <Input
              label="用户编号"
              placeholder="用户编号"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <Input
              label="通知标题"
              placeholder="如：关于你的任务有重要更新"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{
                display: "block",
                fontSize: "12px",
                color: "#8E96A5",
                fontWeight: "600",
                marginBottom: "8px"
              }}>
                通知内容
              </label>
              <textarea
                style={{
                  width: "100%",
                  height: "100px",
                  resize: "none",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F1F5F9",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "all 0.2s"
                }}
                placeholder="通知正文..."
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                  e.currentTarget.style.background = "rgba(0,0,0,0.3)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.background = "rgba(0,0,0,0.2)";
                }}
              />
            </div>
            <Button
              loading={notifLoading}
              onClick={handleSendNotif}
              style={{ gridColumn: "1 / -1" }}
            >
              发送通知
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
