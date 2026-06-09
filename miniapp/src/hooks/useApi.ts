import { useState, useCallback } from 'react'
import Taro from '@tarojs/taro'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: any) => void
  showLoading?: boolean
  showError?: boolean
  retryCount?: number
  retryDelay?: number
}

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: any | null
  retry: () => void
}

/**
 * API请求Hook，支持加载状态、错误处理、重试机制
 * @param apiFunction API调用函数
 * @param options 配置选项
 */
export function useApi<T>(
  apiFunction: () => Promise<any>,
  options: UseApiOptions<T> = {}
): ApiState<T> {
  const {
    onSuccess,
    onError,
    showLoading = false,
    showError = true,
    retryCount = 0,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any | null>(null)

  const execute = useCallback(async (attemptCount = 0) => {
    setLoading(true)
    setError(null)

    if (showLoading) {
      Taro.showLoading({ title: '加载中...', mask: true })
    }

    try {
      const result = await apiFunction()

      if (showLoading) {
        Taro.hideLoading()
      }

      if (result.success) {
        setData(result.data)
        setError(null)
        onSuccess?.(result.data)
      } else {
        throw new Error(result.error?.message || '请求失败')
      }
    } catch (err: any) {
      if (showLoading) {
        Taro.hideLoading()
      }

      console.error('API请求失败:', err)

      // 重试逻辑
      if (attemptCount < retryCount) {
        console.log(`重试中... (${attemptCount + 1}/${retryCount})`)
        setTimeout(() => {
          execute(attemptCount + 1)
        }, retryDelay)
        return
      }

      // 所有重试都失败
      setError(err)
      onError?.(err)

      if (showError && !err.message?.includes('网络')) {
        Taro.showToast({
          title: err.message || '请求失败',
          icon: 'none',
          duration: 2000
        })
      }
    } finally {
      setLoading(false)
    }
  }, [apiFunction, onSuccess, onError, showLoading, showError, retryCount, retryDelay])

  const retry = useCallback(() => {
    execute(0)
  }, [execute])

  return { data, loading, error, retry }
}

/**
 * 手动触发的API请求Hook
 */
export function useApiMutation<T, P = any>(
  apiFunction: (params: P) => Promise<any>,
  options: UseApiOptions<T> = {}
) {
  const {
    onSuccess,
    onError,
    showLoading = true,
    showError = true
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any | null>(null)

  const mutate = useCallback(async (params: P) => {
    setLoading(true)
    setError(null)

    if (showLoading) {
      Taro.showLoading({ title: '处理中...', mask: true })
    }

    try {
      const result = await apiFunction(params)

      if (showLoading) {
        Taro.hideLoading()
      }

      if (result.success) {
        setData(result.data)
        setError(null)
        onSuccess?.(result.data)
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error?.message || '操作失败')
      }
    } catch (err: any) {
      if (showLoading) {
        Taro.hideLoading()
      }

      console.error('API操作失败:', err)
      setError(err)
      onError?.(err)

      if (showError && !err.message?.includes('网络')) {
        Taro.showToast({
          title: err.message || '操作失败',
          icon: 'none',
          duration: 2000
        })
      }

      return { success: false, error: err }
    } finally {
      setLoading(false)
    }
  }, [apiFunction, onSuccess, onError, showLoading, showError])

  return { data, loading, error, mutate }
}
