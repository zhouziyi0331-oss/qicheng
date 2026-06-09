import Taro from '@tarojs/taro';
import { View, ScrollView, Button, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import './index.scss';

/**
 * 社区浏览页面
 *
 * 权限：Lv.4+可浏览
 * 功能：
 * 1. 浏览社区帖子
 * 2. 筛选帖子类型和赛道
 * 3. 查看帖子详情
 * 4. Lv.6可发布招募帖
 */

interface Post {
  id: string;
  type: string;
  title: string;
  content: string;
  author_name: string;
  author_level: number;
  view_count: number;
  reply_count: number;
  application_count?: number;
  team_name?: string;
  vacancy_count?: number;
  track?: string;
  created_at: string;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentType, setCurrentType] = useState('all');
  const [currentTrack, setCurrentTrack] = useState('all');
  const [userLevel, setUserLevel] = useState(0);

  const typeOptions = [
    { label: '全部', value: 'all' },
    { label: '招募', value: 'recruit' },
    { label: '作品展示', value: 'showcase' },
    { label: '协作', value: 'collab' },
    { label: '讨论', value: 'discussion' },
  ];

  const trackOptions = [
    { label: '全部', value: 'all' },
    { label: '开发', value: 'dev' },
    { label: '内容', value: 'content' },
    { label: '混合', value: 'mixed' },
  ];

  useEffect(() => {
    fetchUserInfo();
    fetchPosts();
  }, [currentType, currentTrack]);

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/user/profile`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      });

      if (res.data.success) {
        setUserLevel(res.data.data.current_level);
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  };

  // 获取帖子列表
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (currentType !== 'all') params.type = currentType;
      if (currentTrack !== 'all') params.track = currentTrack;

      const queryString = new URLSearchParams(params).toString();
      const res = await Taro.request({
        url: `${process.env.API_BASE_URL}/api/v1/community-new/posts?${queryString}`,
        method: 'GET',
        header: {
          Authorization: `Bearer ${Taro.getStorageSync('token')}`,
        },
      });

      if (res.data.success) {
        setPosts(res.data.data);
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

  // 跳转到帖子详情
  const handlePostClick = (postId: string) => {
    Taro.navigateTo({
      url: `/pages/community/detail/index?id=${postId}`,
    });
  };

  // 发布帖子
  const handleCreatePost = () => {
    if (userLevel < 6) {
      Taro.showToast({
        title: '仅Lv.6可发布招募帖',
        icon: 'none',
      });
      return;
    }

    Taro.navigateTo({
      url: '/pages/community/create/index',
    });
  };

  // 获取帖子类型标签
  const getTypeTag = (type: string) => {
    const typeMap: any = {
      recruit: { label: '招募', color: '#f5576c' },
      showcase: { label: '作品', color: '#52c41a' },
      collab: { label: '协作', color: '#1890ff' },
      discussion: { label: '讨论', color: '#722ed1' },
    };
    return typeMap[type] || { label: type, color: '#999' };
  };

  // 格式化时间
  const formatTime = (time: string) => {
    const now = new Date().getTime();
    const postTime = new Date(time).getTime();
    const diff = now - postTime;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return '刚刚';
    if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
    if (diff < day) return `${Math.floor(diff / hour)}小时前`;
    if (diff < 7 * day) return `${Math.floor(diff / day)}天前`;
    return new Date(time).toLocaleDateString();
  };

  return (
    <View className='community-page'>
      {/* 头部 */}
      <View className='header'>
        <View className='title'>社区</View>
        <View className='subtitle'>发现志同道合的伙伴</View>
      </View>

      {/* 筛选器 */}
      <View className='filters'>
        <ScrollView scrollX className='filter-scroll'>
          <View className='filter-group'>
            {typeOptions.map((option) => (
              <View
                key={option.value}
                className={`filter-item ${
                  currentType === option.value ? 'active' : ''
                }`}
                onClick={() => setCurrentType(option.value)}
              >
                {option.label}
              </View>
            ))}
          </View>
        </ScrollView>

        <ScrollView scrollX className='filter-scroll'>
          <View className='filter-group'>
            {trackOptions.map((option) => (
              <View
                key={option.value}
                className={`filter-item ${
                  currentTrack === option.value ? 'active' : ''
                }`}
                onClick={() => setCurrentTrack(option.value)}
              >
                {option.label}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* 帖子列表 */}
      <View className='posts-list'>
        {loading ? (
          <View className='loading'>加载中...</View>
        ) : posts.length === 0 ? (
          <View className='empty'>
            <View className='empty-icon'>📭</View>
            <View className='empty-text'>暂无帖子</View>
          </View>
        ) : (
          posts.map((post) => (
            <View
              key={post.id}
              className='post-card'
              onClick={() => handlePostClick(post.id)}
            >
              {/* 帖子类型标签 */}
              <View
                className='type-tag'
                style={{ background: getTypeTag(post.type).color }}
              >
                {getTypeTag(post.type).label}
              </View>

              {/* 帖子标题 */}
              <View className='post-title'>{post.title}</View>

              {/* 帖子内容预览 */}
              <View className='post-content'>{post.content}</View>

              {/* 招募信息 */}
              {post.type === 'recruit' && (
                <View className='recruit-info'>
                  {post.team_name && (
                    <View className='info-item'>
                      <Text className='icon'>👥</Text>
                      <Text>{post.team_name}</Text>
                    </View>
                  )}
                  {post.vacancy_count && (
                    <View className='info-item'>
                      <Text className='icon'>📢</Text>
                      <Text>招募{post.vacancy_count}人</Text>
                    </View>
                  )}
                  {post.track && (
                    <View className='info-item'>
                      <Text className='icon'>🎯</Text>
                      <Text>
                        {post.track === 'dev'
                          ? '开发'
                          : post.track === 'content'
                          ? '内容'
                          : '混合'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* 帖子元信息 */}
              <View className='post-meta'>
                <View className='author'>
                  <Text className='name'>{post.author_name}</Text>
                  <Text className='level'>Lv.{post.author_level}</Text>
                </View>
                <View className='stats'>
                  <Text className='stat'>👁 {post.view_count}</Text>
                  <Text className='stat'>💬 {post.reply_count}</Text>
                  {post.type === 'recruit' && post.application_count !== undefined && (
                    <Text className='stat'>📝 {post.application_count}</Text>
                  )}
                </View>
                <View className='time'>{formatTime(post.created_at)}</View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 发布按钮 */}
      {userLevel >= 6 && (
        <View className='create-btn' onClick={handleCreatePost}>
          <Text className='icon'>+</Text>
        </View>
      )}

      {/* 等级提示 */}
      {userLevel < 4 && (
        <View className='level-tip'>
          <Text>升级到Lv.4即可浏览社区</Text>
        </View>
      )}
    </View>
  );
}
