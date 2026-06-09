'use client';

import { CheckCircle, XCircle, AlertCircle, Lightbulb } from 'lucide-react';

interface PreCheckResultProps {
  result: {
    passed: boolean;
    score: number;
    feedback: string;
  };
  onRecheck: () => void;
  onForceSubmit: () => void;
  onClose: () => void;
}

export function PreCheckResult({ result, onRecheck, onForceSubmit, onClose }: PreCheckResultProps) {
  const { passed, score, feedback } = result;

  // 解析反馈内容
  const parsedFeedback = parseFeedback(feedback);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className={`p-6 ${passed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-orange-500 to-red-500'} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {passed ? (
                <CheckCircle size={32} />
              ) : (
                <XCircle size={32} />
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {passed ? '预审通过！' : '需要改进'}
                </h2>
                <p className="text-sm opacity-90 mt-1">
                  {passed
                    ? '恭喜！你的作品已达到提交标准'
                    : '你的作品还有一些需要改进的地方'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{score}</div>
              <div className="text-sm opacity-90">分</div>
            </div>
          </div>
        </div>

        {/* 评分详情 */}
        {parsedFeedback.scores && (
          <div className="p-6 border-b">
            <h3 className="font-bold text-lg mb-4 flex items-center">
              <span className="mr-2">📊</span>
              五维度评分
            </h3>
            <div className="space-y-3">
              {Object.entries(parsedFeedback.scores).map(([key, value]) => (
                <ScoreBar
                  key={key}
                  label={getDimensionLabel(key)}
                  score={value as number}
                  maxScore={20}
                />
              ))}
            </div>
          </div>
        )}

        {/* 亮点 */}
        {parsedFeedback.strengths && parsedFeedback.strengths.length > 0 && (
          <div className="p-6 border-b bg-green-50">
            <h3 className="font-bold text-lg mb-3 text-green-700 flex items-center">
              <span className="mr-2">✨</span>
              做得好的地方
            </h3>
            <ul className="space-y-2">
              {parsedFeedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 改进建议 */}
        {parsedFeedback.suggestions && parsedFeedback.suggestions.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="font-bold text-lg mb-3 text-orange-700 flex items-center">
              <span className="mr-2">🔧</span>
              改进建议
            </h3>
            <div className="space-y-3">
              {parsedFeedback.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <Lightbulb className="text-orange-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                  <span className="text-gray-700 text-sm">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 总体反馈 */}
        <div className="p-6 border-b bg-blue-50">
          <h3 className="font-bold text-lg mb-3 text-blue-700 flex items-center">
            <span className="mr-2">💬</span>
            导师寄语
          </h3>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {parsedFeedback.overallFeedback || feedback}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="p-6 flex space-x-4">
          {passed ? (
            <>
              <button
                onClick={onForceSubmit}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
              >
                继续提交 →
              </button>
              <button
                onClick={onClose}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-all"
              >
                关闭
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onRecheck}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
              >
                修改后重新检查
              </button>
              <button
                onClick={onForceSubmit}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition-all"
              >
                强制提交（不推荐）
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 评分条组件
function ScoreBar({ label, score, maxScore }: { label: string; score: number; maxScore: number }) {
  const percentage = (score / maxScore) * 100;
  const color = percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{score}/{maxScore}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// 辅助函数：解析反馈内容
function parseFeedback(feedback: string) {
  const result: {
    scores?: Record<string, number>;
    strengths?: string[];
    suggestions?: string[];
    overallFeedback?: string;
  } = {};

  // 尝试解析五维度评分
  const scoresMatch = feedback.match(/五维度评分[：:]([\s\S]*?)(?=\n\n|亮点|改进建议|导师寄语|$)/);
  if (scoresMatch) {
    const scoresText = scoresMatch[1];
    const scores: Record<string, number> = {};

    const functionalityMatch = scoresText.match(/功能完整性[：:]?\s*(\d+)/);
    const usabilityMatch = scoresText.match(/可用性[：:]?\s*(\d+)/);
    const codeQualityMatch = scoresText.match(/代码质量[：:]?\s*(\d+)/);
    const documentationMatch = scoresText.match(/文档完善度[：:]?\s*(\d+)/);
    const innovationMatch = scoresText.match(/创新性[：:]?\s*(\d+)/);

    if (functionalityMatch) scores.functionality = parseInt(functionalityMatch[1]);
    if (usabilityMatch) scores.usability = parseInt(usabilityMatch[1]);
    if (codeQualityMatch) scores.codeQuality = parseInt(codeQualityMatch[1]);
    if (documentationMatch) scores.documentation = parseInt(documentationMatch[1]);
    if (innovationMatch) scores.innovation = parseInt(innovationMatch[1]);

    if (Object.keys(scores).length > 0) {
      result.scores = scores;
    }
  }

  // 尝试解析亮点
  const strengthsMatch = feedback.match(/亮点[：:]([\s\S]*?)(?=\n\n改进建议|导师寄语|$)/);
  if (strengthsMatch) {
    const strengthsText = strengthsMatch[1];
    const strengths = strengthsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s && (s.startsWith('-') || s.startsWith('•') || s.startsWith('✓') || /^\d+\./.test(s)))
      .map(s => s.replace(/^[-•✓\d.]\s*/, ''));

    if (strengths.length > 0) {
      result.strengths = strengths;
    }
  }

  // 尝试解析改进建议
  const suggestionsMatch = feedback.match(/改进建议[：:]([\s\S]*?)(?=\n\n导师寄语|是否通过|$)/);
  if (suggestionsMatch) {
    const suggestionsText = suggestionsMatch[1];
    const suggestions = suggestionsText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s && (s.startsWith('-') || s.startsWith('•') || /^\d+\./.test(s)))
      .map(s => s.replace(/^[-•\d.]\s*/, ''));

    if (suggestions.length > 0) {
      result.suggestions = suggestions;
    }
  }

  // 尝试解析总体反馈
  const feedbackMatch = feedback.match(/导师寄语[：:]([\s\S]*?)$/);
  if (feedbackMatch) {
    result.overallFeedback = feedbackMatch[1].trim();
  }

  return result;
}

// 辅助函数：获取维度标签
function getDimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    functionality: '功能完整性',
    usability: '可用性',
    codeQuality: '代码质量',
    documentation: '文档完善度',
    innovation: '创新性',
  };
  return labels[key] || key;
}
