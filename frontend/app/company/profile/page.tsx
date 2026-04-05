'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

interface CompanyProfile {
  id: number
  email: string
  companyName: string
  industry: string
  scale: string
  contactPerson: string
  contactPhone: string
  address: string
  description: string
  logoUrl?: string
  verifiedAt?: string
  createdAt: string
}

export default function CompanyProfilePage() {
  const { role } = useAuthStore()
  const router = useRouter()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    scale: '',
    contactPerson: '',
    contactPhone: '',
    address: '',
    description: '',
    logoUrl: ''
  })

  useEffect(() => {
    if (role !== 'company') {
      router.push('/tasks')
      return
    }
    fetchProfile()
  }, [role, router])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/v1/company/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setFormData({
          companyName: data.companyName,
          industry: data.industry,
          scale: data.scale,
          contactPerson: data.contactPerson,
          contactPhone: data.contactPhone,
          address: data.address,
          description: data.description,
          logoUrl: data.logoUrl || ''
        })
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const res = await fetch('/api/v1/company/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        await fetchProfile()
        setEditing(false)
      }
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">无法加载企业信息</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">企业信息</h1>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                编辑
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      companyName: profile.companyName,
                      industry: profile.industry,
                      scale: profile.scale,
                      contactPerson: profile.contactPerson,
                      contactPhone: profile.contactPhone,
                      address: profile.address,
                      description: profile.description,
                      logoUrl: profile.logoUrl || ''
                    })
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  取消
                </button>
              </div>
            )}
          </div>

          {profile.verifiedAt && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-green-700">✓ 已认证企业</span>
              <span className="text-gray-500 text-sm ml-2">
                认证时间：{new Date(profile.verifiedAt).toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企业名称
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-900">{profile.companyName}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属行业
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-900">{profile.industry}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企业规模
                </label>
                {editing ? (
                  <select
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1-50">1-50人</option>
                    <option value="51-200">51-200人</option>
                    <option value="201-500">201-500人</option>
                    <option value="501-1000">501-1000人</option>
                    <option value="1000+">1000人以上</option>
                  </select>
                ) : (
                  <div className="text-gray-900">{profile.scale}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系人
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-900">{profile.contactPerson}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-gray-900">{profile.contactPhone}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企业邮箱
                </label>
                <div className="text-gray-900">{profile.email}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                企业地址
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-gray-900">{profile.address}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                企业简介
              </label>
              {editing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="text-gray-900 whitespace-pre-wrap">{profile.description}</div>
              )}
            </div>

            {editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企业 Logo URL
                </label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {profile.logoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  企业 Logo
                </label>
                <img
                  src={profile.logoUrl}
                  alt="Company Logo"
                  className="w-32 h-32 object-contain border rounded"
                />
              </div>
            )}

            <div className="pt-4 border-t text-sm text-gray-500">
              注册时间：{new Date(profile.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
