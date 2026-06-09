import Taro from '@tarojs/taro'

interface ToastOptions {
  title: string;
  icon?: 'success' | 'error' | 'warning' | 'none';
  duration?: number;
}

class Toast {
  /**
   * 成功提示
   */
  success(title: string, duration: number = 2000) {
    Taro.showToast({
      title,
      icon: 'success',
      duration,
      mask: true
    })
  }

  /**
   * 错误提示
   */
  error(title: string, duration: number = 2000) {
    Taro.showToast({
      title,
      icon: 'error',
      duration,
      mask: true
    })
  }

  /**
   * 警告提示
   */
  warning(title: string, duration: number = 2000) {
    Taro.showToast({
      title,
      icon: 'none',
      duration,
      mask: true
    })
  }

  /**
   * 普通提示
   */
  info(title: string, duration: number = 2000) {
    Taro.showToast({
      title,
      icon: 'none',
      duration,
      mask: true
    })
  }

  /**
   * 加载提示
   */
  loading(title: string = '加载中...') {
    Taro.showLoading({
      title,
      mask: true
    })
  }

  /**
   * 隐藏加载
   */
  hideLoading() {
    Taro.hideLoading()
  }

  /**
   * 权限不足提示
   */
  permissionDenied(requiredLevel: number) {
    Taro.showModal({
      title: '功能未解锁',
      content: `需要达到Lv.${requiredLevel}才能使用此功能`,
      showCancel: false,
      confirmText: '知道了'
    })
  }

  /**
   * 确认对话框
   */
  confirm(options: {
    title: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      Taro.showModal({
        title: options.title,
        content: options.content,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        success: (res) => {
          resolve(res.confirm)
        }
      })
    })
  }
}

export default new Toast()
