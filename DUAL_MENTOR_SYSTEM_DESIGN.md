# 双导师协同系统设计

## 🎭 系统定位

### 启程小猫（情感导师）🐱
**定位**: 温暖的情感支持者 + 成长陪伴者

**核心价值**:
- ✅ 情感支持和鼓励
- ✅ 生命问题探索
- ✅ 穿越感时刻记录
- ✅ 信念转变追踪
- ✅ 成长阶段引导
- ✅ 日常关心和陪伴

**适用场景**:
- 情绪低落时需要鼓励
- 探索人生方向
- 记录成长时刻
- 日常聊天和陪伴
- 建立信任关系

---

### PBL Agent（项目导师）🎓
**定位**: 苏格拉底式项目教练

**核心价值**:
- ✅ 真实项目指导
- ✅ 任务拆解引导
- ✅ 代码执行支持
- ✅ MVP方案提供
- ✅ 深度反思引导
- ✅ 成果产出管理

**适用场景**:
- 有具体工作问题要解决
- 需要做实际项目
- 想学习新技能
- 需要代码帮助
- 追求可展示成果

---

## 🤝 协同工作模式

### 模式1：情感基础 + 项目驱动

```
启程小猫（情感层）
    ↓ 建立信任、了解用户
    ↓ 发现用户兴趣和困惑
    ↓
PBL Agent（项目层）
    ↓ 将兴趣转化为项目
    ↓ 引导完成实际成果
    ↓
启程小猫（反思层）
    ↓ 情感反思和成长总结
```

### 模式2：智能切换

```
用户消息 → 智能路由
    ↓
    ├─ 情感类 → 启程小猫
    │   "我今天很沮丧"
    │   "不知道未来要做什么"
    │
    └─ 项目类 → PBL Agent
        "我想做一个XX项目"
        "这段代码怎么写"
```

### 模式3：协同对话

```
用户: "我想学AI，但不知道从哪开始"
    ↓
启程小猫: "很棒的想法！是什么让你对AI感兴趣的？"
    ↓
用户: "我想用AI帮我自动化工作"
    ↓
PBL Agent: "具体是什么工作？我们可以一起做个项目"
    ↓
[项目进行中...]
    ↓
启程小猫: "看到你完成了第一个AI项目，感觉怎么样？"
```

---

## 🏗️ 技术实现

### 1. 数据库扩展

```sql
-- 导师模式表
CREATE TABLE mentor_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- 当前模式
  current_mode TEXT NOT NULL DEFAULT 'emotional',  -- emotional, project, hybrid
  
  -- 模式偏好
  preferred_mode TEXT,
  auto_switch BOOLEAN DEFAULT TRUE,  -- 是否自动切换
  
  -- 使用统计
  emotional_sessions INTEGER DEFAULT 0,
  project_sessions INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 导师协同记录
CREATE TABLE mentor_collaboration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- 协同类型
  collaboration_type TEXT NOT NULL,  -- handoff, parallel, integrated
  
  -- 参与导师
  from_mentor TEXT,  -- emotional, project
  to_mentor TEXT,
  
  -- 上下文
  context JSONB,
  reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 情感-项目关联表
CREATE TABLE emotional_project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- 情感记录
  emotional_moment_id UUID,  -- 关联到生命问题、穿越感时刻等
  emotional_state TEXT,
  
  -- 项目记录
  pbl_project_id UUID REFERENCES pbl_projects(id),
  
  -- 关联说明
  link_reason TEXT,  -- "从困惑到项目", "从兴趣到实践"等
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. 智能路由服务

```typescript
// mentorRouterService.ts
export class MentorRouterService {
  // 分析消息类型
  async analyzeMessageType(message: string, context: any) {
    const emotionalKeywords = [
      '感觉', '情绪', '困惑', '迷茫', '开心', '难过',
      '不知道', '未来', '方向', '意义', '价值'
    ];
    
    const projectKeywords = [
      '项目', '做', '实现', '代码', '怎么', '如何',
      '学习', '技能', '工具', '方案', '问题'
    ];
    
    const emotionalScore = this.calculateScore(message, emotionalKeywords);
    const projectScore = this.calculateScore(message, projectKeywords);
    
    // 使用AI进一步分析
    const aiAnalysis = await this.aiAnalyze(message, context);
    
    return {
      type: aiAnalysis.primary_type,  // emotional, project, hybrid
      confidence: aiAnalysis.confidence,
      suggested_mentor: aiAnalysis.suggested_mentor,
      reason: aiAnalysis.reason
    };
  }
  
  // AI分析
  private async aiAnalyze(message: string, context: any) {
    const prompt = `分析用户消息，判断应该由哪个导师回应：

用户消息：${message}

上下文：
- 最近对话：${context.recent_messages}
- 当前情绪状态：${context.emotional_state}
- 是否有进行中的项目：${context.has_active_project}

导师类型：
1. 情感导师（启程小猫）- 情感支持、人生探索、成长陪伴
2. 项目导师（PBL Agent）- 项目指导、技能学习、实践引导

请以JSON格式返回：
{
  "primary_type": "emotional" | "project" | "hybrid",
  "confidence": 0.8,
  "suggested_mentor": "emotional" | "project" | "both",
  "reason": "判断理由"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const content = message.content[0];
    return content.type === 'text' ? JSON.parse(content.text) : null;
  }
  
  // 路由到合适的导师
  async routeToMentor(userId: string, message: string) {
    const context = await this.getUserContext(userId);
    const analysis = await this.analyzeMessageType(message, context);
    
    // 记录路由决策
    await this.logRouting(userId, analysis);
    
    if (analysis.suggested_mentor === 'both') {
      // 协同模式
      return await this.coordinatedResponse(userId, message, context);
    } else if (analysis.suggested_mentor === 'emotional') {
      // 情感导师
      return await emotionalMentorService.respond(userId, message, context);
    } else {
      // 项目导师
      return await pblAgentService.conductSocraticDialogue(
        context.active_project_id,
        message,
        context
      );
    }
  }
  
  // 协同响应
  private async coordinatedResponse(userId: string, message: string, context: any) {
    // 先由情感导师建立连接
    const emotionalResponse = await emotionalMentorService.respond(
      userId,
      message,
      { ...context, mode: 'brief' }  // 简短模式
    );
    
    // 然后由项目导师提供实践方向
    const projectResponse = await pblAgentService.conductSocraticDialogue(
      context.active_project_id || 'new',
      message,
      { ...context, emotional_context: emotionalResponse }
    );
    
    // 整合响应
    return {
      type: 'coordinated',
      emotional_part: emotionalResponse,
      project_part: projectResponse,
      transition: this.generateTransition(emotionalResponse, projectResponse)
    };
  }
  
  // 生成过渡语
  private generateTransition(emotional: any, project: any) {
    return "我理解你的感受。不如我们一起做点什么，把这个想法变成现实？";
  }
}
```

### 3. 统一对话接口

```typescript
// unifiedMentorService.ts
export class UnifiedMentorService {
  async chat(userId: string, message: string, options?: any) {
    // 1. 获取用户的导师模式偏好
    const userMode = await this.getUserMentorMode(userId);
    
    // 2. 如果用户设置了固定模式，直接使用
    if (userMode.preferred_mode && !userMode.auto_switch) {
      return await this.directRoute(userId, message, userMode.preferred_mode);
    }
    
    // 3. 智能路由
    const response = await mentorRouterService.routeToMentor(userId, message);
    
    // 4. 检查是否需要切换或协同
    if (response.type === 'coordinated') {
      return this.formatCoordinatedResponse(response);
    }
    
    return response;
  }
  
  // 格式化协同响应
  private formatCoordinatedResponse(response: any) {
    return {
      content: `${response.emotional_part.content}\n\n${response.transition}\n\n${response.project_part.content}`,
      mentor_type: 'coordinated',
      emotional_mentor: response.emotional_part,
      project_mentor: response.project_part
    };
  }
  
  // 切换导师模式
  async switchMode(userId: string, mode: 'emotional' | 'project' | 'hybrid') {
    await pool.query(
      `UPDATE mentor_modes SET current_mode = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [mode, userId]
    );
    
    return {
      success: true,
      message: `已切换到${mode === 'emotional' ? '情感导师' : mode === 'project' ? '项目导师' : '协同'}模式`
    };
  }
}
```

---

## 🎨 前端设计

### 1. 导师选择界面

```typescript
// pages/mentor-select/index.tsx
export default function MentorSelectPage() {
  return (
    <View className='mentor-select-page'>
      <Text className='page-title'>选择你的导师</Text>
      
      {/* 情感导师卡片 */}
      <View className='mentor-card emotional'>
        <View className='mentor-avatar'>🐱</View>
        <Text className='mentor-name'>启程小猫</Text>
        <Text className='mentor-desc'>温暖的情感支持者</Text>
        <View className='mentor-features'>
          <Text className='feature'>💝 情感陪伴</Text>
          <Text className='feature'>🌱 成长引导</Text>
          <Text className='feature'>✨ 人生探索</Text>
        </View>
        <View className='mentor-btn' onClick={() => selectMentor('emotional')}>
          选择启程小猫
        </View>
      </View>
      
      {/* 项目导师卡片 */}
      <View className='mentor-card project'>
        <View className='mentor-avatar'>🎓</View>
        <Text className='mentor-name'>项目导师</Text>
        <Text className='mentor-desc'>苏格拉底式项目教练</Text>
        <View className='mentor-features'>
          <Text className='feature'>💼 项目指导</Text>
          <Text className='feature'>💻 代码支持</Text>
          <Text className='feature'>🏆 成果产出</Text>
        </View>
        <View className='mentor-btn' onClick={() => selectMentor('project')}>
          选择项目导师
        </View>
      </View>
      
      {/* 协同模式 */}
      <View className='mentor-card hybrid'>
        <View className='mentor-avatars'>
          <Text>🐱</Text>
          <Text className='plus'>+</Text>
          <Text>🎓</Text>
        </View>
        <Text className='mentor-name'>协同模式</Text>
        <Text className='mentor-desc'>情感支持 + 项目指导</Text>
        <View className='mentor-btn' onClick={() => selectMentor('hybrid')}>
          两个都要
        </View>
      </View>
      
      {/* 智能模式 */}
      <View className='auto-switch'>
        <Text className='switch-label'>智能切换</Text>
        <Text className='switch-desc'>根据对话内容自动选择合适的导师</Text>
        <Switch checked={autoSwitch} onChange={setAutoSwitch} />
      </View>
    </View>
  );
}
```

### 2. 统一对话界面

```typescript
// pages/mentor-chat/index.tsx
export default function MentorChatPage() {
  const [messages, setMessages] = useState([]);
  const [currentMentor, setCurrentMentor] = useState('emotional');
  
  return (
    <View className='mentor-chat-page'>
      {/* 导师指示器 */}
      <View className='mentor-indicator'>
        {currentMentor === 'emotional' && (
          <View className='mentor-badge emotional'>
            <Text className='avatar'>🐱</Text>
            <Text className='name'>启程小猫</Text>
          </View>
        )}
        {currentMentor === 'project' && (
          <View className='mentor-badge project'>
            <Text className='avatar'>🎓</Text>
            <Text className='name'>项目导师</Text>
          </View>
        )}
        {currentMentor === 'coordinated' && (
          <View className='mentor-badge coordinated'>
            <Text className='avatar'>🐱🎓</Text>
            <Text className='name'>协同模式</Text>
          </View>
        )}
      </View>
      
      {/* 消息列表 */}
      <ScrollView className='messages-list'>
        {messages.map(msg => (
          <View key={msg.id} className={`message ${msg.role}`}>
            {msg.mentor_type === 'coordinated' ? (
              // 协同消息
              <View className='coordinated-message'>
                <View className='emotional-part'>
                  <Text className='mentor-label'>🐱 启程小猫</Text>
                  <Text className='content'>{msg.emotional_content}</Text>
                </View>
                <View className='transition'>
                  <Text>{msg.transition}</Text>
                </View>
                <View className='project-part'>
                  <Text className='mentor-label'>🎓 项目导师</Text>
                  <Text className='content'>{msg.project_content}</Text>
                </View>
              </View>
            ) : (
              // 单一导师消息
              <Text className='content'>{msg.content}</Text>
            )}
          </View>
        ))}
      </ScrollView>
      
      {/* 快捷切换 */}
      <View className='quick-switch'>
        <View className='switch-btn' onClick={() => switchMentor('emotional')}>
          🐱 情感
        </View>
        <View className='switch-btn' onClick={() => switchMentor('project')}>
          🎓 项目
        </View>
      </View>
      
      {/* 输入框 */}
      <View className='input-area'>
        <Input
          placeholder={
            currentMentor === 'emotional' 
              ? '和启程小猫聊聊...' 
              : '描述你的项目问题...'
          }
          value={inputText}
          onInput={setInputText}
        />
        <View className='send-btn' onClick={sendMessage}>发送</View>
      </View>
    </View>
  );
}
```

### 3. 情感-项目关联展示

```typescript
// pages/growth-journey/index.tsx
export default function GrowthJourneyPage() {
  return (
    <View className='growth-journey-page'>
      <Text className='page-title'>我的成长旅程</Text>
      
      {/* 时间线 */}
      <View className='timeline'>
        {journeyItems.map(item => (
          <View key={item.id} className='timeline-item'>
            {/* 情感时刻 */}
            {item.type === 'emotional' && (
              <View className='emotional-moment'>
                <Text className='icon'>🐱</Text>
                <Text className='title'>{item.title}</Text>
                <Text className='desc'>{item.description}</Text>
                
                {/* 关联的项目 */}
                {item.linked_project && (
                  <View className='linked-project'>
                    <Text className='link-icon'>→</Text>
                    <Text className='project-name'>
                      转化为项目：{item.linked_project.title}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* 项目里程碑 */}
            {item.type === 'project' && (
              <View className='project-milestone'>
                <Text className='icon'>🎓</Text>
                <Text className='title'>{item.title}</Text>
                <Text className='desc'>{item.description}</Text>
                
                {/* 情感反思 */}
                {item.reflection && (
                  <View className='reflection'>
                    <Text className='reflection-icon'>💭</Text>
                    <Text className='reflection-text'>{item.reflection}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
```

---

## 🔄 典型使用场景

### 场景1：从困惑到项目

```
Day 1 - 情感导师
─────────────────
用户: "我最近很迷茫，不知道该学什么"
启程小猫: "能理解你的感受。是什么让你觉得迷茫呢？"
用户: "感觉自己技能跟不上，但不知道从哪开始"
启程小猫: "你对什么领域感兴趣？或者工作中遇到什么困难？"
用户: "我想学AI，但感觉太难了"

[系统检测到可以转化为项目]

启程小猫: "AI确实是个大话题。不如我们从一个小项目开始？"
[切换到项目导师]

Day 2 - 项目导师
─────────────────
项目导师: "你想用AI解决什么具体问题？"
用户: "我想让AI帮我整理邮件"
项目导师: "很好的想法！如果只能实现一个功能，你会选什么？"
[开始项目...]

Day 7 - 协同反思
─────────────────
启程小猫: "一周过去了，完成第一个AI项目感觉怎么样？"
用户: "很有成就感！原来AI没那么难"
启程小猫: "看到你从迷茫到自信，真为你开心！"
项目导师: "下一个项目想做什么？"
```

### 场景2：情感低谷时的支持

```
用户: "今天项目失败了，很沮丧"

[系统识别为情感类]

启程小猫: "失败确实让人难受。能说说发生了什么吗？"
用户: "代码一直报错，搞了一天都没解决"
启程小猫: "听起来很frustrating。你已经很努力了。"

[系统判断需要项目导师协助]

项目导师: "我看了一下你的代码，要不要一起看看问题在哪？"
[解决技术问题...]

启程小猫: "解决了！感觉好点了吗？"
用户: "好多了，谢谢"
启程小猫: "遇到困难是成长的一部分。你做得很好！"
```

---

## 📊 数据流转

```
用户消息
    ↓
智能路由分析
    ↓
    ├─ 纯情感 → 启程小猫
    │   ↓
    │   情感支持 + 记录情感状态
    │   ↓
    │   [检测是否可转化为项目]
    │   ↓
    │   如果可以 → 建议切换到项目导师
    │
    ├─ 纯项目 → PBL Agent
    │   ↓
    │   苏格拉底式引导 + 项目推进
    │   ↓
    │   [检测情感状态]
    │   ↓
    │   如果低落 → 启程小猫介入鼓励
    │
    └─ 混合型 → 协同模式
        ↓
        启程小猫建立情感连接
        ↓
        项目导师提供实践方向
        ↓
        整合响应
```

---

## ✅ 实现优先级

### P0 - 核心功能
- ✅ 智能路由服务
- ✅ 统一对话接口
- ✅ 导师模式数据库
- ✅ 基础前端页面

### P1 - 协同功能
- ⏳ 情感-项目关联
- ⏳ 协同对话
- ⏳ 成长旅程展示

### P2 - 优化功能
- ⏳ 智能切换优化
- ⏳ 个性化推荐
- ⏳ 数据分析

---

## 🎉 总结

这个**双导师协同系统**：

✅ **保留情感支持** - 启程小猫继续提供温暖陪伴
✅ **增强项目能力** - PBL Agent提供专业指导
✅ **智能协同** - 根据需求自动切换或协同
✅ **无缝衔接** - 从情感到项目的自然过渡
✅ **完整闭环** - 情感支持 → 项目实践 → 成长反思

**两个导师，一个目标：帮助用户真正成长！** 🐱🎓
