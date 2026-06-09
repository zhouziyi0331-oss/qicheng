import { View, Text, Textarea, Picker, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import pblAPI from '../../services/pbl'
import './index.scss'

const LANGUAGES = [
  { label: 'Python', value: 'python', icon: '🐍' },
  { label: 'JavaScript', value: 'javascript', icon: '📜' },
  { label: 'SQL', value: 'sql', icon: '🗄️' },
  { label: 'Bash', value: 'bash', icon: '💻' }
]

const CODE_EXAMPLES = {
  python: `# Python 示例
print("Hello, World!")

# 计算斐波那契数列
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))`,
  javascript: `// JavaScript 示例
console.log("Hello, World!");

// 计算斐波那契数列
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

console.log(fibonacci(10));`,
  sql: `-- SQL 示例
SELECT 'Hello, World!' as message;

-- 创建示例表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);`,
  bash: `# Bash 示例
echo "Hello, World!"

# 显示当前日期
date

# 列出文件
ls -la`
}

interface ExecutionResult {
  id: string
  language: string
  code: string
  status: 'success' | 'error' | 'timeout'
  output?: string
  error?: string
  executionTime?: number
  createdAt: string
}

export default function PBLCodeExecution() {
  const [projectId, setProjectId] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [language, setLanguage] = useState('python')
  const [languageIndex, setLanguageIndex] = useState(0)
  const [code, setCode] = useState(CODE_EXAMPLES.python)
  const [executing, setExecuting] = useState(false)
  const [currentResult, setCurrentResult] = useState<ExecutionResult | null>(null)
  const [history, setHistory] = useState<ExecutionResult[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.projectId) {
      setProjectId(params.projectId)
      setProjectTitle(params.projectTitle || '项目')
      loadHistory(params.projectId)
    }
  }, [])

  // 加载执行历史
  const loadHistory = async (projectId: string) => {
    try {
      const res = await pblAPI.getExecutionHistory(projectId)
      if (res.success && res.data) {
        setHistory(res.data)
      }
    } catch (error) {
      console.error('加载历史失败:', error)
    }
  }

  // 切换语言
  const handleLanguageChange = (e) => {
    const index = e.detail.value
    setLanguageIndex(index)
    const lang = LANGUAGES[index].value
    setLanguage(lang)
    setCode(CODE_EXAMPLES[lang])
  }

  // 使用示例代码
  const handleUseExample = () => {
    setCode(CODE_EXAMPLES[language])
  }

  // 清空代码
  const handleClear = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空当前代码吗？',
      success: (res) => {
        if (res.confirm) {
          setCode('')
        }
      }
    })
  }

  // 执行代码
  const handleExecute = async () => {
    if (!code.trim()) {
      Taro.showToast({
        title: '请输入代码',
        icon: 'none'
      })
      return
    }

    try {
      setExecuting(true)
      setCurrentResult(null)
      Taro.showLoading({ title: '执行中...' })

      const res = await pblAPI.executeCode(projectId, {
        language,
        code: code.trim(),
        timeout: 30000
      })

      Taro.hideLoading()

      if (res.success && res.data) {
        const result: ExecutionResult = {
          id: Date.now().toString(),
          language,
          code: code.trim(),
          status: res.data.status,
          output: res.data.output,
          error: res.data.error,
          executionTime: res.data.executionTime,
          createdAt: new Date().toISOString()
        }

        setCurrentResult(result)
        setHistory(prev => [result, ...prev])

        if (result.status === 'success') {
          Taro.showToast({
            title: '执行成功',
            icon: 'success'
          })
        } else if (result.status === 'timeout') {
          Taro.showToast({
            title: '执行超时',
            icon: 'none'
          })
        } else {
          Taro.showToast({
            title: '执行失败',
            icon: 'none'
          })
        }
      }
    } catch (error) {
      console.error('执行失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '执行失败',
        icon: 'none'
      })
    } finally {
      setExecuting(false)
    }
  }

  // 查看历史记录
  const handleViewHistory = (result: ExecutionResult) => {
    setLanguage(result.language)
    setLanguageIndex(LANGUAGES.findIndex(l => l.value === result.language))
    setCode(result.code)
    setCurrentResult(result)
    setShowHistory(false)
  }

  return (
    <View className='pbl-code-execution-page'>
      {/* 头部 */}
      <View className='execution-header'>
        <View className='header-info'>
          <Text className='header-icon'>💻</Text>
          <View className='header-text'>
            <Text className='header-title'>代码执行</Text>
            <Text className='header-subtitle'>{projectTitle}</Text>
          </View>
        </View>
        <View
          className='history-btn'
          onClick={() => setShowHistory(!showHistory)}
        >
          <Text className='history-icon'>📜</Text>
          <Text className='history-text'>历史</Text>
        </View>
      </View>

      <ScrollView className='execution-content' scrollY>
        {/* 语言选择 */}
        <View className='language-section'>
          <Text className='section-label'>选择语言</Text>
          <Picker
            mode='selector'
            range={LANGUAGES.map(l => l.label)}
            value={languageIndex}
            onChange={handleLanguageChange}
          >
            <View className='language-picker'>
              <Text className='language-icon'>{LANGUAGES[languageIndex].icon}</Text>
              <Text className='language-name'>{LANGUAGES[languageIndex].label}</Text>
              <Text className='picker-arrow'>▼</Text>
            </View>
          </Picker>
        </View>

        {/* 代码编辑器 */}
        <View className='code-section'>
          <View className='section-header'>
            <Text className='section-label'>代码编辑器</Text>
            <View className='section-actions'>
              <View className='action-btn' onClick={handleUseExample}>
                <Text>示例</Text>
              </View>
              <View className='action-btn' onClick={handleClear}>
                <Text>清空</Text>
              </View>
            </View>
          </View>
          <Textarea
            className='code-editor'
            value={code}
            onInput={(e) => setCode(e.detail.value)}
            placeholder='在这里输入代码...'
            maxlength={-1}
            autoHeight
          />
          <Text className='code-counter'>{code.length} 字符</Text>
        </View>

        {/* 执行按钮 */}
        <View className='execute-section'>
          <View
            className={`execute-btn ${executing ? 'disabled' : ''}`}
            onClick={handleExecute}
          >
            <Text className='execute-icon'>▶️</Text>
            <Text className='execute-text'>{executing ? '执行中...' : '执行代码'}</Text>
          </View>
        </View>

        {/* 执行结果 */}
        {currentResult && (
          <View className='result-section'>
            <View className='section-header'>
              <Text className='section-label'>执行结果</Text>
              <View className={`status-badge ${currentResult.status}`}>
                <Text>
                  {currentResult.status === 'success' ? '✅ 成功' :
                   currentResult.status === 'timeout' ? '⏱️ 超时' : '❌ 失败'}
                </Text>
              </View>
            </View>

            {currentResult.status === 'success' && currentResult.output && (
              <View className='result-output'>
                <Text className='result-label'>输出：</Text>
                <Text className='result-text'>{currentResult.output}</Text>
              </View>
            )}

            {currentResult.status === 'error' && currentResult.error && (
              <View className='result-error'>
                <Text className='result-label'>错误：</Text>
                <Text className='result-text'>{currentResult.error}</Text>
              </View>
            )}

            {currentResult.executionTime && (
              <View className='result-meta'>
                <Text>执行时间: {currentResult.executionTime}ms</Text>
              </View>
            )}
          </View>
        )}

        {/* 历史记录 */}
        {showHistory && (
          <View className='history-section'>
            <Text className='section-label'>执行历史</Text>
            {history.length === 0 ? (
              <View className='empty-history'>
                <Text className='empty-icon'>📝</Text>
                <Text className='empty-text'>暂无执行历史</Text>
              </View>
            ) : (
              history.map(item => (
                <View
                  key={item.id}
                  className='history-item'
                  onClick={() => handleViewHistory(item)}
                >
                  <View className='history-header'>
                    <View className='history-language'>
                      <Text className='language-icon'>
                        {LANGUAGES.find(l => l.value === item.language)?.icon}
                      </Text>
                      <Text className='language-name'>
                        {LANGUAGES.find(l => l.value === item.language)?.label}
                      </Text>
                    </View>
                    <View className={`history-status ${item.status}`}>
                      <Text>
                        {item.status === 'success' ? '✅' :
                         item.status === 'timeout' ? '⏱️' : '❌'}
                      </Text>
                    </View>
                  </View>
                  <Text className='history-code'>{item.code.substring(0, 100)}...</Text>
                  <Text className='history-time'>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
