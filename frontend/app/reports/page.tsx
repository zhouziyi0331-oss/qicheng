"use client";
import { useState, useEffect } from "react";
import { reportApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Report {
  type: string;
  name: string;
  description: string;
  price: number;
  status: "locked" | "purchased" | "generating" | "done";
  preview: {
    blurredHint: string;
    unlockedLines: string[];
  };
}

const REPORT_ICONS: Record<string, string> = {
  R1: "🧭", R2: "🎯", R3: "💼", R4: "🚀", R5: "🌟", full: "📖",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    reportApi.list()
      .then(({ data }) => setReports(data.data || []))
      .catch(() => show("加载失败", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleOrder = async (type: string, price: number) => {
    const confirmed = window.confirm(`确认购买此报告？¥${price}`);
    if (!confirmed) return;
    setOrdering(type);
    try {
      await reportApi.order(type);
      show("购买成功！报告生成中，预计3-5分钟完成", "success");
      setReports((rs) => rs.map((r) => r.type === type ? { ...r, status: "generating" } : r));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "购买失败", "error");
    } finally {
      setOrdering(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg animate-pulse mb-4" style={{ background: "#161b22" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "#e6edf3" }}>OPC成长报告</h1>
        <p className="text-sm mt-1" style={{ color: "#8b949e" }}>
          基于你的测试、任务、反馈数据，AI生成专属万字报告
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-24" style={{ color: "#484f58" }}>
          <div className="text-4xl mb-4">📋</div>
          <p>完成测试后可解锁报告</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((r) => {
            const isExpanded = expanded === r.type;
            return (
              <div key={r.type} className="rounded-lg overflow-hidden"
                style={{ background: "#161b22", border: "1px solid #30363d" }}>
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : r.type)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{REPORT_ICONS[r.type] || "📄"}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold" style={{ color: "#e6edf3" }}>{r.name}</p>
                          <Badge color={
                            r.status === "done" || r.status === "purchased" ? "green" :
                            r.status === "generating" ? "blue" : "gray"
                          }>
                            {r.status === "done" || r.status === "purchased" ? "已解锁" :
                             r.status === "generating" ? "生成中" : "未解锁"}
                          </Badge>
                        </div>
                        {r.preview?.blurredHint && (
                          <p className="text-xs" style={{ color: "#484f58" }}>{r.preview.blurredHint}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold" style={{ color: r.status === "locked" ? "#d29922" : "#3fb950" }}>
                        {r.status === "locked" ? `¥${r.price}` : "已购"}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "#484f58" }}>
                        {isExpanded ? "▲" : "▼"}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t" style={{ borderColor: "#30363d" }}>
                    <p className="text-sm mt-4 mb-3 leading-relaxed" style={{ color: "#8b949e" }}>
                      {r.description}
                    </p>

                    {/* 免费预览行 */}
                    {r.preview?.unlockedLines?.length > 0 && (
                      <div className="p-3 rounded-lg mb-4"
                        style={{ background: "#1a2535", border: "1px solid #1f4a8a" }}>
                        <p className="text-xs font-medium mb-2" style={{ color: "#58a6ff" }}>免费预览</p>
                        {r.preview.unlockedLines.map((line, i) => (
                          <p key={i} className="text-xs leading-relaxed" style={{ color: "#8b949e" }}>{line}</p>
                        ))}
                        <p className="text-xs mt-2 blur-sm select-none" style={{ color: "#484f58" }}>
                          ████████████████ 购买后解锁完整内容 ████████████████
                        </p>
                      </div>
                    )}

                    {r.status === "locked" && (
                      <Button
                        loading={ordering === r.type}
                        onClick={() => handleOrder(r.type, r.price)}
                        className="w-full"
                      >
                        购买报告 · ¥{r.price}
                      </Button>
                    )}
                    {r.status === "generating" && (
                      <div className="text-center py-3 text-sm" style={{ color: "#8b949e" }}>
                        ⏳ 报告生成中，AI正在分析你的成长轨迹...
                      </div>
                    )}
                    {(r.status === "done" || r.status === "purchased") && (
                      <Button
                        variant="secondary"
                        onClick={() => reportApi.get(r.type).then(({ data }) => {
                          const w = window.open("", "_blank");
                          if (w) w.document.write(`<pre style="font-family:sans-serif;padding:24px;line-height:1.8">${data.data?.content || "报告内容加载中..."}</pre>`);
                        })}
                        className="w-full"
                      >
                        查看完整报告
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
