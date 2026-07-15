# 启程小程序故障排查指南

## 已完成的修复 (2026-06-28)

### 1. ✅ WXSS语法错误 - CSS注释
- **问题**: 微信小程序WXSS解析器无法处理CSS注释 `/* */`
- **解决**: 使用Python脚本删除了所有SCSS源文件中的注释
- **验证**: 运行 `find dist -name "*.wxss" -exec grep -l "/\*" {} \;` 应返回空

### 2. ✅ WXSS语法错误 - @media查询
- **问题**: 微信小程序不支持@media查询
- **解决**: 从theme.scss中删除了所有@media块
- **文件**: src/styles/theme.scss

### 3. ✅ CSS压缩导致单行过长
- **问题**: Webpack压缩CSS导致单行超过微信解析器限制
- **解决**: 在config/index.js和config/prod.js中设置 `chain.optimization.minimize(false)`
- **文件**: config/index.js (line 37), config/prod.js (line 15)

### 4. ✅ 微信开发者工具压缩设置
- **问题**: project.config.json中启用了压缩选项
- **解决**: 禁用了 minifyWXSS, minifyWXML, minified
- **文件**: project.config.json

### 5. ✅ 后端API地址配置
- **问题**: 前端配置的API地址与后端不匹配
- **解决**: 
  - 后端: PORT=3517 (.env文件)
  - 前端: 127.0.0.1:3517 (request.ts, secureRequest.ts)

## 如何测试

### 1. 清理并重新编译
```bash
cd /Users/alwan/code/qicheng/miniapp
rm -rf dist
npm run build:weapp
```

### 2. 验证编译结果
```bash
# 检查是否有CSS注释
find dist -name "*.wxss" -exec grep -c "/\*" {} \; | grep -v "^0$"

# 检查关键文件是否存在
ls -lh dist/app.js dist/app.json dist/pages/auth/login/index.js
```

### 3. 在微信开发者工具中测试
1. 打开项目目录: `/Users/alwan/code/qicheng/miniapp`
2. 点击"编译"按钮
3. 检查控制台是否有错误
4. 查看模拟器是否显示登录页面

## 当前已知问题

### 空白屏幕可能的原因
如果修复后仍然空白，检查以下方面：

#### A. JavaScript运行时错误
```javascript
// 在微信开发者工具控制台查看
// 是否有红色错误信息
```

#### B. 页面路由问题
- 检查app.json中的pages数组
- 确认首页路径: `pages/auth/login/index`
- 验证文件存在: `dist/pages/auth/login/index.js`

#### C. React组件渲染错误
- 检查登录页面组件是否正确导出
- 验证所有import路径是否正确
- 确认@tarojs/components正确导入

#### D. 样式问题导致内容不可见
- 检查是否有 `display: none`
- 验证背景色与文字颜色对比度
- 查看是否有 `opacity: 0` 或 `visibility: hidden`

#### E. Taro框架初始化问题
- 检查app.tsx是否正确
- 验证useLaunch hook
- 确认children正确渲染

## 调试步骤

### 1. 启用调试日志
在src/app.tsx中添加更多日志：
```typescript
useLaunch(() => {
  console.log('✅ 启程小程序启动成功')
  console.log('Taro版本:', Taro.version)
  console.log('环境:', Taro.getEnv())
})
```

### 2. 在登录页面添加调试信息
在src/pages/auth/login/index.tsx的useEffect中：
```typescript
useEffect(() => {
  console.log('✅ 登录页面组件已挂载')
  console.log('当前路径:', Taro.getCurrentPages())
}, []);
```

### 3. 检查是否是白屏 vs 空白内容
- **白屏**: 页面完全没有渲染，可能是JS错误
- **空白内容**: 页面渲染了，但内容不可见，可能是CSS问题

### 4. 使用微信开发者工具的调试功能
- 打开 WXML面板，查看DOM结构是否生成
- 打开 Sources面板，设置断点调试
- 查看 Network面板，确认API请求状态

## 联系信息

如果问题仍未解决，提供以下信息：
1. 微信开发者工具控制台的完整错误信息
2. WXML面板中的DOM结构截图
3. Network面板中的请求列表
4. 使用的Taro版本: 3.6.39
5. 微信基础库版本: 3.15.1
