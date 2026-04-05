"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { notificationApi } from "@/lib/api";

const studentNav = [
  { href: "/tasks", label: "任务市场" },
  { href: "/my-tasks", label: "我的任务" },
  { href: "/ability", label: "能力成长" },
  { href: "/story", label: "故事墙" },
  { href: "/reports", label: "OPC报告" },
  { href: "/journey", label: "启程之旅" },
  { href: "/timeline", label: "成长时间线" },
];

const companyNav = [
  { href: "/company/tasks", label: "我的任务" },
  { href: "/company/post", label: "发布任务" },
  { href: "/company/profile", label: "企业信息" },
];

const adminNav = [
  { href: "/admin", label: "数据看板" },
  { href: "/admin/tasks", label: "需求管理" },
  { href: "/admin/students", label: "学生数据" },
  { href: "/admin/finance", label: "财务" },
  { href: "/admin/logs", label: "操作日志" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, role, nickname, logout } = useAuthStore();
  const [unread, setUnread] = useState(0);

  const nav = role === "admin" ? adminNav : role === "company" ? companyNav : studentNav;

  useEffect(() => {
    if (!isLoggedIn) return;

    // 只在登录后首次加载，避免每次路由切换都请求
    const fetchUnread = () => {
      notificationApi.list(1).then(({ data }) => {
        const items: Array<{ is_read: boolean }> = data.data || [];
        setUnread(items.filter((n) => !n.is_read).length);
      }).catch(() => {});
    };

    fetchUnread();

    // 每30秒轮询一次（仅在登录状态）
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]); // 移除 pathname 依赖

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header
      style={{ background: "#161b22", borderBottom: "1px solid #30363d" }}
      className="sticky top-0 z-40"
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-base font-bold" style={{ color: "#e6edf3" }}>🚀 启程</span>
        </Link>

        {/* Nav links */}
        {isLoggedIn && (
          <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-md text-sm no-underline transition-colors whitespace-nowrap"
                  style={{
                    background: active ? "#21262d" : "transparent",
                    color: active ? "#e6edf3" : "#8b949e",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isLoggedIn ? (
            <>
              {/* 通知铃铛 */}
              <Link href="/notifications" className="relative no-underline" title="通知">
                <span className="text-lg" style={{ color: "#8b949e" }}>🔔</span>
                {unread > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: "#f85149", color: "white" }}
                  >
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              {role === "student" ? (
                <Link href="/profile" className="text-sm no-underline hidden sm:block" style={{ color: "#8b949e" }}>
                  🎓 {nickname}
                </Link>
              ) : role === "company" ? (
                <Link href="/company/profile" className="text-sm no-underline hidden sm:block" style={{ color: "#8b949e" }}>
                  🏢 {nickname}
                </Link>
              ) : (
                <span className="text-sm hidden sm:block" style={{ color: "#8b949e" }}>
                  🔧 {nickname}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-xs transition-colors"
                style={{ color: "#8b949e", background: "transparent" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#f85149")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#8b949e")}
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm no-underline" style={{ color: "#8b949e" }}>
                登录
              </Link>
              <Link
                href="/register"
                className="text-sm px-3 py-1.5 rounded-md text-white no-underline"
                style={{ background: "#238636", border: "1px solid #2ea043" }}
              >
                免费注册
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
