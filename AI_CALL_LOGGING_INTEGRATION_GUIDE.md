# AI调用日志集成指南

**目标**: 将AI调用日志记录集成到现有的向量生成和翻译服务中  
**工具**: `backend/src/utils/aiCallLogger.ts`  
**原则**: 最小化侵入，不影响现有功能

---

## 📋 集成清单

### 需要集成的服务

1. ✅ **向量生成服务** - `services/vectorGenerationService.ts`
   - BGE Embedding API调用
   - 引擎名称: `AI-02` (项目匹配推荐)

2. ✅ **启程老师翻译服务** - `services/qichengTeacherService.ts`
   - Claude API调用
   - 引擎名称: `qicheng-teacher`

3. ✅ **语义匹配引擎** - `services/semanticMatchingEngine.ts`
   - 不直接调用AI，使用向量生成服务的结果
   - 无需集成

---

## 🔧 集成方法

### 方法1：包装现有API调用（推荐）

在现有的API调用外层添加日志记录，不修改核心逻辑。

#### 示例：向量生成服务

```typescript
// 在 vectorGenerationService.ts 顶部添加导入
import { callEmbeddingWithLogging } from '../utils/aiCallLogger';

// 修改 generateEmbedding 方法
private async generateEmbedding(text: string, dimension: number = 1024): Promise<number[]> {
  const cacheKey = `${text.substring(0, 100)}_${dimension}`;

  if (this.embeddingCache.has(cacheKey)) {
    return this.embeddingCache.get(cacheKey)!;
  }

  const startTime = Date.now();

  try {
    // 包装API调用，自动记录日志
    const response = await callEmbeddingWithLogging(
      'AI-02',                    // 引擎名称
      EMBEDDING_MODEL,            // 模型名称
      async () => {
        return await axios.post(
          EMBEDDING_API_URL,
          {
            model: EMBEDDING_MODEL,
            input: text,
            encoding_format: 'float'
          },
          {
            headers: {
              'Authorization': `Bearer ${EMBEDDING_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
      },
      text.length,                // 文本长度（用于估算token）
      undefined,                  // userId（可选）
      undefined                   // userType（可选）
    );

    const vector = response.data.data[0].embedding;

    if (!vector || vector.length !== dimension) {
      throw new Error(`Expected ${dimension} dimensions, got ${vector?.length || 0}`);
    }

    // 缓存结果
    this.embeddingCache.set(cacheKey, vector);
    setTimeout(() => this.embeddingCache.delete(cacheKey), this.CACHE_TTL);

    return vector;
  } catch (error) {
    logger.error('Failed to generate embedding:', error);
    logger.warn('Falling back to TF-IDF method');
    return this.textToVectorFallback(text, dimension);
  }
}
```

#### 示例：启程老师翻译服务

```typescript
// 在 qichengTeacherService.ts 顶部添加导入
import { callClaudeWithLogging } from '../utils/aiCallLogger';

// 修改 breakdownFunctionalModules 方法
async breakdownFunctionalModules(taskDescription: string): Promise<FunctionalModule[]> {
  try {
    const prompt = `请将以下任务描述拆解成3-5个具体的功能模块...`;

    // 包装Claude API调用，自动记录日志
    const response = await callClaudeWithLogging(
      'qicheng-teacher',          // 引擎名称
      'claude-3-5-sonnet',        // 模型名称
      async () => {
        return await client.messages.create({
          model: 'claude-3-5-sonnet',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
      },
      undefined,                  // userId（可选）
      undefined                   // userType（可选）
    );

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse modules from Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Failed to breakdown functional modules:', error);
    throw error;
  }
}
```

---

### 方法2：手动记录日志（备选）

如果不想修改现有代码结构，可以在关键位置手动添加日志记录。

#### 示例：手动记录

```typescript
import { logAICall, calculateEmbeddingCost } from '../utils/aiCallLogger';

// 在API调用后手动记录
const startTime = Date.now();
try {
  const response = await axios.post(...);
  const durationMs = Date.now() - startTime;
  
  // 手动记录成功日志
  await logAICall({
    engineName: 'AI-02',
    modelName: EMBEDDING_MODEL,
    promptTokens: Math.ceil(text.length / 2),
    completionTokens: 0,
    totalTokens: Math.ceil(text.length / 2),
    costYuan: calculateEmbeddingCost(EMBEDDING_MODEL, Math.ceil(text.length / 2)),
    durationMs,
    status: 'success'
  });
  
  return response.data.data[0].embedding;
} catch (error) {
  const durationMs = Date.now() - startTime;
  
  // 手动记录失败日志
  await logAICall({
    engineName: 'AI-02',
    modelName: EMBEDDING_MODEL,
    durationMs,
    status: 'failed',
    errorMessage: error.message
  });
  
  throw error;
}
```

---

## 📊 验证集成效果

### 1. 触发AI调用

```bash
# 触发向量生成
curl -X POST http://localhost:3000/api/v1/tasks/:taskId/trigger-matching \
  -H "Authorization: Bearer {token}"
```

### 2. 查询AI调用日志

```sql
-- 查看最近的AI调用日志
SELECT 
  engine_name,
  model_name,
  prompt_tokens,
  completion_tokens,
  cost_yuan,
  duration_ms,
  status,
  created_at
FROM ai_call_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- 按引擎统计
SELECT 
  engine_name,
  COUNT(*) as call_count,
  SUM(prompt_tokens) as total_input_tokens,
  SUM(completion_tokens) as total_output_tokens,
  SUM(cost_yuan) as total_cost,
  AVG(duration_ms) as avg_duration_ms
FROM ai_call_logs 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY engine_name;
```

### 3. 预期结果

**向量生成调用**：
- `engine_name`: `AI-02`
- `model_name`: `BAAI/bge-large-zh-v1.5`
- `prompt_tokens`: 约为文本长度/2
- `completion_tokens`: 0
- `cost_yuan`: 约0.0007元/1K tokens
- `duration_ms`: 100-500ms

**翻译服务调用**：
- `engine_name`: `qicheng-teacher`
- `model_name`: `claude-3-5-sonnet`
- `prompt_tokens`: 500-2000
- `completion_tokens`: 500-2000
- `cost_yuan`: 约0.1-0.5元/次
- `duration_ms`: 2000-5000ms

---

## 🎯 集成优先级

### P0 - 必须集成

1. ✅ **启程老师翻译服务** - Claude API调用
   - 成本较高，需要监控
   - 调用频率：每个任务1次

2. ✅ **向量生成服务** - Embedding API调用
   - 调用频率：每个任务1次 + 每个学生1次
   - 成本较低，但调用量大

### P1 - 建议集成

3. ⚠️ **其他AI服务** - 如果有其他Claude API调用
   - 检查 `services/` 目录下的其他服务
   - 搜索 `client.messages.create` 调用

---

## 📝 集成步骤

### Step 1: 备份现有代码

```bash
cd /Users/alwan/code/qicheng/backend/src/services
cp vectorGenerationService.ts vectorGenerationService.ts.backup
cp qichengTeacherService.ts qichengTeacherService.ts.backup
```

### Step 2: 添加导入

在文件顶部添加：
```typescript
import { callEmbeddingWithLogging, callClaudeWithLogging } from '../utils/aiCallLogger';
```

### Step 3: 包装API调用

使用 `callEmbeddingWithLogging` 或 `callClaudeWithLogging` 包装现有的API调用。

### Step 4: 测试验证

1. 启动服务
2. 触发AI调用
3. 查询 `ai_call_logs` 表
4. 验证日志记录正确

### Step 5: 监控成本

```sql
-- 查看今日AI调用成本
SELECT 
  engine_name,
  COUNT(*) as call_count,
  SUM(cost_yuan) as total_cost
FROM ai_call_logs 
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY engine_name;

-- 查看本月AI调用成本
SELECT 
  engine_name,
  COUNT(*) as call_count,
  SUM(cost_yuan) as total_cost
FROM ai_call_logs 
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY engine_name;
```

---

## ⚠️ 注意事项

### 1. 性能影响

- 日志记录是异步的，不会阻塞主流程
- 如果日志记录失败，不会影响AI调用
- 建议在生产环境监控日志记录的成功率

### 2. 成本估算

- Embedding API成本较低：约¥0.0007/1K tokens
- Claude API成本较高：约¥0.02-0.1/1K tokens
- 建议设置成本告警阈值

### 3. 隐私保护

- `request_data` 和 `response_data` 字段可能包含敏感信息
- 建议在生产环境中不记录完整的请求/响应数据
- 或者在记录前脱敏处理

### 4. 数据库容量

- `ai_call_logs` 表会快速增长
- 建议定期归档或清理旧数据
- 建议保留最近30天的数据

```sql
-- 清理30天前的日志
DELETE FROM ai_call_logs 
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## 🔍 故障排查

### 问题1：日志记录失败

**症状**：AI调用成功，但 `ai_call_logs` 表无记录

**排查**：
1. 检查数据库连接
2. 检查 `ai_call_logs` 表是否存在
3. 查看应用日志中的错误信息

**解决**：
```bash
# 检查表是否存在
docker exec -i qicheng-postgres psql -U postgres -d qicheng -c "\d ai_call_logs"

# 检查应用日志
tail -f logs/app.log | grep "AI调用日志"
```

### 问题2：成本计算不准确

**症状**：`cost_yuan` 字段为0或异常

**排查**：
1. 检查 `calculateClaudeCost` 函数
2. 检查 `calculateEmbeddingCost` 函数
3. 验证token统计是否正确

**解决**：
- 更新价格配置（汇率、API价格）
- 手动验证几次调用的成本

### 问题3：性能下降

**症状**：集成日志后，API响应变慢

**排查**：
1. 检查日志记录是否阻塞主流程
2. 检查数据库写入性能
3. 检查是否有死锁

**解决**：
- 确保日志记录是异步的
- 优化数据库索引
- 考虑使用消息队列异步写入

---

## ✅ 集成检查清单

- [ ] 备份现有代码
- [ ] 添加 `aiCallLogger` 导入
- [ ] 包装向量生成API调用
- [ ] 包装翻译服务API调用
- [ ] 测试向量生成日志记录
- [ ] 测试翻译服务日志记录
- [ ] 验证token统计准确性
- [ ] 验证成本计算准确性
- [ ] 设置成本告警阈值
- [ ] 配置日志清理策略
- [ ] 更新部署文档

---

## 📚 相关文档

1. [AI调用日志工具](file:///Users/alwan/code/qicheng/backend/src/utils/aiCallLogger.ts)
2. [向量生成服务](file:///Users/alwan/code/qicheng/backend/src/services/vectorGenerationService.ts)
3. [启程老师翻译服务](file:///Users/alwan/code/qicheng/backend/src/services/qichengTeacherService.ts)
4. [验收通过报告](file:///Users/alwan/code/qicheng/SEMANTIC_MATCHING_ACCEPTANCE.md)

---

**最后更新**: 2026-05-27  
**状态**: 待集成  
**优先级**: P0
