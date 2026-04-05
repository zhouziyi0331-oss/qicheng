import { View, Text, Textarea, Button, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { taskAPI } from '../../services/api'
import './submit.scss'

export default function TaskSubmit() {
  const [taskId, setTaskId] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [links, setLinks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useState(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.id) {
      setTaskId(params.id)
    }
  })

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
    if (!description.trim()) {
      Taro.showToast({ title: '请填写作品说明', icon: 'none' })
      return
    }

    if (images.length === 0 && !links.trim()) {
      Taro.showToast({ title: '请至少上传一张图片或填写链接', icon: 'none' })
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

      // 提交任务
      await taskAPI.submitTask(taskId, {
        description: description.trim(),
        images: uploadedImages,
        links: links.trim().split('\n').filter(l => l.trim())
      })

      Taro.showToast({ title: '提交成功，等待验收', icon: 'success' })

      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/my-tasks/index' })
      }, 1500)

    } catch (err: any) {
      Taro.showToast({
        title: err.message || '提交失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="submit-page">
      <View className="submit-header">
        <Text className="submit-title">提交作品</Text>
        <Text className="submit-tip">请认真填写作品说明，上传相关截图或链接</Text>
      </View>

      <View className="submit-form">
        {/* 作品说明 */}
        <View className="form-section">
          <View className="section-header">
            <Text className="section-title">作品说明</Text>
            <Text className="required">*</Text>
          </View>
          <Textarea
            className="description-input"
            placeholder="请详细描述你的完成情况，包括：&#10;1. 完成了哪些内容&#10;2. 遇到了什么问题及如何解决&#10;3. 有什么心得体会"
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={1000}
            autoHeight
          />
          <Text className="char-count">{description.length}/1000</Text>
        </View>

        {/* 作品截图 */}
        <View className="form-section">
          <View className="section-header">
            <Text className="section-title">作品截图</Text>
            <Text className="section-tip">（最多9张）</Text>
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

        {/* 相关链接 */}
        <View className="form-section">
          <View className="section-header">
            <Text className="section-title">相关链接</Text>
            <Text className="section-tip">（选填，每行一个）</Text>
          </View>
          <Textarea
            className="links-input"
            placeholder="如有在线作品、代码仓库等链接，请填写在此&#10;例如：&#10;https://github.com/xxx/xxx&#10;https://codepen.io/xxx"
            value={links}
            onInput={(e) => setLinks(e.detail.value)}
            maxlength={500}
            autoHeight
          />
        </View>
      </View>

      {/* 提交按钮 */}
      <View className="submit-footer">
        <Button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '提交作品'}
        </Button>
        <Text className="submit-note">
          提交后将由企业方验收，通过后即可获得报酬
        </Text>
      </View>
    </View>
  )
}
