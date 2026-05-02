import Link from "next/link";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A0C10 0%, #11141C 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 40px" }}>
        {/* 顶部导航 */}
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/admin" style={{
              color: "#8E96A5",
              textDecoration: "none",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#3B82F6"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#8E96A5"}
            >
              ← 返回后台
            </Link>
            <div style={{
              width: "1px",
              height: "16px",
              background: "rgba(255,255,255,0.1)"
            }} />
            <div>
              <h1 style={{
                color: "#F1F5F9",
                fontSize: "24px",
                fontWeight: "700",
                margin: 0,
                marginBottom: subtitle ? "4px" : 0
              }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ color: "#8E96A5", fontSize: "14px", margin: 0 }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div>{actions}</div>}
        </div>

        {/* 内容区域 */}
        {children}
      </div>
    </div>
  );
}

// 卡片组件
export function Card({ children, className = "", style = {} }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        padding: "24px",
        borderRadius: "16px",
        background: "#1A1D24",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
        transition: "all 0.3s ease",
        ...style
      }}
    >
      {children}
    </div>
  );
}

// 搜索框组件
export function SearchInput({ value, onChange, placeholder = "搜索..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: "12px 16px",
        borderRadius: "12px",
        background: "#0A0C10",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#F1F5F9",
        fontSize: "14px",
        outline: "none",
        transition: "all 0.2s ease",
        width: "100%"
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "#3B82F6";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.1)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

// 按钮组件
export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  loading = false
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
}) {
  const variants = {
    primary: {
      background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
      color: "#fff",
      boxShadow: "0 4px 12px rgba(59,130,246,0.3)"
    },
    secondary: {
      background: "rgba(255,255,255,0.05)",
      color: "#F1F5F9",
      border: "1px solid rgba(255,255,255,0.1)"
    },
    danger: {
      background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
      color: "#fff",
      boxShadow: "0 4px 12px rgba(239,68,68,0.3)"
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: "10px 20px",
        borderRadius: "12px",
        border: "none",
        fontSize: "14px",
        fontWeight: "600",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        opacity: disabled || loading ? 0.6 : 1,
        ...variants[variant]
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {loading ? "处理中..." : children}
    </button>
  );
}

// 状态徽章组件
export function StatusBadge({ status, label }: { status: "success" | "warning" | "error" | "info"; label: string }) {
  const colors = {
    success: { bg: "rgba(16,185,129,0.15)", color: "#10B981" },
    warning: { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
    error: { bg: "rgba(239,68,68,0.15)", color: "#EF4444" },
    info: { bg: "rgba(59,130,246,0.15)", color: "#3B82F6" }
  };

  return (
    <span style={{
      padding: "4px 12px",
      borderRadius: "8px",
      background: colors[status].bg,
      color: colors[status].color,
      fontSize: "12px",
      fontWeight: "600",
      display: "inline-block"
    }}>
      {label}
    </span>
  );
}

// 表格组件
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div style={{
      borderRadius: "16px",
      background: "#1A1D24",
      border: "1px solid rgba(255,255,255,0.05)",
      overflow: "hidden"
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{
            background: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.06)"
          }}>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "16px",
                textAlign: "left",
                color: "#8E96A5",
                fontSize: "13px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
}

// 表格行组件
export function TableRow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.2s ease"
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </tr>
  );
}

// 表格单元格组件
export function TableCell({ children, style = {} }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{
      padding: "16px",
      color: "#F1F5F9",
      fontSize: "14px",
      ...style
    }}>
      {children}
    </td>
  );
}

// 空状态组件
export function EmptyState({ icon = "📭", message = "暂无数据" }: { icon?: string; message?: string }) {
  return (
    <div style={{
      padding: "80px 20px",
      textAlign: "center",
      borderRadius: "16px",
      background: "#1A1D24",
      border: "1px solid rgba(255,255,255,0.05)"
    }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>{icon}</div>
      <p style={{ color: "#8E96A5", fontSize: "16px" }}>{message}</p>
    </div>
  );
}

// 加载骨架屏组件
export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          height: "80px",
          borderRadius: "16px",
          background: "#1A1D24",
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }} />
      ))}
    </div>
  );
}
