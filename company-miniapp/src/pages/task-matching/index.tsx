import Taro from '@tarojs/taro';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import './index.scss';

/**
 * 企业端 - 任务匹配页面
 *
 * 功能：
 * 1. 触发AI匹配
 * 2. 显示匹配进度
 * 3. 展示Top 10匹配学生
 * 4. 选择5个学生推送任务
 */

interface MatchedStudent {
  studentId: string;
  username: string;
  avatarUrl: string;
  bio: string;
  tasksCompleted: number;
  avgQuality: number;
  avgSatisfaction: number;
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

export default function TaskMatchingPage() {
  const [taskId, setTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchedStudents, setMatchedStudents] = useState<MatchedStudent[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [matchStats, setMatchStats] = useState<any>(null);

  useEffect(() => {
    // 从路由参数获取taskId
    const instance = Taro.getCurrentInstance();
    const id = instance.router?.params?.taskId;
    if (id) {
      setTaskId(id);
      checkMatchingStatus(id);
    }
  }, []);

  // 检查匹配状态
  const checkMatchingStatus = async (id: string) => {
    try {
      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/tasks/${id}/matching-stats`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      });

      if (res.data.success) {
        setMatchStats(res.data.stats);

        // 如果已经有匹配结果，直接加载
        if (res.data.stats.totalMatches > 0) {
          loadMatchedStudents(id);
        }
      }
    } catch (error) {
      console.error('检查匹配状态失败', error);
    }
  };

  // 触发AI匹配
  const triggerMatching = async () => {
    try {
      setMatching(true);

      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/tasks/${taskId}/trigger-matching`,
        method: 'POST',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      });

      if (res.data.success) {
        Taro.showToast({
          title: `成功匹配${res.data.matchedCount}个学生`,
          icon: 'success',
        });

        // 加载匹配结果
        await loadMatchedStudents(taskId);
      }
    } catch (error) {
      Taro.showToast({
        title: '匹配失败，请重试',
        icon: 'none',
      });
    } finally {
      setMatching(false);
    }
  };

  // 加载匹配的学生列表
  const loadMatchedStudents = async (id: string) => {
    try {
      setLoading(true);

      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/tasks/${id}/matched-students?limit=10`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      });

      if (res.data.success) {
        setMatchedStudents(res.data.students);
      }
    } catch (error) {
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 选择/取消选择学生
  const toggleStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      if (selectedStudents.length >= 5) {
        Taro.showToast({
          title: '最多只能选择5个学生',
          icon: 'none',
        });
        return;
      }
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // 推送任务给选中的学生
  const pushToStudents = async () => {
    if (selectedStudents.length === 0) {
      Taro.showToast({
        title: '请至少选择1个学生',
        icon: 'none',
      });
      return;
    }

    try {
      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/tasks/${taskId}/push-to-students`,
        method: 'POST',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
          'Content-Type': 'application/json',
        },
        data: {
          studentIds: selectedStudents,
        },
      });

      if (res.data.success) {
        Taro.showToast({
          title: `已推送给${selectedStudents.length}个学生`,
          icon: 'success',
        });

        // 返回任务详情页
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      }
    } catch (error) {
      Taro.showToast({
        title: '推送失败',
        icon: 'none',
      });
    }
  };

  // 获取维度标签
  const getDimensionLabel = (key: string) => {
    const labels: any = {
      skill: '技能匹配',
      difficulty: '难度匹配',
      domain: '领域经验',
      growth: '成长潜力',
      reliability: '可靠性',
      preference: '偏好对齐',
    };
    return labels[key] || key;
  };

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#1890ff';
    if (score >= 0.4) return '#faad14';
    return '#f5222d';
  };

  return (
    <View className='task-matching-page'>
      {/* 头部 */}
      <View className='header'>
        <View className='title'>AI智能匹配</View>
        <View className='subtitle'>为您找到最合适的学生</View>
      </View>

      {/* 匹配状态 */}
      {matchStats && (
        <View className='stats-card'>
          <View className='stats-row'>
            <View className='stat-item'>
              <Text className='stat-value'>{matchStats.totalMatches}</Text>
              <Text className='stat-label'>匹配学生</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{matchStats.pushedCount}</Text>
              <Text className='stat-label'>已推送</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{matchStats.viewedCount}</Text>
              <Text className='stat-label'>已查看</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>{matchStats.acceptedCount}</Text>
              <Text className='stat-label'>已接受</Text>
            </View>
          </View>
        </View>
      )}

      {/* 匹配按钮 */}
      {matchedStudents.length === 0 && !matching && (
        <View className='match-action'>
          <Button className='match-btn' onClick={triggerMatching}>
            <Text className='btn-icon'>🤖</Text>
            <Text className='btn-text'>开始AI匹配</Text>
          </Button>
          <View className='match-tip'>
            AI将分析任务需求，为您找到最合适的学生
          </View>
        </View>
      )}

      {/* 匹配中 */}
      {matching && (
        <View className='matching-status'>
          <View className='loading-icon'>⏳</View>
          <View className='loading-text'>AI正在为您匹配最合适的学生...</View>
          <View className='loading-desc'>
            正在分析任务需求、学生能力、历史表现等数据
          </View>
        </View>
      )}

      {/* 匹配结果 */}
      {matchedStudents.length > 0 && (
        <View className='results-section'>
          <View className='section-header'>
            <Text className='section-title'>
              为您找到 {matchedStudents.length} 个匹配学生
            </Text>
            <Text className='section-tip'>
              请选择最多5个学生推送任务
            </Text>
          </View>

          <ScrollView scrollY className='students-list'>
            {matchedStudents.map((student) => (
              <View
                key={student.studentId}
                className={`student-card ${
                  selectedStudents.includes(student.studentId) ? 'selected' : ''
                }`}
                onClick={() => toggleStudent(student.studentId)}
              >
                {/* 排名标签 */}
                <View className='rank-badge'>#{student.rank}</View>

                {/* 选中标记 */}
                {selectedStudents.includes(student.studentId) && (
                  <View className='selected-badge'>✓</View>
                )}

                {/* 学生信息 */}
                <View className='student-info'>
                  <View className='student-header'>
                    <Text className='student-name'>{student.username}</Text>
                    <View
                      className='match-score'
                      style={{ color: getScoreColor(student.matchScore.overall) }}
                    >
                      <Text className='score-value'>
                        {Math.round(student.matchScore.overall * 100)}%
                      </Text>
                      <Text className='score-label'>匹配度</Text>
                    </View>
                  </View>

                  {student.bio && (
                    <View className='student-bio'>{student.bio}</View>
                  )}

                  <View className='student-stats'>
                    <Text className='stat'>
                      完成任务: {student.tasksCompleted}
                    </Text>
                    <Text className='stat'>
                      平均质量: {(student.avgQuality * 100).toFixed(0)}%
                    </Text>
                    <Text className='stat'>
                      满意度: {(student.avgSatisfaction * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>

                {/* 匹配详情 */}
                <View className='match-details'>
                  <View className='details-title'>匹配分析</View>
                  <View className='dimensions'>
                    {Object.entries(student.matchScore)
                      .filter(([key]) => key !== 'overall')
                      .map(([key, value]) => (
                        <View key={key} className='dimension-item'>
                          <Text className='dimension-label'>
                            {getDimensionLabel(key)}
                          </Text>
                          <View className='dimension-bar'>
                            <View
                              className='dimension-fill'
                              style={{
                                width: `${(value as number) * 100}%`,
                                background: getScoreColor(value as number),
                              }}
                            />
                          </View>
                          <Text className='dimension-value'>
                            {Math.round((value as number) * 100)}%
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* 推送按钮 */}
          <View className='push-action'>
            <View className='selected-count'>
              已选择 {selectedStudents.length}/5 个学生
            </View>
            <Button
              className='push-btn'
              disabled={selectedStudents.length === 0}
              onClick={pushToStudents}
            >
              推送任务给选中的学生
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
