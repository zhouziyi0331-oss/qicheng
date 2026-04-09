"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { studentApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";

interface ChallengeQuestion {
  id: string;
  question: string;
  type: "single" | "multiple" | "text";
  options?: string[];
}

const CHALLENGE_QUESTIONS: ChallengeQuestion[] = [
  {
    id: "1",
    question: "你使用过哪些AI工具？（多选）",
    type: "multiple",
    options: ["ChatGPT", "Claude", "Midjourney", "Stable Diffusion", "GitHub Copilot", "其他"],
  },
  {
    id: "2",
    question: "请描述你最近完成的一个AI相关项目（至少100字）",
    type: "text",
  },
  {
    id: "3",
    question: "你对Prompt工程的理解程度？",
    type: "single",
    options: ["完全不了解", "听说过但没实践", "有一些实践经验", "能熟练编写复杂Prompt", "能教别人写Prompt"],
  },
  {
    id: "4",
    question: "你是否有过真实的AI项目交付经验？",
    type: "single",
    options: ["没有", "有1-2个", "有3-5个", "有5个以上"],
  },
  {
    id: "5",
    question: "请描述一个你用AI解决的实际问题（至少80字）",
    type: "text",
  },
];

export default function LevelChallengePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const { show } = useToast();
  const router = useRouter();

  const currentQuestion = CHALLENGE_QUESTIONS[currentStep];
  const isLastQuestion = currentStep === CHALLENGE_QUESTIONS.length - 1;

  const handleAnswer = (value: string | string[]) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      return show("请回答当前问题", "error");
    }

    if (currentQuestion.type === "text") {
      const text = answers[currentQuestion.id] as string;
      const minLength = currentQuestion.question.includes("100字") ? 100 : 80;
      if (text.length < minLength) {
        return show(`请至少输入${minLength}字`, "error");
      }
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await studentApi.submitLevelChallenge(answers);
      const result = data.data;

      if (result.passed) {
        show(`恭喜！跳级成功，当前等级：Lv.${result.new_level} 🎉`, "success");
        router.push("/ability");
      } else {
        show(`挑战未通过，继续保持当前等级 Lv.${result.current_level}`, "info");
        router.push("/ability");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "提交失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #F5E6F0 0%, #FEFEFE 100%)" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 返回 */}
        <Link href="/ability" className="inline-flex items-center gap-1 text-sm mb-6 no-underline" style={{ color: "#636E72" }}>
          ← 返回能力图谱
        </Link>

        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#2D3436" }}>
            跳级挑战测试
          </h1>
          <p className="text-sm" style={{ color: "#636E72" }}>
            通过测试可跳过当前等级，直接晋升到更高等级
          </p>
        </div>

        {/* 进度条 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: "#2D3436" }}>
              问题 {currentStep + 1} / {CHALLENGE_QUESTIONS.length}
            </span>
            <span className="text-sm" style={{ color: "#636E72" }}>
              {Math.round(((currentStep + 1) / CHALLENGE_QUESTIONS.length) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5D4E8" }}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / CHALLENGE_QUESTIONS.length) * 100}%`,
                background: "linear-gradient(135deg, #F9C6D9 0%, #EC4899 100%)",
              }}
            />
          </div>
        </div>

        {/* 问题卡片 */}
        <div className="p-8 rounded-3xl shadow-lg mb-6" style={{ background: "#FFFFFF" }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: "#2D3436" }}>
            {currentQuestion.question}
          </h2>

          {/* 单选 */}
          {currentQuestion.type === "single" && currentQuestion.options && (
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: answers[currentQuestion.id] === option ? "#F9C6D9" : "#F9F7F5",
                    border: `2px solid ${answers[currentQuestion.id] === option ? "#EC4899" : "#E5D4E8"}`,
                  }}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium" style={{ color: "#2D3436" }}>
                    {option}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* 多选 */}
          {currentQuestion.type === "multiple" && currentQuestion.options && (
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((option) => {
                const selected = (answers[currentQuestion.id] as string[] || []).includes(option);
                return (
                  <label
                    key={option}
                    className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all"
                    style={{
                      background: selected ? "#F9C6D9" : "#F9F7F5",
                      border: `2px solid ${selected ? "#EC4899" : "#E5D4E8"}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      value={option}
                      checked={selected}
                      onChange={(e) => {
                        const current = (answers[currentQuestion.id] as string[]) || [];
                        if (e.target.checked) {
                          handleAnswer([...current, option]);
                        } else {
                          handleAnswer(current.filter((v) => v !== option));
                        }
                      }}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium" style={{ color: "#2D3436" }}>
                      {option}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* 文本 */}
          {currentQuestion.type === "text" && (
            <div>
              <textarea
                value={(answers[currentQuestion.id] as string) || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="请详细描述..."
                rows={8}
                className="w-full p-4 rounded-2xl text-sm resize-none"
                style={{
                  background: "#F9F7F5",
                  border: "2px solid #E5D4E8",
                  color: "#2D3436",
                }}
              />
              <div className="text-xs mt-2 text-right" style={{ color: "#B2BEC3" }}>
                {((answers[currentQuestion.id] as string) || "").length} 字
              </div>
            </div>
          )}
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1"
            >
              上一题
            </Button>
          )}
          <Button
            onClick={handleNext}
            loading={submitting}
            className="flex-1"
            style={{ background: "linear-gradient(135deg, #F9C6D9 0%, #EC4899 100%)" }}
          >
            {isLastQuestion ? "提交测试" : "下一题"}
          </Button>
        </div>

        {/* 提示 */}
        <div className="mt-6 p-4 rounded-2xl text-sm" style={{ background: "#FFF3CD", border: "1px solid #FFE69C", color: "#856404" }}>
          💡 提示：跳级测试会评估你的实际能力，请如实回答。通过后可跳过1-2个等级。
        </div>
      </div>
    </div>
  );
}
