"use client";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const features = [
  { icon: "🧠", title: "25题能力测评", desc: "AI分析你的OPC人格标签，发现你的独特优势" },
  { icon: "🎯", title: "智能任务匹配", desc: "基于你的能力与情绪状态，推荐最合适的企业任务" },
  { icon: "💰", title: "首单24小时到账", desc: "平台垫付首单报酬，让你零风险完成第一步" },
  { icon: "📈", title: "六维能力雷达", desc: "可视化追踪你的专业成长，积累属于你的OPC档案" },
  { icon: "🤝", title: "真实企业需求", desc: "与有真实AI应用需求的企业直接对接，打造作品集" },
  { icon: "🚀", title: "OPC独立之路", desc: "最终目标：成为可以独立接单的One-Person Creator" },
];

const steps = [
  { num: "01", title: "注册 & 测评", desc: "10分钟完成25题测评，获得你的OPC人格标签" },
  { num: "02", title: "接取首单", desc: "AI为你匹配最适合的入门任务，第一步永远是最小可行步骤" },
  { num: "03", title: "完成 & 收款", desc: "完成任务，平台24小时内垫付报酬，仪式感拉满" },
  { num: "04", title: "迭代成长", desc: "每完成一单，能力雷达更新，OPC档案积累" },
];

export default function HomePage() {
  const { isLoggedIn, role } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace(role === "company" ? "/company/tasks" : "/tasks");
    }
  }, [isLoggedIn, role, router]);

  return (
    <div className="fade-in">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-6"
          style={{ background: "#1f3358", color: "#58a6ff", border: "1px solid #1f4a8a" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] animate-pulse inline-block" />
          AI时代的大学生创业平台 · 现已开放
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
          style={{ color: "#e6edf3" }}>
          从第一单开始，<br />
          <span style={{ color: "#58a6ff" }}>成为真正的OPC</span>
        </h1>
        <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "#8b949e" }}>
          启程连接有AI能力的高校生与有真实需求的企业。
          <br />完成第一单，改变你对自己的认知。
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white no-underline transition-colors"
            style={{ background: "#238636", border: "1px solid #2ea043" }}
          >
            免费注册，10分钟开始 →
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium no-underline transition-colors"
            style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
          >
            已有账号，直接登录
          </Link>
        </div>
        {/* 数据 */}
        <div className="flex items-center justify-center gap-12 mt-16 flex-wrap">
          {[
            { num: "2,400+", label: "注册学生" },
            { num: "380+", label: "合作企业" },
            { num: "¥1.2M+", label: "学生累计收入" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold" style={{ color: "#58a6ff" }}>{s.num}</div>
              <div className="text-sm" style={{ color: "#8b949e" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 功能特性 */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12" style={{ color: "#e6edf3" }}>
          为什么选择启程
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1" style={{ color: "#e6edf3" }}>{f.title}</h3>
              <p className="text-sm" style={{ color: "#8b949e" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 如何开始 */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12" style={{ color: "#e6edf3" }}>
          四步开启OPC之路
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="flex gap-4 p-5 rounded-lg" style={{ background: "#161b22", border: "1px solid #30363d" }}>
              <div className="text-3xl font-bold flex-shrink-0" style={{ color: "#30363d" }}>{s.num}</div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: "#e6edf3" }}>{s.title}</h3>
                <p className="text-sm" style={{ color: "#8b949e" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#e6edf3" }}>
          准备好开始了吗？
        </h2>
        <p className="mb-8" style={{ color: "#8b949e" }}>
          现在注册，完成测评，今天就可以接到你的第一单。
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white text-base no-underline"
          style={{ background: "#238636", border: "1px solid #2ea043" }}
        >
          立即开始 — 完全免费 🚀
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: "#30363d", color: "#484f58" }}>
        © 2026 启程 · 帮助高校生成为独立OPC ·
        <span className="ml-2">学生端 | 企业端</span>
      </footer>
    </div>
  );
}
