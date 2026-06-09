"""
任务拆解API路由
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.task_breakdown import task_breakdown_service

router = APIRouter()


class TaskBreakdownRequest(BaseModel):
    task_id: str
    student_id: str


class SubTask(BaseModel):
    title: str
    description: str
    estimated_hours: float
    order: int
    key_points: List[str]


class TaskBreakdownResponse(BaseModel):
    task_id: str
    student_id: str
    subtasks: List[Dict[str, Any]]
    total_estimated_hours: float
    personalization_notes: str


@router.post("/breakdown", response_model=TaskBreakdownResponse)
async def breakdown_task(request: TaskBreakdownRequest):
    """
    智能任务拆解

    基于学生的OPC标签和能力画像，将任务拆解为个性化的子任务
    """
    try:
        result = await task_breakdown_service.breakdown_task(
            task_id=request.task_id,
            student_id=request.student_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task breakdown failed: {str(e)}")
