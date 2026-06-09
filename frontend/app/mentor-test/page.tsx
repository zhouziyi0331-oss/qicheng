'use client';

import { useState } from 'react';
import { MentorStageChat } from '@/components/mentor/MentorStageChat';
import { PreCheckResult } from '@/components/mentor/PreCheckResult';

export default function MentorTestPage() {
  const [mentorOpen, setMentorOpen] = useState(true);
  const [showPreCheck, setShowPreCheck] = useState(false);

  // 模拟预审结果
  const mockPreCheckResult = {
    passed: false,
    score: 65,
    feedback: `总体评分：65/100

五维度评分：
- 功能完整性：14/20
- 可用性：12/20
- 代码质量：13/20
- 文档完善度：10/20
- 创新性：16/20

亮点：
- 基本功能已实现
- 使用了TypeScript，代码类型安全
- UI设计有一定的创意

改进建议：
- 缺少任务修改功能，需要实现双击编辑或添加编辑按钮
- 没有提供代码仓库链接，请上传代码到GitHub并提供链接
- 建议添加README文档，说明如何运行项目
- UI设计可以参考Material-UI或Ant Design进行优化

导师寄语：
你的作品还有一些需要改进的地方。请根据上面的建议修改后再提交。相信你能做得更好！加油！💪`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">AI导师系统测试</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 测试卡片1 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">导师对话测试</h2>
            <p className="text-gray-600 mb-4">
              点击右下角的小猫图标打开AI导师对话窗口，测试4个阶段的对话功能。
            </p>
            <button
              onClick={() => setMentorOpen(!mentorOpen)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
            >
              {mentorOpen ? '关闭导师' : '打开导师'}
            </button>
          </div>

          {/* 测试卡片2 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">质量预审测试</h2>
            <p className="text-gray-600 mb-4">
              点击按钮查看质量预审结果弹窗，测试评分展示和改进建议功能。
            </p>
            <button
              onClick={() => setShowPreCheck(true)}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
            >
              查看预审结果
            </button>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">功能说明</h2>
          <div className="space-y-4 text-gray-600">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">📋 阶段1：需求理解与确认</h3>
              <p>学生接单后3秒自动触发，AI导师引导学生用自己的话复述需求，确保理解准确。</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">🚀 阶段2：执行引导</h3>
              <p>学生随时可以提问，AI导师用启发式方式引导，不直接给答案，培养独立思考能力。</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">✅ 阶段3：质量预审</h3>
              <p>学生提交前AI自动预审，从5个维度评分，不通过则阻止提交并给出改进建议。</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">🌉 阶段4：沟通桥梁</h3>
              <p>企业拒绝后AI翻译反馈，用学生能理解的语言解释企业意图，提供修改建议。</p>
            </div>
          </div>
        </div>

        {/* API测试 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">API端点</h2>
          <div className="space-y-2 text-sm font-mono text-gray-600">
            <div>GET /api/v1/mentor-stage/tasks/:taskId/session</div>
            <div>GET /api/v1/mentor-stage/sessions/:sessionId/messages</div>
            <div>POST /api/v1/mentor-stage/sessions/:sessionId/messages</div>
            <div>POST /api/v1/mentor-stage/tasks/:taskId/quality-review</div>
            <div>GET /api/v1/mentor-stage/sessions/:sessionId/stats</div>
          </div>
        </div>
      </div>

      {/* AI导师对话组件 */}
      <MentorStageChat
        taskId="test-task-id"
        isOpen={mentorOpen}
        onToggle={() => setMentorOpen(!mentorOpen)}
      />

      {/* 预审结果弹窗 */}
      {showPreCheck && (
        <PreCheckResult
          result={mockPreCheckResult}
          onRecheck={() => {
            setShowPreCheck(false);
            alert('请修改后重新检查');
          }}
          onForceSubmit={() => {
            setShowPreCheck(false);
            alert('已强制提交');
          }}
          onClose={() => setShowPreCheck(false)}
        />
      )}
    </div>
  );
}
