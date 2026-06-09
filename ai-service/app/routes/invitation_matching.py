"""
邀请制匹配API路由
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.invitation_matching import invitation_matching_service

router = APIRouter()


class MatchStudentsRequest(BaseModel):
    task_id: str
    limit: int = 10


class MatchTasksRequest(BaseModel):
    student_id: str
    limit: int = 10


class MatchResult(BaseModel):
    matches: List[Dict[str, Any]]


@router.post("/match-students", response_model=MatchResult)
async def match_students_for_task(request: MatchStudentsRequest):
    """
    为任务匹配合适的学生

    基于能力画像、OPC标签、历史表现等多维度匹配
    """
    try:
        matches = await invitation_matching_service.match_students_for_task(
            task_id=request.task_id,
            limit=request.limit
        )
        return {"matches": matches}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")


@router.post("/match-tasks", response_model=MatchResult)
async def match_tasks_for_student(request: MatchTasksRequest):
    """
    为学生匹配合适的任务

    基于学生能力和成长需求推荐任务
    """
    try:
        matches = await invitation_matching_service.match_tasks_for_student(
            student_id=request.student_id,
            limit=request.limit
        )
        return {"matches": matches}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")
