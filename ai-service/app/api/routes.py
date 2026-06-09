"""API路由"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    PreCheckRequest, PreCheckResponse,
    ProgressRequest, ProgressResponse,
    EmbeddingRequest, EmbeddingResponse
)
from app.services.pre_check import pre_check_service
from app.services.progress_feedback import progress_feedback_service
from app.services.embedding import embedding_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["AI服务"])


@router.post("/pre-check-submission", response_model=PreCheckResponse)
async def pre_check_submission(request: PreCheckRequest):
    """
    交付物预检
    
    分析学生提交的内容，预测通过概率并给出改进建议
    """
    try:
        result = await pre_check_service.check_submission(
            task_id=request.task_id,
            student_id=request.student_id,
            submission_description=request.submission.description,
            attachments=request.submission.attachments
        )
        
        return PreCheckResponse(
            pass_probability=result["pass_probability"],
            issues=result["issues"],
            highlights=result["highlights"],
            overall_feedback=result["overall_feedback"]
        )
    except Exception as e:
        logger.error(f"Pre-check API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/progress-feedback", response_model=ProgressResponse)
async def progress_feedback(request: ProgressRequest):
    """
    进步识别
    
    对比学生历史表现，生成鼓励性的进步反馈
    """
    try:
        # 构建提交内容摘要
        submission_summary = f"""
评分：{request.current_performance.rating}/100
反馈：{request.current_performance.feedback}
完成时间：{request.current_performance.completion_time}小时
"""
        
        result = await progress_feedback_service.generate_feedback(
            student_id=request.student_id,
            current_task_id=request.task_id,
            current_submission=submission_summary
        )
        
        # 构建完整的反馈文本
        feedback_text = ""
        
        if result["progress_highlights"]:
            feedback_text += "🌟 进步亮点：\n"
            for highlight in result["progress_highlights"]:
                feedback_text += f"• {highlight}\n"
            feedback_text += "\n"
        
        if result["skill_improvements"]:
            feedback_text += "📈 能力提升：\n"
            for skill in result["skill_improvements"]:
                feedback_text += f"• {skill}\n"
            feedback_text += "\n"
        
        if result["keep_doing"]:
            feedback_text += "✨ 继续保持：\n"
            for item in result["keep_doing"]:
                feedback_text += f"• {item}\n"
            feedback_text += "\n"
        
        if result["next_steps"]:
            feedback_text += "🎯 下一步建议：\n"
            for step in result["next_steps"]:
                feedback_text += f"• {step}\n"
            feedback_text += "\n"
        
        if result["encouragement"]:
            feedback_text += f"💪 {result['encouragement']}"
        
        # 计算进步数据（简化版）
        has_history = len(result.get("progress_highlights", [])) > 0
        
        return ProgressResponse(
            feedback=feedback_text.strip(),
            progress={
                "rating_improvement": 0,  # 需要从历史数据计算
                "time_improvement": 0,
                "stuck_points_reduced": 0
            },
            has_history=has_history
        )
    except Exception as e:
        logger.error(f"Progress feedback API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-embedding", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest):
    """
    生成文本向量
    
    将文本转换为1536维向量表示
    """
    try:
        embedding = await embedding_service.generate_embedding(request.text)
        
        return EmbeddingResponse(
            embedding=embedding,
            dimensions=len(embedding)
        )
    except Exception as e:
        logger.error(f"Embedding API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "ok",
        "service": "qicheng-ai-service",
        "version": "1.0.0"
    }
