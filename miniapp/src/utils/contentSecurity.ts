import Taro from '@tarojs/taro'
import { getApiUrl } from '../config'

/**
 * 图片内容安全检查
 * 调用后端接口，后端会调用微信 imgSecCheck API
 * @param filePath 图片临时文件路径
 * @returns 检查通过返回true，违规返回false
 */
export async function checkImageSecurity(filePath: string): Promise<boolean> {
  try {
    const token = Taro.getStorageSync('token')

    // 1. 将图片转为base64
    const base64 = await Taro.getFileSystemManager().readFileSync(filePath, 'base64')
    const imageBase64 = `data:image/jpeg;base64,${base64}`

    // 2. 调用后端安全检查接口
    const res = await Taro.request({
      url: getApiUrl('/api/v1/security/imgSecCheck'),
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        imageBase64
      },
      timeout: 15000 // 15秒超时（考虑base64编码和网络传输）
    })

    if (res.statusCode === 200 && res.data.success && res.data.data.pass) {
      return true
    } else {
      console.warn('图片安全检查未通过:', res.data)
      Taro.showToast({
        title: '图片包含违规内容',
        icon: 'none',
        duration: 2000
      })
      return false
    }
  } catch (error: any) {
    console.error('图片安全检查失败:', error)
    // 网络错误时，为了不影响用户体验，可以选择放行
    // 生产环境建议：严格模式返回 false，宽松模式返回 true
    // 这里采用宽松模式
    return true
  }
}

/**
 * 文本内容安全检查
 * 调用后端接口，后端会调用微信 msgSecCheck API
 * @param content 待检查文本内容
 * @returns 检查通过返回true，违规返回false
 */
export async function checkTextSecurity(content: string): Promise<boolean> {
  // 空内容直接通过
  if (!content || content.trim().length === 0) {
    return true
  }

  // 内容过短直接通过（少于2个字符）
  if (content.trim().length < 2) {
    return true
  }

  try {
    // 显示检查中的提示
    Taro.showLoading({ title: '安全检查中...', mask: true })

    const token = Taro.getStorageSync('token')

    // 调用后端安全检查接口
    const res = await Taro.request({
      url: getApiUrl('/api/v1/security/msgSecCheck'),
      method: 'POST',
      header: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        content: content.trim(),
        scene: 2 // 默认场景：评论
      },
      timeout: 10000 // 10秒超时
    })

    Taro.hideLoading()

    if (res.statusCode === 200 && res.data.success && res.data.data.pass) {
      return true
    } else {
      console.warn('文本安全检查未通过:', res.data)
      Taro.showToast({
        title: '内容包含违规信息',
        icon: 'none',
        duration: 2000
      })
      return false
    }
  } catch (error: any) {
    Taro.hideLoading()
    console.error('文本安全检查失败:', error)
    // 网络错误时，为了不影响用户体验，可以选择放行
    // 生产环境建议：严格模式返回 false，宽松模式返回 true
    // 这里采用宽松模式
    return true
  }
}

/**
 * 批量检查图片安全性
 * @param filePaths 图片路径数组
 * @returns 通过检查的图片路径数组
 */
export async function checkMultipleImagesSecurity(filePaths: string[]): Promise<string[]> {
  if (!filePaths || filePaths.length === 0) {
    return []
  }

  // 显示加载动画，让用户知道正在处理
  Taro.showLoading({
    title: `正在检查${filePaths.length}张图片...`,
    mask: true
  })

  try {
    const secureImages: string[] = []
    let checkedCount = 0

    for (const filePath of filePaths) {
      checkedCount++
      // 更新进度提示
      Taro.showLoading({
        title: `检查中 ${checkedCount}/${filePaths.length}`,
        mask: true
      })

      const isSecure = await checkImageSecurity(filePath)
      if (isSecure) {
        secureImages.push(filePath)
      }
    }

    Taro.hideLoading()

    // 如果有图片被过滤，提示用户
    const filteredCount = filePaths.length - secureImages.length
    if (filteredCount > 0) {
      Taro.showToast({
        title: `已过滤${filteredCount}张违规图片`,
        icon: 'none',
        duration: 2000
      })
    } else if (filePaths.length > 0) {
      // 全部通过时给个成功提示
      Taro.showToast({
        title: '图片检查通过',
        icon: 'success',
        duration: 1500
      })
    }

    return secureImages
  } catch (error) {
    Taro.hideLoading()
    console.error('批量图片检查失败:', error)
    return filePaths // 失败时返回原始数组
  }
}
