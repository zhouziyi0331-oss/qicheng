"""
向量嵌入和检索服务
"""
from typing import List, Dict, Any, Optional
import anthropic
from app.config import get_settings
from app.database import engine
from sqlalchemy import text

settings = get_settings()


class VectorService:
    """向量嵌入和检索服务"""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    async def generate_embedding(self, text: str) -> List[float]:
        """
        生成文本的向量嵌入
        注意：Claude API目前不直接提供embedding，这里使用模拟方案
        实际生产环境应该使用OpenAI或其他embedding服务
        """
        # TODO: 集成真实的embedding服务（OpenAI, Cohere等）
        # 这里返回一个占位符，实际应该调用embedding API
        import numpy as np
        # 使用简单的hash-based embedding作为占位符
        hash_val = hash(text)
        np.random.seed(hash_val % (2**32))
        embedding = np.random.randn(1536).tolist()
        return embedding

    async def find_similar_stuck_points(
        self,
        student_id: str,
        current_description: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        查找学生历史上相似的卡点
        """
        embedding = await self.generate_embedding(current_description)

        with engine.connect() as conn:
            query = text("""
            SELECT
                sp.id,
                sp.task_id,
                sp.stuck_description,
                sp.stuck_at_step,
                sp.stuck_category,
                sp.resolved,
                sp.resolution_method,
                sp.created_at,
                t.title as task_title,
                1 - (sp.description_embedding <=> :embedding::vector) as similarity
            FROM student_stuck_points sp
            LEFT JOIN tasks t ON sp.task_id = t.id
            WHERE sp.student_id = :student_id
                AND sp.description_embedding IS NOT NULL
            ORDER BY sp.description_embedding <=> :embedding::vector
            LIMIT :limit
            """)

            result = conn.execute(query, {
                "embedding": str(embedding),
                "student_id": student_id,
                "limit": limit
            })

            return [
                {
                    'id': str(row[0]),
                    'task_id': str(row[1]),
                    'stuck_description': row[2],
                    'stuck_at_step': row[3],
                    'stuck_category': row[4],
                    'resolved': row[5],
                    'resolution_method': row[6],
                    'created_at': row[7].isoformat() if row[7] else None,
                    'task_title': row[8],
                    'similarity': float(row[9]) if row[9] else 0.0
                }
                for row in result
            ]

    async def find_similar_tasks(
        self,
        task_description: str,
        track: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        查找相似的任务
        """
        embedding = await self.generate_embedding(task_description)

        with engine.connect() as conn:
            if track:
                query = text("""
                SELECT
                    t.id,
                    t.title,
                    t.description,
                    t.track,
                    t.level,
                    1 - (t.combined_embedding <=> :embedding::vector) as similarity
                FROM tasks t
                WHERE t.combined_embedding IS NOT NULL
                    AND t.track = :track
                ORDER BY t.combined_embedding <=> :embedding::vector
                LIMIT :limit
                """)
                result = conn.execute(query, {
                    "embedding": str(embedding),
                    "track": track,
                    "limit": limit
                })
            else:
                query = text("""
                SELECT
                    t.id,
                    t.title,
                    t.description,
                    t.track,
                    t.level,
                    1 - (t.combined_embedding <=> :embedding::vector) as similarity
                FROM tasks t
                WHERE t.combined_embedding IS NOT NULL
                ORDER BY t.combined_embedding <=> :embedding::vector
                LIMIT :limit
                """)
                result = conn.execute(query, {
                    "embedding": str(embedding),
                    "limit": limit
                })

            return [
                {
                    'id': str(row[0]),
                    'title': row[1],
                    'description': row[2],
                    'track': row[3],
                    'level': row[4],
                    'similarity': float(row[5]) if row[5] else 0.0
                }
                for row in result
            ]

    async def save_stuck_point_with_embedding(
        self,
        student_id: str,
        task_id: str,
        stuck_description: str,
        stuck_at_step: str,
        stuck_category: str
    ) -> str:
        """
        保存卡点并生成向量嵌入
        """
        embedding = await self.generate_embedding(stuck_description)

        with engine.connect() as conn:
            query = text("""
            INSERT INTO student_stuck_points (
                student_id,
                task_id,
                stuck_description,
                stuck_at_step,
                stuck_category,
                description_embedding,
                resolved,
                created_at
            ) VALUES (:student_id, :task_id, :stuck_description, :stuck_at_step, :stuck_category, :embedding, false, NOW())
            RETURNING id
            """)

            result = conn.execute(query, {
                "student_id": student_id,
                "task_id": task_id,
                "stuck_description": stuck_description,
                "stuck_at_step": stuck_at_step,
                "stuck_category": stuck_category,
                "embedding": str(embedding)
            })

            conn.commit()
            row = result.fetchone()
            return str(row[0]) if row else None

    async def store_stuck_point_embedding(
        self,
        student_id: str,
        description: str
    ) -> None:
        """
        为已存在的卡点生成并存储向量嵌入
        """
        embedding = await self.generate_embedding(description)

        with engine.connect() as conn:
            query = text("""
            UPDATE student_stuck_points
            SET description_embedding = :embedding
            WHERE student_id = :student_id
                AND stuck_description = :description
                AND description_embedding IS NULL
            ORDER BY created_at DESC
            LIMIT 1
            """)

            conn.execute(query, {
                "embedding": str(embedding),
                "student_id": student_id,
                "description": description
            })
            conn.commit()

    async def update_task_embeddings(self, task_id: str) -> None:
        """
        更新任务的向量嵌入
        """
        with engine.connect() as conn:
            # 获取任务信息
            task_query = text("SELECT title, description FROM tasks WHERE id = :task_id")
            result = conn.execute(task_query, {"task_id": task_id})
            task = result.fetchone()

            if not task:
                return

            # 生成嵌入
            title_embedding = await self.generate_embedding(task[0])
            description_embedding = await self.generate_embedding(task[1])
            combined_text = f"{task[0]} {task[1]}"
            combined_embedding = await self.generate_embedding(combined_text)

            # 更新数据库
            update_query = text("""
            UPDATE tasks
            SET title_embedding = :title_embedding,
                description_embedding = :description_embedding,
                combined_embedding = :combined_embedding
            WHERE id = :task_id
            """)

            conn.execute(update_query, {
                "title_embedding": str(title_embedding),
                "description_embedding": str(description_embedding),
                "combined_embedding": str(combined_embedding),
                "task_id": task_id
            })
            conn.commit()

vector_service = VectorService()
