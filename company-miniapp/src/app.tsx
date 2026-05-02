import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import security from './utils/security'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('启程企业端小程序启动')

    // 初始化安全模块
    security.initSecurity()
  })

  return children
}

export default App
