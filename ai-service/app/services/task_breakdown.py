"""
任务拆解服务 - 基于学生能力画像的个性化拆解
"""
import logging
from typing import List, Dict, Any
from app.utils.claude_client import claude_client
from app.database import engine
from app.services.vector_service import vector_service
from sqlalchemy import text

logger = logging.getLogger(__name__)


class TaskBreakdownService:
    """任务拆解服务"""

    async def breakdown_task(
        self,
        task_id: str,
        student_id: str
    ) -> Dict[str, Any]:
        """
        为学生个性化拆解任务

        Args:
            task_id: 任务ID
            student_id: 学生ID

        Returns:
            拆解结果
        """
        try:
            # 1. 获取任务信息
            task_info = await self._get_task_info(task_id)

            # 2. 获取学生能力画像
            student_profile = await self._get_student_profile(student_id)

            # 3. 查找相似任务的成功经验（向量检索）
            similar_tasks = await vector_service.find_similar_tasks(
                task_description=task_info['description'],
                track=task_info['track'],
                limit=3
            )

            # 4. 查找学生历史卡点
            historical_stuck_points = await vector_service.find_similar_stuck_points(
                student_id=student_id,
                current_description=task_info['description'],
                limit=5
            )

            # 5. 使用Claude生成个性化拆解
            breakdown = await self._generate_breakdown(
                task_info,
                student_profile,
                similar_tasks,
                historical_stuck_points
            )

            return breakdown

        except Exception as e:
            logger.error(f"Task breakdown error: {e}")
            raise

    async def _get_task_info(self, task_id: str) -> Dict[str, Any]:
        """获取任务信息"""
        with engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT
                        id,
                        title,
                        description,
                        acceptance_criteria,
                        deliverables,
                        level,
                        track,
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
                "description": row[2],
                "acceptance_criteria": row[3],
                "deliverables": row[4],
                "level": row[5],
                "track": row[6],
                "estimated_hours": row[7]
            }

    async def _get_student_profile(self, student_id: str) -> Dict[str, Any]:
        """获取学生能力画像"""
        with engine.connect() as conn:
            # 获取OPC标签
            opc_result = conn.execute(
                text("""
                    SELECT
                        primary_type,
                        secondary_type,
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

            # 获取完成任务数
            tasks_result = conn.execute(
                text("""
                    SELECT COUNT(*) as completed_tasks
                    FROM task_assignments
                    WHERE student_id = :student_id
                    AND status = 'completed'
                """),
                {"student_id": student_id}
            )
            tasks_row = tasks_result.fetchone()

            profile = {
                "opc_type": opc_row[0] if opc_row else "unknown",
                "secondary_type": opc_row[1] if opc_row else None,
                "o_score": opc_row[2] if opc_row else 0,
                "p_score": opc_row[3] if opc_row else 0,
                "c_score": opc_row[4] if opc_row else 0,
                "completed_tasks": tasks_row[0] if tasks_row else 0,
                "abilities": {}
            }

            # 整理六维能力
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

    async def _generate_breakdown(
        self,
        task_info: Dict[str, Any],
        student_profile: Dict[str, Any],
        similar_tasks: List[Dict[str, Any]],
        historical_stuck_points: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """使用Claude生成个性化任务拆解"""

        # 构建相似任务上下文
        similar_tasks_context = ""
        if similar_tasks:
            similar_tasks_context = "\n## 相似任务参考\n"
            for i, task in enumerate(similar_tasks, 1):
                similar_tasks_context += f"{i}. {task['title']} (相似度: {task['similarity']:.2f})\n"
                similar_tasks_context += f"   描述：{task['description'][:100]}...\n\n"

        # 构建历史卡点上下文
        stuck_points_context = ""
        if historical_stuck_points:
            stuck_points_context = "\n## 学生历史卡点（需要特别注意）\n"
            for i, point in enumerate(historical_stuck_points, 1):
                stuck_points_context += f"{i}. {point['stuck_description']}\n"
                if point['resolved'] and point['resolution_method']:
                    stuck_points_context += f"   解决方案：{point['resolution_method']}\n"
                stuck_points_context += f"   相似度：{point['similarity']:.2f}\n\n"

        # 根据OPC类型调整拆解策略
        opc_strategy = self._get_opc_strategy(student_profile['opc_type'])

        prompt = f"""你是一位经验丰富的AI导师。请为学生个性化拆解任务，帮助他们更好地完成任务。

## 任务信息
标题：{task_info['title']}
描述：{task_info['description']}
验收标准：{task_info['acceptance_criteria']}
交付物：{task_info['deliverables']}
难度等级：{task_info['level']}
赛道：{task_info['track']}
预计时长：{task_info.get('estimated_hours', '未知')}小时

## 学生能力画像
OPC类型：{student_profile['opc_type']} (O:{student_profile['o_score']}, P:{student_profile['p_score']}, C:{student_profile['c_score']})
完成任务数：{student_profile['completed_tasks']}
六维能力：{student_profile['abilities'].get(task_info['track'], '暂无该赛道数据')}

## 拆解策略（基于OPC类型）
{opc_strategy}
{similar_tasks_context}
{stuck_points_context}

## 请按以下格式输出任务拆解：

### 整体思路
[一段话说明完成这个任务的整体思路和关键点]

### 分步骤计划
1. [步骤名称] (预计X小时)
   - 具体要做什么
   - 关键注意事项
   - 预期产出

2. [步骤名称] (预计X小时)
   - 具体要做什么
   - 关键注意事项
   - 预期产出

### 潜在卡点预警
- [卡点1]：可能遇到的问题及应对方法
- [卡点2]：可能遇到的问题及应对方法

### 推荐资源
- [资源1]：为什么推荐
- [资源2]：为什么推荐

### 鼓励寄语
[根据学生的OPC类型和历史表现，给出个性化的鼓励]

注意：
1. 拆解要符合学生的OPC类型特点
2. 如果学生历史上在相似任务遇到过卡点，要特别提醒
3. 步骤要具体可执行，不要太抽象
4. 时间估算要合理
5. 鼓励寄语要真诚，不要套话
"""

        response = await claude_client.generate_text(prompt, max_tokens=3000)

        # 解析响应
        return self._parse_breakdown_response(response, task_info, student_profile)

    def _get_opc_strategy(self, opc_type: str) -> str:
        """根据OPC类型获取拆解策略"""
        strategies = {
            "O": """
O型学生（开放探索型）特点：
- 喜欢创意和探索，不喜欢被限制
- 容易发散思维，需要帮助聚焦
- 拆解策略：先给创意方向和可能性，再给具体步骤
- 强调"为什么这样做"而不是"必须这样做"
            """,
            "P": """
P型学生（计划执行型）特点：
- 喜欢清晰的步骤和计划
- 执行力强，但可能缺乏灵活性
- 拆解策略：给出详细的执行步骤和时间表
- 强调每一步的具体产出和验收标准
            """,
            "C": """
C型学生（技术钻研型）特点：
- 喜欢深入技术细节
- 可能忽视沟通和文档
- 拆解策略：先给技术路线和架构，再给实现细节
- 提醒注意文档和沟通环节
            """
        }
        return strategies.get(opc_type, strategies["P"])

    def _parse_breakdown_response(
        self,
        response: str,
        task_info: Dict[str, Any],
        student_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """解析拆解响应"""
        lines = response.strip().split('\n')

        result = {
            "task_id": task_info['id'],
            "student_id": student_profile.get('student_id'),
            "overall_approach": "",
            "steps": [],
            "potential_blockers": [],
            "recommended_resources": [],
            "encouragement": ""
        }

        current_section = None
        current_step = None

        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                # 识别章节
                if '整体思路' in line:
                    current_section = 'approach'
                elif '分步骤计划' in line:
                    current_section = 'steps'
                elif '潜在卡点预警' in line:
                    current_section = 'blockers'
                elif '推荐资源' in line:
                    current_section = 'resources'
                elif '鼓励寄语' in line:
                    current_section = 'encouragement'
                continue

            # 解析内容
            if current_section == 'approach':
                if not line.startswith('-') and not line.startswith('###'):
                    result['overall_approach'] += line + " "

            elif current_section == 'steps':
                if line[0].isdigit() and '.' in line:
                    # 新步骤
                    if current_step:
                        result['steps'].append(current_step)

                    step_text = line.split('.', 1)[1].strip()
                    current_step = {
                        "name": step_text.split('(')[0].strip(),
                        "estimated_hours": self._extract_hours(step_text),
                        "details": [],
                        "notes": [],
                        "output": ""
                    }
                elif line.startswith('- ') and current_step:
                    current_step['details'].append(line[2:])

            elif current_section == 'blockers' and line.startswith('- '):
                blocker_text = line[2:]
                parts = blocker_text.split('：')
                if len(parts) >= 2:
                    result['potential_blockers'].append({
                        "blocker": parts[0].strip(),
                        "solution": parts[1].strip()
                    })

            elif current_section == 'resources' and line.startswith('- '):
                resource_text = line[2:]
                parts = resource_text.split('：')
                if len(parts) >= 2:
                    result['recommended_resources'].append({
                        "resource": parts[0].strip(),
                        "reason": parts[1].strip()
                    })

            elif current_section == 'encouragement':
                if not line.startswith('-') and not line.startswith('###'):
                    result['encouragement'] += line + " "

        # 添加最后一个步骤
        if current_step:
            result['steps'].append(current_step)

        # 清理空格
        result['overall_approach'] = result['overall_approach'].strip()
        result['encouragement'] = result['encouragement'].strip()

        return result

    def _extract_hours(self, text: str) -> float:
        """从文本中提取小时数"""
        import re
        match = re.search(r'(\d+(?:\.\d+)?)\s*小时', text)
        if match:
            return float(match.group(1))
        return 0.0


# 全局服务实例
task_breakdown_service = TaskBreakdownService()
