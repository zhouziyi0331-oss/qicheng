const fs = require('fs');
const path = require('path');

// 扫描后端路由定义
function scanBackendRoutes(dir) {
  const routes = new Set();

  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 匹配 router.get/post/put/delete/patch('路径', ...)
    const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const routePath = match[2];
      routes.add(`${method} ${routePath}`);
    }
  }

  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.js')) {
        scanFile(filePath);
      }
    }
  }

  walkDir(dir);
  return Array.from(routes).sort();
}

// 扫描前端API调用
function scanFrontendAPICalls(dir) {
  const apiCalls = new Set();

  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 匹配 request('/路径', { method: 'METHOD' })
    // 或 request('/路径') (默认GET)
    const patterns = [
      // request('/path', { method: 'POST', ... })
      /request\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{[^}]*method\s*:\s*['"`](\w+)['"`]/g,
      // request('/path') - 默认GET
      /request\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      // request(`/path/${var}`, ...)
      /request\s*\(\s*`([^`]+)`\s*,\s*\{[^}]*method\s*:\s*['"`](\w+)['"`]/g,
      /request\s*\(\s*`([^`]+)`\s*\)/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        let apiPath = match[1];
        let method = match[2] || 'GET';

        // 清理模板字符串中的变量 ${xxx} -> :param
        apiPath = apiPath.replace(/\$\{[^}]+\}/g, ':param');

        apiCalls.add(`${method.toUpperCase()} ${apiPath}`);
      }
    }
  }

  function walkDir(currentPath) {
    if (!fs.existsSync(currentPath)) {
      return;
    }

    const files = fs.readdirSync(currentPath);

    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        scanFile(filePath);
      }
    }
  }

  walkDir(dir);
  return Array.from(apiCalls).sort();
}

// 规范化路径用于比较
function normalizePath(path) {
  // 移除 /api/v1 前缀
  path = path.replace(/^\/api\/v1/, '');

  // 将 :id, :userId 等参数统一为 :param
  path = path.replace(/:[a-zA-Z_]+/g, ':param');

  // 将 ${xxx} 统一为 :param
  path = path.replace(/\$\{[^}]+\}/g, ':param');

  return path;
}

// 主函数
function main() {
  console.log('🔍 扫描前后端API对齐情况...\n');

  const backendDir = path.join(__dirname, 'backend/src');
  const miniappDir = path.join(__dirname, 'miniapp/src');
  const companyMiniappDir = path.join(__dirname, 'company-miniapp/src');

  console.log('📡 扫描后端路由...');
  const backendRoutes = scanBackendRoutes(backendDir);
  console.log(`   找到 ${backendRoutes.length} 个后端路由\n`);

  console.log('📱 扫描学生端API调用...');
  const studentAPICalls = scanFrontendAPICalls(miniappDir);
  console.log(`   找到 ${studentAPICalls.length} 个API调用\n`);

  console.log('🏢 扫描企业端API调用...');
  const companyAPICalls = scanFrontendAPICalls(companyMiniappDir);
  console.log(`   找到 ${companyAPICalls.length} 个API调用\n`);

  // 合并前端调用
  const allFrontendCalls = new Set([...studentAPICalls, ...companyAPICalls]);

  // 创建规范化映射
  const backendMap = new Map();
  backendRoutes.forEach(route => {
    const [method, path] = route.split(' ');
    const normalizedPath = normalizePath(path);
    const key = `${method} ${normalizedPath}`;
    if (!backendMap.has(key)) {
      backendMap.set(key, []);
    }
    backendMap.get(key).push(route);
  });

  const frontendMap = new Map();
  allFrontendCalls.forEach(call => {
    const [method, path] = call.split(' ');
    const normalizedPath = normalizePath(path);
    const key = `${method} ${normalizedPath}`;
    if (!frontendMap.has(key)) {
      frontendMap.set(key, []);
    }
    frontendMap.get(key).push(call);
  });

  // 找出未匹配的API
  const unmatchedBackend = [];
  const unmatchedFrontend = [];
  const matched = [];

  backendMap.forEach((routes, key) => {
    if (frontendMap.has(key)) {
      matched.push(key);
    } else {
      unmatchedBackend.push(...routes);
    }
  });

  frontendMap.forEach((calls, key) => {
    if (!backendMap.has(key)) {
      unmatchedFrontend.push(...calls);
    }
  });

  // 输出报告
  console.log('=' .repeat(80));
  console.log('📊 对齐报告');
  console.log('='.repeat(80));
  console.log(`✅ 匹配的API: ${matched.length}`);
  console.log(`⚠️  后端有但前端未调用: ${unmatchedBackend.length}`);
  console.log(`❌ 前端调用但后端未实现: ${unmatchedFrontend.length}`);
  console.log('');

  if (unmatchedBackend.length > 0) {
    console.log('⚠️  后端有但前端未调用的API (可能是废弃的或待实现的):');
    console.log('-'.repeat(80));
    unmatchedBackend.slice(0, 50).forEach(route => {
      console.log(`   ${route}`);
    });
    if (unmatchedBackend.length > 50) {
      console.log(`   ... 还有 ${unmatchedBackend.length - 50} 个未显示`);
    }
    console.log('');
  }

  if (unmatchedFrontend.length > 0) {
    console.log('❌ 前端调用但后端未实现的API (需要实现):');
    console.log('-'.repeat(80));
    unmatchedFrontend.forEach(call => {
      console.log(`   ${call}`);
    });
    console.log('');
  }

  // 保存详细报告到文件
  const report = {
    summary: {
      totalBackendRoutes: backendRoutes.length,
      totalFrontendCalls: allFrontendCalls.size,
      matched: matched.length,
      unmatchedBackend: unmatchedBackend.length,
      unmatchedFrontend: unmatchedFrontend.length
    },
    matched: matched,
    unmatchedBackend: unmatchedBackend,
    unmatchedFrontend: unmatchedFrontend,
    allBackendRoutes: backendRoutes,
    allFrontendCalls: Array.from(allFrontendCalls)
  };

  fs.writeFileSync(
    path.join(__dirname, 'api-alignment-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('💾 详细报告已保存到: api-alignment-report.json');
  console.log('');

  // 计算对齐率
  const alignmentRate = matched.length / Math.max(backendRoutes.length, allFrontendCalls.size) * 100;
  console.log(`📈 API对齐率: ${alignmentRate.toFixed(1)}%`);
}

main();
