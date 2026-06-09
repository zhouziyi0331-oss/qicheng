"""OpenAI API客户端封装"""
from openai import AsyncOpenAI
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class OpenAIClient:
    """OpenAI API客户端"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimensions = 1536
    
    async def generate_embedding(self, text: str) -> list[float]:
        """生成文本向量"""
        try:
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=text,
                dimensions=self.embedding_dimensions
            )
            
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"OpenAI embedding error: {e}")
            raise


# 全局客户端实例
openai_client = OpenAIClient()
