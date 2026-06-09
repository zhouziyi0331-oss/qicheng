import { View, Text, Button, Image, Checkbox } from '@tarojs/components';
import { useState } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

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

interface Props {
  taskId: string;
  students: MatchedStudent[];
  onPushComplete?: () => void;
}

export default function MatchedStudentsList({ taskId, students, onPushComplete }: Props) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [pushing, setPushing] = useState(false);

  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      if (selectedStudents.length >= 5) {
        Taro.showToast({
          title: '最多只能选择5个学生',
          icon: 'none'
        });
        return;
      }
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handlePushToStudents = async () => {
    if (selectedStudents.length === 0) {
      Taro.showToast({
        title: '请至少选择1个学生',
        icon: 'none'
      });
      return;
    }

    setPushing(true);
    try {
      const res = await Taro.request({
        url: `http://localhost:3000/api/v1/tasks/${taskId}/push-to-students`,
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
        setSelectedStudents([]);
        onPushComplete?.();
      } else {
        throw new Error(res.data.error || '推送失败');
      }
    } catch (error: any) {
      Taro.showToast({
        title: error.message || '推送失败',
        icon: 'none'
      });
    } finally {
      setPushing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return '非常匹配';
    if (score >= 0.6) return '较为匹配';
    return '一般匹配';
  };

  return (
    <View className="matched-students-list">
      <View className="header">
        <Text className="title">AI为您匹配的学生</Text>
        <Text className="subtitle">已为您找到{students.length}个合适的学生</Text>
      </View>

      {students.length === 0 ? (
        <View className="empty">
          <Text className="empty-text">暂无匹配的学生</Text>
        </View>
      ) : (
        <>
          <View className="students-container">
            {students.map((student) => (
              <View
                key={student.studentId}
                className={`student-card ${selectedStudents.includes(student.studentId) ? 'selected' : ''}`}
                onClick={() => handleSelectStudent(student.studentId)}
              >
                <View className="card-header">
                  <View className="student-info">
                    <Image
                      className="avatar"
                      src={student.avatarUrl || 'https://via.placeholder.com/80'}
                      mode="aspectFill"
                    />
                    <View className="info">
                      <View className="name-row">
                        <Text className="name">{student.username}</Text>
                        <View className="rank-badge">
                          <Text className="rank-text">#{student.rank}</Text>
                        </View>
                      </View>
                      <Text className="bio">{student.bio || '暂无简介'}</Text>
                      <View className="stats">
                        <Text className="stat-item">完成{student.tasksCompleted}个任务</Text>
                        <Text className="stat-item">质量{(student.avgQuality * 100).toFixed(0)}%</Text>
                        <Text className="stat-item">满意度{(student.avgSatisfaction * 100).toFixed(0)}%</Text>
                      </View>
                    </View>
                  </View>
                  <Checkbox
                    checked={selectedStudents.includes(student.studentId)}
                    color="#1890ff"
                    className="checkbox"
                  />
                </View>

                <View className="match-score">
                  <View className="score-main">
                    <Text className="score-label">匹配度</Text>
                    <Text
                      className="score-value"
                      style={{ color: getScoreColor(student.matchScore.overall) }}
                    >
                      {(student.matchScore.overall * 100).toFixed(0)}%
                    </Text>
                    <Text
                      className="score-status"
                      style={{ color: getScoreColor(student.matchScore.overall) }}
                    >
                      {getScoreLabel(student.matchScore.overall)}
                    </Text>
                  </View>

                  <View className="score-details">
                    <View className="score-item">
                      <Text className="score-item-label">技能匹配</Text>
                      <View className="score-bar">
                        <View
                          className="score-bar-fill"
                          style={{ width: `${student.matchScore.skill * 100}%` }}
                        />
                      </View>
                      <Text className="score-item-value">
                        {(student.matchScore.skill * 100).toFixed(0)}%
                      </Text>
                    </View>
                    <View className="score-item">
                      <Text className="score-item-label">难度匹配</Text>
                      <View className="score-bar">
                        <View
                          className="score-bar-fill"
                          style={{ width: `${student.matchScore.difficulty * 100}%` }}
                        />
                      </View>
                      <Text className="score-item-value">
                        {(student.matchScore.difficulty * 100).toFixed(0)}%
                      </Text>
                    </View>
                    <View className="score-item">
                      <Text className="score-item-label">可靠性</Text>
                      <View className="score-bar">
                        <View
                          className="score-bar-fill"
                          style={{ width: `${student.matchScore.reliability * 100}%` }}
                        />
                      </View>
                      <Text className="score-item-value">
                        {(student.matchScore.reliability * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View className="action-bar">
            <View className="selection-info">
              <Text className="selection-text">
                已选择 {selectedStudents.length}/5 个学生
              </Text>
            </View>
            <Button
              className="push-button"
              type="primary"
              disabled={selectedStudents.length === 0 || pushing}
              loading={pushing}
              onClick={handlePushToStudents}
            >
              推送给选中的学生
            </Button>
          </View>
        </>
      )}
    </View>
  );
}
