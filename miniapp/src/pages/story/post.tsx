import { View, Text, Textarea, Button, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { storyAPI } from '../../services/api'
import './post.scss'

export default function StoryPost() {
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 9 - images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      setImages([...images, ...res.tempFilePaths])
    } catch (err) {
      console.error('选择图片失败', err)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      Taro.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    if (content.trim().length < 10) {
      Taro.showToast({ title: '内容至少10个字', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)

      // 上传图片
      const uploadedImages: string[] = []
      for (const imagePath of images) {
        const uploadRes = await Taro.uploadFile({
          url: `${process.env.TARO_APP_API}/upload/image`,
          filePath: imagePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${Taro.getStorageSync('token')}`
          }
        })
        const data = JSON.parse(uploadRes.data)
        if (data.url) {
          uploadedImages.push(data.url)
        }
      }

      // 发布故事
      await storyAPI.post({
        content: content.trim(),
        images: uploadedImages
      })

      Taro.showToast({ title: '发布成功', icon: 'success' })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)

    } catch (err: any) {
      Taro.showToast({
        title: err.message || '发布失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="story-post-page">
      <View className="post-header">
        <Text className="post-title">分享你的成长故事</Text>
        <Text className="post-tip">记录任务中的收获、感悟和成长瞬间</Text>
      </View>

      <View className="post-form">
        {/* 内容编辑器 */}
        <View className="content-section">
          <Textarea
            className="content-input"
            placeholder="分享你在任务中的收获和感悟...&#10;&#10;例如：&#10;• 学到了什么新技能&#10;• 遇到了什么挑战，如何克服&#10;• 有什么心得体会&#10;• 想对其他小伙伴说的话"
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={2000}
            autoHeight
          />
          <Text className="char-count">{content.length}/2000</Text>
        </View>

        {/* 图片上传 */}
        <View className="images-section">
          <View className="section-header">
            <Text className="section-title">添加图片</Text>
            <Text className="section-tip">（选填，最多9张）</Text>
          </View>
          <View className="image-grid">
            {images.map((img, index) => (
              <View key={index} className="image-item">
                <Image src={img} className="image-preview" mode="aspectFill" />
                <View
                  className="image-remove"
                  onClick={() => handleRemoveImage(index)}
                >
                  ×
                </View>
              </View>
            ))}
            {images.length < 9 && (
              <View className="image-add" onClick={handleChooseImage}>
                <Text className="add-icon">+</Text>
                <Text className="add-text">添加图片</Text>
              </View>
            )}
          </View>
        </View>

        {/* 发布提示 */}
        <View className="post-tips">
          <Text className="tip-title">发布须知</Text>
          <Text className="tip-item">• 内容需真实，分享真实的成长经历</Text>
          <Text className="tip-item">• 禁止发布广告、垃圾信息</Text>
          <Text className="tip-item">• 尊重他人，文明交流</Text>
          <Text className="tip-item">• 违规内容将被删除，严重者封号</Text>
        </View>
      </View>

      {/* 发布按钮 */}
      <View className="post-footer">
        <Button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '发布中...' : '发布故事'}
        </Button>
      </View>
    </View>
  )
}
