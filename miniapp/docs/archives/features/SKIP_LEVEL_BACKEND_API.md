# 跳级系统后端API实现指南

## 概述
跳级系统允许Lv.3及以上学员通过完成挑战任务跳过一个级别。本文档提供完整的后端API实现规范。

## 数据库设计

### 1. skip_level_applications 表（跳级申请记录）
```sql
CREATE TABLE skip_level_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  from_level INT NOT NULL,
  target_level INT NOT NULL,
  track_name VARCHAR(50) NOT NULL,
  status ENUM('pending', 'in_progress', 'submitted', 'passed', 'failed') DEFAULT 'pending',
  task_id VARCHAR(50) UNIQUE,
  deadline DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

### 2. skip_level_tasks 表（跳级任务详情）
```sql
CREATE TABLE skip_level_tasks (
  id VARCHAR(50) PRIMARY KEY,
  application_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  requirements JSON,
  pass_score INT DEFAULT 80,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (application_id) REFERENCES skip_level_applications(id)
);
```

### 3. skip_level_progress 表（任务进度）
```sql
CREATE TABLE skip_level_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id VARCHAR(50) NOT NULL,
  sub_task_id INT NOT NULL,
  sub_task_name VARCHAR(200),
  status ENUM('done', 'active', 'locked') DEFAULT 'locked',
  progress INT DEFAULT 0,
  xp INT DEFAULT 0,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (task_id) REFERENCES skip_level_tasks(id)
);
```

### 4. skip_level_submissions 表（作品提交）
```sql
CREATE TABLE skip_level_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id VARCHAR(50) NOT NULL,
  submission_type ENUM('image', 'link') NOT NULL,
  content JSON NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES skip_level_tasks(id)
);
```

### 5. skip_level_scores 表（评分结果）
```sql
CREATE TABLE skip_level_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id VARCHAR(50) UNIQUE NOT NULL,
  total_score INT NOT NULL,
  breakdown JSON NOT NULL,
  mentor_id INT,
  mentor_comment TEXT,
  scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES skip_level_tasks(id),
  FOREIGN KEY (mentor_id) REFERENCES mentors(id)
);
```

### 6. skip_level_cooldowns 表（失败冷却期）
```sql
CREATE TABLE skip_level_cooldowns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  levels_required INT NOT NULL,
  levels_completed INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);
```

## API端点实现

### 1. GET /api/skip-level/eligibility
**功能**: 检查学员是否有跳级资格

**请求头**:
```
Authorization: Bearer {token}
```

**响应**:
```json
{
  "eligible": true,
  "currentLevel": 3,
  "currentLevelName": "探索者",
  "canSkipTo": [4, 5],
  "cooldownLevels": 0
}
```

**实现逻辑**:
```javascript
// Node.js 示例
app.get('/api/skip-level/eligibility', authenticate, async (req, res) => {
  const studentId = req.user.id;
  
  // 1. 获取学员当前级别
  const student = await db.query('SELECT level, level_name FROM students WHERE id = ?', [studentId]);
  const currentLevel = student.level;
  
  // 2. 检查是否在冷却期
  const cooldown = await db.query(
    'SELECT levels_required, levels_completed FROM skip_level_cooldowns WHERE student_id = ? AND levels_completed < levels_required',
    [studentId]
  );
  
  if (cooldown.length > 0) {
    return res.json({
      eligible: false,
      currentLevel,
      currentLevelName: student.level_name,
      reason: '需要正常升满 2 级后才能再次申请',
      cooldownLevels: cooldown[0].levels_required - cooldown[0].levels_completed
    });
  }
  
  // 3. 检查级别要求（必须 >= Lv.3）
  if (currentLevel < 3) {
    return res.json({
      eligible: false,
      currentLevel,
      currentLevelName: student.level_name,
      reason: '需要达到 Lv.3 才能申请跳级'
    });
  }
  
  // 4. 返回可跳级的目标级别
  const canSkipTo = [];
  if (currentLevel === 3) canSkipTo.push(4, 5);
  if (currentLevel === 4) canSkipTo.push(5, 6);
  if (currentLevel === 5) canSkipTo.push(6);
  
  res.json({
    eligible: true,
    currentLevel,
    currentLevelName: student.level_name,
    canSkipTo,
    cooldownLevels: 0
  });
});
```

### 2. POST /api/skip-level/apply
**功能**: 申请跳级

**请求体**:
```json
{
  "targetLevel": 4
}
```

**响应**:
```json
{
  "taskId": "skip_task_123456",
  "deadline": "2024-01-20T23:59:59.000Z"
}
```

**实现逻辑**:
```javascript
app.post('/api/skip-level/apply', authenticate, async (req, res) => {
  const studentId = req.user.id;
  const { targetLevel } = req.body;
  
  // 1. 再次验证资格
  const student = await db.query('SELECT level, track_name FROM students WHERE id = ?', [studentId]);
  
  // 2. 创建申请记录
  const taskId = `skip_task_${Date.now()}_${studentId}`;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7); // 7天期限
  
  await db.query(
    'INSERT INTO skip_level_applications (student_id, from_level, target_level, track_name, task_id, deadline) VALUES (?, ?, ?, ?, ?, ?)',
    [studentId, student.level, targetLevel, student.track_name, taskId, deadline]
  );
  
  // 3. 创建任务详情
  const taskName = `Lv.${student.level} → Lv.${targetLevel} 跳级任务`;
  const requirements = [
    { id: 1, icon: '⏰', text: '7天内完成所有任务，逾期视为失败' },
    { id: 2, icon: '📝', text: '在至少 2 个平台各发布 1 篇以上内容，共 3 篇' },
    { id: 3, icon: '📊', text: '提交数据分析报告，包含阅读量、互动率等核心指标' },
    { id: 4, icon: '👨‍🏫', text: '获得至少 1 位导师的评审确认' }
  ];
  
  const applicationId = await db.query('SELECT id FROM skip_level_applications WHERE task_id = ?', [taskId]);
  
  await db.query(
    'INSERT INTO skip_level_tasks (id, application_id, name, description, requirements) VALUES (?, ?, ?, ?, ?)',
    [taskId, applicationId[0].id, taskName, '打造一个完整的内容矩阵', JSON.stringify(requirements)]
  );
  
  // 4. 初始化子任务进度
  const subTasks = [
    { id: 1, name: 'AI 短视频脚本创作', xp: 120 },
    { id: 2, name: 'AI 视频素材生成', xp: 150 },
    { id: 3, name: '品牌宣传内容策划', xp: 200 },
    { id: 4, name: '长篇内容创作发布', xp: 180 },
    { id: 5, name: `Lv.${targetLevel} 综合测试`, xp: 350 }
  ];
  
  for (const task of subTasks) {
    await db.query(
      'INSERT INTO skip_level_progress (task_id, sub_task_id, sub_task_name, xp) VALUES (?, ?, ?, ?)',
      [taskId, task.id, task.name, task.xp]
    );
  }
  
  res.json({ taskId, deadline: deadline.toISOString() });
});
```

### 3. GET /api/skip-level/task/:taskId
**功能**: 获取任务详情

### 4. POST /api/skip-level/task/:taskId/receive
**功能**: 领取任务（开始计时）

### 5. GET /api/skip-level/progress/:taskId
**功能**: 获取任务进度

### 6. PUT /api/skip-level/progress/:taskId/subtask/:subTaskId
**功能**: 更新子任务进度

### 7. POST /api/skip-level/submit/:taskId
**功能**: 提交作品

### 8. POST /api/skip-level/score/:taskId/request
**功能**: 申请评分（通知导师）

### 9. GET /api/skip-level/score/:taskId
**功能**: 获取评分结果

### 10. POST /api/skip-level/rewards/:taskId/claim
**功能**: 领取奖励

**实现逻辑**:
```javascript
app.post('/api/skip-level/rewards/:taskId/claim', authenticate, async (req, res) => {
  const { taskId } = req.params;
  const studentId = req.user.id;
  
  // 1. 获取评分结果
  const score = await db.query('SELECT total_score FROM skip_level_scores WHERE task_id = ?', [taskId]);
  
  if (!score || score[0].total_score < 80) {
    return res.status(400).json({ error: '未通过跳级' });
  }
  
  // 2. 获取申请信息
  const application = await db.query('SELECT target_level FROM skip_level_applications WHERE task_id = ?', [taskId]);
  
  // 3. 更新学员级别
  await db.query('UPDATE students SET level = ? WHERE id = ?', [application[0].target_level, studentId]);
  
  // 4. 发放奖励
  await db.query('UPDATE students SET xp = xp + 500, balance = balance + 200 WHERE id = ?', [studentId]);
  
  // 5. 添加徽章
  await db.query('INSERT INTO badges (student_id, badge_type, badge_name) VALUES (?, ?, ?)', 
    [studentId, 'skip_level', '跳级徽章']);
  
  res.json({ success: true });
});
```

### 11. GET /api/skip-level/improvement/:taskId
**功能**: 获取改进建议（失败时）

## 业务逻辑要点

### 失败惩罚机制
```javascript
// 当评分 < 80 分时
async function handleSkipLevelFailure(studentId) {
  // 创建冷却期记录，需要升满2级
  await db.query(
    'INSERT INTO skip_level_cooldowns (student_id, levels_required, levels_completed) VALUES (?, 2, 0)',
    [studentId]
  );
}

// 监听学员升级事件
async function onStudentLevelUp(studentId) {
  // 更新冷却期进度
  await db.query(
    'UPDATE skip_level_cooldowns SET levels_completed = levels_completed + 1 WHERE student_id = ? AND levels_completed < levels_required',
    [studentId]
  );
}
```

### 任务超时检查
```javascript
// 定时任务：每小时检查一次
async function checkTaskDeadlines() {
  const expiredTasks = await db.query(
    'SELECT task_id, student_id FROM skip_level_applications WHERE status = "in_progress" AND deadline < NOW()'
  );
  
  for (const task of expiredTasks) {
    // 标记为失败
    await db.query('UPDATE skip_level_applications SET status = "failed" WHERE task_id = ?', [task.task_id]);
    
    // 触发失败惩罚
    await handleSkipLevelFailure(task.student_id);
  }
}
```

## 测试建议

1. **资格检查测试**: 测试不同级别学员的资格判断
2. **冷却期测试**: 测试失败后的冷却期机制
3. **并发测试**: 测试同一学员重复申请的处理
4. **超时测试**: 测试任务超时的自动失败机制
5. **评分测试**: 测试导师评分流程

## 部署检查清单

- [ ] 数据库表已创建
- [ ] 所有API端点已实现
- [ ] 权限验证已配置
- [ ] 定时任务已启动（检查超时）
- [ ] 错误处理已完善
- [ ] API文档已更新
- [ ] 前端已配置正确的API地址

## 前端集成示例

```typescript
// 在页面中使用API
import skipLevelService from '@/services/skipLevel'

// 检查资格
const eligibility = await skipLevelService.checkSkipLevelEligibility()

// 申请跳级
const application = await skipLevelService.applySkipLevel(4)

// 获取进度
const progress = await skipLevelService.getSkipLevelProgress(taskId)
```

完成！
