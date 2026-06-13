import { View, Text, ScrollView, Button, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import CollaborationProgressHint from '../../components/CollaborationProgressHint';
import './index.scss';

interface Student {
  studentId: string;
  studentName: string;
  avatar?: string;
  level: number;
  matchScore: number;
  matchReason: string;
  completedTasks: number;
  successRate: number;
  averageRating: number;
  skills: string[];
  recentWorks?: string[];
  collaborationCount?: number;
}

// E-05: 增强档案数据
interface EnhancedProfile {
  headline: string;
  growth_story: string;
  key_strengths: string[];
  milestones: any[];
  metrics: {
    tasks_completed: number;
    success_rate: number;
    on_time_rate: number;
    avg_rating: number;
    growth_rate: number;
  };
  tags: string[];
  investment_highlights: string[];
}

export default function SelectStudents() {
  const router = useRouter();
  const { taskId } = router.params;
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // E-05: 增强档案数据
  const [enhancedProfiles, setEnhancedProfiles] = useState<Map<string, EnhancedProfile>>(new Map())
  const [showEnhanced, setShowEnhanced] = useState(true)

  useEffect(() => {
    loadMatchedStudents();
  }, [taskId]);

  const loadMatchedStudents = async () => {
    setLoading(true);
    try {
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/flow/${taskId}/matched-students`,
        method: 'GET',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        }
      });

      if (res.data.success) {
        const studentList = res.data.data.students || [];
        setStudents(studentList);

        // E-05: 加载增强档案
        if (studentList.length > 0) {
          loadEnhancedProfiles(studentList.map((s: Student) => s.studentId));
        }
      } else {
        Taro.showToast({ title: res.data.message || '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error('加载匹配学生失败:', err);
      Taro.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  // E-05: 加载增强档案
  const loadEnhancedProfiles = async (studentIds: string[]) => {
    try {
      const token = Taro.getStorageSync('token')
      const res = await Taro.request({
        url: '/api/students/batch-enhanced-profiles',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          studentIds
        }
      })

      if (res.data.success) {
        const profiles = res.data.data.profiles || []
        const profileMap = new Map<string, EnhancedProfile>()
        profiles.forEach((profile: any) => {
          profileMap.set(profile.student_id, profile)
        })
        setEnhancedProfiles(profileMap)
      }
    } catch (error) {
      console.error('加载增强档案失败:', error)
      // 静默失败，不影响基础功能
    }
  }

  const handleToggleSelect = (studentId: string) => {
    if (selectedIds.includes(studentId)) {
      setSelectedIds(selectedIds.filter(id => id !== studentId));
    } else {
      if (selectedIds.length >= 5) {
        Taro.showToast({ title: '最多选择5名学生', icon: 'none' });
        return;
      }
      setSelectedIds([...selectedIds, studentId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      Taro.showToast({ title: '请至少选择1名学生', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认选择',
      content: `确认邀请${selectedIds.length}名学生接单吗？第一个接受的学生将获得任务。`,
      success: async (modalRes) => {
        if (modalRes.confirm) {
          await submitSelection();
        }
      }
    });
  };

  const submitSelection = async () => {
    setSubmitting(true);
    try {
      Taro.showLoading({ title: '发送邀请中...' });
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/flow/${taskId}/select-students`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`
        },
        data: {
          studentIds: selectedIds
        }
      });

      Taro.hideLoading();

      if (res.data.success) {
        Taro.showToast({ title: '邀请已发送', icon: 'success' });
        setTimeout(() => {
          Taro.redirectTo({ url: '/pages/tasks/index' });
        }, 1500);
      } else {
        throw new Error(res.data.message || '发送失败');
      }
    } catch (err: any) {
      Taro.hideLoading();
      console.error('发送邀请失败:', err);
      Taro.showToast({ title: err.message || '发送失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="select-students-page">
        <View className="loading">加载中...</View>
      </View>
    );
  }

  return (
    <View className="select-students-page">
      <View className="header">
        <Text className="title">选择学生</Text>
        <Text className="subtitle">AI为您匹配了{students.length}名合适的学生，请选择5名邀请接单</Text>
        <View className="selection-count">
          已选择 <Text className="count">{selectedIds.length}</Text>/5
        </View>
      </View>

      <ScrollView className="student-list" scrollY>
        {students.map((student) => (
          <View
            key={student.studentId}
            className={`student-card ${selectedIds.includes(student.studentId) ? 'selected' : ''}`}
            onClick={() => handleToggleSelect(student.studentId)}
          >
            {/* 选中标记 */}
            {selectedIds.includes(student.studentId) && (
              <View className="selected-badge">✓</View>
            )}

            {/* 匹配度 */}
            <View className="match-badge">
              <Text className="match-score">{student.matchScore}%</Text>
              <Text className="match-text">匹配</Text>
            </View>

            {/* 合作进度提示 */}
            {student.collaborationCount && student.collaborationCount > 0 && (
              <View onClick={(e) => e.stopPropagation()}>
                <CollaborationProgressHint
                  studentId={student.studentId}
                  mode="inline"
                  showAction={false}
                />
              </View>
            )}

            {/* 学生信息 */}
            <View className="student-info">
              <View className="student-header">
                {student.avatar ? (
                  <Image src={student.avatar} className="avatar" />
                ) : (
                  <View className="avatar-placeholder">
                    {student.studentName.charAt(0)}
                  </View>
                )}
                <View className="student-basic">
                  <Text className="student-name">{student.studentName}</Text>
                  <Text className="student-level">Lv.{student.level}</Text>
                </View>
              </View>

              {/* E-05: 投资简报式展示 */}
              {showEnhanced && enhancedProfiles.has(student.studentId) && (() => {
                const profile = enhancedProfiles.get(student.studentId)!;
                return (
                  <View className="investment-brief">
                    {/* 一句话描述 */}
                    {profile.headline && (
                      <View className="headline">
                        <Text className="headline-text">{profile.headline}</Text>
                      </View>
                    )}

                    {/* 成长故事 */}
                    {profile.growth_story && (
                      <View className="growth-story">
                        <Text className="story-text">{profile.growth_story}</Text>
                      </View>
                    )}

                    {/* 关键指标 */}
                    <View className="key-metrics">
                      <View className="metric-item">
                        <Text className="metric-value">{profile.metrics.tasks_completed}</Text>
                        <Text className="metric-label">完成任务</Text>
                      </View>
                      <View className="metric-item">
                        <Text className="metric-value">{(profile.metrics.success_rate * 100).toFixed(0)}%</Text>
                        <Text className="metric-label">成功率</Text>
                      </View>
                      <View className="metric-item">
                        <Text className="metric-value">{(profile.metrics.on_time_rate * 100).toFixed(0)}%</Text>
                        <Text className="metric-label">按时交付</Text>
                      </View>
                      <View className="metric-item">
                        <Text className="metric-value">{profile.metrics.avg_rating.toFixed(1)}</Text>
                        <Text className="metric-label">平均评分</Text>
                      </View>
                    </View>

                    {/* 投资亮点 */}
                    {profile.investment_highlights && profile.investment_highlights.length > 0 && (
                      <View className="investment-highlights">
                        <Text className="section-title">投资亮点</Text>
                        {profile.investment_highlights.map((highlight, idx) => (
                          <View key={idx} className="highlight-item">
                            <Text className="highlight-icon">💡</Text>
                            <Text className="highlight-text">{highlight}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* 核心优势 */}
                    {profile.key_strengths && profile.key_strengths.length > 0 && (
                      <View className="key-strengths">
                        <Text className="section-title">核心优势</Text>
                        <View className="strengths-list">
                          {profile.key_strengths.map((strength, idx) => (
                            <View key={idx} className="strength-tag">
                              {strength}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* 技能标签 */}
                    {profile.tags && profile.tags.length > 0 && (
                      <View className="profile-tags">
                        {profile.tags.map((tag, idx) => (
                          <View key={idx} className="profile-tag">
                            {tag}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* 降级显示：如果没有增强档案，显示基础信息 */}
              {(!showEnhanced || !enhancedProfiles.has(student.studentId)) && (
                <View className="basic-info">
                  {/* 统计数据 */}
                  <View className="student-stats">
                    <View className="stat-item">
                      <Text className="stat-value">{student.completedTasks}</Text>
                      <Text className="stat-label">完成任务</Text>
                    </View>
                    <View className="stat-item">
                      <Text className="stat-value">{student.successRate}%</Text>
                      <Text className="stat-label">成功率</Text>
                    </View>
                    <View className="stat-item">
                      <Text className="stat-value">{student.averageRating.toFixed(1)}</Text>
                      <Text className="stat-label">平均评分</Text>
                    </View>
                  </View>

                  {/* 技能标签 */}
                  {student.skills && student.skills.length > 0 && (
                    <View className="student-skills">
                      {student.skills.map((skill, index) => (
                        <View key={index} className="skill-tag">
                          {skill}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 匹配理由 */}
                  <View className="match-reason">
                    <Text className="reason-label">推荐理由：</Text>
                    <Text className="reason-text">{student.matchReason}</Text>
                  </View>
                </View>
              )}

              {/* 近期作品 */}
              {student.recentWorks && student.recentWorks.length > 0 && (
                <View className="recent-works">
                  <Text className="works-label">近期作品</Text>
                  <View className="works-grid">
                    {student.recentWorks.map((work, index) => (
                      <Image
                        key={index}
                        src={work}
                        className="work-image"
                        mode="aspectFill"
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 底部操作 */}
      <View className="bottom-actions">
        <Button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={submitting || selectedIds.length === 0}
        >
          {submitting ? '发送中...' : `邀请${selectedIds.length}名学生`}
        </Button>
      </View>
    </View>
  );
}
