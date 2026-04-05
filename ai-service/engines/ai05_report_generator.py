"""
AI-05: 报告生成引擎
输入: 用户全量数据 (测试结果 + 任务历史 + 六维评分 + 成长时间线)
输出: 万字级OPC成长报告 (R1-R5)
关键要求: 报告不能有模板感，必须引用用户的具体任务和经历
"""
import json
import re
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from utils.claude_client import call_claude

logger = logging.getLogger(__name__)
router = APIRouter()

SYSTEM_PROMPT = """你是启程平台的OPC成长顾问，负责生成个性化成长报告。

核心要求:
1. 报告必须引用用户的具体经历和任务，不能有模板感
2. 每一段分析都要有数据支撑（任务数量、评分、成长对比）
3. R5 OPC方向报告要有天马行空的创意，但也要评估商业可行性
4. 语气: 专业但不冷漠，像一个了解你的职业导师
5. 字数: R1-R4 各约 1500-2000 字，R5 约 3000-5000 字
"""


class ReportGenerationRequest(BaseModel):
    report_id: str
    user_id: str
    report_type: str  # R1/R2/R3/R4/R5/full
    user_data: List[Dict[str, Any]]


class ReportContent(BaseModel):
    report_type: str
    title: str
    sections: List[Dict[str, Any]]
    summary: str


class ReportGenerationResult(BaseModel):
    content: Dict[str, Any]
    raw_response: str


REPORT_PROMPTS = {
    "R1": """生成「能力全景图」报告，包含:
1. 六维能力总览 (专业技能/执行力/新工具上手/需求理解/时间管理/交付水平)
2. 每个维度的详细分析 (数据支撑 + 具体案例)
3. 与同类OPC对比 (基于平台数据)
4. 能力优势描述 (最突出的2-3个维度)
5. 提升建议 (最需要改进的维度)""",

    "R2": """生成「执行力档案」报告，包含:
1. 任务完成历史分析
2. 执行模式识别 (拖延型/冲刺型/稳定型等)
3. 可靠度评级 (A/B/C/D)
4. 执行力优缺点分析
5. 改善建议""",

    "R3": """生成「学习成长曲线」报告，包含:
1. 从注册至今的成长轨迹可视化描述
2. 关键突破点标注 (第一次超过80分/第一次完成高难度任务等)
3. 技能获取速度分析
4. 成长加速期识别
5. 未来预测""",

    "R4": """生成「简历包装方案」报告，包含:
1. 将平台经历转化为标准简历语言
2. 匹配求职岗位推荐 (3-5个方向)
3. 面试话术建议 (如何描述AI技能)
4. 作品集亮点提炼
5. 差异化竞争优势""",

    "R5": """生成「OPC方向报告」，必须包含四个维度:
1. 职业倾向分析 (基于测试D4 + 任务历史，分析最适合的OPC方向)
2. 市场需求匹配 (该方向的市场空间、竞争情况、变现路径)
3. 天马行空创意建议 (3-5个创新方向，包括跨界可能性，不受常规限制)
4. 商业可行性评判 (每个方向可行性评分1-10 + 理由 + 第一步建议)
这份报告要让用户看完觉得「这就是我应该做的事」""",
}


@router.post("/generate-report", response_model=ReportGenerationResult)
async def generate_report(req: ReportGenerationRequest) -> ReportGenerationResult:
    """AI-05: 生成个性化OPC成长报告"""

    # 提取关键用户数据
    profile_data = req.user_data[0] if req.user_data else {}
    opc_label = profile_data.get("opc_label", "未知")
    task_count = profile_data.get("task_count", 0)
    six_dim = profile_data.get("six_dim_scores", {})

    report_types = ["R1", "R2", "R3", "R4", "R5"] if req.report_type == "full" else [req.report_type]
    full_content: Dict[str, Any] = {}

    for r_type in report_types:
        specific_prompt = REPORT_PROMPTS.get(r_type, "生成综合报告")
        prompt = f"""
为以下用户生成{r_type}报告。

## 用户档案
- OPC人格标签: {opc_label}
- 完成任务数: {task_count}
- 六维评分: {json.dumps(six_dim, ensure_ascii=False)}
- 原始数据: {json.dumps(profile_data, ensure_ascii=False)[:2000]}

## 报告要求
{specific_prompt}

重要: 报告内容必须引用用户的具体数据，不能有「您的XX很好」这类空话。
每一句分析都要有依据。

请直接输出报告内容（Markdown格式，不需要JSON包装）。
"""

        try:
            raw = await call_claude(
                prompt,
                system=SYSTEM_PROMPT,
                max_tokens=4000 if r_type == "R5" else 2000,
                temperature=0.7,
            )
            full_content[r_type] = {
                "type": r_type,
                "title": {
                    "R1": "能力全景图", "R2": "执行力档案", "R3": "学习成长曲线",
                    "R4": "简历包装方案", "R5": "OPC方向报告",
                }.get(r_type, r_type),
                "content": raw,
                "word_count": len(raw),
            }
        except Exception as e:
            logger.error(f"AI-05 report {r_type} failed: {e}")
            full_content[r_type] = {
                "type": r_type,
                "title": r_type,
                "content": f"报告生成失败，请联系客服。错误: {str(e)}",
                "word_count": 0,
            }

    return ReportGenerationResult(
        content=full_content,
        raw_response=json.dumps(full_content, ensure_ascii=False),
    )
