"""
AI-02: 任务匹配引擎
输入: 任务描述 + 候选学生列表 (含等级/赛道/历史/情绪状态)
输出: 2-3名最匹配学生的推荐列表
匹配维度 (按优先级): 等级(硬性) > 赛道 > 历史任务类型 > 情绪状态 > 活跃度
"""
import json
import re
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from utils.claude_client import call_claude

logger = logging.getLogger(__name__)
router = APIRouter()


class TaskMatchRequest(BaseModel):
    student_id: str
    student_profile: Dict[str, Any]
    emotion_state: str  # excited/calm/frustrated/cooling
    candidate_tasks: List[Dict[str, Any]]
    max_results: int = 3


class MatchedTask(BaseModel):
    id: str
    title: str
    description: str
    budget_net: float
    level_required: int
    estimated_minutes: Optional[int] = None
    match_reason: str


class TaskMatchResult(BaseModel):
    recommended_tasks: List[MatchedTask]


@router.post("/match-task", response_model=TaskMatchResult)
async def match_task(req: TaskMatchRequest) -> TaskMatchResult:
    """AI-02: 为学生推荐最匹配的2-3个任务"""

    # 情绪状态驱动的推荐策略
    emotion_guidance = {
        "excited": "学生状态良好，可以推荐稍有挑战性的任务",
        "calm": "推荐难度适中的任务",
        "frustrated": "学生最近遇到挫折，优先推荐简单、容易成功的任务，重建信心",
        "cooling": "学生已久未活跃，推荐极简任务，降低重新开始的门槛",
    }

    prompt = f"""
为以下学生推荐最合适的任务（最多{req.max_results}个）。

## 学生信息
- 等级 A: Lv.{req.student_profile.get('level_a', 0)}
- 等级 B: Lv.{req.student_profile.get('level_b', 0)}
- OPC标签: {req.student_profile.get('opc_label', '未知')}
- 当前情绪状态: {req.emotion_state} ({emotion_guidance.get(req.emotion_state, '')})

## 候选任务列表
{json.dumps(req.candidate_tasks[:10], ensure_ascii=False, indent=2)}

## 匹配规则
1. 等级匹配是硬性条件（任务等级不得超过学生等级）
2. {emotion_guidance.get(req.emotion_state, '推荐难度适中的任务')}
3. 给出每个推荐的理由

## 输出格式 (严格JSON)
{{
  "recommended_tasks": [
    {{
      "id": "<任务ID>",
      "title": "<任务标题>",
      "description": "<任务描述>",
      "budget_net": <学生实得金额>,
      "level_required": <所需等级>,
      "estimated_minutes": <预计分钟>,
      "match_reason": "<推荐理由，20字以内，鼓励性语气>"
    }}
  ]
}}
"""

    try:
        raw = await call_claude(prompt, max_tokens=600, temperature=0.4)
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if not json_match:
            raise ValueError("No JSON")
        data = json.loads(json_match.group())
        tasks = [MatchedTask(**t) for t in data.get("recommended_tasks", [])]
        return TaskMatchResult(recommended_tasks=tasks[:req.max_results])
    except Exception as e:
        logger.error(f"AI-02 match failed: {e}")
        # 降级: 取前N个候选
        fallback = [
            MatchedTask(
                id=t["id"], title=t["title"], description=t["description"],
                budget_net=t["budget_net"], level_required=t["level_required"],
                estimated_minutes=t.get("estimated_minutes"),
                match_reason="根据你的能力等级推荐"
            )
            for t in req.candidate_tasks[:req.max_results]
        ]
        return TaskMatchResult(recommended_tasks=fallback)
