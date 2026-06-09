'use client'

import { useState, useEffect } from 'react'
import adminProjectAPI from '@/services/project'
import styles from './ProjectStatistics.module.scss'

const DOMAINS = [
  '全部',
  'AI人工智能',
  'Web开发',
  '移动开发',
  '数据分析',
  '产品设计',
  '游戏开发',
  '区块链',
  '物联网'
]

const TIME_RANGES = [
  { label: '最近7天', value: 7 },
  { label: '最近30天', value: 30 },
  { label: '最近90天', value: 90 },
  { label: '全部', value: 0 }
]

interface Statistics {
  overview: {
    totalProjects: number
    pendingReview: number
    approvedProjects: number
    featuredProjects: number
    totalViews: number
    totalLikes: number
    totalRecommendations: number
  }
  domainStats: Array<{
    domain: string
    count: number
    percentage: number
  }>
  trendData: Array<{
    date: string
    newProjects: number
    approvedProjects: number
    views: number
  }>
  topProjects: Array<{
    id: string
    title: string
    studentName: string
    domain: string
    viewCount: number
    likeCount: number
    isFeatured: boolean
  }>
  topStudents: Array<{
    studentId: string
    studentName: string
    projectCount: number
    totalViews: number
    totalLikes: number
  }>
}

export default function ProjectStatistics() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentDomain, setCurrentDomain] = useState('全部')
  const [timeRange, setTimeRange] = useState(30)

  useEffect(() => {
    loadStatistics()
  }, [currentDomain, timeRange])

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')

      const endDate = new Date()
      const startDate = timeRange > 0
        ? new Date(endDate.getTime() - timeRange * 24 * 60 * 60 * 1000)
        : undefined

      const res = await adminProjectAPI.getProjectStats({
        startDate: startDate?.toISOString(),
        endDate: endDate.toISOString(),
        domain: currentDomain === '全部' ? undefined : currentDomain
      }, token || undefined)

      if (res.success && res.data) {
        setStats(res.data)
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 查看项目详情
  const handleViewProject = (projectId: string) => {
    window.open(`/admin/projects/${projectId}`, '_blank')
  }

  if (loading && !stats) {
    return (
      <div className={styles.projectStatistics}>
        <div className={styles.loading}>加载中...</div>
      </div>
    )
  }

  return (
    <div className={styles.projectStatistics}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>项目统计</h1>
          <p className={styles.subtitle}>查看项目数据分析和趋势</p>
        </div>
      </div>

      {/* 筛选器 */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>时间范围：</label>
          <div className={styles.filterOptions}>
            {TIME_RANGES.map(range => (
              <button
                key={range.value}
                className={`${styles.filterBtn} ${timeRange === range.value ? styles.active : ''}`}
                onClick={() => setTimeRange(range.value)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>领域筛选：</label>
          <div className={styles.filterOptions}>
            {DOMAINS.map(domain => (
              <button
                key={domain}
                className={`${styles.filterBtn} ${currentDomain === domain ? styles.active : ''}`}
                onClick={() => setCurrentDomain(domain)}
              >
                {domain}
              </button>
            ))}
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* 概览卡片 */}
          <div className={styles.overviewCards}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>📊</div>
              <div className={styles.cardContent}>
                <div className={styles.cardValue}>{stats.overview.totalProjects}</div>
                <div className={styles.cardLabel}>总项目数</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>⏳</div>
              <div className={styles.cardContent}>
                <div className={styles.cardValue}>{stats.overview.pendingReview}</div>
                <div className={styles.cardLabel}>待审核</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>✅</div>
              <div className={styles.cardContent}>
                <div className={styles.cardValue}>{stats.overview.approvedProjects}</div>
                <div className={styles.cardLabel}>已通过</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>⭐</div>
              <div className={styles.cardContent}>
                <div className={styles.cardValue}>{stats.overview.featuredProjects}</div>
                <div className={styles.cardLabel}>精选项目</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>👀</div>
              <div className={styles.cardContent}>
                <div className={styles.cardValue}>{stats.overview.totalViews}</div>
                <div className={styles.cardLabel}>总浏览量</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>❤️</div>
              <div className={styles.cardContent}>
                <div className={styles.cardValue}>{stats.overview.totalLikes}</div>
                <div className={styles.cardLabel}>总点赞数</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>📤</div>
              <div className={styles.cardContent}>
                <div className={styles.cardValue}>{stats.overview.totalRecommendations}</div>
                <div className={styles.cardLabel}>推荐次数</div>
              </div>
            </div>
          </div>

          {/* 领域分布 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>领域分布</h2>
            <div className={styles.domainStats}>
              {stats.domainStats.map(item => (
                <div key={item.domain} className={styles.domainItem}>
                  <div className={styles.domainInfo}>
                    <span className={styles.domainName}>{item.domain}</span>
                    <span className={styles.domainCount}>{item.count} 个项目</span>
                  </div>
                  <div className={styles.domainBar}>
                    <div
                      className={styles.domainBarFill}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className={styles.domainPercentage}>{item.percentage.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* 趋势图 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>项目趋势</h2>
            <div className={styles.trendChart}>
              {stats.trendData.map((item, index) => (
                <div key={index} className={styles.trendItem}>
                  <div className={styles.trendDate}>
                    {new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className={styles.trendBars}>
                    <div
                      className={`${styles.trendBar} ${styles.newProjects}`}
                      style={{ height: `${(item.newProjects / Math.max(...stats.trendData.map(d => d.newProjects))) * 100}%` }}
                      title={`新增: ${item.newProjects}`}
                    />
                    <div
                      className={`${styles.trendBar} ${styles.approvedProjects}`}
                      style={{ height: `${(item.approvedProjects / Math.max(...stats.trendData.map(d => d.approvedProjects))) * 100}%` }}
                      title={`通过: ${item.approvedProjects}`}
                    />
                  </div>
                  <div className={styles.trendValues}>
                    <span className={styles.newValue}>{item.newProjects}</span>
                    <span className={styles.approvedValue}>{item.approvedProjects}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.trendLegend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.newProjects}`} />
                <span>新增项目</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendColor} ${styles.approvedProjects}`} />
                <span>通过审核</span>
              </div>
            </div>
          </div>

          {/* 热门项目 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>热门项目 Top 10</h2>
            <div className={styles.topList}>
              {stats.topProjects.map((project, index) => (
                <div
                  key={project.id}
                  className={styles.topItem}
                  onClick={() => handleViewProject(project.id)}
                >
                  <div className={styles.topRank}>#{index + 1}</div>
                  <div className={styles.topInfo}>
                    <div className={styles.topTitle}>
                      {project.title}
                      {project.isFeatured && <span className={styles.featuredBadge}>⭐</span>}
                    </div>
                    <div className={styles.topMeta}>
                      <span>{project.studentName}</span>
                      <span>•</span>
                      <span>{project.domain}</span>
                    </div>
                  </div>
                  <div className={styles.topStats}>
                    <span className={styles.topStat}>
                      <span className={styles.statIcon}>👀</span>
                      {project.viewCount}
                    </span>
                    <span className={styles.topStat}>
                      <span className={styles.statIcon}>❤️</span>
                      {project.likeCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 活跃学生 */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>活跃学生 Top 10</h2>
            <div className={styles.topList}>
              {stats.topStudents.map((student, index) => (
                <div key={student.studentId} className={styles.topItem}>
                  <div className={styles.topRank}>#{index + 1}</div>
                  <div className={styles.topInfo}>
                    <div className={styles.topTitle}>{student.studentName}</div>
                    <div className={styles.topMeta}>
                      {student.projectCount} 个项目
                    </div>
                  </div>
                  <div className={styles.topStats}>
                    <span className={styles.topStat}>
                      <span className={styles.statIcon}>👀</span>
                      {student.totalViews}
                    </span>
                    <span className={styles.topStat}>
                      <span className={styles.statIcon}>❤️</span>
                      {student.totalLikes}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
