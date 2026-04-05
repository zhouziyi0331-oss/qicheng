"use client";
import { useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [roles, setRoles] = useState<string[]>(["student", "company"]);
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const toggleRole = (role: string) => {
    setRoles((rs) => rs.includes(role) ? rs.filter((r) => r !== role) : [...rs, role]);
  };

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) return show("请填写标题和内容", "error");
    if (roles.length === 0) return show("请选择至少一个目标用户组", "error");
    const confirmed = window.confirm(`确认向 ${roles.join("、")} 发送广播通知？`);
    if (!confirmed) return;
    setLoading(true);
    try {
      await adminApi.broadcast(title.trim(), body.trim(), roles);
      show("广播发送成功", "success");
      setTitle("");
      setBody("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "发送失败", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm no-underline" style={{ color: "#8b949e" }}>← 后台</Link>
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>通知推送</h1>
      </div>

      <div className="p-5 rounded-lg flex flex-col gap-4" style={{ background: "#161b22", border: "1px solid #30363d" }}>
        <Input
          label="通知标题 *"
          placeholder="如：平台维护通知"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
        <div>
          <label className="text-xs mb-1 block" style={{ color: "#8b949e" }}>通知内容 *</label>
          <textarea
            className="w-full h-32 resize-none p-3 rounded-lg text-sm"
            placeholder="通知正文..."
            style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs mb-2 block" style={{ color: "#8b949e" }}>目标用户组</label>
          <div className="flex gap-3">
            {[
              { value: "student", label: "🎓 学生" },
              { value: "company", label: "🏢 企业" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg"
                style={{
                  background: roles.includes(opt.value) ? "#1f3358" : "#21262d",
                  border: `1px solid ${roles.includes(opt.value) ? "#58a6ff" : "#30363d"}`,
                }}>
                <input
                  type="checkbox"
                  checked={roles.includes(opt.value)}
                  onChange={() => toggleRole(opt.value)}
                  style={{ width: "auto" }}
                />
                <span className="text-sm" style={{ color: roles.includes(opt.value) ? "#58a6ff" : "#e6edf3" }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-lg text-xs" style={{ background: "#1a2535", border: "1px solid #1f4a8a", color: "#8b949e" }}>
          ⚠️ 广播通知将发送给所有符合条件的用户，操作不可撤销，且会写入管理员日志。
        </div>
        <Button loading={loading} onClick={handleBroadcast} className="w-full">
          发送广播通知
        </Button>
      </div>
    </div>
  );
}
