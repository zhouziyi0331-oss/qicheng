import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { checkMultipleImagesSecurity } from './utils/contentSecurity'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('启程小程序启动')

    // ○ 全局AOP拦截 - 图片选择安全检查
    const originalChooseImage = Taro.chooseImage
    Taro.chooseImage = async (options: Taro.chooseImage.Option) => {
      try {
        // 1. 调用原始API选择图片
        const res = await originalChooseImage(options)

        // 2. 静默进行安全检查
        const secureImages = await checkMultipleImagesSecurity(res.tempFilePaths)

        // 3. 如果所有图片都违规，抛出错误
        if (secureImages.length === 0) {
          throw new Error('所有图片均包含违规内容，请重新选择')
        }

        // 4. 返回通过检查的图片
        const secureFiles = res.tempFiles?.filter((_, index) =>
          secureImages.includes(res.tempFilePaths[index])
        )

        return {
          ...res,
          tempFilePaths: secureImages,
          tempFiles: secureFiles || []
        } as Taro.chooseImage.SuccessCallbackResult

      } catch (error: any) {
        console.error('图片选择失败:', error)

        // 如果是安全检查失败，显示友好提示
        if (error.message && error.message.includes('违规')) {
          Taro.showToast({
            title: error.message,
            icon: 'none',
            duration: 2500
          })
        }

        // 抛出错误，让调用方的 catch 捕获
        throw error
      }
    }

    // ○ 全局AOP拦截 - 文件选择安全检查（用于图片类型）
    const originalChooseMessageFile = Taro.chooseMessageFile
    Taro.chooseMessageFile = async (options: Taro.chooseMessageFile.Option) => {
      try {
        // 调用原始API
        const res = await originalChooseMessageFile(options)

        // 过滤出图片类型文件
        const imageFiles = res.tempFiles.filter(file =>
          file.type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
        )

        // 如果包含图片，进行安全检查
        if (imageFiles.length > 0) {
          const imagePaths = imageFiles.map(f => f.path)
          const securePaths = await checkMultipleImagesSecurity(imagePaths)

          // 过滤出安全的文件
          const secureFiles = res.tempFiles.filter(file => {
            // 非图片文件直接通过
            if (!imageFiles.some(img => img.path === file.path)) {
              return true
            }
            // 图片文件需要通过安全检查
            return securePaths.includes(file.path)
          })

          if (secureFiles.length === 0) {
            throw new Error('所有文件均包含违规内容，请重新选择')
          }

          return {
            ...res,
            tempFiles: secureFiles
          } as Taro.chooseMessageFile.SuccessCallbackResult
        }

        return res

      } catch (error: any) {
        console.error('文件选择失败:', error)

        if (error.message && error.message.includes('违规')) {
          Taro.showToast({
            title: error.message,
            icon: 'none',
            duration: 2500
          })
        }

        throw error
      }
    }

    console.log('✓ 全局安全检查拦截已启用')
  })

  return children
}

export default App
