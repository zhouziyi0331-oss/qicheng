"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { studentApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

interface Question {
  question_num: number;
  dimension: string;
  question_text: string;
  input_type: string;
  options: { key: string; label: string }[] | null;
  max_select: number | null;
}

const DIM_NAMES: Record<string, string> = {
  D1: "创造力",
  D2: "执行力",
  D3: "工具掌握",
  D4: "需求理解",
  D5: "时间管理",
};

export default function OnboardingPage() {
  const [stage, setStage] = useState<"welcome" | "test" | "submitting" | "result">("welcome");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (stage === "test" && questions.length === 0) {
      studentApi.getTestQuestions().then(({ data }) => {
        setQuestions(data.data || []);
      }).catch(() => show("加载题目失败，请刷新", "error"));
    }
  }, [stage]);

  const q = questions[current];
  const progress = questions.length > 0 ? ((current) / questions.length) * 100 : 0;
  const answered = q && (answers[`Q${String(q.question_num).padStart(2, "0")}`] !== undefined);

  const handleAnswer = (key: string) => {
    const qKey = `Q${String(q.question_num).padStart(2, "0")}`;
    setAnswers((a) => ({ ...a, [qKey]: key }));
    // 自动跳到下一题
    setTimeout(() => {
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
      }
    }, 300);
  };

  const handleOpenAnswer = (val: string) => {
    const qKey = `Q${String(q.question_num).padStart(2, "0")}`;
    setAnswers((a) => ({ ...a, [qKey]: val }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      return show(`还有 ${questions.length - Object.keys(answers).length} 题未回答`, "error");
    }
    setStage("submitting");
    try {
      const { data } = await studentApi.submitTest(answers);
      setResult(data.data);
      setStage("result");
    } catch {
      show("提交失败，请重试", "error");
      setStage("test");
    }
  };

  if (stage === "welcome") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-lg text-center fade-in">
          <div className="text-5xl mb-6">🧠</div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: "#e6edf3" }}>OPC能力测评</h1>
          <p className="mb-8 leading-relaxed" style={{ color: "#8b949e" }}>
            接下来的25道题，将帮助AI了解你的独特优势。<br />
            没有标准答案，按第一直觉作答效果最好。<br />
            <strong style={{ color: "#58a6ff" }}>大约需要8-10分钟</strong>
          </p>
          <div className="flex flex-col gap-2 mb-8">
            {["发现你的OPC人格标签", "获得专属五维度能力评分", "解锁个性化任务推荐"].map((s) => (
              <div key={s} className="flex items-center gap-3 text-sm" style={{ color: "#8b949e" }}>
                <span style={{ color: "#3fb950" }}>✓</span> {s}
              </div>
            ))}
          </div>
          <Button size="lg" onClick={() => setStage("test")}>
            开始测评 →
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "submitting") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="text-4xl mb-4">🤔</div>
          <p className="text-lg font-medium mb-2" style={{ color: "#e6edf3" }}>AI正在分析你的答案...</p>
          <p style={{ color: "#8b949e" }}>正在生成你的OPC人格标签</p>
        </div>
      </div>
    );
  }

  if (stage === "result" && result) {
    const r = result as {
      opc_label?: string; opc_label_secondary?: string;
      share_card_caption?: string; recommended_track?: string;
      d1_score?: number; d2_score?: number; d3_score?: number;
      d4_score?: number; d5_score?: number;
    };
    const dims = [
      { key: "D1", score: r.d1_score || 0 },
      { key: "D2", score: r.d2_score || 0 },
      { key: "D3", score: r.d3_score || 0 },
      { key: "D4", score: r.d4_score || 0 },
      { key: "D5", score: r.d5_score || 0 },
    ];
    return (
      <div className="max-w-lg mx-auto px-4 py-16 fade-in">
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">✨</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#e6edf3" }}>测评完成！</h1>
          <div className="inline-block px-4 py-2 rounded-lg mb-3"
            style={{ background: "#1f3358", border: "1px solid #1f4a8a" }}>
            <span className="font-bold text-lg" style={{ color: "#58a6ff" }}>
              {r.opc_label || "探索中的AI实践者"}
            </span>
          </div>
          {r.opc_label_secondary && (
            <p className="text-sm" style={{ color: "#8b949e" }}>
              副标签：{r.opc_label_secondary}
            </p>
          )}
          {r.share_card_caption && (
            <p className="mt-4 text-base italic" style={{ color: "#e6edf3" }}>
              "{r.share_card_caption}"
            </p>
          )}
        </div>

        {/* 五维分数 */}
        <div className="p-5 rounded-lg mb-6" style={{ background: "#161b22", border: "1px solid #30363d" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: "#8b949e" }}>五维能力评分</h3>
          {dims.map((d) => (
            <div key={d.key} className="flex items-center gap-3 mb-3">
              <span className="w-16 text-xs" style={{ color: "#8b949e" }}>{DIM_NAMES[d.key]}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#21262d" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${d.score}%`, background: "#58a6ff" }}
                />
              </div>
              <span className="w-8 text-xs text-right" style={{ color: "#58a6ff" }}>{d.score}</span>
            </div>
          ))}
        </div>

        <Button size="lg" className="w-full" onClick={() => router.push("/tasks")}>
          去探索任务市场 →
        </Button>
      </div>
    );
  }

  // 答题界面
  if (!q) return <div className="flex items-center justify-center min-h-[80vh]"><p style={{ color: "#8b949e" }}>加载中...</p></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* 进度 */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-2" style={{ color: "#8b949e" }}>
          <span>第 {current + 1} / {questions.length} 题</span>
          <span style={{ color: "#58a6ff" }}>{DIM_NAMES[q.dimension] || q.dimension}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#21262d" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "#58a6ff" }}
          />
        </div>
      </div>

      {/* 题目 */}
      <div className="fade-in" key={current}>
        <h2 className="text-lg font-medium mb-6 leading-relaxed" style={{ color: "#e6edf3" }}>
          {q.question_text}
        </h2>

        {q.input_type === "open" ? (
          <div>
            <textarea
              className="w-full h-28 resize-none p-3 rounded-lg text-sm"
              placeholder="写下你的想法，没有标准答案..."
              style={{ background: "#21262d", border: "1px solid #30363d", color: "#e6edf3" }}
              value={answers[`Q${String(q.question_num).padStart(2, "0")}`] || ""}
              onChange={(e) => handleOpenAnswer(e.target.value)}
            />
            <div className="flex justify-between mt-4">
              {current > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setCurrent((c) => c - 1)}>← 上一题</Button>
              )}
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => {
                  if (current < questions.length - 1) setCurrent((c) => c + 1);
                  else handleSubmit();
                }}
              >
                {current < questions.length - 1 ? "下一题 →" : "提交测评"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(q.options || []).map((opt) => {
              const qKey = `Q${String(q.question_num).padStart(2, "0")}`;
              const selected = answers[qKey] === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleAnswer(opt.key)}
                  className="text-left p-3.5 rounded-lg transition-all text-sm"
                  style={{
                    background: selected ? "#1f3358" : "#161b22",
                    border: `1px solid ${selected ? "#58a6ff" : "#30363d"}`,
                    color: selected ? "#58a6ff" : "#e6edf3",
                  }}
                >
                  <span className="font-medium mr-2" style={{ color: "#484f58" }}>{opt.key}.</span>
                  {opt.label}
                </button>
              );
            })}
            {current === questions.length - 1 && answered && (
              <Button className="w-full mt-2" onClick={handleSubmit} loading={loading}>
                提交测评
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 跳过提示 */}
      {current > 0 && q.input_type !== "open" && (
        <button
          onClick={() => setCurrent((c) => c - 1)}
          className="mt-6 text-xs"
          style={{ color: "#484f58", background: "transparent" }}
        >
          ← 返回上一题
        </button>
      )}
    </div>
  );
}
