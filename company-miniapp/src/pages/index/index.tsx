import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Index() {
  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  return (
    <View className='index-page'>
      {/* 1. 顶部欢迎区域 */}
      <View className='welcome-section'>
        <View className='greeting'>
          <Text className='hello-text'>你好，欢迎回来</Text>
          <Text className='subtitle'>实时监控您的工作空间和任务数据</Text>
        </View>
        <View className='time-stats'>
          <View className='time-card'>
            <Text className='time-value'>16 小时</Text>
            <Text className='time-label'>已节省</Text>
          </View>
          <View className='time-card'>
            <Text className='time-value'>14 小时</Text>
            <Text className='time-label'>已节省</Text>
          </View>
        </View>
      </View>

      {/* 2. 核心指标卡片（三列） */}
      <View className='metrics-grid'>
        <View className='metric-card' onClick={() => handleNavigate('/pages/data-report/index')}>
          <View className='metric-header'>
            <Text className='metric-title'>总互动量</Text>
            <View className='metric-icon'>↗</View>
          </View>
          <Text className='metric-value'>12,480</Text>
          <Text className='metric-subtitle'>累计互动次数</Text>
        </View>

        <View className='metric-card' onClick={() => handleNavigate('/pages/data-report/index')}>
          <View className='metric-header'>
            <Text className='metric-title'>活跃用户</Text>
            <View className='metric-icon'>↗</View>
          </View>
          <Text className='metric-value'>1,376</Text>
          <Text className='metric-subtitle'>当前活跃人数</Text>
        </View>

        <View className='metric-card' onClick={() => handleNavigate('/pages/data-report/index')}>
          <View className='metric-header'>
            <Text className='metric-title'>任务完成率</Text>
            <View className='metric-icon'>↗</View>
          </View>
          <Text className='metric-value'>96.7%</Text>
          <Text className='metric-subtitle'>任务准确率</Text>
        </View>
      </View>

      {/* 3. 双栏布局（生产力趋势 + AI Insights） */}
      <View className='main-content'>
        {/* 左侧：生产力趋势 */}
        <View className='productivity-card'>
          <View className='card-header'>
            <Text className='card-title'>生产力趋势</Text>
            <Text className='period-selector'>本周 ▼</Text>
          </View>
          <View className='productivity-content'>
            <View className='stats-left'>
              <Text className='main-stat'>14 小时</Text>
              <Text className='stat-detail'>本周已记录</Text>
              <Text className='stat-change'>+15% 较上周</Text>
            </View>
            <View className='chart-right'>
              <View className='chart-container'>
                <View className='chart-bar'>
                  <View className='bar inactive' style={{ height: '40px' }}></View>
                  <Text className='bar-label'>周日</Text>
                </View>
                <View className='chart-bar'>
                  <View className='bar' style={{ height: '60px' }}></View>
                  <Text className='bar-label'>周一</Text>
                </View>
                <View className='chart-bar'>
                  <View className='bar' style={{ height: '80px' }}></View>
                  <Text className='bar-label'>周二</Text>
                </View>
                <View className='chart-bar'>
                  <View className='bar' style={{ height: '100px' }}></View>
                  <Text className='bar-label'>周三</Text>
                </View>
                <View className='chart-bar'>
                  <View className='bar' style={{ height: '70px' }}></View>
                  <Text className='bar-label'>周四</Text>
                </View>
                <View className='chart-bar'>
                  <View className='bar' style={{ height: '90px' }}></View>
                  <Text className='bar-label'>周五</Text>
                </View>
                <View className='chart-bar'>
                  <View className='bar inactive' style={{ height: '30px' }}></View>
                  <Text className='bar-label'>周六</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 右侧：AI Insights 推广卡片 */}
        <View className='insights-card'>
          <View className='insights-content'>
            <View className='insights-icon'>✨</View>
            <Text className='insights-title'>立即升级到专业版！</Text>
            <Text className='insights-desc'>
              解锁高级分析功能，获得更深入的洞察，提升您的工作效率。
            </Text>
            <View className='insights-button'>立即升级</View>
          </View>
        </View>
      </View>

      {/* 4. 快捷操作入口 */}
      <View className='quick-entry-section'>
        <View className='section-header'>
          <Text className='section-title'>快捷操作</Text>
        </View>
        <View className='quick-entry-grid'>
          <View className='quick-entry-item' onClick={() => handleNavigate('/pages/publish/index')}>
            <View className='entry-icon'>📝</View>
            <Text className='entry-text'>发布任务</Text>
          </View>
          <View className='quick-entry-item' onClick={() => handleNavigate('/pages/tasks/index')}>
            <View className='entry-icon'>📋</View>
            <Text className='entry-text'>我的任务</Text>
          </View>
          <View className='quick-entry-item' onClick={() => handleNavigate('/pages/chat-list/index')}>
            <View className='entry-icon'>💬</View>
            <Text className='entry-text'>消息中心</Text>
          </View>
          <View className='quick-entry-item' onClick={() => handleNavigate('/pages/payments/index')}>
            <View className='entry-icon'>💰</View>
            <Text className='entry-text'>财务管理</Text>
          </View>
          <View className='quick-entry-item' onClick={() => handleNavigate('/pages/favorite-students/index')}>
            <View className='entry-icon'>⭐</View>
            <Text className='entry-text'>收藏学生</Text>
          </View>
          <View className='quick-entry-item' onClick={() => handleNavigate('/pages/data-report/index')}>
            <View className='entry-icon'>📊</View>
            <Text className='entry-text'>数据报表</Text>
          </View>
        </View>
      </View>

      {/* 5. 待处理任务 */}
      <View className='pending-tasks-section'>
        <View className='section-header'>
          <Text className='section-title'>待处理任务</Text>
          <Text className='view-all' onClick={() => handleNavigate('/pages/tasks/index?tab=pending')}>
            查看全部 →
          </Text>
        </View>
        <View className='pending-task-card' onClick={() => handleNavigate('/pages/task-detail/index?id=2')}>
          <View className='task-header'>
            <Text className='task-title'>设计企业官网UI</Text>
            <View className='task-badge urgent'>待验收</View>
          </View>
          <Text className='task-desc'>学生已提交交付物，等待您的验收</Text>
          <View className='task-footer'>
            <Text className='task-time'>2小时前</Text>
            <View className='task-action'>立即验收</View>
          </View>
        </View>
        <View className='pending-task-card' onClick={() => handleNavigate('/pages/select-students/index?taskId=5')}>
          <View className='task-header'>
            <Text className='task-title'>品牌Logo设计</Text>
            <View className='task-badge info'>待选择</View>
          </View>
          <Text className='task-desc'>AI已匹配10名学生，请选择5名发送邀请</Text>
          <View className='task-footer'>
            <Text className='task-time'>5小时前</Text>
            <View className='task-action'>选择学生</View>
          </View>
        </View>
      </View>

      {/* 6. 性能分析表格 */}
      <View className='performance-section'>
        <View className='section-header'>
          <Text className='section-title'>性能分析</Text>
          <Text className='view-all' onClick={() => handleNavigate('/pages/tasks/index')}>
            查看全部 →
          </Text>
        </View>
        <View className='performance-table'>
          <View className='table-header'>
            <Text className='header-cell'>任务名称</Text>
            <Text className='header-cell'>日期</Text>
            <Text className='header-cell'>准确率</Text>
            <Text className='header-cell'>时长</Text>
            <Text className='header-cell'>状态</Text>
          </View>
          <View className='table-row'>
            <Text className='cell task-name'>聊天分析</Text>
            <Text className='cell date'>2025年12月12日</Text>
            <Text className='cell'>97%</Text>
            <Text className='cell duration'>1.8分钟</Text>
            <View className='status-badge success'>成功</View>
          </View>
          <View className='table-row'>
            <Text className='cell task-name'>欺诈检测</Text>
            <Text className='cell date'>2025年12月13日</Text>
            <Text className='cell'>98%</Text>
            <Text className='cell duration'>1.2分钟</Text>
            <View className='status-badge warning'>警告</View>
          </View>
          <View className='table-row'>
            <Text className='cell task-name'>图像处理</Text>
            <Text className='cell date'>2025年12月14日</Text>
            <Text className='cell'>95%</Text>
            <Text className='cell duration'>2.3分钟</Text>
            <View className='status-badge error'>失败</View>
          </View>
        </View>
      </View>

      {/* 5. 底部 AI Insights 列表 */}
      <View className='insights-section'>
        <View className='insights-list-card'>
          <Text className='card-title'>智能洞察</Text>
          <View className='insight-item'>
            <Text className='insight-title'>用户行为趋势</Text>
            <Text className='insight-desc'>
              分析用户参与度，发现周末活动持续保持强劲。
            </Text>
            <Text className='insight-link'>查看详情</Text>
          </View>
          <View className='insight-item'>
            <Text className='insight-title'>风险与异常警报</Text>
            <Text className='insight-desc'>
              检测到近期数据中的异常模式，需要立即审查。
            </Text>
            <Text className='insight-link'>查看详情</Text>
          </View>
          <View className='insight-item'>
            <Text className='insight-title'>增长建议</Text>
            <Text className='insight-desc'>
              推荐可行的策略以提高用户参与度、留存率和整体增长。
            </Text>
            <Text className='insight-link'>查看详情</Text>
          </View>
        </View>

        <View className='insights-list-card'>
          <Text className='card-title'>最近活动</Text>
          <View className='insight-item'>
            <Text className='insight-title'>任务已完成</Text>
            <Text className='insight-desc'>网站前端开发任务已完成，等待验收</Text>
            <Text className='insight-link' onClick={() => handleNavigate('/pages/task-detail/index?id=1')}>
              查看详情
            </Text>
          </View>
          <View className='insight-item'>
            <Text className='insight-title'>新消息</Text>
            <Text className='insight-desc'>张同学发来了新消息</Text>
            <Text className='insight-link' onClick={() => handleNavigate('/pages/chat-list/index')}>
              查看消息
            </Text>
          </View>
          <View className='insight-item'>
            <Text className='insight-title'>付款提醒</Text>
            <Text className='insight-desc'>有一笔待支付款项需要处理</Text>
            <Text className='insight-link' onClick={() => handleNavigate('/pages/payments/index')}>
              去支付
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
