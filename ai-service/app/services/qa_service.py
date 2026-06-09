"""
实时答疑服务 - 苏格拉底式引导 + 历史卡点提醒
"""
import logging
from typing import List, Dict, Any, Optional
from app.utils.claude_client import claude_client
from app.database import engine
from app.services.vector_service import vector_service
from sqlalchemy import text

logger = logging.getLogger(__name__)


class QAService:
    """实时答疑服务"""

    async def answer_question(
        self,
        student_id: str,
        task_id: str,
        question: str,
        context: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        回答学生问题（苏格拉底式引导）

        Args:
            student_id: 学生ID
            task_id: 任务ID
            question: 学生的问题
            context: 问题上下文（可选）
            conversation_history: 对话历史（可选）

        Returns:
            回答结果
        """
        try:
            # 1. 获取任务信息
            task_info = await self._get_task_info(task_id)

            # 2. 获取学生能力画像
            student_profile = await self._get_student_profile(student_id)

            # 3. 查找相似的历史卡点
            similar_stuck_points = await vector_service.find_similar_stuck_points(
                student_id=student_id,
                current_description=question,
                limit=3
            )

            # 4. 判断问题类型
            question_type = await self._classify_question(question)

            # 5. 生成苏格拉底式回答
            answer = await self._generate_answer(
                student_profile,
                task_info,
                question,
                question_type,
                similar_stuck_points,
                context,
                conversation_history
            )

            # 6. 如果是新卡点，记录到数据库
            if answer.get('is_stuck_point'):
                await self._record_stuck_point(
                    student_id,
                    task_id,
                    question,
                    answer.get('stuck_category')
                )

            return answer

        except Exception as e:
            logger.error(f"QA service error: {e}")
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
                        level,
                        track
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
                "level": row[4],
                "track": row[5]
            }

    async def _get_student_profile(self, student_id: str) -> Dict[str, Any]:
        """获取学生能力画像"""
        with engine.connect() as conn:
            result = conn.execute(
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
            row = result.fetchone()

            if not row:
                return {
                    "student_id": student_id,
                    "opc_type": "unknown",
                    "o_score": 0,
                    "p_score": 0,
                    "c_score": 0
                }

            return {
                "student_id": student_id,
                "opc_type": row[0],
                "o_score": row[1],
                "p_score": row[2],
                "c_score": row[3]
            }

    async def _classify_question(self, question: str) -> str:
        """
        分类问题类型

        Returns:
            question_type: 'concept' | 'implementation' | 'debugging' | 'direction' | 'other'
        """
        prompt = f"""请判断以下学生问题属于哪种类型，只返回类型名称：

问题：{question}

类型选项：
- concept: 概念理解问题（什么是X？为什么要这样？）
- implementation: 实现方法问题（怎么做X？如何实现Y？）
- debugging: 调试问题（为什么报错？哪里出问题了？）
- direction: 方向选择问题（应该用A还是B？哪种方案更好？）
- other: 其他

只返回类型名称，不要其他内容。"""

        response = await claude_client.generate_text(prompt, max_tokens=50)
        question_type = response.strip().lower()

        valid_types = ['concept', 'implementation', 'debugging', 'direction', 'other']
        return question_type if question_type in valid_types else 'other'

    async def _generate_answer(
        self,
        student_profile: Dict[str, Any],
        task_info: Dict[str, Any],
        question: str,
        question_type: str,
        similar_stuck_points: List[Dict[str, Any]],
        context: Optional[str],
        conversation_history: Optional[List[Dict[str, str]]]
    ) -> Dict[str, Any]:
        """生成苏格拉底式回答"""

        # 构建历史卡点上下文
        stuck_points_context = ""
        if similar_stuck_points:
            stuck_points_context = "\n## 学生历史相似卡点\n"
            for i, point in enumerate(similar_stuck_points, 1):
                stuck_points_context += f"{i}. {point['stuck_description']}\n"
                if point['resolved'] and point['resolution_method']:
                    stuck_points_context += f"   当时的解决方案：{point['resolution_method']}\n"
                stuck_points_context += f"   相似度：{point['similarity']:.2f}\n\n"

        # 构建对话历史
        history_context = ""
        if conversation_history:
            history_context = "\n## 对话历史\n"
            for msg in conversation_history[-5:]:  # 只保留最近5轮
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                history_context += f"{role}: {content}\n"

        # 根据问题类型调整引导策略
        guidance_strategy = self._get_guidance_strategy(question_type, student_profile['opc_type'])

        prompt = f"""你是一位经验丰富的AI导师，擅长使用苏格拉底式教学法引导学生思考。

## 任务背景
标题：{task_info['title']}
描述：{task_info['description']}
难度：{task_info['level']}
赛道：{task_info['track']}

## 学生画像
OPC类型：{student_profile['opc_type']}

## 学生问题
类型：{question_type}
问题：{question}
{f"上下文：{context}" if context else ""}
{history_context}
{stuck_points_context}

## 引导策略
{guidance_strategy}

## 请按以下格式回答：

### 引导性问题
[提出1-3个引导学生思考的问题，不要直接给答案]

### 思路提示
[给出思考方向和关键点，但不要给出完整解决方案]

### 相关提醒
[如果学生历史上遇到过类似问题，提醒他们回顾之前的解决方法]
[如果发现学生可能陷入卡点，给出预警]

### 参考资源
[推荐1-2个相关资源，帮助学生自己找到答案]

### 鼓励
[简短的鼓励，让学生保持信心]

注意：
1. 不要直接给答案，要引导学生自己思考
2. 问题要具体，不要太抽象
3. 如果学生历史上解决过类似问题，要提醒他们
4. 如果判断学生遇到了真正的卡点（而不是懒得思考），可以给更多提示
5. 根据学生的OPC类型调整引导方式
"""

        response = await claude_client.generate_text(prompt, max_tokens=2000)

        # 解析响应
        parsed = self._parse_answer_response(response)

        # 判断是否是卡点
        is_stuck = await self._is_stuck_point(question, similar_stuck_points)

        return {
            **parsed,
            "question_type": question_type,
            "is_stuck_point": is_stuck,
            "stuck_category": self._categorize_stuck_point(question_type) if is_stuck else None
        }

    def _get_guidance_strategy(self, question_type: str, opc_type: str) -> str:
        """根据问题类型和OPC类型获取引导策略"""
        base_strategies = {
            "concept": "概念问题：先问学生已经理解了什么，再引导他们建立知识联系",
            "implementation": "实现问题：引导学生分解问题，思考每一步要做什么",
            "debugging": "调试问题：引导学生定位问题、分析原因、验证假设",
            "direction": "方向问题：引导学生列出各方案的优缺点，根据场景选择",
            "other": "其他问题：先理解学生的真实困惑，再针对性引导"
        }

        opc_adjustments = {
            "O": "O型学生喜欢探索，可以给更多可能性和创意方向",
            "P": "P型学生喜欢清晰步骤，引导要具体可执行",
            "C": "C型学生喜欢深入技术，可以引导他们思考底层原理"
        }

        base = base_strategies.get(question_type, base_strategies["other"])
        adjustment = opc_adjustments.get(opc_type, "")

        return f"{base}\n{adjustment}"

    async def _is_stuck_point(
        self,
        question: str,
        similar_stuck_points: List[Dict[str, Any]]
    ) -> bool:
        """判断是否是真正的卡点"""
        # 简单规则：如果问题包含"不知道"、"不会"、"卡住了"等关键词
        stuck_keywords = ['不知道', '不会', '卡住', '不懂', '搞不定', '没思路', '不明白']
        if any(keyword in question for keyword in stuck_keywords):
            return True

        # 如果历史上有相似卡点，也认为是卡点
        if similar_stuck_points and similar_stuck_points[0]['similarity'] > 0.8:
            return True

        return False

    def _categorize_stuck_point(self, question_type: str) -> str:
        """根据问题类型分类卡点"""
        category_map = {
            "concept": "concept_understanding",
            "implementation": "implementation_difficulty",
            "debugging": "technical_error",
            "direction": "decision_making",
            "other": "other"
        }
        return category_map.get(question_type, "other")

    def _parse_answer_response(self, response: str) -> Dict[str, Any]:
        """解析回答响应"""
        lines = response.strip().split('\n')

        result = {
            "guiding_questions": [],
            "thinking_hints": "",
            "reminders": "",
            "resources": [],
            "encouragement": ""
        }

        current_section = None

        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                if '引导性问题' in line:
                    current_section = 'questions'
                elif '思路提示' in line:
                    current_section = 'hints'
                elif '相关提醒' in line:
                    current_section = 'reminders'
                elif '参考资源' in line:
                    current_section = 'resources'
                elif '鼓励' in line:
                    current_section = 'encouragement'
                continue

            if current_section == 'questions' and line.startswith('-'):
                result['guiding_questions'].append(line[1:].strip())
            elif current_section == 'hints':
                result['thinking_hints'] += line + " "
            elif current_section == 'reminders':
                result['reminders'] += line + " "
            elif current_section == 'resources' and line.startswith('-'):
                result['resources'].append(line[1:].strip())
            elif current_section == 'encouragement':
                result['encouragement'] += line + " "

        # 清理空格
        result['thinking_hints'] = result['thinking_hints'].strip()
        result['reminders'] = result['reminders'].strip()
        result['encouragement'] = result['encouragement'].strip()

        return result

    async def _record_stuck_point(
        self,
        student_id: str,
        task_id: str,
        description: str,
        category: str
    ) -> None:
        """记录卡点到数据库"""
        try:
            with engine.connect() as conn:
                conn.execute(
                    text("""
                        INSERT INTO student_stuck_points
                        (student_id, task_id, stuck_description, stuck_category, resolved, created_at)
                        VALUES (:student_id, :task_id, :description, :category, false, NOW())
                    """),
                    {
                        "student_id": student_id,
                        "task_id": task_id,
                        "description": description,
                        "category": category
                    }
                )
                conn.commit()

            # 异步生成并存储向量嵌入
            await vector_service.store_stuck_point_embedding(student_id, description)

        except Exception as e:
            logger.error(f"Failed to record stuck point: {e}")


# 全局服务实例
qa_service = QAService()
