"""
动态能力画像更新服务 - 根据任务表现持续更新学生能力
"""
import logging
from typing import Dict, Any, List
from app.utils.claude_client import claude_client
from app.database import engine
from sqlalchemy import text

logger = logging.getLogger(__name__)


class DynamicProfileService:
    """动态能力画像更新服务"""

    async def update_profile_after_task(
        self,
        student_id: str,
        task_id: str,
        performance: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        任务完成后更新学生能力画像

        Args:
            student_id: 学生ID
            task_id: 任务ID
            performance: 任务表现数据
                - rating: 评分 (1-5)
                - completion_time: 完成时间（小时）
                - feedback: 企业反馈
                - stuck_points_count: 卡点次数
                - revision_count: 修改次数

        Returns:
            更新结果
        """
        try:
            # 1. 获取任务信息
            task_info = await self._get_task_info(task_id)

            # 2. 获取学生当前画像
            current_profile = await self._get_current_profile(student_id)

            # 3. 获取学生历史表现
            history = await self._get_performance_history(student_id, task_info['track'])

            # 4. 使用Claude分析并计算新的能力评分
            new_scores = await self._calculate_new_scores(
                current_profile,
                task_info,
                performance,
                history
            )

            # 5. 更新数据库
            await self._update_database(student_id, task_info['track'], new_scores)

            # 6. 检查是否需要重新评估OPC标签
            opc_changed = await self._check_opc_change(student_id, new_scores, history)

            # 7. 生成更新报告
            report = await self._generate_update_report(
                current_profile,
                new_scores,
                opc_changed,
                performance
            )

            return {
                "success": True,
                "old_scores": current_profile['abilities'],
                "new_scores": new_scores,
                "opc_changed": opc_changed,
                "report": report
            }

        except Exception as e:
            logger.error(f"Profile update error: {e}")
            raise

    async def _get_task_info(self, task_id: str) -> Dict[str, Any]:
        """获取任务信息"""
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT
                        id,
                        title,
                        track,
                        level,
                        estimated_hours
                    FROM tasks
                    WHERE id = :task_id
                """),
                {"task_id": task_id}
            )
            row = result.fetchone()

            if not row:
                raise ValueError(f"Task {task_id} not found")

            return {
                "id": str(row[0]),
                "title": row[1],
                "track": row[2],
                "level": row[3],
                "estimated_hours": row[4]
            }

    async def _get_current_profile(self, student_id: str) -> Dict[str, Any]:
        """获取学生当前画像"""
        with engine.connect() as conn:
            # 获取OPC标签
            opc_result = conn.execute(
                text("""
                    SELECT
                        primary_type,
                        o_score,
                        p_score,
                        c_score
                    FROM student_profiles
                    WHERE student_id = :student_id
                """),
                {"student_id": student_id}
            )
            opc_row = opc_result.fetchone()

            # 获取六维能力
            abilities_result = conn.execute(
                text("""
                    SELECT
                        track,
                        creativity_score,
                        execution_score,
                        technical_score,
                        communication_score,
                        learning_score,
                        problem_solving_score
                    FROM student_abilities
                    WHERE student_id = :student_id
                """),
                {"student_id": student_id}
            )
            abilities_rows = abilities_result.fetchall()

            profile = {
                "student_id": student_id,
                "opc_type": opc_row[0] if opc_row else "unknown",
                "o_score": opc_row[1] if opc_row else 0,
                "p_score": opc_row[2] if opc_row else 0,
                "c_score": opc_row[3] if opc_row else 0,
                "abilities": {}
            }

            for row in abilities_rows:
                track = row[0]
                profile["abilities"][track] = {
                    "creativity": row[1],
                    "execution": row[2],
                    "technical": row[3],
                    "communication": row[4],
                    "learning": row[5],
                    "problem_solving": row[6]
                }

            return profile

    async def _get_performance_history(self, student_id: str, track: str) -> List[Dict[str, Any]]:
        """获取学生历史表现"""
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT
                        t.title,
                        t.level,
                        tr.overall_rating,
                        ta.completed_at,
                        EXTRACT(EPOCH FROM (ta.completed_at - ta.accepted_at))/3600 as hours_spent
                    FROM task_assignments ta
                    INNER JOIN tasks t ON ta.task_id = t.id
                    LEFT JOIN task_ratings tr ON ta.task_id = tr.task_id AND tr.ratee_id = :student_id
                    WHERE ta.student_id = :student_id
                        AND ta.status = 'completed'
                        AND t.track = :track
                    ORDER BY ta.completed_at DESC
                    LIMIT 10
                """),
                {"student_id": student_id, "track": track}
            )

            history = []
            for row in result:
                history.append({
                    "title": row[0],
                    "level": row[1],
                    "rating": row[2] if row[2] else 0,
                    "completed_at": row[3].isoformat() if row[3] else None,
                    "hours_spent": float(row[4]) if row[4] else 0
                })

            return history

    async def _calculate_new_scores(
        self,
        current_profile: Dict[str, Any],
        task_info: Dict[str, Any],
        performance: Dict[str, Any],
        history: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """使用Claude分析并计算新的能力评分"""

        track = task_info['track']
        current_abilities = current_profile['abilities'].get(track, {
            "creativity": 50,
            "execution": 50,
            "technical": 50,
            "communication": 50,
            "learning": 50,
            "problem_solving": 50
        })

        # 构建历史表现摘要
        history_summary = ""
        if history:
            avg_rating = sum(h['rating'] for h in history) / len(history)
            history_summary = f"最近{len(history)}个任务平均评分：{avg_rating:.1f}"

        prompt = f"""你是一位专业的能力评估专家。请根据学生的任务表现，更新他们的六维能力评分。

## 当前能力评分（0-100分）
创意能力：{current_abilities['creativity']}
执行能力：{current_abilities['execution']}
技术能力：{current_abilities['technical']}
沟通能力：{current_abilities['communication']}
学习能力：{current_abilities['learning']}
问题解决：{current_abilities['problem_solving']}

## 本次任务表现
任务：{task_info['title']}
难度：{task_info['level']}
评分：{performance['rating']}/5
完成时间：{performance['completion_time']}小时（预计{task_info.get('estimated_hours', '未知')}小时）
卡点次数：{performance.get('stuck_points_count', 0)}
修改次数：{performance.get('revision_count', 0)}
企业反馈：{performance.get('feedback', '无')}

## 历史表现
{history_summary}

## 更新规则
1. 评分变化幅度：单次任务最多±5分
2. 评分范围：0-100分
3. 根据表现调整：
   - 评分5分 → 各维度+3到+5分
   - 评分4分 → 各维度+1到+3分
   - 评分3分 → 各维度-1到+1分
   - 评分2分 → 各维度-3到-1分
   - 评分1分 → 各维度-5到-3分
4. 特殊调整：
   - 完成时间远超预期 → 执行能力-2分
   - 卡点次数多 → 问题解决-2分
   - 修改次数多 → 沟通能力-1分

## 请按以下格式输出新的评分：
creativity: [0-100的整数]
execution: [0-100的整数]
technical: [0-100的整数]
communication: [0-100的整数]
learning: [0-100的整数]
problem_solving: [0-100的整数]

只返回评分，每行一个，格式如上。"""

        response = await claude_client.generate_text(prompt, max_tokens=200)

        # 解析响应
        new_scores = {}
        for line in response.strip().split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                try:
                    new_scores[key] = max(0, min(100, int(value)))
                except ValueError:
                    # 如果解析失败，保持原值
                    new_scores[key] = current_abilities.get(key, 50)

        # 确保所有维度都有值
        for ability in ['creativity', 'execution', 'technical', 'communication', 'learning', 'problem_solving']:
            if ability not in new_scores:
                new_scores[ability] = current_abilities.get(ability, 50)

        return new_scores

    async def _update_database(
        self,
        student_id: str,
        track: str,
        new_scores: Dict[str, float]
    ) -> None:
        """更新数据库中的能力评分"""
        with engine.connect() as conn:
            # 检查是否已存在该赛道的记录
            check_result = conn.execute(
                text("""
                    SELECT id FROM student_abilities
                    WHERE student_id = :student_id AND track = :track
                """),
                {"student_id": student_id, "track": track}
            )

            if check_result.fetchone():
                # 更新现有记录
                conn.execute(
                    text("""
                        UPDATE student_abilities
                        SET creativity_score = :creativity,
                            execution_score = :execution,
                            technical_score = :technical,
                            communication_score = :communication,
                            learning_score = :learning,
                            problem_solving_score = :problem_solving,
                            updated_at = NOW()
                        WHERE student_id = :student_id AND track = :track
                    """),
                    {
                        "student_id": student_id,
                        "track": track,
                        **new_scores
                    }
                )
            else:
                # 插入新记录
                conn.execute(
                    text("""
                        INSERT INTO student_abilities
                        (student_id, track, creativity_score, execution_score, technical_score,
                         communication_score, learning_score, problem_solving_score, created_at, updated_at)
                        VALUES (:student_id, :track, :creativity, :execution, :technical,
                                :communication, :learning, :problem_solving, NOW(), NOW())
                    """),
                    {
                        "student_id": student_id,
                        "track": track,
                        **new_scores
                    }
                )

            conn.commit()

    async def _check_opc_change(
        self,
        student_id: str,
        new_scores: Dict[str, float],
        history: List[Dict[str, Any]]
    ) -> bool:
        """检查是否需要重新评估OPC标签"""
        # 触发条件：
        # 1. 完成任务数达到里程碑（5、10、20）
        # 2. 某个维度评分变化超过10分

        if len(history) in [5, 10, 20]:
            # 达到里程碑，重新评估
            await self._reevaluate_opc(student_id)
            return True

        return False

    async def _reevaluate_opc(self, student_id: str) -> None:
        """重新评估OPC标签"""
        # TODO: 实现OPC重新评估逻辑
        # 这里需要综合学生的全量任务表现，重新计算OPC分数
        pass

    async def _generate_update_report(
        self,
        current_profile: Dict[str, Any],
        new_scores: Dict[str, float],
        opc_changed: bool,
        performance: Dict[str, Any]
    ) -> str:
        """生成能力更新报告"""
        changes = []
        for ability, new_score in new_scores.items():
            old_score = current_profile['abilities'].get(ability, 50)
            diff = new_score - old_score
            if abs(diff) >= 1:
                direction = "提升" if diff > 0 else "下降"
                changes.append(f"{ability}: {old_score} → {new_score} ({direction}{abs(diff)}分)")

        if not changes:
            return "本次任务后，你的能力评分保持稳定。"

        report = "🎯 能力画像更新\n\n"
        report += "\n".join(changes)

        if opc_changed:
            report += "\n\n🌟 你的OPC标签已更新！查看新的能力画像。"

        return report


# 全局服务实例
dynamic_profile_service = DynamicProfileService()
