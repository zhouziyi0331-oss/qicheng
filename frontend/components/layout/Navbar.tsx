"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  { href: "/company", label: "数据概览" },
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

  // 根据路径判断当前角色
  const isCompany = pathname.startsWith("/company");
  const isAdmin = pathname.startsWith("/admin");
  const nav = isAdmin ? adminNav : isCompany ? companyNav : studentNav;

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
      </div>
    </header>
  );
}
