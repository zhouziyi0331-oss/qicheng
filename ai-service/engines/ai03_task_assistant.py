"""
AI-03: 任务辅助引擎
输入: 任务描述 + 学生等级 + 工具熟悉度
输出: 3-6个子步骤 (接单瞬间 <3s 触发)
关键要求: 第一步必须是「现在就能开始」的操作，不能是「先了解背景」
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

SYSTEM_PROMPT = """你是启程平台的任务辅助AI。
你的任务是将复杂任务拆解成具体可执行的步骤。

关键原则:
1. 第一步必须是「现在就能开始」的动作——打开某个工具，做某个具体操作
2. 绝对不能说「先了解背景」「先规划方案」「先研究一下」——这些会让用户不知道怎么开始
3. 每个步骤要告诉用户用什么工具、做什么操作、预计多少分钟
4. 格式: 「现在做：[具体操作]，用[工具]，预计[时间]，完成后点击下一步」
5. 步骤数量: 3-6步，太多会让用户觉得任务太难
"""


class TaskBreakdownRequest(BaseModel):
    task_id: str
    task_description: str
    acceptance_criteria: str
    student_level: int  # 0-5


class TaskStep(BaseModel):
    title: str
    desc: str
    tool: str
    est_minutes: int


class TaskBreakdownResult(BaseModel):
    steps: List[TaskStep]


@router.post("/breakdown-task", response_model=TaskBreakdownResult)
async def breakdown_task(req: TaskBreakdownRequest) -> TaskBreakdownResult:
    """AI-03: 拆解任务为步骤，接单后<3s推送第一步"""

    level_desc = {0: "新手(刚开始学AI)", 1: "入门(用过几次AI工具)", 2: "实践者(AI熟练用户)",
                  3: "熟练者(AI专家)", 4: "专业者", 5: "专家"}.get(req.student_level, "新手")

    prompt = f"""
请将以下任务拆解为3-6个具体可执行的步骤。

## 任务描述
{req.task_description}

## 验收标准
{req.acceptance_criteria}

## 学生水平
{level_desc} (Lv.{req.student_level})

## 输出格式 (严格JSON)
{{
  "steps": [
    {{
      "title": "<步骤标题，简短>",
      "desc": "<具体操作描述，格式: 现在做[操作]，要求[要求]>",
      "tool": "<推荐工具名，如 ChatGPT/Claude/Midjourney/剪映/Cursor/无>",
      "est_minutes": <预计分钟数，整数>
    }}
  ]
}}

重要:
- 第一步必须是可以「立刻开始」的操作，比如「打开[工具]，输入以下提示词...」
- 每步要有明确的「完成标志」，让用户知道什么时候算做完这步
- 针对Lv.{req.student_level}的水平适当调整步骤细度
"""

    try:
        raw = await call_claude(prompt, system=SYSTEM_PROMPT, max_tokens=800, temperature=0.5)
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if not json_match:
            raise ValueError("No JSON found")
        data = json.loads(json_match.group())
        steps = [TaskStep(**s) for s in data.get("steps", [])]
        return TaskBreakdownResult(steps=steps[:6] if steps else _fallback_steps(req.task_description))
    except Exception as e:
        logger.error(f"AI-03 breakdown failed: {e}")
        return TaskBreakdownResult(steps=_fallback_steps(req.task_description))


def _fallback_steps(task_desc: str) -> List[TaskStep]:
    return [
        TaskStep(title="理解任务", desc=f"阅读任务要求：{task_desc[:50]}...", tool="无", est_minutes=5),
        TaskStep(title="执行核心工作", desc="使用AI工具完成核心交付内容", tool="ChatGPT/Claude", est_minutes=20),
        TaskStep(title="检查并提交", desc="检查是否满足验收标准，满足后提交", tool="无", est_minutes=5),
    ]
