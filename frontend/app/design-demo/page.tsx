// 启程平台 - 设计系统示例页面
// 展示所有设计组件和样式

'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  Tag,
  Input,
  Progress,
  Blob,
  Loading,
  GradientText,
  StatCard,
  TaskCard,
  ProfileCard,
  EmptyState,
  Badge,
  Toast,
} from '@/components/ui/DesignSystem';

export default function DesignSystemDemo() {
  const [showToast, setShowToast] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 py-20">
        <Blob variant={1} size={256} className="top-10 left-10" />
        <Blob variant={2} size={192} className="bottom-10 right-10" animate />

        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-6xl font-bold mb-4">
            <GradientText variant="rainbow">启程平台设计系统</GradientText>
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            扁平插画风格 + 渐变配色 + 年轻化视觉
          </p>
          <div className="flex gap-4">
            <Button variant="primary" size="lg">开始探索 →</Button>
            <Button variant="secondary" size="lg">查看文档</Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-16 space-y-20">
        {/* 按钮组件 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">按钮组件</h2>
          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">主要按钮</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">主按钮</Button>
                  <Button variant="pink">粉色按钮</Button>
                  <Button variant="cyan">青色按钮</Button>
                  <Button variant="secondary">次要按钮</Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">尺寸</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="primary" size="sm">小按钮</Button>
                  <Button variant="primary" size="md">中按钮</Button>
                  <Button variant="primary" size="lg">大按钮</Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">图标按钮</h3>
                <div className="flex gap-4">
                  <Button variant="icon">❤️</Button>
                  <Button variant="icon">⭐</Button>
                  <Button variant="icon">🔔</Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 卡片组件 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">卡片组件</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="default">
              <h3 className="text-xl font-bold mb-2">基础卡片</h3>
              <p className="text-gray-600">简洁的白色卡片，适合大多数场景</p>
            </Card>

            <Card variant="gradient">
              <h3 className="text-xl font-bold mb-2">渐变卡片</h3>
              <p className="text-gray-700">柔和的渐变背景，更有视觉吸引力</p>
            </Card>

            <Card variant="hover">
              <h3 className="text-xl font-bold mb-2">悬停卡片</h3>
              <p className="text-gray-600">鼠标悬停时有动画效果</p>
            </Card>
          </div>
        </section>

        {/* 标签组件 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">标签组件</h2>
          <Card>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">OPC标签</h3>
                <div className="flex flex-wrap gap-4">
                  <Tag type="opc-o" icon="🎨">O-创意先锋</Tag>
                  <Tag type="opc-p" icon="⚡">P-执行专家</Tag>
                  <Tag type="opc-c" icon="💻">C-技术大师</Tag>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">其他标签</h3>
                <div className="flex flex-wrap gap-4">
                  <Tag type="level" icon="⭐">Lv.2</Tag>
                  <Tag type="category">内容创作</Tag>
                  <Tag type="category">工具开发</Tag>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 输入框组件 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">输入框组件</h2>
          <Card>
            <div className="space-y-6 max-w-md">
              <Input
                label="用户名"
                placeholder="请输入用户名"
              />
              <Input
                label="邮箱"
                type="email"
                placeholder="your@email.com"
                icon={<span>📧</span>}
              />
              <Input
                label="密码"
                type="password"
                placeholder="请输入密码"
                error="密码长度至少8位"
              />
            </div>
          </Card>
        </section>

        {/* 进度条组件 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">进度条组件</h2>
          <Card>
            <div className="space-y-6">
              <Progress value={30} showLabel />
              <Progress value={65} showLabel />
              <Progress value={90} showLabel />
            </div>
          </Card>
        </section>

        {/* 加载动画 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">加载动画</h2>
          <Card>
            <div className="flex flex-wrap gap-12 items-center justify-center py-8">
              <div className="text-center">
                <Loading variant="pulse" size="md" />
                <p className="text-sm text-gray-600 mt-4">脉冲加载</p>
              </div>
              <div className="text-center">
                <Loading variant="spin" size="md" />
                <p className="text-sm text-gray-600 mt-4">旋转加载</p>
              </div>
              <div className="text-center">
                <Loading variant="wave" />
                <p className="text-sm text-gray-600 mt-4">波浪加载</p>
              </div>
            </div>
          </Card>
        </section>

        {/* 统计卡片 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">统计卡片</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon="👥"
              label="总用户数"
              value="1,234"
              trend={{ value: 12, isPositive: true }}
              gradient="primary"
            />
            <StatCard
              icon="📋"
              label="活跃任务"
              value="89"
              trend={{ value: 5, isPositive: true }}
              gradient="cyan"
            />
            <StatCard
              icon="💰"
              label="今日收入"
              value="¥5.6K"
              trend={{ value: 8, isPositive: false }}
              gradient="green"
            />
            <StatCard
              icon="⭐"
              label="平均评分"
              value="4.8"
              gradient="orange"
            />
          </div>
        </section>

        {/* 任务卡片 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">任务卡片</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TaskCard
              title="AI工具测评视频制作"
              description="需要制作一个3分钟的AI工具测评视频，包括功能演示、使用体验分享、优缺点分析..."
              category="内容创作"
              level={1}
              budget={350}
              company={{ name: 'AI科技公司', avatar: 'AI' }}
            />
            <TaskCard
              title="小红书文案创作"
              description="为新产品撰写吸引人的小红书推广文案，需要有创意、接地气..."
              category="内容创作"
              level={0}
              budget={200}
              company={{ name: '美妆品牌', avatar: '💄' }}
            />
            <TaskCard
              title="Chrome插件开发"
              description="开发一个简单的Chrome浏览器插件，实现网页内容提取功能..."
              category="工具开发"
              level={2}
              budget={800}
              company={{ name: '科技公司', avatar: '🚀' }}
            />
          </div>
        </section>

        {/* 个人资料卡片 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">个人资料卡片</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProfileCard
              avatar="🎓"
              nickname="小明"
              opcLabel="O-创意先锋"
              opcType="O"
              stats={{ tasks: 12, earnings: 2800, level: 2 }}
            />
            <ProfileCard
              avatar="👨‍💼"
              nickname="小红"
              opcLabel="P-执行专家"
              opcType="P"
              stats={{ tasks: 25, earnings: 5600, level: 3 }}
            />
            <ProfileCard
              avatar="👩‍💻"
              nickname="小李"
              opcLabel="C-技术大师"
              opcType="C"
              stats={{ tasks: 8, earnings: 6400, level: 2 }}
            />
          </div>
        </section>

        {/* 空状态 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">空状态</h2>
          <Card>
            <EmptyState
              icon="📭"
              title="暂无任务"
              description="你还没有接取任何任务，去任务大厅看看吧！"
              action={{
                label: '浏览任务',
                onClick: () => alert('跳转到任务大厅'),
              }}
            />
          </Card>
        </section>

        {/* 通知徽章 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">通知徽章</h2>
          <Card>
            <div className="flex gap-8 items-center">
              <div className="relative">
                <Button variant="icon">🔔</Button>
                <Badge count={5} />
              </div>
              <div className="relative">
                <Button variant="icon">💬</Button>
                <Badge count={99} />
              </div>
              <div className="relative">
                <Button variant="icon">📧</Button>
                <Badge count={150} max={99} />
              </div>
            </div>
          </Card>
        </section>

        {/* Toast通知 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">Toast通知</h2>
          <Card>
            <div className="space-y-4">
              <Button variant="primary" onClick={() => setShowToast(true)}>
                显示通知
              </Button>

              {showToast && (
                <div className="space-y-4">
                  <Toast
                    type="success"
                    message="操作成功！任务已提交"
                    onClose={() => setShowToast(false)}
                  />
                  <Toast
                    type="error"
                    message="操作失败，请重试"
                    onClose={() => setShowToast(false)}
                  />
                  <Toast
                    type="warning"
                    message="注意：余额不足"
                    onClose={() => setShowToast(false)}
                  />
                  <Toast
                    type="info"
                    message="新消息：你有一条新通知"
                    onClose={() => setShowToast(false)}
                  />
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* 渐变文字 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">渐变文字</h2>
          <Card>
            <div className="space-y-4">
              <h3 className="text-5xl font-bold">
                <GradientText variant="primary">开启你的职业启程</GradientText>
              </h3>
              <h3 className="text-5xl font-bold">
                <GradientText variant="cyan">探索无限可能</GradientText>
              </h3>
              <h3 className="text-5xl font-bold">
                <GradientText variant="rainbow">成就精彩人生</GradientText>
              </h3>
            </div>
          </Card>
        </section>

        {/* 装饰性形状 */}
        <section className="animate-fade-in">
          <h2 className="text-4xl font-bold mb-8 text-gradient-primary">装饰性形状</h2>
          <Card>
            <div className="relative h-64 overflow-hidden rounded-xl bg-gradient-soft">
              <Blob variant={1} size={200} className="top-4 left-4" />
              <Blob variant={2} size={150} className="bottom-4 right-4" animate />
              <Blob variant={3} size={180} className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl font-bold text-gray-700">装饰性背景元素</p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-purple-900 via-pink-900 to-cyan-900 text-white py-12 mt-20">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold mb-4">启程平台设计系统</h3>
          <p className="text-purple-200 mb-6">
            扁平插画风格 + 渐变配色 + 年轻化视觉
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary">查看文档</Button>
            <Button variant="primary">开始使用</Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
