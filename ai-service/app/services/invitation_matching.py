"""
邀请制匹配服务 - 基于OPC + 六维能力 + 历史表现的智能匹配
"""
import logging
from typing import List, Dict, Any
from app.utils.claude_client import claude_client
from app.database import engine
from sqlalchemy import text

logger = logging.getLogger(__name__)


class InvitationMatchingService:
    """邀请制匹配服务"""

    async def match_students_for_task(
        self,
        task_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        为任务匹配最合适的学生

        Args:
            task_id: 任务ID
            limit: 返回的学生数量（默认5个）

        Returns:
            匹配的学生列表，按匹配分数排序
        """
        try:
            # 1. 获取任务信息
            task_info = await self._get_task_info(task_id)

            # 2. 获取所有符合条件的学生
            candidates = await self._get_candidate_students(task_info)

            # 3. 计算每个学生的匹配分数
            scored_candidates = []
            for candidate in candidates:
                score = await self._calculate_match_score(task_info, candidate)
                scored_candidates.append({
                    **candidate,
                    "match_score": score['total_score'],
                    "score_breakdown": score['breakdown'],
                    "match_reason": score['reason']
                })

            # 4. 排序并返回前N个
            scored_candidates.sort(key=lambda x: x['match_score'], reverse=True)
            top_matches = scored_candidates[:limit]

            # 5. 为每个匹配生成个性化邀请理由
            for match in top_matches:
                match['invitation_message'] = await self._generate_invitation_message(
                    task_info,
                    match
                )

            return top_matches

        except Exception as e:
            logger.error(f"Matching error: {e}")
            raise

    async def _get_task_info(self, task_id: str) -> Dict[str, Any]:
        """获取任务信息"""
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT
                        t.id,
                        t.title,
                        t.description,
                        t.track,
                        t.level,
                        t.estimated_hours,
                        t.budget,
                        t.required_opc_types,
                        t.min_level
                    FROM tasks t
                    WHERE t.id = :task_id
                """),
                {"task_id": task_id}
            )
            row = result.fetchone()

            if not row:
                raise ValueError(f"Task {task_id} not found")

            return {
                "id": str(row[0]),
                "title": row[1],
                "description": row[2],
                "track": row[3],
                "level": row[4],
                "estimated_hours": row[5],
                "budget": row[6],
                "required_opc_types": row[7] if row[7] else [],
                "min_level": row[8] if row[8] else 0
            }

    async def _get_candidate_students(self, task_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """获取候选学生"""
        with engine.connect() as conn:
            # 查询符合基本条件的学生
            query = text("""
                SELECT DISTINCT
                    u.id as student_id,
                    u.username,
                    sp.primary_type as opc_type,
                    sp.secondary_type,
                    sp.o_score,
                    sp.p_score,
                    sp.c_score,
                    sa.creativity_score,
                    sa.execution_score,
                    sa.technical_score,
                    sa.communication_score,
                    sa.learning_score,
                    sa.problem_solving_score,
                    sa.current_level,
                    (SELECT COUNT(*) FROM task_assignments ta
                     WHERE ta.student_id = u.id AND ta.status = 'completed') as completed_tasks,
                    (SELECT AVG(tr.overall_rating) FROM task_ratings tr
                     WHERE tr.ratee_id = u.id AND tr.ratee_type = 'student') as avg_rating,
                    (SELECT COUNT(*) FROM task_assignments ta2
                     WHERE ta2.student_id = u.id AND ta2.status = 'in_progress') as active_tasks
                FROM users u
                INNER JOIN student_profiles sp ON u.id = sp.student_id
                LEFT JOIN student_abilities sa ON u.id = sa.student_id AND sa.track = :track
                WHERE u.role = 'student'
                    AND u.status = 'active'
                    AND (sa.current_level >= :min_level OR sa.current_level IS NULL)
                    AND (SELECT COUNT(*) FROM task_assignments ta3
                         WHERE ta3.student_id = u.id AND ta3.status = 'in_progress') < 3
            """)

            result = conn.execute(
                query,
                {
                    "track": task_info['track'],
                    "min_level": task_info.get('min_level', 0)
                }
            )

            candidates = []
            for row in result:
                candidates.append({
                    "student_id": str(row[0]),
                    "username": row[1],
                    "opc_type": row[2],
                    "secondary_type": row[3],
                    "o_score": row[4] or 0,
                    "p_score": row[5] or 0,
                    "c_score": row[6] or 0,
                    "abilities": {
                        "creativity": row[7] or 0,
                        "execution": row[8] or 0,
                        "technical": row[9] or 0,
                        "communication": row[10] or 0,
                        "learning": row[11] or 0,
                        "problem_solving": row[12] or 0
                    },
                    "current_level": row[13] or 0,
                    "completed_tasks": row[14] or 0,
                    "avg_rating": float(row[15]) if row[15] else 0,
                    "active_tasks": row[16] or 0
                })

            return candidates

    async def _calculate_match_score(
        self,
        task_info: Dict[str, Any],
        candidate: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        计算匹配分数

        评分维度：
        - OPC标签匹配（30分）
        - 六维能力匹配（40分）
        - 历史任务类型匹配（20分）
        - 成长路径匹配（10分）
        """
        breakdown = {}

        # 1. OPC标签匹配（30分）
        opc_score = self._calculate_opc_match(task_info, candidate)
        breakdown['opc_match'] = opc_score

        # 2. 六维能力匹配（40分）
        ability_score = self._calculate_ability_match(task_info, candidate)
        breakdown['ability_match'] = ability_score

        # 3. 历史任务类型匹配（20分）
        history_score = self._calculate_history_match(task_info, candidate)
        breakdown['history_match'] = history_score

        # 4. 成长路径匹配（10分）
        growth_score = self._calculate_growth_match(task_info, candidate)
        breakdown['growth_match'] = growth_score

        total_score = opc_score + ability_score + history_score + growth_score

        # 生成匹配理由
        reason = self._generate_match_reason(breakdown, task_info, candidate)

        return {
            "total_score": total_score,
            "breakdown": breakdown,
            "reason": reason
        }

    def _calculate_opc_match(self, task_info: Dict[str, Any], candidate: Dict[str, Any]) -> float:
        """计算OPC标签匹配分数（30分）"""
        required_types = task_info.get('required_opc_types', [])

        if not required_types:
            # 如果任务没有指定OPC要求，根据任务特点推断
            if task_info['track'] == 'ai_content':
                required_types = ['O', 'C']  # 内容创作偏向O和C
            else:
                required_types = ['P', 'C']  # 工具开发偏向P和C

        primary_match = 30 if candidate['opc_type'] in required_types else 0
        secondary_match = 15 if candidate.get('secondary_type') in required_types else 0

        return min(primary_match + secondary_match, 30)

    def _calculate_ability_match(self, task_info: Dict[str, Any], candidate: Dict[str, Any]) -> float:
        """计算六维能力匹配分数（40分）"""
        abilities = candidate['abilities']

        # 根据任务类型确定关键能力
        if task_info['track'] == 'ai_content':
            # 内容创作：创意>沟通>学习>执行>技术>问题解决
            weights = {
                'creativity': 0.3,
                'communication': 0.25,
                'learning': 0.2,
                'execution': 0.15,
                'technical': 0.05,
                'problem_solving': 0.05
            }
        else:
            # 工具开发：技术>问题解决>执行>学习>创意>沟通
            weights = {
                'technical': 0.3,
                'problem_solving': 0.25,
                'execution': 0.2,
                'learning': 0.15,
                'creativity': 0.05,
                'communication': 0.05
            }

        # 计算加权分数
        weighted_score = sum(
            abilities.get(ability, 0) * weight
            for ability, weight in weights.items()
        )

        # 归一化到40分
        return (weighted_score / 100) * 40

    def _calculate_history_match(self, task_info: Dict[str, Any], candidate: Dict[str, Any]) -> float:
        """计算历史任务类型匹配分数（20分）"""
        # 基于完成任务数和平均评分
        completed_tasks = candidate['completed_tasks']
        avg_rating = candidate['avg_rating']

        # 完成任务数得分（10分）
        if completed_tasks >= 10:
            task_count_score = 10
        elif completed_tasks >= 5:
            task_count_score = 7
        elif completed_tasks >= 1:
            task_count_score = 5
        else:
            task_count_score = 0

        # 平均评分得分（10分）
        rating_score = (avg_rating / 5) * 10 if avg_rating > 0 else 5

        return task_count_score + rating_score

    def _calculate_growth_match(self, task_info: Dict[str, Any], candidate: Dict[str, Any]) -> float:
        """计算成长路径匹配分数（10分）"""
        current_level = candidate['current_level']
        task_level = task_info['level']

        # 理想情况：任务难度略高于当前等级（挑战但不过分）
        level_diff = task_level - current_level

        if level_diff == 1:
            # 完美挑战
            return 10
        elif level_diff == 0:
            # 同等级，稳妥
            return 8
        elif level_diff == 2:
            # 有挑战性
            return 6
        elif level_diff < 0:
            # 低于当前等级，可能无聊
            return 4
        else:
            # 过于困难
            return 2

    def _generate_match_reason(
        self,
        breakdown: Dict[str, float],
        task_info: Dict[str, Any],
        candidate: Dict[str, Any]
    ) -> str:
        """生成匹配理由"""
        reasons = []

        # OPC匹配
        if breakdown['opc_match'] >= 25:
            reasons.append(f"你的{candidate['opc_type']}型特质非常适合这个任务")

        # 能力匹配
        if breakdown['ability_match'] >= 30:
            top_ability = max(candidate['abilities'].items(), key=lambda x: x[1])
            reasons.append(f"你的{top_ability[0]}能力({top_ability[1]}分)是完成这个任务的关键")

        # 历史表现
        if candidate['completed_tasks'] >= 5:
            reasons.append(f"你已经成功完成{candidate['completed_tasks']}个任务，经验丰富")

        # 成长路径
        if breakdown['growth_match'] >= 8:
            reasons.append("这个任务难度适中，是你成长的好机会")

        return "；".join(reasons) if reasons else "综合评估，你适合这个任务"

    async def _generate_invitation_message(
        self,
        task_info: Dict[str, Any],
        match: Dict[str, Any]
    ) -> str:
        """使用Claude生成个性化邀请消息"""
        prompt = f"""你是一位专业的任务匹配顾问。请为学生生成一条个性化的任务邀请消息。

## 任务信息
标题：{task_info['title']}
描述：{task_info['description']}
赛道：{task_info['track']}
难度：{task_info['level']}
预算：{task_info.get('budget', '未知')}

## 学生画像
OPC类型：{match['opc_type']}
完成任务数：{match['completed_tasks']}
平均评分：{match['avg_rating']:.1f}
匹配分数：{match['match_score']:.1f}
匹配理由：{match['match_reason']}

## 请生成一条邀请消息（100-150字）：
1. 开头要个性化，提到学生的特点
2. 说明为什么这个任务适合他/她
3. 强调任务的价值和成长机会
4. 语气要真诚、鼓励，不要套话
5. 结尾要有行动号召

只返回邀请消息文本，不要其他内容。"""

        response = await claude_client.generate_text(prompt, max_tokens=300)
        return response.strip()


# 全局服务实例
invitation_matching_service = InvitationMatchingService()
