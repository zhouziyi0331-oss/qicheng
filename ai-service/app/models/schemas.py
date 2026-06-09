"""API请求和响应模型"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ============ 交付物预检 ============
class SubmissionData(BaseModel):
    """提交数据"""
    description: str = Field(..., description="学生提交的描述")
    attachments: List[str] = Field(default=[], description="附件列表")


class PreCheckRequest(BaseModel):
    """交付物预检请求"""
    task_id: str = Field(..., description="任务ID")
    student_id: str = Field(..., description="学生ID")
    submission: SubmissionData = Field(..., description="提交内容")


class IssueItem(BaseModel):
    """问题项"""
    type: str = Field(..., description="问题类型: critical/warning/info")
    description: str = Field(..., description="问题描述")
    suggestion: str = Field(..., description="改进建议")


class PreCheckResponse(BaseModel):
    """交付物预检响应"""
    pass_probability: int = Field(..., description="通过概率(0-100)")
    issues: List[IssueItem] = Field(default=[], description="问题列表")
    highlights: List[str] = Field(default=[], description="亮点列表")
    overall_feedback: str = Field(..., description="总体反馈")


# ============ 进步识别 ============
class PerformanceData(BaseModel):
    """当前表现数据"""
    rating: int = Field(..., description="评分(0-100)")
    feedback: str = Field(..., description="反馈内容")
    completion_time: int = Field(..., description="完成时间(小时)")


class ProgressRequest(BaseModel):
    """进步识别请求"""
    student_id: str = Field(..., description="学生ID")
    task_id: str = Field(..., description="任务ID")
    current_performance: PerformanceData = Field(..., description="当前表现")


class ProgressImprovement(BaseModel):
    """进步数据"""
    rating_improvement: int = Field(..., description="评分提升")
    time_improvement: int = Field(..., description="时间改进(小时)")
    stuck_points_reduced: int = Field(..., description="卡点减少数量")


class ProgressResponse(BaseModel):
    """进步识别响应"""
    feedback: str = Field(..., description="对比式反馈")
    progress: ProgressImprovement = Field(..., description="进步数据")
    has_history: bool = Field(..., description="是否有历史数据")


# ============ 向量生成 ============
class EmbeddingRequest(BaseModel):
    """向量生成请求"""
    text: str = Field(..., description="需要向量化的文本")
    type: str = Field(..., description="文本类型: task_title/task_description/student_profile")


class EmbeddingResponse(BaseModel):
    """向量生成响应"""
    embedding: List[float] = Field(..., description="向量数据")
    dimensions: int = Field(..., description="向量维度")


# ============ 语义搜索 ============
class SemanticSearchRequest(BaseModel):
    """语义搜索请求"""
    query_embedding: List[float] = Field(..., description="查询向量")
    table: str = Field(..., description="表名: tasks/users")
    embedding_field: str = Field(..., description="向量字段名")
    limit: int = Field(default=10, description="返回数量")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="过滤条件")


class SearchResult(BaseModel):
    """搜索结果项"""
    id: str = Field(..., description="记录ID")
    similarity: float = Field(..., description="相似度(0-1)")
    data: Dict[str, Any] = Field(..., description="记录数据")


class SemanticSearchResponse(BaseModel):
    """语义搜索响应"""
    results: List[SearchResult] = Field(..., description="搜索结果")


# ============ 任务拆解 ============
class TaskBreakdownRequest(BaseModel):
    """任务拆解请求"""
    task_id: str = Field(..., description="任务ID")
    student_id: str = Field(..., description="学生ID")


class TaskStep(BaseModel):
    """任务步骤"""
    step_num: int = Field(..., description="步骤编号")
    title: str = Field(..., description="步骤标题")
    description: str = Field(..., description="步骤描述")
    tools: List[str] = Field(default=[], description="推荐工具")
    warnings: List[str] = Field(default=[], description="注意事项")


class TaskBreakdownResponse(BaseModel):
    """任务拆解响应"""
    steps: List[TaskStep] = Field(..., description="任务步骤列表")


# ============ AI导师对话 ============
class ConversationMessage(BaseModel):
    """对话消息"""
    role: str = Field(..., description="角色: user/assistant")
    content: str = Field(..., description="消息内容")
    timestamp: Optional[datetime] = None


class MentorChatRequest(BaseModel):
    """AI导师对话请求"""
    student_id: str = Field(..., description="学生ID")
    task_id: str = Field(..., description="任务ID")
    message: str = Field(..., description="学生消息")
    conversation_history: List[ConversationMessage] = Field(default=[], description="对话历史")


class MentorChatResponse(BaseModel):
    """AI导师对话响应"""
    response: str = Field(..., description="导师回复")
    detected_passion_spark: bool = Field(default=False, description="是否检测到热情火花")
    detected_flow_moment: bool = Field(default=False, description="是否检测到心流时刻")


# ============ 智能匹配 ============
class MatchStudentsRequest(BaseModel):
    """智能匹配请求"""
    task_id: str = Field(..., description="任务ID")


class StudentMatch(BaseModel):
    """学生匹配结果"""
    student_id: str = Field(..., description="学生ID")
    match_score: int = Field(..., description="匹配分数(0-100)")
    match_reason: str = Field(..., description="匹配原因")


class MatchStudentsResponse(BaseModel):
    """智能匹配响应"""
    invitations: List[StudentMatch] = Field(..., description="匹配学生列表")


# ============ 能力画像更新 ============
class UpdateProfileRequest(BaseModel):
    """能力画像更新请求"""
    student_id: str = Field(..., description="学生ID")
    task_id: str = Field(..., description="任务ID")
    performance: PerformanceData = Field(..., description="表现数据")


class UpdateProfileResponse(BaseModel):
    """能力画像更新响应"""
    new_opc_label: str = Field(..., description="新的OPC标签")
    new_six_dim_scores: Dict[str, int] = Field(..., description="新的六维分数")
    changed: bool = Field(..., description="是否发生变化")
    reason: str = Field(..., description="变化原因")
