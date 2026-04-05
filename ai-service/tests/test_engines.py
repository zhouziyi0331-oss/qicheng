"""
启程 AI 服务引擎测试
不依赖真实 Claude/OpenAI API — 测试路由、输入验证、禁用词过滤
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


# ============================================================
# Health
# ============================================================

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["service"] == "qicheng-ai"


# ============================================================
# AI-01: 测试分析
# ============================================================

MOCK_TEST_ANALYSIS = {
    "d1_score": 75,
    "d2_score": 68,
    "d3_score": 82,
    "d4_score": 55,
    "d5_score": 90,
    "opc_label": "把AI用到极致的内容怪",
    "opc_label_secondary": "工具控·解决问题专家",
    "recommended_track": "A",
    "recommended_level": 1,
    "share_card_caption": "我是那种把工具用到极致的人",
    "share_card_data": {"theme": "blue"},
}


@patch("engines.ai01_test_analyzer.call_claude", new_callable=AsyncMock)
def test_ai01_analyze_test(mock_claude):
    import json
    mock_claude.return_value = json.dumps(MOCK_TEST_ANALYSIS)

    payload = {
        "user_id": "test-user-001",
        "answers": {f"Q{i:02d}": "A" for i in range(1, 26)},
    }
    res = client.post("/ai/analyze-test", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["opc_label"] == "把AI用到极致的内容怪"
    assert 0 <= data["d1_score"] <= 100
    assert len(data["share_card_caption"]) <= 30  # 分享卡片 ≤30字


@patch("engines.ai01_test_analyzer.call_claude", new_callable=AsyncMock)
def test_ai01_share_card_truncation(mock_claude):
    """分享卡片文案超过30字应被截断"""
    import json
    long_caption_result = {**MOCK_TEST_ANALYSIS, "share_card_caption": "这是一段超过三十个字的分享卡片文案，用来测试截断功能是否正常工作的长文本"}
    mock_claude.return_value = json.dumps(long_caption_result)

    payload = {"user_id": "test-002", "answers": {f"Q{i:02d}": "B" for i in range(1, 26)}}
    res = client.post("/ai/analyze-test", json=payload)
    assert res.status_code == 200
    assert len(res.json()["share_card_caption"]) <= 30


# ============================================================
# AI-03: 任务拆解
# ============================================================

MOCK_STEPS = {
    "steps": [
        {"title": "打开工具", "desc": "现在做：打开 Claude，输入产品描述", "tool": "Claude AI", "est_minutes": 10},
        {"title": "生成初稿", "desc": "用 AI 生成第一版内容", "tool": "Claude AI", "est_minutes": 15},
        {"title": "校对调整", "desc": "检查内容是否符合要求", "tool": "文档工具", "est_minutes": 10},
    ]
}


@patch("engines.ai03_task_assistant.call_claude", new_callable=AsyncMock)
def test_ai03_breakdown_task(mock_claude):
    import json
    mock_claude.return_value = json.dumps(MOCK_STEPS)

    payload = {
        "task_id": "task-abc",
        "task_description": "为某品牌写一篇500字的产品介绍",
        "acceptance_criteria": "语言流畅，突出产品特点",
        "student_level": 1,
    }
    res = client.post("/ai/breakdown-task", json=payload)
    assert res.status_code == 200
    steps = res.json()["steps"]
    assert 3 <= len(steps) <= 6  # 3-6步
    # 第一步应该是能立刻开始的操作
    assert steps[0]["title"] is not None
    assert steps[0]["est_minutes"] > 0


# ============================================================
# AI-04: 交付审核 — 禁用词检测
# ============================================================

FORBIDDEN_WORDS = ["不合格", "质量差", "质量不达标", "失败", "不通过", "不达标", "很差", "太差"]


def test_ai04_forbidden_words_not_in_list():
    """禁用词列表必须包含所有 v7 规定的词"""
    from engines.ai04_delivery_reviewer import FORBIDDEN_WORDS as FW
    required = {"不合格", "质量差", "失败", "不通过", "不达标"}
    assert required.issubset(set(FW)), f"缺少禁用词: {required - set(FW)}"


@patch("engines.ai04_delivery_reviewer.call_claude", new_callable=AsyncMock)
def test_ai04_sanitize_removes_forbidden_words(mock_claude):
    """AI返回的反馈包含禁用词时，应被 sanitize 替换"""
    import json
    bad_feedback = {
        "passed": False,
        "score": 40,
        "feedback": "这个作品不合格，质量差，需要重新做。",
    }
    mock_claude.return_value = json.dumps(bad_feedback)

    payload = {
        "task_id": "task-xyz",
        "file_urls": ["https://example.com/file.pdf"],
        "acceptance_criteria": "内容完整，格式规范",
        "review_count": 0,
    }
    res = client.post("/ai/review-delivery", json=payload)
    assert res.status_code == 200
    feedback = res.json()["feedback"]
    for word in FORBIDDEN_WORDS:
        assert word not in feedback, f"反馈中含有禁用词: {word}"


@patch("engines.ai04_delivery_reviewer.call_claude", new_callable=AsyncMock)
def test_ai04_passed_delivery(mock_claude):
    """审核通过时返回 passed=True"""
    import json
    mock_claude.return_value = json.dumps({
        "passed": True,
        "score": 92,
        "feedback": "你已经做到了内容完整、格式规范，非常棒！",
    })

    payload = {
        "task_id": "task-pass",
        "file_urls": ["https://example.com/great.pdf"],
        "acceptance_criteria": "内容完整",
        "review_count": 0,
    }
    res = client.post("/ai/review-delivery", json=payload)
    assert res.status_code == 200
    assert res.json()["passed"] is True
    assert res.json()["score"] >= 80


# ============================================================
# AI-02: 任务匹配 — 情绪状态驱动
# ============================================================

MOCK_MATCH_RESULT = {
    "recommended_tasks": [
        {
            "id": "t1",
            "title": "简单图文排版",
            "description": "排版一页A4",
            "budget_net": 50.0,
            "level_required": 0,
            "estimated_minutes": 30,
            "match_reason": "适合当前状态的入门任务",
        }
    ]
}


@patch("engines.ai02_task_matcher.call_claude", new_callable=AsyncMock)
def test_ai02_match_task_frustrated_gets_easy(mock_claude):
    """frustrated 状态的学生应推荐简单任务"""
    import json
    mock_claude.return_value = json.dumps(MOCK_MATCH_RESULT)

    payload = {
        "student_id": "s1",
        "student_profile": {"level_a": 1, "level_b": 0, "opc_label": "测试标签"},
        "emotion_state": "frustrated",
        "candidate_tasks": [
            {"id": "t1", "title": "简单图文", "level_required": 0, "budget_net": 50},
            {"id": "t2", "title": "复杂项目", "level_required": 3, "budget_net": 500},
        ],
        "max_results": 2,
    }
    res = client.post("/ai/match-task", json=payload)
    assert res.status_code == 200
    tasks = res.json()["recommended_tasks"]
    assert len(tasks) >= 1
    assert tasks[0]["id"] == "t1"


# ============================================================
# Input validation
# ============================================================

def test_ai01_missing_user_id():
    """缺少 user_id 应返回 422"""
    res = client.post("/ai/analyze-test", json={"answers": {}})
    assert res.status_code == 422


def test_ai03_missing_task_description():
    """缺少 task_description 应返回 422"""
    res = client.post("/ai/breakdown-task", json={"task_id": "x", "student_level": 0})
    assert res.status_code == 422
