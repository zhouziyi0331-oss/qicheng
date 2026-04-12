import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Profile() {
  const [companyInfo] = useState({
    name: '示例科技有限公司',
    contact: '张经理',
    phone: '138****8888',
    email: 'contact@example.com',
    industry: '互联网/软件',
    scale: '50-200人'
  })

  const menuItems = [
    { icon: 'task', title: '我的任务', path: '/pages/tasks/index', badge: 3 },
    { icon: 'payment', title: '付款记录', path: '/pages/payments/index', badge: 0 },
    { icon: 'chat', title: '聊天消息', path: '/pages/chat-list/index', badge: 5 },
    { icon: 'star', title: '待评价任务', path: '/pages/pending-ratings/index', badge: 2 },
    { icon: 'user', title: '收藏的学生', path: '/pages/favorite-students/index', badge: 0 },
    { icon: 'chart', title: '数据报表', path: '/pages/data-report/index', badge: 0 },
    { icon: 'invoice', title: '发票管理', path: '/pages/invoice-manage/index', badge: 0 },
    { icon: 'verify', title: '企业认证', path: '/pages/company-verify/index', badge: 0 },
    { icon: 'dispute', title: '任务申诉', path: '/pages/dispute/index', badge: 0 },
    { icon: 'setting', title: '账号设置', path: '', badge: 0 },
    { icon: 'help', title: '帮助中心', path: '', badge: 0 }
  ]

  const handleMenuClick = (item) => {
    if (item.path) {
      Taro.navigateTo({ url: item.path })
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已退出', icon: 'success' })
        }
      }
    })
  }

  return (
    <View className='profile-page'>
      {/* 企业信息卡片 */}
      <View className='company-card'>
        <View className='company-avatar'>
          <Text className='avatar-text'>{companyInfo.name.substring(0, 2)}</Text>
        </View>
        <View className='company-info'>
          <Text className='company-name'>{companyInfo.name}</Text>
          <Text className='company-detail'>{companyInfo.industry} · {companyInfo.scale}</Text>
        </View>
      </View>

      {/* 统计数据 */}
      <View className='stats-section'>
        <View className='stat-item' onClick={() => Taro.navigateTo({ url: '/pages/tasks/index' })}>
          <Text className='stat-value'>12</Text>
          <Text className='stat-label'>发布任务</Text>
        </View>
        <View className='stat-divider' />
        <View className='stat-item' onClick={() => Taro.navigateTo({ url: '/pages/tasks/index?tab=active' })}>
          <Text className='stat-value'>5</Text>
          <Text className='stat-label'>进行中</Text>
        </View>
        <View className='stat-divider' />
        <View className='stat-item' onClick={() => Taro.navigateTo({ url: '/pages/tasks/index?tab=completed' })}>
          <Text className='stat-value'>7</Text>
          <Text className='stat-label'>已完成</Text>
        </View>
      </View>

      {/* 快捷操作 */}
      <View className='quick-actions-section'>
        <View className='quick-action-item' onClick={() => Taro.navigateTo({ url: '/pages/publish/index' })}>
          <View className='action-icon publish'>📝</View>
          <Text className='action-text'>发布任务</Text>
        </View>
        <View className='quick-action-item' onClick={() => Taro.navigateTo({ url: '/pages/tasks/index?tab=pending' })}>
          <View className='action-icon pending'>⏰</View>
          <Text className='action-text'>待处理</Text>
          <View className='action-badge'>3</View>
        </View>
        <View className='quick-action-item' onClick={() => Taro.navigateTo({ url: '/pages/chat-list/index' })}>
          <View className='action-icon message'>💬</View>
          <Text className='action-text'>消息</Text>
          <View className='action-badge'>5</View>
        </View>
        <View className='quick-action-item' onClick={() => Taro.navigateTo({ url: '/pages/payments/index' })}>
          <View className='action-icon wallet'>💰</View>
          <Text className='action-text'>财务</Text>
        </View>
      </View>

      {/* 菜单列表 */}
      <View className='menu-section'>
        {menuItems.map((item, index) => (
          <View key={index} className='menu-item' onClick={() => handleMenuClick(item)}>
            <View className='menu-left'>
              <View className={`menu-icon icon-${item.icon}`}></View>
              <Text className='menu-title'>{item.title}</Text>
            </View>
            <View className='menu-right'>
              {item.badge > 0 && <View className='menu-badge'>{item.badge}</View>}
              <View className='menu-arrow'>›</View>
            </View>
          </View>
        ))}
      </View>

      {/* 企业详细信息 */}
      <View className='info-section'>
        <View className='section-title'>企业信息</View>
        <View className='info-item'>
          <Text className='info-label'>联系人</Text>
          <Text className='info-value'>{companyInfo.contact}</Text>
        </View>
        <View className='info-item'>
          <Text className='info-label'>联系电话</Text>
          <Text className='info-value'>{companyInfo.phone}</Text>
        </View>
        <View className='info-item'>
          <Text className='info-label'>邮箱</Text>
          <Text className='info-value'>{companyInfo.email}</Text>
        </View>
      </View>

      {/* 退出登录 */}
      <View className='logout-section'>
        <View className='logout-btn' onClick={handleLogout}>
          <Text>退出登录</Text>
        </View>
      </View>
    </View>
  )
}
