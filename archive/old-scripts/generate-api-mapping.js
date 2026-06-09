#!/usr/bin/env node

/**
 * 生成前后端API映射表
 * 用于指导前端API路径修改
 */

const fs = require('fs');

const mappings = [
  {
    category: '认证相关',
    apis: [
      { frontend: 'POST /auth/register', backend: 'POST /api/v1/auth/register', status: '✅ 已实现' },
      { frontend: 'POST /auth/login', backend: 'POST /api/v1/auth/login', status: '✅ 已实现' },
      { frontend: 'POST /auth/send-code', backend: 'POST /api/v1/auth/send-code', status: '✅ 已实现' },
      { frontend: 'GET /auth/me', backend: '❌ 缺失', status: '需要实现', fix: '添加到 auth/index.ts' },
    ]
  },
  {
    category: '任务相关',
    apis: [
      { frontend: 'GET /tasks/market', backend: 'GET /api/v1/tasks/market', status: '✅ 已实现' },
      { frontend: 'GET /tasks/matched', backend: '❌ 缺失', status: '需要实现', fix: '添加到 tasks/index.ts' },
      { frontend: 'GET /tasks/recommended', backend: 'GET /api/v1/tasks/recommended', status: '✅ 已实现' },
      { frontend: 'GET /tasks/my', backend: 'GET /api/v1/tasks/my', status: '✅ 已实现' },
      { frontend: 'GET /tasks/:id', backend: 'GET /api/v1/tasks/:id', status: '✅ 已实现' },
      { frontend: 'GET /tasks/:id/steps', backend: 'GET /api/v1/tasks/:id/steps', status: '✅ 已实现' },
      { frontend: 'POST /tasks/:id/accept', backend: 'POST /api/v1/tasks/:id/accept', status: '✅ 已实现' },
      { frontend: 'POST /tasks/:id/submit', backend: 'POST /api/v1/tasks/:id/submit', status: '✅ 已实现' },
      { frontend: 'POST /tasks/:id/progress', backend: '❌ 缺失', status: '需要实现', fix: '添加到 tasks/index.ts' },
    ]
  },
  {
    category: '能力系统',
    apis: [
      { frontend: 'GET /ability/radar', backend: 'GET /api/v1/ability/radar', status: '✅ 已实现' },
      { frontend: 'GET /ability/timeline', backend: 'GET /api/v1/ability/timeline', status: '✅ 已实现' },
      { frontend: 'GET /ability/emotion-state', backend: '❌ 缺失', status: '需要实现', fix: '添加到 ability/index.ts' },
      { frontend: 'POST /ability/update-after-task', backend: '❌ 缺失', status: '需要实现', fix: '添加到 ability/index.ts' },
    ]
  },
  {
    category: 'AI导师',
    apis: [
      { frontend: 'POST /mentor/chat', backend: 'POST /api/v1/mentor/chat', status: '✅ 已实现' },
      { frontend: 'GET /mentor/:taskId/history', backend: 'GET /api/v1/mentor/:taskId/history', status: '✅ 已实现' },
      { frontend: 'GET /mentor/:taskId/first-step', backend: 'GET /api/v1/mentor/:taskId/first-step', status: '✅ 已实现' },
      { frontend: 'POST /mentor/:taskId/stuck', backend: '❌ 缺失', status: '需要实现', fix: '添加到 mentor/index.ts' },
      { frontend: 'POST /mentor/:taskId/rejection-guidance', backend: '❌ 缺失', status: '需要实现', fix: '添加到 mentor/index.ts' },
      { frontend: 'POST /mentor/:taskId/milestone', backend: '❌ 缺失', status: '需要实现', fix: '添加到 mentor/index.ts' },
    ]
  },
  {
    category: '通知系统',
    apis: [
      { frontend: 'GET /notifications', backend: 'GET /api/v1/notifications', status: '✅ 已实现' },
      { frontend: 'GET /notifications/unread-count', backend: '❌ 缺失', status: '需要实现', fix: '添加到 notifications/index.ts' },
      { frontend: 'POST /notifications/:id/read', backend: 'PUT /api/v1/notifications/:id/read', status: '✅ 已实现（方法不同）' },
      { frontend: 'POST /notifications/read-all', backend: 'PUT /api/v1/notifications/read-all', status: '✅ 已实现（方法不同）' },
    ]
  },
  {
    category: 'OPC测评',
    apis: [
      { frontend: 'GET /student/test/questions', backend: 'GET /api/v1/student/test/questions', status: '✅ 已实现' },
      { frontend: 'POST /student/test/submit', backend: 'POST /api/v1/student/test/submit', status: '✅ 已实现' },
      { frontend: 'GET /student/test/result', backend: '❌ 缺失', status: '需要实现', fix: '添加到 student/index.ts' },
      { frontend: 'POST /opc/submit', backend: 'POST /api/v1/opc/submit', status: '✅ 已实现' },
      { frontend: 'GET /opc/result/:userId', backend: 'GET /api/v1/opc/result/:userId', status: '✅ 已实现' },
      { frontend: 'GET /opc/report/:userId', backend: '❌ 缺失', status: '需要实现', fix: '添加到 opcRoutes.ts' },
    ]
  },
  {
    category: '企业端',
    apis: [
      { frontend: 'POST /company/tasks/publish', backend: 'POST /api/v1/tasks/company', status: '✅ 已实现（路径不同）' },
      { frontend: 'GET /company/tasks', backend: 'GET /api/v1/tasks/company', status: '✅ 已实现（路径不同）' },
      { frontend: 'GET /company/tasks/:id', backend: 'GET /api/v1/tasks/:id', status: '✅ 已实现' },
      { frontend: 'GET /company/tasks/:id/matched-students', backend: '❌ 缺失', status: '需要实现', fix: '添加到 tasks/companyController.ts' },
      { frontend: 'GET /company/tasks/:id/progress', backend: 'GET /api/v1/company/tasks/:taskId/progress', status: '✅ 已实现' },
      { frontend: 'POST /company/tasks/:id/verify', backend: 'POST /api/v1/tasks/company/:id/approve', status: '✅ 已实现（路径不同）' },
      { frontend: 'POST /company/tasks/:id/cancel', backend: '❌ 缺失', status: '需要实现', fix: '添加到 tasks/companyController.ts' },
      { frontend: 'POST /company/tasks/:id/assign', backend: '❌ 缺失', status: '需要实现', fix: '添加到 tasks/companyController.ts' },
    ]
  },
];

// 生成Markdown表格
let markdown = '# 前后端API映射表\n\n';
markdown += '> 生成时间: ' + new Date().toISOString() + '\n\n';
markdown += '## 统计\n\n';

let totalAPIs = 0;
let implementedAPIs = 0;
let missingAPIs = 0;

mappings.forEach(category => {
  totalAPIs += category.apis.length;
  category.apis.forEach(api => {
    if (api.status.includes('✅')) implementedAPIs++;
    if (api.status.includes('❌')) missingAPIs++;
  });
});

markdown += `- 总API数: ${totalAPIs}\n`;
markdown += `- 已实现: ${implementedAPIs} (${(implementedAPIs/totalAPIs*100).toFixed(1)}%)\n`;
markdown += `- 需实现: ${missingAPIs} (${(missingAPIs/totalAPIs*100).toFixed(1)}%)\n\n`;

markdown += '---\n\n';

mappings.forEach(category => {
  markdown += `## ${category.category}\n\n`;
  markdown += '| 前端调用 | 后端实际 | 状态 | 修复方案 |\n';
  markdown += '|---------|---------|------|----------|\n';

  category.apis.forEach(api => {
    markdown += `| \`${api.frontend}\` | \`${api.backend}\` | ${api.status} | ${api.fix || '-'} |\n`;
  });

  markdown += '\n';
});

// 添加修复指南
markdown += '## 修复指南\n\n';
markdown += '### 方案A: 修改前端API调用（推荐）\n\n';
markdown += '修改 `miniapp/src/services/api.ts`，将前端调用路径改为后端实际路径。\n\n';
markdown += '**示例**:\n';
markdown += '```typescript\n';
markdown += '// 修改前\n';
markdown += 'export const taskAPI = {\n';
markdown += '  getList: () => request(\'/tasks/market\'),\n';
markdown += '}\n\n';
markdown += '// 修改后\n';
markdown += 'export const taskAPI = {\n';
markdown += '  getList: () => request(\'/tasks/market\'), // 路径正确，无需修改\n';
markdown += '}\n';
markdown += '```\n\n';

markdown += '### 方案B: 补充缺失的后端API\n\n';
markdown += '对于标记为 ❌ 的API，需要在对应的路由文件中添加实现。\n\n';

fs.writeFileSync('API_MAPPING.md', markdown);
console.log('✅ API映射表已生成: API_MAPPING.md');
console.log(`\n📊 统计:`);
console.log(`   总API数: ${totalAPIs}`);
console.log(`   已实现: ${implementedAPIs} (${(implementedAPIs/totalAPIs*100).toFixed(1)}%)`);
console.log(`   需实现: ${missingAPIs} (${(missingAPIs/totalAPIs*100).toFixed(1)}%)`);
