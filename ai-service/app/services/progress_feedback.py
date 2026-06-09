"""进步识别服务"""
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.utils.claude_client import claude_client
from app.database import engine
from sqlalchemy import text

logger = logging.getLogger(__name__)


class ProgressFeedbackService:
    """进步识别服务"""
    
    async def generate_feedback(
        self,
        student_id: str,
        current_task_id: str,
        current_submission: str
    ) -> Dict[str, Any]:
        """
        生成对比式进步反馈
        
        Args:
            student_id: 学生ID
            current_task_id: 当前任务ID
            current_submission: 当前提交内容
            
        Returns:
            进步反馈
        """
        try:
            # 1. 获取学生历史任务
            history = await self._get_student_history(student_id, current_task_id)
            
            # 2. 获取当前任务信息
            current_task = await self._get_task_info(current_task_id)
            
            # 3. 使用Claude生成对比式反馈
            feedback = await self._generate_comparative_feedback(
                student_id,
                history,
                current_task,
                current_submission
            )
            
            return feedback
            
        except Exception as e:
            logger.error(f"Progress feedback error: {e}")
            raise
    
    async def _get_student_history(
        self,
        student_id: str,
        current_task_id: str
    ) -> List[Dict[str, Any]]:
        """获取学生历史任务（最近5个已完成的）"""
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT
                        t.id,
                        t.title,
                        t.description,
                        t.level,
                        t.track,
                        ts.submission_note,
                        tr.overall_rating,
                        tr.comment as feedback,
                        ta.completed_at
                    FROM task_assignments ta
                    JOIN tasks t ON ta.task_id = t.id
                    LEFT JOIN task_submissions ts ON ta.task_id = ts.task_id AND ta.student_id = ts.student_id
                    LEFT JOIN task_ratings tr ON ta.task_id = tr.task_id AND ta.student_id = tr.ratee_id
                    WHERE ta.student_id = :student_id
                    AND ta.task_id != :current_task_id
                    AND ta.status = 'completed'
                    ORDER BY ta.completed_at DESC
                    LIMIT 5
                """),
                {"student_id": student_id, "current_task_id": current_task_id}
            )

            history = []
            for row in result:
                history.append({
                    "task_id": row[0],
                    "title": row[1],
                    "description": row[2],
                    "level": row[3],
                    "primary_track": row[4],
                    "submission": row[5] or "无提交内容",
                    "rating": row[6] or 0,
                    "feedback": row[7] or "无反馈",
                    "completed_at": row[8]
                })

            return history
    
    async def _get_task_info(self, task_id: str) -> Dict[str, Any]:
        """获取任务信息"""
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT
                        t.title,
                        t.description,
                        t.acceptance_criteria,
                        t.level,
                        t.track
                    FROM tasks t
                    WHERE t.id = :task_id
                """),
                {"task_id": task_id}
            )
            row = result.fetchone()

            if not row:
                raise ValueError(f"Task {task_id} not found")

            return {
                "title": row[0],
                "description": row[1],
                "requirements": row[2],
                "level": row[3],
                "primary_track": row[4]
            }
    
    async def _generate_comparative_feedback(
        self,
        student_id: str,
        history: List[Dict[str, Any]],
        current_task: Dict[str, Any],
        current_submission: str
    ) -> Dict[str, Any]:
        """生成对比式反馈"""
        
        # 构建历史任务摘要
        history_summary = ""
        if history:
            history_summary = "## 历史任务表现\n\n"
            for i, task in enumerate(history, 1):
                completed_date = task['completed_at'].strftime('%Y-%m-%d') if task['completed_at'] else '未知'
                history_summary += f"""
### 任务{i}：{task['title']} ({completed_date})
- 难度：{task['level']} | 赛道：{task['primary_track']}
- 评分：{task['rating']}/5
- 提交内容：{task['submission'][:200]}...
- 导师反馈：{task['feedback'][:200] if task['feedback'] else '无'}...

"""
        else:
            history_summary = "## 历史任务表现\n\n这是学生的第一个任务，暂无历史数据。\n\n"
        
        prompt = f"""你是一位善于发现学生进步的AI导师。请分析学生的成长轨迹，生成鼓励性的对比式反馈。

{history_summary}

## 当前任务
标题：{current_task['title']}
描述：{current_task['description']}
难度：{current_task['level']} | 赛道：{current_task['primary_track']}

## 当前提交
{current_submission}

## 请按以下格式输出反馈：

进步亮点：
- [具体进步1]：从[之前的表现]到[现在的表现]
- [具体进步2]：从[之前的表现]到[现在的表现]
- [具体进步3]：从[之前的表现]到[现在的表现]

能力提升：
- [能力维度1]：[具体描述提升]
- [能力维度2]：[具体描述提升]

继续保持：
- [优点1]
- [优点2]

下一步建议：
- [建议1]
- [建议2]

鼓励寄语：
[一段温暖的鼓励话语，50字以内]

注意：
1. 如果是第一个任务，重点关注当前表现的亮点，给予鼓励
2. 如果有历史数据，一定要做具体的对比，不要泛泛而谈
3. 进步亮点要具体到某个技能、某个方面的改进
4. 能力维度包括：技术能力、创意思维、沟通表达、项目管理、学习能力等
5. 语气要温暖、鼓励，但不要过度夸张
"""
        
        response = await claude_client.generate_text(prompt, max_tokens=2048)
        
        # 解析响应
        return self._parse_feedback_response(response, len(history))
    
    def _parse_feedback_response(
        self,
        response: str,
        has_history: bool
    ) -> Dict[str, Any]:
        """解析反馈响应"""
        lines = response.strip().split('\n')
        
        result = {
            "progress_highlights": [],
            "skill_improvements": [],
            "keep_doing": [],
            "next_steps": [],
            "encouragement": ""
        }
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 识别章节
            if line.startswith('进步亮点：'):
                current_section = 'highlights'
            elif line.startswith('能力提升：'):
                current_section = 'skills'
            elif line.startswith('继续保持：'):
                current_section = 'keep'
            elif line.startswith('下一步建议：'):
                current_section = 'next'
            elif line.startswith('鼓励寄语：'):
                current_section = 'encouragement'
            
            # 解析内容
            elif line.startswith('- '):
                content = line[2:].strip()
                
                if current_section == 'highlights':
                    result["progress_highlights"].append(content)
                elif current_section == 'skills':
                    result["skill_improvements"].append(content)
                elif current_section == 'keep':
                    result["keep_doing"].append(content)
                elif current_section == 'next':
                    result["next_steps"].append(content)
            
            # 解析鼓励寄语
            elif current_section == 'encouragement' and line:
                result["encouragement"] += line + " "
        
        result["encouragement"] = result["encouragement"].strip()
        
        # 如果没有解析到鼓励寄语，生成默认的
        if not result["encouragement"]:
            if has_history:
                result["encouragement"] = "看到你的进步真的很开心！继续加油，你会越来越棒的！"
            else:
                result["encouragement"] = "很棒的开始！期待看到你在接下来的任务中继续成长！"
        
        return result


# 全局服务实例
progress_feedback_service = ProgressFeedbackService()
