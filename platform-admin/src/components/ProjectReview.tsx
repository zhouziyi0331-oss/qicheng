'use client'

import { useState, useEffect } from 'react'
import adminProjectAPI from '@/services/project'
import styles from './ProjectReview.module.scss'

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

const REVIEW_TABS = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
]

interface Project {
  id: string
  title: string
  description: string
  domain: string
  tags: string[]
  studentName: string
  studentId: string
  coverImage?: string
  stats: {
    viewCount: number
    likeCount: number
  }
  createdAt: string
  submittedAt: string
  reviewStatus?: 'approved' | 'rejected'
  reviewNotes?: string
  reviewedAt?: string
}

export default function ProjectReview() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState('pending')
  const [currentDomain, setCurrentDomain] = useState('全部')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved')
  const [reviewNotes, setReviewNotes] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [currentTab, currentDomain])

  // 加载项目列表
  const loadProjects = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('adminToken')

      let res
      if (currentTab === 'pending') {
        res = await adminProjectAPI.getPendingProjects({
          domain: currentDomain === '全部' ? undefined : currentDomain,
          limit: 50
        }, token || undefined)
      } else {
        res = await adminProjectAPI.getReviewedProjects({
          status: currentTab as any,
          domain: currentDomain === '全部' ? undefined : currentDomain,
          limit: 50
        }, token || undefined)
      }

      if (res.success && res.data) {
        setProjects(res.data.projects || [])
      }
    } catch (error) {
      console.error('加载失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 打开审核弹窗
  const handleOpenReview = (project: Project, action: 'approved' | 'rejected') => {
    setSelectedProject(project)
    setReviewAction(action)
    setReviewNotes('')
    setIsFeatured(false)
    setShowReviewModal(true)
  }

  // 提交审核
  const handleSubmitReview = async () => {
    if (!selectedProject) return

    try {
      setSubmitting(true)
      const token = localStorage.getItem('adminToken')

      await adminProjectAPI.reviewProject(
        selectedProject.id,
        {
          status: reviewAction,
          reviewNotes: reviewNotes.trim() || undefined,
          isFeatured: reviewAction === 'approved' ? isFeatured : false
        },
        token || undefined
      )

      alert(`项目已${reviewAction === 'approved' ? '通过' : '拒绝'}`)
      setShowReviewModal(false)
      loadProjects()
    } catch (error) {
      console.error('审核失败:', error)
      alert('审核失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 查看项目详情
  const handleViewDetail = (project: Project) => {
    window.open(`/admin/projects/${project.id}`, '_blank')
  }

  return (
    <div className={styles.projectReview}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>项目审核</h1>
          <p className={styles.subtitle}>审核学生提交的公开项目</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{projects.length}</span>
            <span className={styles.statLabel}>项目数</span>
          </div>
        </div>
      </div>

      {/* 标签页 */}
      <div className={styles.tabs}>
        {REVIEW_TABS.map(tab => (
          <button
            key={tab.value}
            className={`${styles.tab} ${currentTab === tab.value ? styles.active : ''}`}
            onClick={() => setCurrentTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

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
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyText}>暂无项目</div>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className={styles.projectCard}>
              {/* 封面 */}
              {project.coverImage ? (
                <img src={project.coverImage} alt={project.title} className={styles.projectCover} />
              ) : (
                <div className={styles.projectCoverPlaceholder}>
                  <span>🎨</span>
                </div>
              )}

              {/* 信息 */}
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
                  <span className={styles.metaItem}>
                    <span className={styles.metaIcon}>📅</span>
                    {new Date(project.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                {project.tags && project.tags.length > 0 && (
                  <div className={styles.projectTags}>
                    {project.tags.slice(0, 4).map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}

                {/* 审核信息 */}
                {project.reviewStatus && (
                  <div className={styles.reviewInfo}>
                    <span className={`${styles.reviewStatus} ${styles[project.reviewStatus]}`}>
                      {project.reviewStatus === 'approved' ? '✓ 已通过' : '✗ 已拒绝'}
                    </span>
                    {project.reviewNotes && (
                      <span className={styles.reviewNotes}>备注: {project.reviewNotes}</span>
                    )}
                  </div>
                )}
              </div>

              {/* 操作 */}
              <div className={styles.projectActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleViewDetail(project)}
                >
                  查看详情
                </button>
                {currentTab === 'pending' && (
                  <>
                    <button
                      className={`${styles.actionBtn} ${styles.approve}`}
                      onClick={() => handleOpenReview(project, 'approved')}
                    >
                      ✓ 通过
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.reject}`}
                      onClick={() => handleOpenReview(project, 'rejected')}
                    >
                      ✗ 拒绝
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 审核弹窗 */}
      {showReviewModal && selectedProject && (
        <div className={styles.modal} onClick={() => setShowReviewModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {reviewAction === 'approved' ? '通过项目' : '拒绝项目'}
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowReviewModal(false)}
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
                <label className={styles.formLabel}>审核备注</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder={reviewAction === 'approved' ? '可选：添加通过理由或建议' : '必填：说明拒绝原因'}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {reviewAction === 'approved' && (
                <div className={styles.formGroup}>
                  <label className={styles.formCheckbox}>
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                    <span>设为精选项目</span>
                  </label>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalBtnCancel}
                onClick={() => setShowReviewModal(false)}
              >
                取消
              </button>
              <button
                className={`${styles.modalBtnSubmit} ${reviewAction === 'rejected' ? styles.reject : ''}`}
                onClick={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
