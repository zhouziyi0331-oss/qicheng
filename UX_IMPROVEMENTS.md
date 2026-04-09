# 用户体验改进功能清单

## 已完成功能（2024年最新补充）

### 1. 草稿箱系统 ✅
**文件：**
- `backend/src/routes/tasks/draftController.ts` - 草稿箱控制器
- `backend/src/routes/tasks/draftRoutes.ts` - 草稿箱路由
- `backend/scripts/db/013_ux_improvements.sql` - 数据库表

**功能点：**
- ✅ 任务发布草稿自动保存（企业端）
- ✅ 任务提交草稿自动保存（学生端）
- ✅ 草稿恢复功能
- ✅ 草稿删除功能
- ✅ 按用户和类型查询草稿

**API端点：**
- `POST /api/v1/tasks/drafts/publish` - 保存任务发布草稿
- `GET /api/v1/tasks/drafts/publish` - 获取任务发布草稿
- `POST /api/v1/tasks/drafts/submit` - 保存任务提交草稿
- `GET /api/v1/tasks/drafts/submit/:taskId` - 获取任务提交草稿
- `DELETE /api/v1/tasks/drafts/:draftId` - 删除草稿

---

### 2. 申诉/纠纷处理系统 ✅
**文件：**
- `backend/src/routes/disputes/controller.ts` - 申诉控制器
- `backend/src/routes/disputes/index.ts` - 申诉路由
- `backend/scripts/db/013_ux_improvements.sql` - 数据库表

**功能点：**
- ✅ 学生/企业发起申诉
- ✅ 申诉类型分类（不公平拒绝、支付问题、需求变更、其他）
- ✅ 证据文件上传
- ✅ 管理员处理申诉（调查中、已解决、驳回）
- ✅ 申诉状态流转
- ✅ 自动通知相关方
- ✅ 防止重复申诉

**API端点：**
- `POST /api/v1/disputes` - 创建申诉
- `GET /api/v1/disputes/my` - 获取我的申诉列表
- `GET /api/v1/disputes/:disputeId` - 获取申诉详情
- `GET /api/v1/disputes` - 获取所有申诉（管理员）
- `POST /api/v1/disputes/:disputeId/handle` - 处理申诉（管理员）

---

### 3. 任务追加需求系统 ✅
**文件：**
- `backend/src/routes/tasks/amendmentController.ts` - 追加需求控制器
- `backend/src/routes/tasks/draftRoutes.ts` - 路由集成
- `backend/scripts/db/013_ux_improvements.sql` - 数据库表

**功能点：**
- ✅ 企业追加需求（延长时间、追加需求、增加预算）
- ✅ 学生确认/拒绝追加需求
- ✅ 自动更新任务信息（接受后）
- ✅ 双向通知机制
- ✅ 追加需求历史记录
- ✅ 权限验证（只能对进行中的任务追加）

**API端点：**
- `POST /api/v1/tasks/amendments` - 创建追加需求（企业端）
- `POST /api/v1/tasks/amendments/:amendmentId/respond` - 响应追加需求（学生端）
- `GET /api/v1/tasks/amendments/pending` - 获取待处理追加需求（学生端）
- `GET /api/v1/tasks/:taskId/amendments` - 获取任务的追加需求列表

---

### 4. AI智能定价建议 ✅
**文件：**
- `backend/src/services/pricingSuggestion.ts` - 定价服务
- `backend/src/routes/pricing/index.ts` - 定价路由
- `backend/scripts/db/013_ux_improvements.sql` - 数据库表

**功能点：**
- ✅ 基于任务描述的AI定价分析（Claude Sonnet 4.6）
- ✅ 估算工时
- ✅ 建议价格区间（最低价-最高价）
- ✅ 市场行情参考（历史同类任务平均价）
- ✅ 定价理由说明
- ✅ 7天缓存机制
- ✅ 规则引擎降级方案

**API端点：**
- `POST /api/v1/pricing/pricing-suggestion` - 获取AI定价建议

**定价矩阵（规则引擎）：**
| 等级 | A赛道 | B赛道 | AB赛道 |
|------|-------|-------|--------|
| Lv.0 | ¥50   | ¥80   | ¥100   |
| Lv.1 | ¥100  | ¥150  | ¥200   |
| Lv.2 | ¥200  | ¥300  | ¥400   |
| Lv.3 | ¥400  | ¥600  | ¥800   |

---

### 5. 其他数据库表（待前端集成）

#### 5.1 任务模板表 ✅
- 企业可保存常用任务模板快速发布
- 支持公开模板（其他企业可用）
- 记录使用次数

#### 5.2 风险提示确认表 ✅
- 记录用户已阅读的风险提示
- 风险类型：首次接单、高预算任务、紧急任务、复杂任务

#### 5.3 用户反馈表 ✅
- 收集产品改进建议
- 反馈类型：问题反馈、功能建议、体验反馈
- 支持截图上传

---

## 待前端集成功能

### 高优先级
1. **表单自动保存** - 前端每30秒调用草稿保存API
2. **风险提示弹窗** - 学生首次接单时显示风险提示
3. **申诉入口** - 任务被拒后显示"申诉"按钮
4. **追加需求通知** - 学生收到追加需求时弹窗提醒
5. **AI定价建议** - 企业发布任务时自动显示定价建议

### 中优先级
6. **任务模板管理** - 企业端任务模板保存和使用
7. **申诉进度查询** - 学生/企业查看申诉处理进度
8. **草稿恢复提示** - 用户重新打开表单时提示恢复草稿
9. **追加需求历史** - 任务详情页显示所有追加需求记录

### 低优先级
10. **用户反馈入口** - 全局反馈按钮
11. **定价建议缓存** - 前端缓存相似任务的定价建议

---

## 技术实现细节

### 草稿自动保存机制
```typescript
// 前端实现示例
useEffect(() => {
  const timer = setInterval(() => {
    if (formData.title || formData.description) {
      saveDraft(formData); // 调用API保存草稿
    }
  }, 30000); // 每30秒保存一次

  return () => clearInterval(timer);
}, [formData]);
```

### 风险提示逻辑
```typescript
// 学生首次接单时检查
const checkRiskAcknowledgment = async (userId: string, taskId: string) => {
  const hasAcknowledged = await query(
    'SELECT id FROM risk_acknowledgments WHERE user_id = $1 AND risk_type = $2',
    [userId, 'first_task']
  );
  
  if (hasAcknowledged.rows.length === 0) {
    // 显示风险提示弹窗
    return { showRiskDialog: true };
  }
};
```

### AI定价建议调用
```typescript
// 企业发布任务时自动获取定价建议
const handleGetPricingSuggestion = async () => {
  const response = await api.post('/pricing/pricing-suggestion', {
    description: formData.description,
    level: formData.level,
    track: formData.track,
    requirements: formData.requirements
  });
  
  setPricingSuggestion(response.data);
};
```

---

## 数据库迁移

执行以下命令创建新表：
```bash
cd /Users/alwan/code/qicheng/backend
psql -U postgres -d qicheng -f scripts/db/013_ux_improvements.sql
```

---

## 总结

本次补充了4个核心用户体验功能：
1. **草稿箱系统** - 防止用户数据丢失
2. **申诉系统** - 保障用户权益
3. **追加需求系统** - 提升任务灵活性
4. **AI定价建议** - 帮助企业合理定价

所有后端API已完成，待前端集成后即可上线使用。
