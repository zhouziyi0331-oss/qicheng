import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import pblAPI from '../../services/pbl'
import './index.scss'

const FILE_TYPES = [
  { label: '全部', value: 'all', icon: '📁' },
  { label: '代码', value: 'code', icon: '💻' },
  { label: '文档', value: 'document', icon: '📄' },
  { label: '数据', value: 'data', icon: '📊' },
  { label: '图片', value: 'image', icon: '🖼️' },
  { label: '其他', value: 'other', icon: '📦' }
]

interface ProjectFile {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  purpose: string
  aiAnalysis?: {
    summary?: string
    issues?: string[]
    suggestions?: string[]
  }
  uploadedAt: string
}

export default function PBLFileUpload() {
  const [projectId, setProjectId] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<ProjectFile[]>([])
  const [currentType, setCurrentType] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.projectId) {
      setProjectId(params.projectId)
      setProjectTitle(params.projectTitle || '项目')
      loadFiles(params.projectId)
    }
  }, [])

  useEffect(() => {
    if (currentType === 'all') {
      setFilteredFiles(files)
    } else {
      setFilteredFiles(files.filter(f => f.fileType === currentType))
    }
  }, [currentType, files])

  // 加载文件列表
  const loadFiles = async (projectId: string) => {
    try {
      const res = await pblAPI.getProjectFiles(projectId)
      if (res.success && res.data) {
        setFiles(res.data)
      }
    } catch (error) {
      console.error('加载文件失败:', error)
    }
  }

  // 选择文件类型
  const handleSelectType = (type: string) => {
    setCurrentType(type)
  }

  // 上传文件
  const handleUpload = async () => {
    try {
      const res = await Taro.chooseMessageFile({
        count: 1,
        type: 'all'
      })

      if (res.tempFiles && res.tempFiles.length > 0) {
        const file = res.tempFiles[0]

        // 检查文件大小（限制10MB）
        if (file.size > 10 * 1024 * 1024) {
          Taro.showToast({
            title: '文件大小不能超过10MB',
            icon: 'none'
          })
          return
        }

        setUploading(true)
        Taro.showLoading({ title: '上传中...' })

        const uploadRes = await pblAPI.uploadFile(projectId, file.path, {
          purpose: 'input',
          aiAnalyze: true
        })

        Taro.hideLoading()

        if (uploadRes.statusCode === 200) {
          const data = JSON.parse(uploadRes.data)
          if (data.success) {
            Taro.showToast({
              title: '上传成功',
              icon: 'success'
            })
            loadFiles(projectId)
          }
        }
      }
    } catch (error) {
      console.error('上传失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '上传失败',
        icon: 'none'
      })
    } finally {
      setUploading(false)
    }
  }

  // 查看文件详情
  const handleViewFile = (file: ProjectFile) => {
    setSelectedFile(file)
  }

  // 关闭详情
  const handleCloseDetail = () => {
    setSelectedFile(null)
  }

  // 删除文件
  const handleDelete = async (fileId: string) => {
    try {
      const res = await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个文件吗？'
      })

      if (res.confirm) {
        Taro.showLoading({ title: '删除中...' })
        await pblAPI.deleteFile(fileId)
        Taro.hideLoading()
        Taro.showToast({
          title: '删除成功',
          icon: 'success'
        })
        loadFiles(projectId)
        setSelectedFile(null)
      }
    } catch (error) {
      console.error('删除失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    const type = FILE_TYPES.find(t => t.value === fileType)
    return type?.icon || '📄'
  }

  return (
    <View className='pbl-file-upload-page'>
      {/* 头部 */}
      <View className='upload-header'>
        <View className='header-info'>
          <Text className='header-icon'>📁</Text>
          <View className='header-text'>
            <Text className='header-title'>项目文件</Text>
            <Text className='header-subtitle'>{projectTitle}</Text>
          </View>
        </View>
        <View className='file-count'>
          <Text className='count-number'>{files.length}</Text>
          <Text className='count-label'>个文件</Text>
        </View>
      </View>

      {/* 文件类型筛选 */}
      <ScrollView className='type-filter' scrollX>
        {FILE_TYPES.map(type => (
          <View
            key={type.value}
            className={`type-item ${currentType === type.value ? 'active' : ''}`}
            onClick={() => handleSelectType(type.value)}
          >
            <Text className='type-icon'>{type.icon}</Text>
            <Text className='type-label'>{type.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 文件列表 */}
      <ScrollView className='files-list' scrollY>
        {filteredFiles.length === 0 ? (
          <View className='empty-files'>
            <Text className='empty-icon'>📂</Text>
            <Text className='empty-text'>
              {currentType === 'all' ? '还没有上传文件' : `没有${FILE_TYPES.find(t => t.value === currentType)?.label}文件`}
            </Text>
            <Text className='empty-hint'>点击下方按钮上传文件</Text>
          </View>
        ) : (
          filteredFiles.map(file => (
            <View
              key={file.id}
              className='file-item'
              onClick={() => handleViewFile(file)}
            >
              <View className='file-icon'>
                <Text>{getFileIcon(file.fileType)}</Text>
              </View>
              <View className='file-info'>
                <Text className='file-name'>{file.fileName}</Text>
                <View className='file-meta'>
                  <Text className='file-size'>{formatFileSize(file.fileSize)}</Text>
                  <Text className='file-time'>
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
                {file.aiAnalysis?.summary && (
                  <View className='file-ai-badge'>
                    <Text>🤖 AI已分析</Text>
                  </View>
                )}
              </View>
              <View className='file-arrow'>
                <Text>›</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 上传按钮 */}
      <View className='upload-actions'>
        <View
          className={`upload-btn ${uploading ? 'disabled' : ''}`}
          onClick={handleUpload}
        >
          <Text className='upload-icon'>⬆️</Text>
          <Text className='upload-text'>{uploading ? '上传中...' : '上传文件'}</Text>
        </View>
      </View>

      {/* 文件详情弹窗 */}
      {selectedFile && (
        <View className='file-detail-modal' onClick={handleCloseDetail}>
          <View className='modal-content' onClick={(e) => e.stopPropagation()}>
            <View className='modal-header'>
              <Text className='modal-title'>文件详情</Text>
              <View className='modal-close' onClick={handleCloseDetail}>
                <Text>✕</Text>
              </View>
            </View>

            <ScrollView className='modal-body' scrollY>
              {/* 基本信息 */}
              <View className='detail-section'>
                <View className='detail-icon'>
                  <Text>{getFileIcon(selectedFile.fileType)}</Text>
                </View>
                <Text className='detail-name'>{selectedFile.fileName}</Text>
                <View className='detail-meta'>
                  <View className='meta-item'>
                    <Text className='meta-label'>大小</Text>
                    <Text className='meta-value'>{formatFileSize(selectedFile.fileSize)}</Text>
                  </View>
                  <View className='meta-item'>
                    <Text className='meta-label'>类型</Text>
                    <Text className='meta-value'>
                      {FILE_TYPES.find(t => t.value === selectedFile.fileType)?.label}
                    </Text>
                  </View>
                  <View className='meta-item'>
                    <Text className='meta-label'>上传时间</Text>
                    <Text className='meta-value'>
                      {new Date(selectedFile.uploadedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* AI分析结果 */}
              {selectedFile.aiAnalysis && (
                <View className='ai-analysis-section'>
                  <View className='analysis-header'>
                    <Text className='analysis-icon'>🤖</Text>
                    <Text className='analysis-title'>AI分析</Text>
                  </View>

                  {selectedFile.aiAnalysis.summary && (
                    <View className='analysis-item'>
                      <Text className='analysis-label'>摘要</Text>
                      <Text className='analysis-content'>{selectedFile.aiAnalysis.summary}</Text>
                    </View>
                  )}

                  {selectedFile.aiAnalysis.issues && selectedFile.aiAnalysis.issues.length > 0 && (
                    <View className='analysis-item'>
                      <Text className='analysis-label'>发现的问题</Text>
                      {selectedFile.aiAnalysis.issues.map((issue, index) => (
                        <View key={index} className='analysis-list-item issue'>
                          <Text className='list-bullet'>⚠️</Text>
                          <Text className='list-text'>{issue}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedFile.aiAnalysis.suggestions && selectedFile.aiAnalysis.suggestions.length > 0 && (
                    <View className='analysis-item'>
                      <Text className='analysis-label'>改进建议</Text>
                      {selectedFile.aiAnalysis.suggestions.map((suggestion, index) => (
                        <View key={index} className='analysis-list-item suggestion'>
                          <Text className='list-bullet'>💡</Text>
                          <Text className='list-text'>{suggestion}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View className='modal-footer'>
              <View
                className='delete-btn'
                onClick={() => handleDelete(selectedFile.id)}
              >
                <Text>删除文件</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
