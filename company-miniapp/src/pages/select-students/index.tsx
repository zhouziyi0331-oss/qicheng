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
  collaborationCount?: number; // 已合作次数
}

export default function SelectStudents() {
  const router = useRouter();
  const { taskId } = router.params;
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
        setStudents(res.data.data.students || []);
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
