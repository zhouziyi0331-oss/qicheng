"""
AI-01: 测试分析引擎
输入: 25题答案 JSON + 开放题文本
输出: OPC人格标签 + 五维度评分 + 推荐赛道/等级 + 分享卡片文案
关键要求: 标签要让人觉得「说的就是我」，避免泛泛
"""
import json
import re
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from utils.claude_client import call_claude

logger = logging.getLogger(__name__)
router = APIRouter()

# OPC标签库 (与数据库 opc_label_library 同步)
OPC_LABELS = [
    "隐藏的创作型执行者", "天生的品牌叙事者", "内容感知力超强的视觉OPC",
    "把AI用到极致的内容怪", "低调的内容策划师", "会讲故事的效率型创作者",
    "工具控·解决问题专家", "低调的技术实现派", "把AI用到极致的效率怪",
    "自动化流程痴迷者", "产品感极强的工具搭建者", "Agent搭建爱好者",
    "全栈型OPC探索者", "斜杠OPC·创作+技术双修", "市场感极强的创业型思维者",
    "执行力第一名", "安静的高产出者", "反应极快的需求理解专家",
    "自学成才的AI原住民", "有商业直觉的创造者", "把第一次做好的完美主义者",
    "迭代速度极快的精益OPC", "好奇心驱动的终身学习者", "把工具用出灵魂的极客",
    "AI工具收藏家·内容变现者", "小程序微创业者", "数据驱动的分析型OPC",
]

SYSTEM_PROMPT = """你是启程平台的OPC能力分析师。
你的任务是分析用户的25题测试答案，生成准确、有个性的OPC人格标签和能力画像。

核心原则:
1. 标签必须让用户看完觉得「说的就是我」——要具体，不要泛泛
2. 避免「你很有创造力」这类空话，要具体到「你是那种把工具用到极致的人」
3. 分享卡片文案必须让人看完想截图，20字以内，第一人称，有冲击力
4. 基于答案的真实数据，不要凭空捏造特质

输出格式要求: 严格的JSON，不要任何多余内容。
"""


class TestSubmission(BaseModel):
    user_id: str
    answers: dict


class TestAnalysisResult(BaseModel):
    d1_score: int
    d2_score: int
    d3_score: int
    d4_score: int
    d5_score: int
    opc_label: str
    opc_label_secondary: Optional[str] = None
    recommended_track: str  # A/B/AB
    recommended_level: int  # 0-2
    share_card_caption: str
    share_card_data: dict
    raw_response: Optional[str] = None


@router.post("/analyze-test", response_model=TestAnalysisResult)
async def analyze_test(submission: TestSubmission) -> TestAnalysisResult:
    """AI-01: 分析25题测试结果，生成OPC人格标签"""

    # 提取开放题答案
    open_answers = {
        "q01": submission.answers.get("1", ""),
        "q07": submission.answers.get("7", ""),
        "q08": submission.answers.get("8", ""),
        "q10": submission.answers.get("10", ""),
        "q17": submission.answers.get("17", ""),
    }

    prompt = f"""
请分析以下25题测试答案，生成OPC能力画像。

## 测试答案
{json.dumps(submission.answers, ensure_ascii=False, indent=2)}

## 开放题关键答案
- Q01 (做到忘记时间的事): {open_answers['q01']}
- Q07 (比同学更好的事): {open_answers['q07']}
- Q08 (最近被夸的原因): {open_answers['q08']}
- Q10 (最有成就感的事): {open_answers['q10']}
- Q17 (愿意被付钱做的事): {open_answers['q17']}

## 可选OPC人格标签库
{json.dumps(OPC_LABELS, ensure_ascii=False)}

## 输出要求
请返回严格的JSON，格式如下:
{{
  "d1_score": <0-100, D1兴趣探索维度评分>,
  "d2_score": <0-100, D2擅长识别维度评分>,
  "d3_score": <0-100, D3专业工具维度评分>,
  "d4_score": <0-100, D4方向偏好维度评分>,
  "d5_score": <0-100, D5能力自评维度评分>,
  "opc_label": "<从标签库选最匹配的1个，或基于标签库风格创造新标签>",
  "opc_label_secondary": "<可选的第二标签，或null>",
  "recommended_track": "<'A'内容创作 / 'B'工具开发 / 'AB'双赛道>",
  "recommended_level": <0或1或2，新用户起点等级>,
  "share_card_caption": "<20字以内，第一人称，有冲击力，让人想截图的一句话>",
  "share_card_data": {{
    "label": "<同opc_label>",
    "abilities": ["<最突出的3个能力词>", "<能力词2>", "<能力词3>"],
    "description": "<一句专属描述语，40字以内，说出这个人最独特的地方>"
  }}
}}

关键: 标签和描述必须基于答案中的真实信息，不要空洞。例如用户Q01说「打游戏」但Q17说「做视频」，这个矛盾本身就是洞察。
"""

    try:
        raw = await call_claude(prompt, system=SYSTEM_PROMPT, max_tokens=1000, temperature=0.6)

        # 提取JSON
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if not json_match:
            raise ValueError("No JSON found in response")

        data = json.loads(json_match.group())

        # 校验 + 边界处理
        result = TestAnalysisResult(
            d1_score=max(0, min(100, int(data.get("d1_score", 60)))),
            d2_score=max(0, min(100, int(data.get("d2_score", 60)))),
            d3_score=max(0, min(100, int(data.get("d3_score", 50)))),
            d4_score=max(0, min(100, int(data.get("d4_score", 60)))),
            d5_score=max(0, min(100, int(data.get("d5_score", 55)))),
            opc_label=data.get("opc_label", "探索中的AI实践者"),
            opc_label_secondary=data.get("opc_label_secondary"),
            recommended_track=data.get("recommended_track", "A"),
            recommended_level=max(0, min(2, int(data.get("recommended_level", 0)))),
            share_card_caption=data.get("share_card_caption", "我的AI能力现在就值钱")[:30],
            share_card_data=data.get("share_card_data", {
                "label": data.get("opc_label", "探索中的AI实践者"),
                "abilities": ["好奇心", "执行力", "学习力"],
                "description": "正在开启AI变现之旅",
            }),
            raw_response=raw,
        )
        return result

    except Exception as e:
        logger.error(f"AI-01 analysis failed: {e}")
        # 降级返回
        return TestAnalysisResult(
            d1_score=60, d2_score=60, d3_score=50, d4_score=60, d5_score=55,
            opc_label="探索中的AI实践者",
            recommended_track="A",
            recommended_level=0,
            share_card_caption="我正在开启AI变现之旅",
            share_card_data={
                "label": "探索中的AI实践者",
                "abilities": ["好奇心", "执行力", "学习力"],
                "description": "正在开启属于自己的AI变现之旅",
            },
        )
