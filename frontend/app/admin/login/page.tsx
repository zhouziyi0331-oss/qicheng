"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await adminApi.login(username, password);

      // 后端直接返回 {token, admin}
      const { token, admin } = response.data;

      if (token && admin) {
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminUser", JSON.stringify(admin));
        document.cookie = `adminToken=${token}; path=/; max-age=${8 * 3600}; SameSite=Lax`;

        router.push("/admin");
      } else {
        setError("登录失败：响应格式错误");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || "登录失败，请检查用户名和密码");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A0C10 0%, #11141C 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{
        background: "#1A1D24",
        borderRadius: "16px",
        padding: "48px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.05)"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "16px"
          }}>🚀</div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#FFFFFF",
            margin: "0 0 8px 0"
          }}>启程管理后台</h1>
          <p style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.5)",
            margin: 0
          }}>Qicheng Admin System</p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "24px",
            color: "#EF4444",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "8px"
            }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#0A0C10",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#FFFFFF",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#3B82F6"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "8px"
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#0A0C10",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#FFFFFF",
                fontSize: "14px",
                outline: "none",
                transition: "all 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#3B82F6"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "rgba(59, 130, 246, 0.5)" : "#3B82F6",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#2563EB";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "#3B82F6";
            }}
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: "24px",
          paddingTop: "24px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          textAlign: "center"
        }}>
          <p style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.4)",
            margin: 0
          }}>
            账号: 18502885747 / chengyanlove
          </p>
        </div>
      </div>
    </div>
  );
}
