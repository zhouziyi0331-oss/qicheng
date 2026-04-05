"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { show } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return show("请填写手机号和密码", "error");
    setLoading(true);
    try {
      const { data } = await authApi.login(phone, password);
      login(data.data.userId, data.data.role, data.data.nickname || phone, {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
      show("登录成功 👋", "success");
      router.replace(data.data.role === "company" ? "/company/tasks" : "/tasks");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "登录失败，请检查手机号和密码", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#e6edf3" }}>欢迎回来</h1>
          <p style={{ color: "#8b949e" }}>登录你的启程账号</p>
        </div>
        <div className="p-6 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="手机号"
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
            />
            <Input
              label="密码"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              登录
            </Button>
          </form>
        </div>
        <p className="text-center mt-6 text-sm" style={{ color: "#8b949e" }}>
          还没有账号？{" "}
          <Link href="/register" style={{ color: "#58a6ff" }}>免费注册</Link>
        </p>
      </div>
    </div>
  );
}
