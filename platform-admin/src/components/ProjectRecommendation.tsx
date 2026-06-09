'use client'

import { useState, useEffect } from 'react'
import adminProjectAPI from '@/services/project'
import styles from './ProjectRecommendation.module.scss'

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

interface Project {
  id: string
  title: string
  description: string
  domain: string
  tags: string[]
  studentName: string
  coverImage?: string
  stats: {
    viewCount: number
    likeCount: number
  }
  isFeatured: boolean
  createdAt: string
}

interface Company {
  id: string
  name: string
  industry: string
  logo?: string
}

interface Recommendation {
  id: string
  projectId: string
  projectTitle: string
  companyId: string
  companyName: string
  recommendationText: string
  status: 'pending' | 'viewed' | 'contacted'
  createdAt: string
}

export default function ProjectRecommendation() {
  const [projects, setProjects] = useState<Project[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [currentDomain, setCurrentDomain] = useState('全部')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showRecommendModal, setShowRecommendModal] = useState(false)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [recommendationText, setRecommendationText] = useState('')
  const [companySearch, setCompanySearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'projects' | 'history'>('projects')

  useEffect(() => {
    loadProjects()
    loadCompanies()
    loadRecommendations()
  }, [currentDomain])

  // 加载精选项目
  const loadProjects = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')

      const res = await adminProjectAPI.getFeaturedProjects({
        domain: currentDomain === '全部' ? undefined : currentDomain,
        limit: 50
      }, token || undefined)

      if (res.success && res.data) {
        setProjects(res.data.projects || [])
      }
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载企业列表
  const loadCompanies = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await adminProjectAPI.getCompanies({
        search: companySearch || undefined,
        limit: 100
      }, token || undefined)

      if (res.success && res.data) {
        setCompanies(res.data.companies || [])
      }
    } catch (error) {
      console.error('加载企业失败:', error)
    }
  }

  // 加载推荐历史
  const loadRecommendations = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await adminProjectAPI.getRecommendations({
        limit: 50
      }, token || undefined)

      if (res.success && res.data) {
        setRecommendations(res.data.recommendations || [])
      }
    } catch (error) {
      console.error('加载推荐历史失败:', error)
    }
  }

  // 打开推荐弹窗
  const handleOpenRecommend = (project: Project) => {
    setSelectedProject(project)
    setSelectedCompanies([])
    setRecommendationText(`我们发现了一个优秀的${project.domain}项目"${project.title}"，该项目展示了学生在该领域的实践能力，推荐贵公司关注。`)
    setShowRecommendModal(true)
  }

  // 切换企业选择
  const handleToggleCompany = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
  }

  // 提交推荐
  const handleSubmitRecommendation = async () => {
    if (!selectedProject || selectedCompanies.length === 0) {
      alert('请至少选择一家企业')
      return
    }

    if (!recommendationText.trim()) {
      alert('请填写推荐理由')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('adminToken')

      // 批量推荐
      for (const companyId of selectedCompanies) {
        await adminProjectAPI.recommendToCompany(
          selectedProject.id,
          {
            companyId,
            recommendationText: recommendationText.trim()
          },
          token || undefined
        )
      }

      alert(`已成功推荐给 ${selectedCompanies.length} 家企业`)
      setShowRecommendModal(false)
      loadRecommendations()
    } catch (error) {
      console.error('推荐失败:', error)
      alert('推荐失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 查看项目详情
  const handleViewDetail = (projectId: string) => {
    window.open(`/admin/projects/${projectId}`, '_blank')
  }

  // 搜索企业
  const handleSearchCompanies = () => {
    loadCompanies()
  }

  return (
    <div className={styles.projectRecommendation}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>项目推荐</h1>
          <p className={styles.subtitle}>将优秀项目推荐给企业</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{projects.length}</span>
            <span className={styles.statLabel}>精选项目</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{recommendations.length}</span>
            <span className={styles.statLabel}>推荐记录</span>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'projects' ? styles.active : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          精选项目
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          推荐历史
        </button>
      </div>

      {/* 精选项目 */}
      {activeTab === 'projects' && (
        <>
          {/* 领域筛选 */}
          <div className={styles.filters}>
            <div className={styles.filterLabel}>领域筛选：</div>
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

          {/* 项目列表 */}
          <div className={styles.projectList}>
            {loading ? (
              <div className={styles.loading}>加载中...</div>
            ) : projects.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>⭐</div>
                <div className={styles.emptyText}>暂无精选项目</div>
              </div>
            ) : (
              projects.map(project => (
                <div key={project.id} className={styles.projectCard}>
                  {project.coverImage ? (
                    <img src={project.coverImage} alt={project.title} className={styles.projectCover} />
                  ) : (
                    <div className={styles.projectCoverPlaceholder}>
                      <span>🎨</span>
                    </div>
                  )}

                  <div className={styles.featuredBadge}>⭐ 精选</div>

                  <div className={styles.projectInfo}>
                    <h3 className={styles.projectTitle}>{project.title}</h3>
                    <p className={styles.projectDescription}>{project.description}</p>

                    <div className={styles.projectMeta}>
                      <span className={styles.metaItem}>
                        <span className={styles.metaIcon}>👤</span>
                        {project.studentName}
                      </span>
                      <span className={styles.metaItem}>
                        <span className={styles.metaIcon}>🏷️</span>
                        {project.domain}
                      </span>
                    </div>

                    {project.tags && project.tags.length > 0 && (
                      <div className={styles.projectTags}>
                        {project.tags.slice(0, 4).map((tag, index) => (
                          <span key={index} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className={styles.projectStats}>
                      <span>👀 {project.stats.viewCount}</span>
                      <span>❤️ {project.stats.likeCount}</span>
                    </div>
                  </div>

                  <div className={styles.projectActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleViewDetail(project.id)}
                    >
                      查看详情
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.recommend}`}
                      onClick={() => handleOpenRecommend(project)}
                    >
                      📤 推荐给企业
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* 推荐历史 */}
      {activeTab === 'history' && (
        <div className={styles.historyList}>
          {recommendations.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <div className={styles.emptyText}>暂无推荐记录</div>
            </div>
          ) : (
            recommendations.map(rec => (
              <div key={rec.id} className={styles.historyCard}>
                <div className={styles.historyHeader}>
                  <div className={styles.historyTitle}>
                    <span className={styles.projectName}>{rec.projectTitle}</span>
                    <span className={styles.arrow}>→</span>
                    <span className={styles.companyName}>{rec.companyName}</span>
                  </div>
                  <span className={`${styles.historyStatus} ${styles[rec.status]}`}>
                    {rec.status === 'pending' && '待查看'}
                    {rec.status === 'viewed' && '已查看'}
                    {rec.status === 'contacted' && '已联系'}
                  </span>
                </div>
                <p className={styles.historyText}>{rec.recommendationText}</p>
                <div className={styles.historyTime}>
                  {new Date(rec.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 推荐弹窗 */}
      {showRecommendModal && selectedProject && (
        <div className={styles.modal} onClick={() => setShowRecommendModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>推荐项目给企业</h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowRecommendModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.projectPreview}>
                <h3>{selectedProject.title}</h3>
                <p>{selectedProject.description}</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>推荐理由</label>
                <textarea
                  className={styles.formTextarea}
                  value={recommendationText}
                  onChange={(e) => setRecommendationText(e.target.value)}
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>选择企业</label>
                <div className={styles.companySearch}>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="搜索企业名称..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchCompanies()}
                  />
                  <button className={styles.searchBtn} onClick={handleSearchCompanies}>
                    搜索
                  </button>
                </div>
                <div className={styles.companyList}>
                  {companies.map(company => (
                    <label key={company.id} className={styles.companyItem}>
                      <input
                        type="checkbox"
                        checked={selectedCompanies.includes(company.id)}
                        onChange={() => handleToggleCompany(company.id)}
                      />
                      <div className={styles.companyInfo}>
                        <span className={styles.companyName}>{company.name}</span>
                        <span className={styles.companyIndustry}>{company.industry}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className={styles.selectedCount}>
                  已选择 {selectedCompanies.length} 家企业
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalBtnCancel}
                onClick={() => setShowRecommendModal(false)}
              >
                取消
              </button>
              <button
                className={styles.modalBtnSubmit}
                onClick={handleSubmitRecommendation}
                disabled={submitting || selectedCompanies.length === 0}
              >
                {submitting ? '推荐中...' : `推荐给 ${selectedCompanies.length} 家企业`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
