"""
实时答疑API路由
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.qa_service import qa_service

router = APIRouter()


class QARequest(BaseModel):
    student_id: str
    task_id: str
    question: str
    context: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None


class QAResponse(BaseModel):
    guiding_questions: List[str]
    thinking_hints: str
    reminders: str
    resources: List[str]
    encouragement: str
    question_type: str
    is_stuck_point: bool
    stuck_category: Optional[str] = None


@router.post("/ask", response_model=QAResponse)
async def answer_question(request: QARequest):
    """
    实时答疑（苏格拉底式引导）

    不直接给答案，而是通过引导性问题帮助学生自己思考
    """
    try:
        result = await qa_service.answer_question(
            student_id=request.student_id,
            task_id=request.task_id,
            question=request.question,
            context=request.context,
            conversation_history=request.conversation_history
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QA service failed: {str(e)}")
