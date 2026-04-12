import { View, Text, ScrollView, Image } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';

interface Student {
  id: number;
  nickname: string;
  avatar: string;
  school: string;
  major: string;
  skills: string[];
  completed_tasks: number;
  rating: number;
  favorited_at: string;
}

export default function FavoriteStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const token = Taro.getStorageSync('token');

      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/company/favorites',
        method: 'GET',
        header: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.statusCode === 200) {
        setStudents(res.data.data || []);
      }
    } catch (error) {
      console.error('加载收藏列表失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (studentId: number) => {
    Taro.showModal({
      title: '取消收藏',
      content: '确定要取消收藏这位学生吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const token = Taro.getStorageSync('token');

            await Taro.request({
              url: `http://localhost:3000/api/v1/company/favorites/${studentId}`,
              method: 'DELETE',
              header: {
                'Authorization': `Bearer ${token}`
              }
            });

            Taro.showToast({
              title: '已取消收藏',
              icon: 'success'
            });

            loadFavorites();
          } catch (error) {
            console.error('取消收藏失败:', error);
            Taro.showToast({
              title: '操作失败',
              icon: 'none'
            });
          }
        }
      }
    });
  };

  const handleViewProfile = (studentId: number) => {
    Taro.navigateTo({
      url: `/pages/student-profile/index?id=${studentId}`
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View className="favorite-students-page">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  if (students.length === 0) {
    return (
      <View className="favorite-students-page">
        <View className="empty">
          <View className="empty-icon"></View>
          <Text className="empty-text">暂无收藏的学生</Text>
          <Text className="empty-hint">在任务中遇到优秀的学生可以收藏</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="favorite-students-page">
      <View className="header">
        <Text className="title">收藏的学生</Text>
        <Text className="count">{students.length}位</Text>
      </View>

      <ScrollView className="student-list" scrollY>
        {students.map((student) => (
          <View key={student.id} className="student-card">
            <View className="card-header">
              <View className="student-info" onClick={() => handleViewProfile(student.id)}>
                <Image
                  className="avatar"
                  src={student.avatar || 'https://via.placeholder.com/100'}
                  mode="aspectFill"
                />
                <View className="info">
                  <Text className="name">{student.nickname}</Text>
                  <Text className="school">{student.school} · {student.major}</Text>
                </View>
              </View>
              <View
                className="unfavorite-btn"
                onClick={() => handleUnfavorite(student.id)}
              >
                <Text className="unfavorite-icon">★</Text>
              </View>
            </View>

            <View className="stats-row">
              <View className="stat-item">
                <Text className="stat-value">{student.completed_tasks}</Text>
                <Text className="stat-label">完成任务</Text>
              </View>
              <View className="stat-item">
                <Text className="stat-value">{student.rating.toFixed(1)}</Text>
                <Text className="stat-label">综合评分</Text>
              </View>
            </View>

            {student.skills && student.skills.length > 0 && (
              <View className="skills-section">
                <Text className="section-label">擅长技能</Text>
                <View className="skills">
                  {student.skills.slice(0, 5).map((skill, index) => (
                    <View key={index} className="skill-tag">
                      <Text className="skill-text">{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View className="footer">
              <Text className="favorite-time">收藏于 {formatDate(student.favorited_at)}</Text>
              <View
                className="contact-btn"
                onClick={() => {
                  Taro.showToast({
                    title: '请先发布任务邀请学生',
                    icon: 'none'
                  });
                }}
              >
                <Text className="contact-text">发送任务邀请</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
