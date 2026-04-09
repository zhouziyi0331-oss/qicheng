"use client";
import { useState, useEffect } from "react";
import { taskApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string;
  budget_net: number;
  level_required: number;
  track_type: string;
  estimated_hours: number;
  tags: string[];
  status: string;
  assignee_count: number;
  max_assignees: number;
  // AI匹配相关字段
  matchScore?: number; // AI匹配度 0-100
  matchReason?: string; // AI推荐理由
  invitationStatus?: "pending" | "accepted" | "rejected"; // 邀请状态
}

const LEVEL_NAMES = ["入门", "初级", "中级", "高级", "专家", "大师", "满级"];

export default function AITasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    // 获取AI为当前学生推荐的任务
    taskApi.market().then(({ data }) => {
      // TODO: 后端应该返回AI匹配的任务，包含matchScore和matchReason
      // 临时添加模拟数据
      const tasksWithMatch = (data.data || []).map((task: Task, index: number) => ({
        ...task,
        matchScore: 95 - index * 5,
        matchReason: index === 0
          ? "你的React技能与此任务高度匹配，且有3个类似项目经验"
          : "你的技能组合符合任务需求，建议接单"
      }));
      setTasks(tasksWithMatch);
    }).catch(() => show("加载任务失败", "error")).finally(() => setLoading(false));
  }, []);

  const handleAccept = async (taskId: string) => {
    setAccepting(taskId);
    try {
      await taskApi.accept(taskId);
      show("已接受任务邀请！等待企业确认 🎯", "success");
      setTasks((ts) => ts.filter((t) => t.id !== taskId));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "接单失败，请重试", "error");
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (taskId: string) => {
    if (!confirm("确定要拒绝这个任务邀请吗？")) return;
    try {
      // TODO: 调用拒绝API
      show("已拒绝任务邀请", "info");
      setTasks((ts) => ts.filter((t) => t.id !== taskId));
    } catch (err: unknown) {
      show("操作失败，请重试", "error");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F5E6F0 0%, #FEFEFE 100%)',
      padding: '24px 0'
    }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* 顶部导航 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#2D3436',
              marginBottom: '8px'
            }}>🤖 AI为你推荐的任务</h1>
            <p style={{
              fontSize: '14px',
              color: '#636E72'
            }}>
              {loading ? "加载中..." : `AI根据你的能力和兴趣，为你精选了 ${tasks.length} 个任务`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/tasks"
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                background: 'white',
                border: '2px solid #E5D4E8',
                color: '#2D3436',
                fontWeight: '600',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              📋 所有任务
            </Link>
            <Link
              href="/my-tasks"
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                background: 'white',
                border: '2px solid #E5D4E8',
                color: '#2D3436',
                fontWeight: '600',
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              📋 我的任务
            </Link>
          </div>
        </div>

        {/* 任务列表 */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                height: '200px',
                borderRadius: '20px',
                background: 'white',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            ))}
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: '20px',
            border: '1px solid #E5D4E8'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤖</div>
            <p style={{ fontSize: '18px', color: '#2D3436', fontWeight: '600', marginBottom: '8px' }}>
              暂无AI推荐任务
            </p>
            <p style={{ fontSize: '14px', color: '#636E72' }}>
              AI正在为你寻找最合适的任务，请稍后再来看看
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="fade-in"
              style={{
                padding: '28px',
                borderRadius: '20px',
                background: 'white',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                border: '1px solid #E5D4E8',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  {/* 标签 */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {/* AI匹配度标签 */}
                    {task.matchScore && (
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        background: task.matchScore >= 90 ? '#10B98130' : task.matchScore >= 70 ? '#FFE08230' : '#F9C6D930',
                        color: task.matchScore >= 90 ? '#10B981' : task.matchScore >= 70 ? '#FFB84D' : '#EC4899',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        🤖 匹配度 {task.matchScore}%
                      </span>
                    )}
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      background: task.track_type === 'A' ? '#A8D8EA30' : task.track_type === 'B' ? '#D4A5F930' : '#D4F29130',
                      color: task.track_type === 'A' ? '#A8D8EA' : task.track_type === 'B' ? '#D4A5F9' : '#D4F291',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {task.track_type}赛道
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      background: '#FFE08230',
                      color: '#FFB84D',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      Lv.{task.level_required} {LEVEL_NAMES[task.level_required] || ''}
                    </span>
                  </div>

                  {/* 标题 */}
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#2D3436',
                    marginBottom: '12px',
                    lineHeight: '1.4'
                  }}>
                    {task.title}
                  </h3>

                  {/* 描述 */}
                  <p style={{
                    fontSize: '14px',
                    color: '#636E72',
                    lineHeight: '1.6',
                    marginBottom: '16px'
                  }}>
                    {task.description}
                  </p>

                  {/* AI推荐理由 */}
                  {task.matchReason && (
                    <div style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>💡</span>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#0369A1', marginBottom: '4px' }}>
                            AI推荐理由
                          </div>
                          <div style={{ fontSize: '13px', color: '#075985', lineHeight: '1.5' }}>
                            {task.matchReason}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 标签 */}
                  {task.tags && task.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {task.tags.map((tag) => (
                        <span key={tag} style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: '#F5E6F0',
                          color: '#636E72',
                          fontSize: '12px'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 右侧信息 */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '16px',
                  minWidth: '180px'
                }}>
                  {/* 报酬 */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#10B981',
                      marginBottom: '4px'
                    }}>
                      ¥{task.budget_net}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#636E72'
                    }}>
                      预计 {task.estimated_hours || 2} 小时
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <Link
                      href={`/tasks/${task.id}`}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #F9C6D9 0%, #EC4899 100%)',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(249, 198, 217, 0.3)',
                        transition: 'all 0.2s'
                      }}
                    >
                      查看详情
                    </Link>
                    <button
                      onClick={() => handleAccept(task.id)}
                      disabled={accepting === task.id}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        background: accepting === task.id ? '#E0E0E0' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: accepting === task.id ? 'not-allowed' : 'pointer',
                        opacity: accepting === task.id ? 0.6 : 1,
                        transition: 'all 0.2s',
                        boxShadow: accepting === task.id ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      {accepting === task.id ? "接受中..." : "✅ 接受邀请"}
                    </button>
                    <button
                      onClick={() => handleReject(task.id)}
                      disabled={accepting === task.id}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: '2px solid #E5D4E8',
                        background: 'white',
                        color: '#636E72',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: accepting === task.id ? 'not-allowed' : 'pointer',
                        opacity: accepting === task.id ? 0.6 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      ❌ 拒绝邀请
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        {!loading && tasks.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            marginTop: '24px'
          }}>
            <p style={{ fontSize: '14px', color: '#636E72' }}>
              已显示全部AI推荐任务 · AI每天更新推荐
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
