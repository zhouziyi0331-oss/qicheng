// 企业端 - 任务匹配流程组件
// 文件位置: company-miniapp/src/components/TaskMatching/index.tsx

import { View, Text, Button, Image, Checkbox } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface MatchedStudent {
  studentId: string;
  username: string;
  avatarUrl: string;
  bio: string;
  tasksCompleted: number;
  avgQuality: number;
  matchScore: {
    overall: number;
    skill: number;
    difficulty: number;
    domain: number;
    growth: number;
    reliability: number;
    preference: number;
  };
  matchReason: any;
  rank: number;
}

interface TaskMatchingProps {
  taskId: string;
  onMatchComplete?: () => void;
}

export default function TaskMatching({ taskId, onMatchComplete }: TaskMatchingProps) {
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [students, setStudents] = useState<MatchedStudent[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [matchStats, setMatchStats] = useState<any>(null);

  // 触发AI匹配
  const handleTriggerMatching = async () => {
    try {
      setMatching(true);
      Taro.showLoading({ title: 'AI正在匹配...' });

      const res = await Taro.request({
        url: `/api/v1/tasks/${taskId}/trigger-matching`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        Taro.showToast({
          title: `成功匹配${res.data.matchedCount}个学生`,
          icon: 'success'
        });

        // 加载匹配结果
        await loadMatchedStudents();
        onMatchComplete?.();
      }
    } catch (error) {
      Taro.showToast({
        title: '匹配失败，请重试',
        icon: 'error'
      });
    } finally {
      setMatching(false);
      Taro.hideLoading();
    }
  };

  // 加载匹配的学生列表
  const loadMatchedStudents = async () => {
    try {
      setLoading(true);
      const res = await Taro.request({
        url: `/api/v1/tasks/${taskId}/matched-students?limit=10`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        setStudents(res.data.students);
      }
    } catch (error) {
      console.error('加载匹配学生失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载匹配统计
  const loadMatchStats = async () => {
    try {
      const res = await Taro.request({
        url: `/api/v1/tasks/${taskId}/matching-stats`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        setMatchStats(res.data.stats);
      }
    } catch (error) {
      console.error('加载匹配统计失败:', error);
    }
  };

  // 选择/取消选择学生
  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      if (selectedStudents.length >= 5) {
        Taro.showToast({
          title: '最多只能选择5个学生',
          icon: 'none'
        });
        return;
      }
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  // 推送给选中的学生
  const handlePushToStudents = async () => {
    if (selectedStudents.length === 0) {
      Taro.showToast({
        title: '请至少选择1个学生',
        icon: 'none'
      });
      return;
    }

    try {
      Taro.showLoading({ title: '推送中...' });

      const res = await Taro.request({
        url: `/api/v1/tasks/${taskId}/push-to-students`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`,
          'Content-Type': 'application/json'
        },
        data: {
          studentIds: selectedStudents
        }
      });

      if (res.data.success) {
        Taro.showToast({
          title: `已推送给${selectedStudents.length}个学生`,
          icon: 'success'
        });

        // 重新加载数据
        await loadMatchedStudents();
        await loadMatchStats();
        setSelectedStudents([]);
      }
    } catch (error) {
      Taro.showToast({
        title: '推送失败，请重试',
        icon: 'error'
      });
    } finally {
      Taro.hideLoading();
    }
  };

  // 查看学生详情
  const handleViewStudent = (studentId: string) => {
    Taro.navigateTo({
      url: `/pages/student-profile/index?id=${studentId}`
    });
  };

  useEffect(() => {
    loadMatchedStudents();
    loadMatchStats();
  }, [taskId]);

  return (
    <View className="task-matching">
      {/* 匹配统计 */}
      {matchStats && (
        <View className="match-stats">
          <Text className="stats-title">匹配统计</Text>
          <View className="stats-row">
            <View className="stat-item">
              <Text className="stat-value">{matchStats.totalMatches}</Text>
              <Text className="stat-label">匹配学生</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">{matchStats.pushedCount}</Text>
              <Text className="stat-label">已推送</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">{matchStats.viewedCount}</Text>
              <Text className="stat-label">已查看</Text>
            </View>
            <View className="stat-item">
              <Text className="stat-value">{matchStats.acceptedCount}</Text>
              <Text className="stat-label">已接受</Text>
            </View>
          </View>
        </View>
      )}

      {/* 触发匹配按钮 */}
      {students.length === 0 && (
        <View className="trigger-section">
          <Button
            className="trigger-btn"
            onClick={handleTriggerMatching}
            loading={matching}
          >
            {matching ? 'AI正在匹配...' : '🤖 AI智能匹配学生'}
          </Button>
          <Text className="trigger-tip">
            AI会根据任务需求，从所有学生中找出最匹配的100个学生
          </Text>
        </View>
      )}

      {/* 匹配结果列表 */}
      {students.length > 0 && (
        <View className="matched-students">
          <View className="section-header">
            <Text className="section-title">
              为您匹配到 {students.length} 个学生
            </Text>
            <Button
              className="rematch-btn"
              size="mini"
              onClick={handleTriggerMatching}
            >
              重新匹配
            </Button>
          </View>

          {students.map((student, index) => (
            <View key={student.studentId} className="student-card">
              {/* 排名标签 */}
              <View className={`rank-badge rank-${index + 1}`}>
                #{index + 1}
              </View>

              {/* 学生基本信息 */}
              <View className="student-header">
                <Image
                  className="student-avatar"
                  src={student.avatarUrl || '/assets/default-avatar.png'}
                />
                <View className="student-info">
                  <Text className="student-name">{student.username}</Text>
                  <Text className="student-bio">{student.bio}</Text>
                  <View className="student-stats">
                    <Text className="stat">完成{student.tasksCompleted}个任务</Text>
                    <Text className="stat">质量{(student.avgQuality * 100).toFixed(0)}分</Text>
                  </View>
                </View>
              </View>

              {/* 匹配度 */}
              <View className="match-score-section">
                <View className="overall-score">
                  <Text className="score-label">综合匹配度</Text>
                  <Text className="score-value">
                    {(student.matchScore.overall * 100).toFixed(0)}%
                  </Text>
                </View>

                <View className="dimension-scores">
                  <View className="dimension">
                    <Text className="dim-label">技能</Text>
                    <View className="progress-bar">
                      <View
                        className="progress-fill"
                        style={{ width: `${student.matchScore.skill * 100}%` }}
                      />
                    </View>
                    <Text className="dim-value">
                      {(student.matchScore.skill * 100).toFixed(0)}%
                    </Text>
                  </View>

                  <View className="dimension">
                    <Text className="dim-label">难度</Text>
                    <View className="progress-bar">
                      <View
                        className="progress-fill"
                        style={{ width: `${student.matchScore.difficulty * 100}%` }}
                      />
                    </View>
                    <Text className="dim-value">
                      {(student.matchScore.difficulty * 100).toFixed(0)}%
                    </Text>
                  </View>

                  <View className="dimension">
                    <Text className="dim-label">可靠性</Text>
                    <View className="progress-bar">
                      <View
                        className="progress-fill"
                        style={{ width: `${student.matchScore.reliability * 100}%` }}
                      />
                    </View>
                    <Text className="dim-value">
                      {(student.matchScore.reliability * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* 匹配原因 */}
              {student.matchReason && (
                <View className="match-reason">
                  <Text className="reason-title">为什么推荐：</Text>
                  <Text className="reason-text">
                    {JSON.stringify(student.matchReason)}
                  </Text>
                </View>
              )}

              {/* 操作按钮 */}
              <View className="student-actions">
                <Checkbox
                  checked={selectedStudents.includes(student.studentId)}
                  onChange={(e) => handleSelectStudent(student.studentId, e.detail.value)}
                >
                  选择推送
                </Checkbox>
                <Button
                  size="mini"
                  onClick={() => handleViewStudent(student.studentId)}
                >
                  查看详情
                </Button>
              </View>
            </View>
          ))}

          {/* 批量推送按钮 */}
          <View className="push-section">
            <Text className="push-tip">
              已选择 {selectedStudents.length} 个学生
              {selectedStudents.length > 0 && selectedStudents.length < 5 &&
                `，建议选择5个学生以提高响应率`
              }
            </Text>
            <Button
              className="push-btn"
              type="primary"
              onClick={handlePushToStudents}
              disabled={selectedStudents.length === 0}
            >
              推送给选中的学生
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
