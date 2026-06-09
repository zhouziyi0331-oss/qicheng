"""交付物预检服务"""
import logging
from typing import List, Dict, Any
from app.utils.claude_client import claude_client
from app.database import engine
from app.services.vector_service import vector_service
from sqlalchemy import text

logger = logging.getLogger(__name__)


class PreCheckService:
    """交付物预检服务"""
    
    async def check_submission(
        self,
        task_id: str,
        student_id: str,
        submission_description: str,
        attachments: List[str]
    ) -> Dict[str, Any]:
        """
        检查学生提交的交付物

        Args:
            task_id: 任务ID
            student_id: 学生ID
            submission_description: 提交描述
            attachments: 附件列表

        Returns:
            检查结果
        """
        try:
            # 1. 获取任务要求
            task_requirements = await self._get_task_requirements(task_id)

            # 2. 获取学生历史表现
            student_history = await self._get_student_history(student_id)

            # 3. 查找相似的历史卡点（向量检索）
            similar_stuck_points = await vector_service.find_similar_stuck_points(
                student_id=student_id,
                current_description=submission_description,
                limit=3
            )

            # 4. 使用Claude分析提交内容
            analysis = await self._analyze_submission(
                task_requirements,
                student_history,
                submission_description,
                attachments,
                similar_stuck_points
            )

            return analysis

        except Exception as e:
            logger.error(f"Pre-check error: {e}")
            raise
    
    async def _get_task_requirements(self, task_id: str) -> Dict[str, Any]:
        """获取任务要求"""
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT
                        t.title,
                        t.description,
                        t.acceptance_criteria,
                        t.deliverables,
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
                "deliverables": row[3],
                "level": row[4],
                "primary_track": row[5]
            }
    
    async def _get_student_history(self, student_id: str) -> Dict[str, Any]:
        """获取学生历史表现"""
        with engine.connect() as conn:
            # 查询任务完成情况
            assignment_result = conn.execute(
                text("""
                    SELECT
                        COUNT(*) as total_tasks,
                        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejection_count
                    FROM task_assignments
                    WHERE student_id = :student_id
                    AND status IN ('completed', 'rejected')
                """),
                {"student_id": student_id}
            )
            assignment_row = assignment_result.fetchone()

            # 查询平均评分
            rating_result = conn.execute(
                text("""
                    SELECT AVG(overall_rating) as avg_rating
                    FROM task_ratings
                    WHERE ratee_id = :student_id
                    AND ratee_type = 'student'
                """),
                {"student_id": student_id}
            )
            rating_row = rating_result.fetchone()

            return {
                "total_tasks": assignment_row[0] or 0,
                "avg_rating": float(rating_row[0]) if rating_row[0] else 0,
                "rejection_count": assignment_row[1] or 0
            }
    
    async def _analyze_submission(
        self,
        task_requirements: Dict[str, Any],
        student_history: Dict[str, Any],
        submission_description: str,
        attachments: List[str],
        similar_stuck_points: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """使用Claude分析提交内容"""

        # 构建历史卡点信息
        stuck_points_context = ""
        if similar_stuck_points:
            stuck_points_context = "\n## 学生历史相似卡点\n"
            for i, point in enumerate(similar_stuck_points, 1):
                stuck_points_context += f"{i}. {point['description']}\n"
                stuck_points_context += f"   解决方案：{point['solution']}\n"
                stuck_points_context += f"   相似度：{point['similarity']:.2f}\n\n"

        prompt = f"""你是一位经验丰富的项目评审专家。请分析学生的任务提交，预测通过概率并给出改进建议。

## 任务要求
标题：{task_requirements['title']}
描述：{task_requirements['description']}
要求：{task_requirements.get('requirements', '无')}
交付物：{task_requirements.get('deliverables', '无')}
难度等级：{task_requirements['level']}
赛道：{task_requirements['primary_track']}

## 学生历史表现
完成任务数：{student_history['total_tasks']}
平均评分：{student_history['avg_rating']:.1f}
被打回次数：{student_history['rejection_count']}
{stuck_points_context}
## 学生提交内容
描述：{submission_description}
附件数量：{len(attachments)}
附件列表：{', '.join(attachments) if attachments else '无'}

## 请按以下格式输出分析结果：

通过概率：[0-100的整数]

关键问题：
- [critical] 问题描述 | 改进建议
- [warning] 问题描述 | 改进建议
- [info] 问题描述 | 改进建议

亮点：
- 亮点1
- 亮点2

总体反馈：
[一段话总结]

注意：
1. 通过概率要综合考虑任务要求的完成度、质量、学生历史表现
2. critical问题会严重影响通过率，warning是需要改进的地方，info是建议
3. 亮点要具体，不要泛泛而谈
4. 总体反馈要鼓励为主，指出改进方向
5. 如果发现学生可能遇到历史相似的卡点，请在反馈中提醒并给出针对性建议
"""

        response = await claude_client.generate_text(prompt, max_tokens=2048)

        # 解析Claude的响应
        return self._parse_analysis_response(response)
    
    def _parse_analysis_response(self, response: str) -> Dict[str, Any]:
        """解析Claude的分析响应"""
        lines = response.strip().split('\n')
        
        result = {
            "pass_probability": 50,
            "issues": [],
            "highlights": [],
            "overall_feedback": ""
        }
        
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 解析通过概率
            if line.startswith('通过概率：'):
                try:
                    prob_str = line.split('：')[1].strip()
                    result["pass_probability"] = int(''.join(filter(str.isdigit, prob_str)))
                except:
                    pass
            
            # 识别章节
            elif line.startswith('关键问题：'):
                current_section = 'issues'
            elif line.startswith('亮点：'):
                current_section = 'highlights'
            elif line.startswith('总体反馈：'):
                current_section = 'feedback'
            
            # 解析内容
            elif line.startswith('- '):
                content = line[2:].strip()
                
                if current_section == 'issues':
                    # 解析问题：[type] 描述 | 建议
                    if '[critical]' in content:
                        issue_type = 'critical'
                        content = content.replace('[critical]', '').strip()
                    elif '[warning]' in content:
                        issue_type = 'warning'
                        content = content.replace('[warning]', '').strip()
                    elif '[info]' in content:
                        issue_type = 'info'
                        content = content.replace('[info]', '').strip()
                    else:
                        issue_type = 'info'
                    
                    parts = content.split('|')
                    description = parts[0].strip() if len(parts) > 0 else content
                    suggestion = parts[1].strip() if len(parts) > 1 else "请仔细检查"
                    
                    result["issues"].append({
                        "type": issue_type,
                        "description": description,
                        "suggestion": suggestion
                    })
                
                elif current_section == 'highlights':
                    result["highlights"].append(content)
            
            # 解析总体反馈
            elif current_section == 'feedback' and line:
                result["overall_feedback"] += line + " "
        
        result["overall_feedback"] = result["overall_feedback"].strip()
        
        # 如果没有解析到总体反馈，生成一个默认的
        if not result["overall_feedback"]:
            if result["pass_probability"] >= 80:
                result["overall_feedback"] = "整体完成度很好，继续保持！"
            elif result["pass_probability"] >= 60:
                result["overall_feedback"] = "基本符合要求，注意改进上述问题。"
            else:
                result["overall_feedback"] = "还需要进一步完善，请仔细查看改进建议。"
        
        return result


# 全局服务实例
pre_check_service = PreCheckService()
