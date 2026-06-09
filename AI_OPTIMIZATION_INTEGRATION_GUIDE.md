# 启程平台 - AI性能优化集成指南

**文档日期**: 2026-05-27  
**适用版本**: P0+P1优化后  

---

## 📚 目录

1. [快速开始](#快速开始)
2. [流式输出集成](#流式输出集成)
3. [Redis缓存集成](#redis缓存集成)
4. [完整示例](#完整示例)
5. [监控和调试](#监控和调试)
6. [常见问题](#常见问题)

---

## 快速开始

### 环境检查

```bash
# 1. 检查Node.js版本
node --version  # 应该 >= 16.0.0

# 2. 检查Redis
redis-cli ping  # 应返回 PONG

# 3. 检查环境变量
echo $REDIS_URL  # 应该有值，如 redis://localhost:6379
echo $ANTHROPIC_API_KEY  # 应该有值
```

### 安装依赖

```bash
# 如果有新增依赖
npm install ioredis
```

---

## 流式输出集成

### 1. 后端API实现

#### 创建流式对话路由

**文件**: `backend/src/routes/mentor/chatRoutes.ts`

```typescript
import express from 'express';
import mentorCoreService from '../../services/mentorCoreService';
import websocketService from '../../services/websocketService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * 流式对话接口
 * POST /api/v1/mentor/chat-stream
 */
router.post('/chat-stream', authenticateToken, async (req, res) => {
  try {
    const { message, taskId, sessionId } = req.body;
    const studentId = req.user.id;

    // 验证参数
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空',
      });
    }

    // 使用流式方法
    const result = await mentorCoreService.chatStream(
      studentId,
      message,
      (chunk) => {
        // 实时通过WebSocket发送给前端
        websocketService.sendToUser(studentId, {
          type: 'mentor_message_chunk',
          sessionId: sessionId || 'new',
          content: chunk,
        });
      },
      taskId,
      sessionId
    );

    // 返回完整结果
    res.json({
      success: true,
      data: {
        sessionId: result.sessionId,
        fullResponse: result.fullResponse,
        tokensUsed: result.tokensUsed,
        responseTime: result.responseTime,
        detectedSignals: result.detectedSignals,
        suggestions: result.suggestions,
      },
    });
  } catch (error: any) {
    console.error('流式对话失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI服务暂时不可用',
    });
  }
});

/**
 * 普通对话接口（兼容旧版本）
 * POST /api/v1/mentor/chat
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, taskId, sessionId } = req.body;
    const studentId = req.user.id;

    // 使用普通方法
    const result = await mentorCoreService.chat(
      studentId,
      message,
      taskId,
      sessionId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('对话失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'AI服务暂时不可用',
    });
  }
});

export default router;
```

### 2. 前端集成（小程序）

#### WebSocket连接管理

**文件**: `miniapp/src/utils/websocket.ts`

```typescript
class WebSocketManager {
  private ws: any = null;
  private reconnectTimer: any = null;
  private messageHandlers: Map<string, Function[]> = new Map();

  connect(token: string) {
    const wsUrl = `ws://localhost:3000?token=${token}`;

    this.ws = wx.connectSocket({
      url: wsUrl,
      success: () => {
        console.log('WebSocket连接成功');
      },
    });

    this.ws.onOpen(() => {
      console.log('WebSocket已打开');
      this.clearReconnectTimer();
    });

    this.ws.onMessage((res: any) => {
      try {
        const data = JSON.parse(res.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    });

    this.ws.onClose(() => {
      console.log('WebSocket已关闭，尝试重连...');
      this.reconnect(token);
    });

    this.ws.onError((error: any) => {
      console.error('WebSocket错误:', error);
    });
  }

  private handleMessage(data: any) {
    const { type } = data;
    const handlers = this.messageHandlers.get(type) || [];
    handlers.forEach(handler => handler(data));
  }

  on(type: string, handler: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  off(type: string, handler: Function) {
    const handlers = this.messageHandlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  private reconnect(token: string) {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.connect(token);
    }, 3000);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  close() {
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new WebSocketManager();
```

#### 导师对话页面

**文件**: `miniapp/src/pages/mentor/chat.tsx`

```typescript
import { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import websocket from '../../utils/websocket';
import './chat.scss';

export default function MentorChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentChunk, setCurrentChunk] = useState('');
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    // 连接WebSocket
    const token = Taro.getStorageSync('token');
    websocket.connect(token);

    // 监听消息块
    const handleChunk = (data: any) => {
      setIsTyping(true);
      setCurrentChunk(prev => prev + data.content);
    };

    websocket.on('mentor_message_chunk', handleChunk);

    return () => {
      websocket.off('mentor_message_chunk', handleChunk);
    };
  }, []);

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      role: 'student',
      content: inputText,
      timestamp: new Date().toISOString(),
    };

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setCurrentChunk('');

    try {
      // 调用流式API
      const res = await Taro.request({
        url: 'http://localhost:3000/api/v1/mentor/chat-stream',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${Taro.getStorageSync('token')}`,
          'Content-Type': 'application/json',
        },
        data: {
          message: inputText,
        },
      });

      if (res.data.success) {
        // API返回完整响应后，添加到消息列表
        const mentorMessage = {
          role: 'mentor',
          content: res.data.data.fullResponse,
          timestamp: new Date().toISOString(),
          signals: res.data.data.detectedSignals,
        };

        setMessages(prev => [...prev, mentorMessage]);
        setIsTyping(false);
        setCurrentChunk('');

        // 滚动到底部
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      Taro.showToast({
        title: '发送失败，请重试',
        icon: 'none',
      });
      setIsTyping(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTop = scrollViewRef.current.scrollHeight;
    }
  };

  return (
    <View className="mentor-chat">
      <ScrollView
        ref={scrollViewRef}
        scrollY
        className="message-list"
        scrollIntoView="bottom"
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            className={`message ${msg.role === 'student' ? 'student' : 'mentor'}`}
          >
            <View className="avatar">
              {msg.role === 'student' ? '👤' : '🐱'}
            </View>
            <View className="content">
              <View className="text">{msg.content}</View>
              {msg.signals && (
                <View className="signals">
                  {msg.signals.passionSpark && <View className="signal">🔥 热情火花</View>}
                  {msg.signals.flowMoment && <View className="signal">⚡ 穿越感</View>}
                  {msg.signals.stuckPoint && <View className="signal">🤔 卡点</View>}
                </View>
              )}
            </View>
          </View>
        ))}

        {/* 正在输入的消息（流式显示） */}
        {isTyping && currentChunk && (
          <View className="message mentor typing">
            <View className="avatar">🐱</View>
            <View className="content">
              <View className="text">{currentChunk}</View>
              <View className="cursor">▋</View>
            </View>
          </View>
        )}

        <View id="bottom" />
      </ScrollView>

      <View className="input-area">
        <Input
          className="input"
          value={inputText}
          onInput={(e) => setInputText(e.detail.value)}
          placeholder="和启程小猫聊聊..."
          disabled={isTyping}
        />
        <Button
          className="send-btn"
          onClick={handleSend}
          disabled={isTyping || !inputText.trim()}
        >
          {isTyping ? '发送中...' : '发送'}
        </Button>
      </View>
    </View>
  );
}
```

---

## Redis缓存集成

### 1. 在匹配服务中集成缓存

**文件**: `backend/src/services/matchingService.ts`

```typescript
import cacheService from './cacheService';
import { query } from '../utils/db';
import logger from '../utils/logger';

class MatchingService {
  /**
   * 获取学生的推荐任务（带缓存）
   */
  async getRecommendedTasks(studentId: string, limit: number = 10) {
    // 1. 先查缓存
    const cacheKey = `match:student:${studentId}:limit:${limit}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      logger.info('匹配结果缓存命中', { studentId, limit });
      return {
        tasks: cached,
        fromCache: true,
      };
    }

    // 2. 缓存未命中，计算匹配
    logger.info('匹配结果缓存未命中，开始计算', { studentId, limit });
    const startTime = Date.now();

    // 获取学生画像
    const profile = await this.getStudentProfile(studentId);

    // 获取候选任务
    const candidateTasks = await this.getCandidateTasks(studentId);

    // 计算匹配分数
    const matches = await this.calculateMatches(profile, candidateTasks);

    // 排序并取Top N
    const topMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const duration = Date.now() - startTime;
    logger.info('匹配计算完成', { studentId, duration, matchCount: topMatches.length });

    // 3. 缓存结果（6小时）
    await cacheService.set(cacheKey, topMatches, 6 * 3600);

    return {
      tasks: topMatches,
      fromCache: false,
      calculationTime: duration,
    };
  }

  /**
   * 获取学生画像（带缓存）
   */
  private async getStudentProfile(studentId: string) {
    // 1. 先查缓存
    const cached = await cacheService.getStudentProfile(studentId);
    if (cached) {
      return cached;
    }

    // 2. 缓存未命中，查询数据库
    const profile = await query(
      'SELECT * FROM student_capabilities WHERE student_id = $1',
      [studentId]
    );

    if (profile.rows.length === 0) {
      throw new Error('学生画像不存在');
    }

    // 3. 缓存结果（24小时）
    await cacheService.setStudentProfile(studentId, profile.rows[0]);

    return profile.rows[0];
  }

  /**
   * 更新学生画像（清除缓存）
   */
  async updateStudentProfile(studentId: string, data: any) {
    // 1. 更新数据库
    await query(
      `UPDATE student_capabilities 
       SET skills = $1, updated_at = NOW(), vector_updated_at = NOW()
       WHERE student_id = $2`,
      [JSON.stringify(data.skills), studentId]
    );

    // 2. 清除相关缓存
    await cacheService.invalidateStudentCache(studentId);

    // 3. 清除匹配结果缓存（因为画像变了）
    await cacheService.deletePattern(`match:student:${studentId}:*`);

    logger.info('学生画像已更新，缓存已清除', { studentId });
  }

  /**
   * 获取候选任务
   */
  private async getCandidateTasks(studentId: string) {
    // 获取学生等级
    const student = await query(
      'SELECT level FROM users WHERE id = $1',
      [studentId]
    );

    const level = student.rows[0]?.level || 0;

    // 查询适合该等级的任务
    const tasks = await query(
      `SELECT * FROM tasks 
       WHERE status = 'open' 
       AND required_level <= $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [level]
    );

    return tasks.rows;
  }

  /**
   * 计算匹配分数
   */
  private async calculateMatches(profile: any, tasks: any[]) {
    // 这里实现6维度匹配算法
    // 简化示例
    return tasks.map(task => ({
      taskId: task.id,
      title: task.title,
      score: this.calculateScore(profile, task),
      reasons: this.generateReasons(profile, task),
    }));
  }

  private calculateScore(profile: any, task: any): number {
    // 简化的匹配分数计算
    let score = 0.5; // 基础分

    // 技能匹配
    const requiredSkills = task.required_skills || [];
    const studentSkills = Object.keys(profile.skills || {});
    const matchedSkills = requiredSkills.filter((skill: string) =>
      studentSkills.includes(skill)
    );
    score += (matchedSkills.length / requiredSkills.length) * 0.3;

    // 难度匹配
    const levelDiff = Math.abs(task.required_level - profile.level);
    score += Math.max(0, 1 - levelDiff * 0.1) * 0.2;

    return Math.min(1, score);
  }

  private generateReasons(profile: any, task: any): string[] {
    const reasons = [];

    // 生成推荐理由
    if (task.required_level === profile.level) {
      reasons.push('难度适合你当前水平');
    }

    const requiredSkills = task.required_skills || [];
    const studentSkills = Object.keys(profile.skills || {});
    const matchedSkills = requiredSkills.filter((skill: string) =>
      studentSkills.includes(skill)
    );

    if (matchedSkills.length > 0) {
      reasons.push(`你的${matchedSkills.join('、')}技能很匹配`);
    }

    return reasons;
  }
}

export default new MatchingService();
```

### 2. 在API路由中使用

**文件**: `backend/src/routes/tasks/recommendedRoutes.ts`

```typescript
import express from 'express';
import matchingService from '../../services/matchingService';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

/**
 * 获取推荐任务
 * GET /api/v1/tasks/recommended
 */
router.get('/recommended', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await matchingService.getRecommendedTasks(studentId, limit);

    res.json({
      success: true,
      data: {
        tasks: result.tasks,
        fromCache: result.fromCache,
        calculationTime: result.calculationTime,
      },
    });
  } catch (error: any) {
    console.error('获取推荐任务失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取推荐任务失败',
    });
  }
});

export default router;
```

---

## 完整示例

### 端到端流程示例

```typescript
// 场景：学生完成OPC测试后，查看推荐任务

// 1. 学生提交OPC测试
POST /api/v1/profile/questionnaire
{
  "answers": {...},
  "scores": {...}
}

// 2. 后台异步生成画像（Bull队列，并发3个）
// - AI-01分析OPC结果
// - 生成学生能力向量
// - 保存到student_capabilities表
// - 缓存到Redis（24小时）

// 3. 学生点击"查看推荐任务"
GET /api/v1/tasks/recommended?limit=10

// 4. 匹配服务处理
// - 先查Redis缓存
// - 如果缓存命中：<100ms返回
// - 如果缓存未命中：
//   - 获取学生画像（从Redis或数据库）
//   - 计算匹配分数（6维度算法）
//   - 缓存结果（6小时）
//   - 返回Top 10任务

// 5. 学生查看任务详情并与导师对话
POST /api/v1/mentor/chat-stream
{
  "message": "这个任务我能做吗？",
  "taskId": "xxx"
}

// 6. 导师服务处理（流式输出）
// - 加载对话历史（智能压缩，>20条时生成摘要）
// - 调用Claude API（流式）
// - 实时通过WebSocket返回文本块
// - 1-2秒内开始显示回复
// - 4-6秒完成全部回复
```

---

## 监控和调试

### 1. 缓存统计API

**文件**: `backend/src/routes/admin/cacheRoutes.ts`

```typescript
import express from 'express';
import cacheService from '../../services/cacheService';
import { authenticateAdmin } from '../../middleware/auth';

const router = express.Router();

/**
 * 获取缓存统计
 * GET /api/v1/admin/cache/stats
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await cacheService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * 清空缓存
 * POST /api/v1/admin/cache/flush
 */
router.post('/flush', authenticateAdmin, async (req, res) => {
  try {
    await cacheService.flushAll();

    res.json({
      success: true,
      message: '缓存已清空',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

### 2. 性能监控日志

```typescript
// 在关键位置添加性能日志

// 匹配服务
logger.info('匹配计算开始', { studentId, taskCount });
const startTime = Date.now();
// ... 计算匹配
const duration = Date.now() - startTime;
logger.info('匹配计算完成', { studentId, duration, matchCount });

// 缓存服务
logger.info('缓存命中', { key, ttl });
logger.info('缓存未命中', { key });
logger.info('缓存已设置', { key, ttl, size });
```

### 3. 查询慢查询

```sql
-- 查询最慢的AI调用
SELECT 
  engine_name,
  model_name,
  latency_ms,
  input_tokens,
  output_tokens,
  created_at
FROM ai_call_logs
WHERE latency_ms > 5000  -- 超过5秒
ORDER BY latency_ms DESC
LIMIT 20;

-- 查询缓存命中率（需要在代码中记录）
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE from_cache = true) as cache_hits,
  COUNT(*) FILTER (WHERE from_cache = false) as cache_misses,
  ROUND(
    COUNT(*) FILTER (WHERE from_cache = true)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as hit_rate
FROM match_requests
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 常见问题

### Q1: Redis连接失败怎么办？

**A**: 缓存服务已实现自动降级，Redis不可用时会自动跳过缓存，不影响主流程。

```typescript
// 检查Redis状态
const stats = await cacheService.getStats();
if (!stats.enabled) {
  console.log('Redis不可用，已自动降级');
}
```

### Q2: 如何清除特定学生的缓存？

**A**: 使用 `invalidateStudentCache` 方法。

```typescript
// 清除学生的所有相关缓存
await cacheService.invalidateStudentCache(studentId);

// 或者手动清除
await cacheService.deleteStudentProfile(studentId);
await cacheService.deleteStudentMatches(studentId);
```

### Q3: 流式输出前端看不到怎么办？

**A**: 检查WebSocket连接和事件监听。

```typescript
// 1. 确认WebSocket已连接
websocket.on('open', () => {
  console.log('WebSocket已连接');
});

// 2. 确认监听了正确的事件
websocket.on('mentor_message_chunk', (data) => {
  console.log('收到消息块:', data.content);
});

// 3. 检查后端是否正确发送
websocketService.sendToUser(studentId, {
  type: 'mentor_message_chunk',
  content: chunk,
});
```

### Q4: 长对话延迟还是很高怎么办？

**A**: 检查上下文压缩是否生效。

```typescript
// 查看对话历史长度
const historyLength = conversationHistory.length;
console.log('对话历史长度:', historyLength);

// 如果超过20条，应该会生成摘要
if (historyLength > 20) {
  // 检查日志，应该有"对话摘要生成成功"
  logger.info('对话摘要生成成功', {
    originalMessages: historyLength,
    summaryLength: summary.length,
  });
}
```

### Q5: 如何调整缓存TTL？

**A**: 修改cacheService中的TTL参数。

```typescript
// 匹配结果：6小时 → 12小时
await cacheService.setStudentMatches(studentId, matches);
// 改为
await cacheService.set(`match:student:${studentId}`, matches, 12 * 3600);

// 学生画像：24小时 → 48小时
await cacheService.setStudentProfile(studentId, profile);
// 改为
await cacheService.set(`profile:${studentId}`, profile, 48 * 3600);
```

---

## 总结

本指南提供了完整的集成示例，包括：

1. ✅ 流式输出的后端和前端实现
2. ✅ Redis缓存在匹配服务中的集成
3. ✅ 完整的端到端流程示例
4. ✅ 监控和调试方法
5. ✅ 常见问题解答

按照本指南集成后，启程平台的AI性能将达到生产级别。

---

**文档版本**: v1.0  
**最后更新**: 2026-05-27
