# ⚡ 跨端性能优化方案 - 完整实施计划

## 🎯 优化目标

将跨端打通功能从"数据来回链接导致卡顿"优化为"流畅实时的双向联动"。

**核心指标**:
- API响应时间: 从3-5秒 → <500ms (非AI接口)
- 首屏加载: 从5秒 → <2秒
- 用户感知等待: 从焦虑 → 期待

---

## 📊 性能瓶颈诊断

### 瓶颈1: 需求变更重新匹配 (C-01)
**问题**: 企业修改需求后，同步重算所有匹配学生的分数，耗时3-8秒

**瓶颈点**:
```typescript
// ❌ 当前实现：同步等待
for (const student of matchedStudents.rows) {
  const newScore = await this.recalculateMatchScore(...);  // 每个学生200-500ms
  // 10个学生 = 2-5秒
}
```

### 瓶颈2: 学生升级通知所有关注企业 (C-02)
**问题**: 学生升级后，查询关注企业、查询新任务、发送通知，全部同步

**瓶颈点**:
```typescript
// ❌ 当前实现：串行处理
1. 查询新匹配任务 (SQL查询 500ms)
2. 查询关注企业 (SQL查询 300ms)
3. 发送通知给每个企业 (HTTP请求 N * 200ms)
```

### 瓶颈3: 关注学生动态查询 (C-10)
**问题**: 企业端查询关注学生列表，需要联表查询最新作品、评分等

**瓶颈点**:
```sql
-- ❌ 当前实现：复杂联表查询
SELECT * FROM company_followed_students_updates
-- 涉及3个JOIN + 子查询，10个关注学生需要1-2秒
```

---

## 🚀 Phase 1: 异步化 + 队列处理

### 1.1 引入Bull队列系统

**安装依赖**:
```bash
npm install bull @types/bull redis ioredis
```

**队列配置**:
```typescript
// backend/src/config/queue.ts
import Bull from 'bull';
import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

// 创建队列
export const matchingQueue = new Bull('matching', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const notificationQueue = new Bull('notification', {
  redis: redisConfig,
});

export const aiQueue = new Bull('ai-processing', {
  redis: redisConfig,
  limiter: {
    max: 10,  // 最多10个并发AI任务
    duration: 60000,  // 1分钟
  },
});
```

### 1.2 重构需求变更匹配为异步

**修改后的实现**:
```typescript
// services/crossPlatformService.ts
async recordRequirementChange(data: RequirementChange) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. 立即记录变更
    const changeResult = await client.query(`
      INSERT INTO task_requirement_changes (...)
      VALUES (...)
      RETURNING id
    `, [...]);
    
    // 2. 获取匹配学生列表
    const matchedStudents = await client.query(`
      SELECT student_id FROM task_student_matches
      WHERE task_id = $1 AND status = 'pending'
    `, [data.task_id]);
    
    // 3. 推送到队列，立即返回
    await matchingQueue.add('recalculate-matches', {
      change_id: changeResult.rows[0].id,
      task_id: data.task_id,
      student_ids: matchedStudents.rows.map(s => s.student_id),
      new_requirements: data.new_requirements,
    });
    
    await client.query('COMMIT');
    
    // ✅ 立即返回，不等待重算完成
    return {
      change_id: changeResult.rows[0].id,
      status: 'processing',
      affected_students_count: matchedStudents.rows.length,
      message: '需求已更新，正在重新计算匹配度...'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

**队列处理器**:
```typescript
// workers/matchingWorker.ts
import { matchingQueue } from '../config/queue';
import crossPlatformService from '../services/crossPlatformService';

// 处理匹配重算任务
matchingQueue.process('recalculate-matches', 5, async (job) => {
  const { task_id, student_ids, new_requirements } = job.data;
  
  const results = [];
  
  // 并行处理（最多5个并发）
  for (const studentId of student_ids) {
    const newScore = await crossPlatformService.recalculateMatchScore(
      studentId,
      task_id,
      new_requirements
    );
    
    results.push({ student_id: studentId, new_score: newScore });
    
    // 实时推送进度
    job.progress((results.length / student_ids.length) * 100);
  }
  
  return { completed: results.length, results };
});

// 启动worker
export function startMatchingWorker() {
  console.log('✅ Matching worker started');
  
  matchingQueue.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed:`, result);
  });
  
  matchingQueue.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err);
  });
}
```

**响应时间优化**:
- 修改前: 3-8秒（同步等待）
- 修改后: <200ms（异步返回）+ 后台处理

---

### 1.3 学生升级异步通知

**修改后的实现**:
```typescript
async handleLevelChange(studentId: string, oldLevel: number, newLevel: number) {
  // 1. 立即推送到队列
  await notificationQueue.add('student-level-changed', {
    student_id: studentId,
    old_level: oldLevel,
    new_level: newLevel,
  });
  
  // 2. 立即返回
  return {
    status: 'processing',
    message: '等级变化已记录，正在查找新任务和通知企业...'
  };
}
```

**队列处理器**:
```typescript
// workers/notificationWorker.ts
notificationQueue.process('student-level-changed', async (job) => {
  const { student_id, old_level, new_level } = job.data;
  
  // 并行查询
  const [newTasks, watchingCompanies] = await Promise.all([
    // 查询新匹配任务
    pool.query(`SELECT id, title FROM tasks WHERE...`),
    
    // 查询关注企业
    pool.query(`SELECT company_id FROM company_student_watching WHERE...`),
  ]);
  
  // 更新记录
  await pool.query(`
    UPDATE student_level_changes
    SET new_matched_tasks = $1, notified_companies = $2
    WHERE student_id = $3
  `, [
    JSON.stringify(newTasks.rows.map(t => t.id)),
    JSON.stringify(watchingCompanies.rows.map(c => c.company_id)),
    student_id
  ]);
  
  // 批量发送通知（使用WebSocket或推送服务）
  await sendNotifications(watchingCompanies.rows, {
    type: 'student_level_up',
    student_id,
    new_level,
  });
  
  return { tasks_count: newTasks.rows.length, companies_count: watchingCompanies.rows.length };
});
```

---

## 🗄️ Phase 2: 数据库优化

### 2.1 创建物化视图

**学生快照视图**:
```sql
-- backend/migrations/119_performance_optimization.sql

-- 学生能力快照（每小时刷新）
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_snapshots AS
SELECT 
  u.id AS student_id,
  u.username,
  u.avatar,
  u.student_level,
  u.capability_skills,
  u.total_tasks_completed,
  u.avg_task_rating,
  u.on_time_delivery_rate,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'task_id', t.id,
      'title', t.title,
      'rating', t.rating,
      'completed_at', t.updated_at
    ) ORDER BY t.updated_at DESC)
    FROM tasks t
    WHERE t.student_id = u.id 
      AND t.status = 'completed'
    LIMIT 3
  ) AS recent_works,
  (
    SELECT COUNT(*)
    FROM company_student_follows csf
    WHERE csf.student_id = u.id
  ) AS followers_count,
  NOW() AS refreshed_at
FROM users u
WHERE u.user_type = 'student'
  AND u.status = 'active';

-- 创建唯一索引
CREATE UNIQUE INDEX idx_mv_student_snapshots_id ON mv_student_snapshots(student_id);

-- 定时刷新（每小时）
CREATE OR REPLACE FUNCTION refresh_student_snapshots()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_student_snapshots;
END;
$$ LANGUAGE plpgsql;

-- 定时任务（使用pg_cron或外部cron）
-- SELECT cron.schedule('refresh-snapshots', '0 * * * *', 'SELECT refresh_student_snapshots()');
```

**企业关注动态视图**:
```sql
-- 企业关注的学生动态汇总
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_company_follow_updates AS
SELECT 
  csf.company_id,
  csf.student_id,
  mss.username AS student_name,
  mss.student_level,
  mss.avatar,
  mss.recent_works,
  mss.followers_count,
  csf.follow_strength,
  csf.last_interaction_at,
  (
    SELECT COUNT(*)
    FROM tasks t
    WHERE t.student_id = csf.student_id
      AND t.status = 'completed'
      AND t.created_at > COALESCE(csf.last_interaction_at, csf.created_at)
  ) AS new_tasks_count,
  mss.refreshed_at
FROM company_student_follows csf
JOIN mv_student_snapshots mss ON mss.student_id = csf.student_id;

CREATE UNIQUE INDEX idx_mv_follow_updates ON mv_company_follow_updates(company_id, student_id);
```

### 2.2 索引优化

```sql
-- 匹配查询优化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_matching 
ON tasks(status, required_level, category) 
WHERE status = 'published';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_matching
ON users(user_type, student_level, status)
WHERE user_type = 'student' AND status = 'active';

-- 关注关系查询优化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_student_interaction
ON company_student_follows(student_id, last_interaction_at DESC);

-- 任务完成时间查询优化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_completion
ON tasks(student_id, status, created_at DESC)
WHERE status = 'completed';
```

### 2.3 查询优化

**使用视图替代复杂JOIN**:
```typescript
// ❌ 修改前：复杂联表查询
async getFollowedStudentsUpdates(companyId: string) {
  const result = await pool.query(`
    SELECT * FROM company_followed_students_updates  -- 复杂视图，3个JOIN
    WHERE company_id = $1
    ORDER BY ...
  `, [companyId]);
  return result.rows;  // 耗时1-2秒
}

// ✅ 修改后：查询物化视图
async getFollowedStudentsUpdates(companyId: string) {
  const result = await pool.query(`
    SELECT * FROM mv_company_follow_updates  -- 物化视图，已预计算
    WHERE company_id = $1
    ORDER BY new_tasks_count DESC, last_interaction_at DESC
    LIMIT 20
  `, [companyId]);
  return result.rows;  // 耗时<100ms
}
```

---

## 💾 Phase 3: Redis缓存策略

### 3.1 缓存配置

```typescript
// backend/src/config/cache.ts
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// 缓存键前缀
export const CacheKeys = {
  STUDENT_PROFILE: (id: string) => `student:profile:${id}`,
  MATCHING_RESULT: (taskId: string) => `matching:result:${taskId}`,
  FOLLOW_UPDATES: (companyId: string) => `follow:updates:${companyId}`,
  RELATIONSHIP_BADGES: (companyId: string, studentId: string) => 
    `badges:${companyId}:${studentId}`,
};

// 缓存TTL（秒）
export const CacheTTL = {
  STUDENT_PROFILE: 3600,      // 1小时
  MATCHING_RESULT: 300,        // 5分钟
  FOLLOW_UPDATES: 600,         // 10分钟
  RELATIONSHIP_BADGES: 86400,  // 24小时
};
```

### 3.2 缓存应用

**关注学生动态缓存**:
```typescript
async getFollowedStudentsUpdates(companyId: string) {
  const cacheKey = CacheKeys.FOLLOW_UPDATES(companyId);
  
  // 1. 尝试从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 2. 查询数据库（物化视图）
  const result = await pool.query(`
    SELECT * FROM mv_company_follow_updates
    WHERE company_id = $1
    ORDER BY new_tasks_count DESC
    LIMIT 20
  `, [companyId]);
  
  // 3. 写入缓存
  await redis.setex(
    cacheKey,
    CacheTTL.FOLLOW_UPDATES,
    JSON.stringify(result.rows)
  );
  
  return result.rows;
}
```

**匹配结果缓存**:
```typescript
async recalculateMatchScore(studentId: string, taskId: string, requirements: any) {
  const cacheKey = `match:score:${taskId}:${studentId}`;
  
  // 检查缓存
  const cached = await redis.get(cacheKey);
  if (cached) {
    return parseFloat(cached);
  }
  
  // 计算分数（真实算法）
  const score = await this.calculateMatchScoreReal(studentId, taskId, requirements);
  
  // 缓存5分钟
  await redis.setex(cacheKey, 300, score.toString());
  
  return score;
}
```

### 3.3 缓存失效策略

```typescript
// 学生完成任务后，清除相关缓存
async invalidateCacheOnTaskComplete(studentId: string, taskId: string) {
  const pipeline = redis.pipeline();
  
  // 清除学生档案缓存
  pipeline.del(CacheKeys.STUDENT_PROFILE(studentId));
  
  // 清除所有关注该学生的企业的更新缓存
  const followers = await pool.query(`
    SELECT company_id FROM company_student_follows WHERE student_id = $1
  `, [studentId]);
  
  for (const follower of followers.rows) {
    pipeline.del(CacheKeys.FOLLOW_UPDATES(follower.company_id));
  }
  
  await pipeline.exec();
}
```

---

## 🎨 Phase 4: 前端体验优化

### 4.1 骨架屏组件

```typescript
// company-miniapp/src/components/SkeletonScreen/index.tsx
import { View } from '@tarojs/components'
import './index.scss'

interface SkeletonScreenProps {
  type: 'list' | 'card' | 'detail';
  count?: number;
}

export default function SkeletonScreen({ type, count = 3 }: SkeletonScreenProps) {
  if (type === 'list') {
    return (
      <View className='skeleton-list'>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} className='skeleton-item'>
            <View className='skeleton-avatar shimmer' />
            <View className='skeleton-content'>
              <View className='skeleton-line shimmer' />
              <View className='skeleton-line short shimmer' />
            </View>
          </View>
        ))}
      </View>
    );
  }
  
  // ... 其他类型
}
```

```scss
// SkeletonScreen/index.scss
.skeleton-item {
  display: flex;
  padding: 24px;
  background: #fff;
  margin-bottom: 16px;
  
  .skeleton-avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: #f0f0f0;
    margin-right: 20px;
  }
  
  .skeleton-line {
    height: 32px;
    background: #f0f0f0;
    border-radius: 8px;
    margin-bottom: 16px;
    
    &.short {
      width: 60%;
    }
  }
}

// 闪烁动画
@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### 4.2 进度推送组件

```typescript
// company-miniapp/src/components/ProgressIndicator/index.tsx
import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import './index.scss'

interface Stage {
  label: string;
  duration: number;  // 毫秒
}

interface ProgressIndicatorProps {
  stages: Stage[];
  onComplete?: () => void;
}

export default function ProgressIndicator({ stages, onComplete }: ProgressIndicatorProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (currentStage >= stages.length) {
      onComplete?.();
      return;
    }
    
    const stage = stages[currentStage];
    const interval = 50;  // 每50ms更新一次
    const increment = (interval / stage.duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          setCurrentStage(c => c + 1);
          return 0;
        }
        return next;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [currentStage, stages]);
  
  return (
    <View className='progress-indicator'>
      <View className='stages'>
        {stages.map((stage, i) => (
          <View
            key={i}
            className={`stage ${i === currentStage ? 'active' : i < currentStage ? 'completed' : ''}`}
          >
            <View className='stage-dot' />
            <Text className='stage-label'>{stage.label}</Text>
          </View>
        ))}
      </View>
      
      <View className='progress-bar'>
        <View 
          className='progress-fill' 
          style={{ width: `${(currentStage * 100 + progress) / stages.length}%` }}
        />
      </View>
      
      <Text className='progress-text'>
        {stages[currentStage]?.label || '完成'}
      </Text>
    </View>
  );
}
```

### 4.3 打字机效果（AI对话）

```typescript
// components/TypewriterText/index.tsx
import { Text } from '@tarojs/components'
import { useState, useEffect } from 'react'

interface TypewriterTextProps {
  text: string;
  speed?: number;  // 字符/秒
  onComplete?: () => void;
}

export default function TypewriterText({ text, speed = 30, onComplete }: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    if (index >= text.length) {
      onComplete?.();
      return;
    }
    
    const timer = setTimeout(() => {
      setDisplayText(text.slice(0, index + 1));
      setIndex(i => i + 1);
    }, 1000 / speed);
    
    return () => clearTimeout(timer);
  }, [index, text, speed]);
  
  return (
    <Text>
      {displayText}
      {index < text.length && <Text className='cursor'>|</Text>}
    </Text>
  );
}
```

---

## 📈 性能监控

### 监控指标

```typescript
// backend/src/middleware/performanceMonitor.ts
import { Request, Response, NextFunction } from 'express';

export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = `${req.method} ${req.route?.path || req.path}`;
    
    // 记录到数据库或日志
    if (duration > 1000) {
      console.warn(`⚠️  Slow API: ${route} took ${duration}ms`);
    }
    
    // 可以接入APM工具（如阿里云ARMS、Sentry）
  });
  
  next();
}
```

---

## 🎯 优化效果预期

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 需求变更响应 | 3-8秒 | <200ms | **95%↓** |
| 学生升级通知 | 2-5秒 | <300ms | **94%↓** |
| 关注列表加载 | 1-2秒 | <100ms | **95%↓** |
| 匹配分数计算 | 200-500ms/个 | <50ms/个（缓存） | **90%↓** |
| 首屏加载 | 3-5秒 | <1秒 | **80%↓** |

---

**立即开始实施Phase 1！** 🚀
