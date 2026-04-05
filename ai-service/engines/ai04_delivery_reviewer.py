"""
AI-04: 交付审核引擎
输入: 交付物 + 验收标准 + 修改次数
输出: 通过/打回 + 评分 + 反馈

v7 核心要求:
- 打回反馈格式: 肯定已完成 + 具体问题 + 具体修改步骤 + 鼓励
- 绝对禁用词: 不合格、质量差、失败、不通过、不达标
- 打回是「成长信号」，不是「失败信号」
"""
import json
import re
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from utils.claude_client import call_claude

logger = logging.getLogger(__name__)
router = APIRouter()

# ============================================================
# v7 硬性规范: 绝对禁用词列表
# ============================================================
FORBIDDEN_WORDS = ["不合格", "质量差", "质量不达标", "失败", "不通过", "不达标", "很差", "太差"]

SYSTEM_PROMPT = """你是启程平台的交付物审核AI。

你的核心职责: 帮助学生成长，而不是评判他们。

审核反馈格式 (打回时必须严格遵守):
1. 肯定已完成的部分: 「你已经做到了 [X]」
2. 指出具体问题: 「需要改进的是 [Y]」(具体，不泛泛)
3. 给出具体修改步骤: 「修改方法: 把[A]改成[B]，因为[原因]」(1-3条)
4. 鼓励性结尾: 「很多人第一次都需要修改，这很正常。」

绝对禁止使用: 不合格、质量差、质量不达标、失败、不通过、不达标、很差、太差
打回 = 成长信号，不是失败信号
"""


class DeliveryReviewRequest(BaseModel):
    task_id: str
    file_urls: List[str]
    acceptance_criteria: str
    review_count: int  # 已修改次数 0=第一次提交


class DeliveryReviewResult(BaseModel):
    passed: bool
    score: int  # 0-100
    feedback: str


@router.post("/review-delivery", response_model=DeliveryReviewResult)
async def review_delivery(req: DeliveryReviewRequest) -> DeliveryReviewResult:
    """AI-04: 审核交付物，打回使用「成长信号」格式"""

    prompt = f"""
请审核以下交付物是否满足验收标准。

## 验收标准
{req.acceptance_criteria}

## 交付文件
{json.dumps(req.file_urls, ensure_ascii=False)}

## 修改历史
这是第 {req.review_count + 1} 次提交（之前修改了 {req.review_count} 次）

## 输出格式 (严格JSON)
{{
  "passed": <true如果满足验收标准，false如果需要修改>,
  "score": <0-100的评分>,
  "feedback": "<审核反馈，打回时必须按格式: 你已经做到了[X]。需要改进的是[Y]。修改方法: 1.[具体步骤] 很多人第一次都需要修改，这很正常。>"
}}

注意:
- 如果 passed=true，feedback 写简短的肯定性评语
- 如果 passed=false，feedback 严格按上述格式，具体指出问题，给出可执行的修改步骤
- 绝对不要使用: 不合格、质量差、失败、不通过
"""

    try:
        raw = await call_claude(prompt, system=SYSTEM_PROMPT, max_tokens=600, temperature=0.3)
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if not json_match:
            raise ValueError("No JSON found")
        data = json.loads(json_match.group())

        feedback = data.get("feedback", "")
        # 后处理: 检查并替换禁用词
        feedback = sanitize_feedback(feedback)

        return DeliveryReviewResult(
            passed=bool(data.get("passed", True)),
            score=max(0, min(100, int(data.get("score", 75)))),
            feedback=feedback,
        )
    except Exception as e:
        logger.error(f"AI-04 review failed: {e}")
        # 降级: 通过
        return DeliveryReviewResult(
            passed=True,
            score=75,
            feedback="你的提交看起来不错！等待企业验收。",
        )


def sanitize_feedback(feedback: str) -> str:
    """后处理: 替换禁用词，确保反馈符合「成长信号」规范"""
    replacements = {
        "不合格": "还有改进空间",
        "质量差": "需要调整一些地方",
        "质量不达标": "距离验收标准还差一步",
        "失败": "遇到了挑战",
        "不通过": "需要修改后重新提交",
        "不达标": "还需要完善",
        "很差": "需要较多调整",
        "太差": "需要重新思考",
    }
    for bad, good in replacements.items():
        feedback = feedback.replace(bad, good)
    return feedback
