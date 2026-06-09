'use client'

import { useState, useEffect } from 'react'
import { platformAdminAPI } from '@/lib/platformAdminApi'

interface Rating {
  id: string
  task_id: string
  task_title: string
  rater_id: string
  rater_name: string
  ratee_id: string
  ratee_name: string
  rating: number
  comment: string
  tags: string[]
  is_anonymous: boolean
  response?: string
  is_reported: boolean
  report_count: number
  created_at: string
}

interface RatingStats {
  total_ratings: number
  average_rating: number
  reported_count: number
  anonymous_count: number
}

export default function RatingsManagementPage() {
  const [ratings, setRatings] = useState<Rating[]>([])
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'reported'>('all')
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null)

  useEffect(() => {
    fetchRatings()
  }, [filter])

  const fetchRatings = async () => {
    setLoading(true)
    try {
      const params = filter === 'reported' ? { reported: true } : {}
      const [ratingsRes, statsRes] = await Promise.all([
        platformAdminAPI.getRatings(params),
        platformAdminAPI.getRatingStats()
      ])
      setRatings(ratingsRes.data || [])
      setStats(statsRes.data)
    } catch (err) {
      console.error('获取评价失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRating = async (id: string) => {
    if (!confirm('确定要删除这条评价吗？此操作不可恢复。')) return

    try {
      await platformAdminAPI.deleteRating(id)
      setRatings(ratings.filter(r => r.id !== id))
      alert('删除成功')
    } catch (err) {
      console.error('删除失败:', err)
      alert('删除失败')
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= rating ? 'text-yellow-500' : 'text-gray-600'}>
            ★
          </span>
        ))}
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN')
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-300 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">评价管理</h1>
          <p className="text-gray-400">管理平台上的所有评价，处理举报和违规内容</p>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">总评价数</div>
              <div className="text-3xl font-bold text-white">{stats.total_ratings}</div>
            </div>
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">平均评分</div>
              <div className="text-3xl font-bold text-yellow-500">{stats.average_rating.toFixed(1)}</div>
            </div>
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">被举报评价</div>
              <div className="text-3xl font-bold text-red-500">{stats.reported_count}</div>
            </div>
            <div className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">匿名评价</div>
              <div className="text-3xl font-bold text-blue-500">{stats.anonymous_count}</div>
            </div>
          </div>
        )}

        {/* 筛选标签 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-[#161b22] text-gray-400 hover:bg-[#1c2128]'
            }`}
          >
            全部评价
          </button>
          <button
            onClick={() => setFilter('reported')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              filter === 'reported'
                ? 'bg-red-600 text-white'
                : 'bg-[#161b22] text-gray-400 hover:bg-[#1c2128]'
            }`}
          >
            被举报评价
          </button>
        </div>

        {/* 评价列表 */}
        <div className="bg-[#161b22] border border-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">加载中...</div>
          ) : ratings.length === 0 ? (
            <div className="p-12 text-center text-gray-400">暂无评价</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {ratings.map(rating => (
                <div key={rating.id} className="p-6 hover:bg-[#1c2128] transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-white font-medium">
                          {rating.is_anonymous ? '匿名用户' : rating.rater_name}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="text-gray-400">{rating.ratee_name}</span>
                        {rating.is_reported && (
                          <span className="px-3 py-1 bg-red-900/30 text-red-400 text-xs rounded-full">
                            被举报 ({rating.report_count})
                          </span>
                        )}
                        {rating.is_anonymous && (
                          <span className="px-3 py-1 bg-blue-900/30 text-blue-400 text-xs rounded-full">
                            匿名
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        任务：{rating.task_title}
                      </div>
                      {renderStars(rating.rating)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(rating.created_at)}
                    </div>
                  </div>

                  {rating.comment && (
                    <div className="mb-3 text-gray-300 bg-[#0d1117] p-4 rounded-lg">
                      {rating.comment}
                    </div>
                  )}

                  {rating.tags && rating.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {rating.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-[#0d1117] text-gray-400 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {rating.response && (
                    <div className="mb-3 text-gray-400 bg-[#0d1117] p-4 rounded-lg border-l-4 border-blue-600">
                      <div className="text-xs text-gray-500 mb-1">对方回复：</div>
                      {rating.response}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedRating(rating)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      查看详情
                    </button>
                    <button
                      onClick={() => handleDeleteRating(rating.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      删除评价
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 详情弹窗 */}
        {selectedRating && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedRating(null)}
          >
            <div
              className="bg-[#161b22] border border-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-6">评价详情</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-gray-400 text-sm mb-1">评价人</div>
                  <div className="text-white">
                    {selectedRating.is_anonymous ? '匿名用户' : selectedRating.rater_name}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">被评价人</div>
                  <div className="text-white">{selectedRating.ratee_name}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">任务</div>
                  <div className="text-white">{selectedRating.task_title}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">评分</div>
                  {renderStars(selectedRating.rating)}
                </div>
                {selectedRating.comment && (
                  <div>
                    <div className="text-gray-400 text-sm mb-1">评价内容</div>
                    <div className="text-white bg-[#0d1117] p-4 rounded-lg">
                      {selectedRating.comment}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-gray-400 text-sm mb-1">举报次数</div>
                  <div className="text-white">{selectedRating.report_count}</div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRating(null)}
                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
