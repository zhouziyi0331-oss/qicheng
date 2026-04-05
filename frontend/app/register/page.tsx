"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterPage() {
  const [step, setStep] = useState<"info" | "code">("info");
  const [role, setRole] = useState<"student" | "company">("student");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  const { login } = useAuthStore();
  const { show } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = async () => {
    if (phone.length !== 11) return show("请输入正确的手机号", "error");
    setSendLoading(true);
    try {
      const { data } = await authApi.sendCode(phone);
      show("验证码已发送", "success");
      setCountdown(60);
      setStep("code");
      // 开发模式自动填入验证码
      if (data._dev_code) {
        setCode(data._dev_code);
        show(`开发模式验证码：${data._dev_code}`, "info");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "发送失败，请稍后重试", "error");
    } finally {
      setSendLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return show("请输入验证码", "error");
    if (password.length < 8) return show("密码至少8位", "error");
    if (!nickname) return show("请输入昵称", "error");
    if (role === "company" && (!companyName || !contactName)) {
      return show("企业名称和联系人必填", "error");
    }
    setLoading(true);
    try {
      const { data } = await authApi.register({
        phone, code, password, role, nickname,
        ...(role === "company" ? { companyName, contactName } : {}),
      });
      login(data.data.userId, data.data.role, nickname, {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
      show("注册成功！开始你的启程之旅 🎉", "success");
      router.replace(role === "company" ? "/company/tasks" : "/onboarding");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "注册失败，请检查信息", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#e6edf3" }}>加入启程</h1>
          <p style={{ color: "#8b949e" }}>开启你的OPC成长之路</p>
        </div>

        {/* 角色选择 */}
        <div className="flex rounded-lg overflow-hidden mb-6" style={{ border: "1px solid #30363d" }}>
          {(["student", "company"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="flex-1 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: role === r ? "#58a6ff" : "#161b22",
                color: role === r ? "#0d1117" : "#8b949e",
              }}
            >
              {r === "student" ? "🎓 我是学生" : "🏢 我是企业"}
            </button>
          ))}
        </div>

        <div className="p-6 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input
              label="手机号"
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
            />
            <Input
              label="验证码"
              type="text"
              placeholder="6位验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              suffix={
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={sendLoading || countdown > 0}
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{ color: countdown > 0 ? "#484f58" : "#58a6ff", background: "transparent" }}
                >
                  {sendLoading ? "发送中..." : countdown > 0 ? `${countdown}s` : "获取验证码"}
                </button>
              }
            />
            <Input
              label="设置密码"
              type="password"
              placeholder="至少8位"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label={role === "student" ? "昵称" : "联系人姓名"}
              placeholder={role === "student" ? "你的昵称（其他人会看到）" : "联系人真实姓名"}
              value={role === "student" ? nickname : contactName}
              onChange={(e) => role === "student" ? setNickname(e.target.value) : setContactName(e.target.value)}
            />
            {role === "company" && (
              <>
                <Input
                  label="企业名称"
                  placeholder="公司全称"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                {/* 企业nickname = contactName，同步设置 */}
                {!nickname && contactName && (() => { setNickname(contactName); return null; })()}
              </>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              注册并开始
            </Button>
          </form>
        </div>

        {role === "company" && (
          <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: "#1a3a2a", border: "1px solid #2ea043", color: "#8b949e" }}>
            💡 企业账号注册后需经平台审核，审核通过后即可发布任务（通常1个工作日）
          </div>
        )}

        <p className="text-center mt-6 text-sm" style={{ color: "#8b949e" }}>
          已有账号？{" "}
          <Link href="/login" style={{ color: "#58a6ff" }}>直接登录</Link>
        </p>
      </div>
    </div>
  );
}
