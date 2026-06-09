"""
动态能力画像更新API路由
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.services.dynamic_profile import dynamic_profile_service

router = APIRouter()


class UpdateProfileRequest(BaseModel):
    student_id: str
    task_id: str
    performance: Dict[str, Any]  # rating, completion_time, feedback, stuck_points_count, revision_count


class UpdateProfileResponse(BaseModel):
    success: bool
    old_scores: Dict[str, float]
    new_scores: Dict[str, float]
    opc_changed: bool
    report: str


@router.post("/update", response_model=UpdateProfileResponse)
async def update_profile_after_task(request: UpdateProfileRequest):
    """
    任务完成后更新学生能力画像

    根据任务表现动态调整六维能力评分
    """
    try:
        result = await dynamic_profile_service.update_profile_after_task(
            student_id=request.student_id,
            task_id=request.task_id,
            performance=request.performance
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile update failed: {str(e)}")
