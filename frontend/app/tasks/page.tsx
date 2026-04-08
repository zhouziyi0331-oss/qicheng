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
}

const LEVEL_NAMES = ["入门", "初级", "中级", "高级", "专家", "大师", "满级"];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { show } = useToast();

  useEffect(() => {
    taskApi.market().then(({ data }) => {
      setTasks(data.data || []);
    }).catch(() => show("加载任务失败", "error")).finally(() => setLoading(false));
  }, []);

  const handleAccept = async (taskId: string) => {
    setAccepting(taskId);
    try {
      await taskApi.accept(taskId);
      show("接单成功！AI正在为你拆解步骤 🎯", "success");
      setTasks((ts) => ts.filter((t) => t.id !== taskId));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      show(msg || "接单失败，请重试", "error");
    } finally {
      setAccepting(null);
    }
  };

  // 筛选任务
  const filteredTasks = tasks.filter((task) => {
    if (filterTrack !== "all" && task.track_type !== filterTrack) return false;
    if (filterLevel !== "all" && task.level_required !== parseInt(filterLevel)) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
            }}>任务大厅</h1>
            <p style={{
              fontSize: '14px',
              color: '#636E72'
            }}>
              {loading ? "加载中..." : `为你精选了 ${filteredTasks.length} 个任务`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
            <Link
              href="/mentor"
              style={{
                padding: '10px 20px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #FFE082 0%, #FFB84D 100%)',
                color: '#2D3436',
                fontWeight: '600',
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(255, 224, 130, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              🤖 问AI导师
            </Link>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '24px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          border: '1px solid #E5D4E8'
        }}>
          {/* 搜索框 */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="🔍 搜索任务标题或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '16px',
                border: '2px solid #E5D4E8',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>

          {/* 筛选按钮 */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#636E72', fontWeight: '600' }}>筛选：</span>

            {/* 赛道筛选 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: "all", label: "全部赛道" },
                { value: "A", label: "A赛道", color: "#A8D8EA" },
                { value: "B", label: "B赛道", color: "#D4A5F9" },
                { value: "AB", label: "AB赛道", color: "#D4F291" },
              ].map((track) => (
                <button
                  key={track.value}
                  onClick={() => setFilterTrack(track.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: filterTrack === track.value ? '2px solid ' + (track.color || '#F9C6D9') : '2px solid #E5D4E8',
                    background: filterTrack === track.value ? (track.color || '#F9C6D9') + '20' : 'white',
                    color: '#2D3436',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {track.label}
                </button>
              ))}
            </div>

            {/* 等级筛选 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: "all", label: "全部等级" },
                { value: "0", label: "Lv0-2", color: "#D4F291" },
                { value: "3", label: "Lv3-5", color: "#FFE082" },
                { value: "6", label: "Lv6-7", color: "#F9C6D9" },
              ].map((level) => (
                <button
                  key={level.value}
                  onClick={() => setFilterLevel(level.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: filterLevel === level.value ? '2px solid ' + (level.color || '#F9C6D9') : '2px solid #E5D4E8',
                    background: filterLevel === level.value ? (level.color || '#F9C6D9') + '20' : 'white',
                    color: '#2D3436',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {level.label}
                </button>
              ))}
            </div>
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

        {!loading && filteredTasks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: '20px',
            border: '1px solid #E5D4E8'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <p style={{ fontSize: '18px', color: '#2D3436', fontWeight: '600', marginBottom: '8px' }}>
              暂无符合条件的任务
            </p>
            <p style={{ fontSize: '14px', color: '#636E72' }}>
              试试调整筛选条件，或者稍后再来看看
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredTasks.map((task) => (
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
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      background: '#F9C6D930',
                      color: '#EC4899',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {task.assignee_count}/{task.max_assignees} 人已接
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
                      color: '#D4F291',
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
                        border: '2px solid #E5D4E8',
                        background: 'white',
                        color: '#2D3436',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: accepting === task.id ? 'not-allowed' : 'pointer',
                        opacity: accepting === task.id ? 0.6 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      {accepting === task.id ? "接单中..." : "立即接单"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        {!loading && filteredTasks.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            marginTop: '24px'
          }}>
            <p style={{ fontSize: '14px', color: '#636E72' }}>
              已显示全部任务 · 每天更新
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
