"""向量生成服务"""
import logging
import numpy as np
from typing import List
from app.utils.claude_client import claude_client
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmbeddingService:
    """向量生成服务"""
    
    def __init__(self):
        self.dimensions = settings.embedding_dimensions
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        生成文本向量
        
        Args:
            text: 输入文本
            
        Returns:
            1536维向量
        """
        try:
            # 使用Claude生成8维语义特征分数
            scores = await claude_client.generate_embedding_scores(text)
            
            # 扩展到1536维
            embedding = self._expand_to_1536(scores)
            
            # 归一化
            embedding = self._normalize(embedding)
            
            return embedding.tolist()
            
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            # 降级方案：使用简单的文本特征
            return self._generate_simple_embedding(text)
    
    def _expand_to_1536(self, scores: List[float]) -> np.ndarray:
        """将8维分数扩展到1536维"""
        embedding = np.zeros(self.dimensions)
        
        for i in range(self.dimensions):
            base_score = scores[i % 8]
            # 添加随机噪声以增加多样性
            noise = np.random.normal(0, 0.1)
            embedding[i] = np.clip(base_score + noise, 0, 1)
        
        return embedding
    
    def _normalize(self, vec: np.ndarray) -> np.ndarray:
        """归一化向量"""
        magnitude = np.linalg.norm(vec)
        if magnitude > 0:
            return vec / magnitude
        return vec
    
    def _generate_simple_embedding(self, text: str) -> List[float]:
        """简单的降级方案：基于文本特征生成向量"""
        embedding = np.zeros(self.dimensions)
        normalized = text.lower()
        
        for i in range(self.dimensions):
            char_code = ord(normalized[i % len(normalized)]) if normalized else 0
            value = (char_code / 255) * np.sin(i * 0.1) * np.cos(len(text) * 0.01)
            embedding[i] = value
        
        return self._normalize(embedding).tolist()
    
    def calculate_cosine_similarity(
        self,
        vec1: List[float],
        vec2: List[float]
    ) -> float:
        """
        计算余弦相似度
        
        Args:
            vec1: 向量1
            vec2: 向量2
            
        Returns:
            相似度 (0-1)
        """
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        dot_product = np.dot(v1, v2)
        magnitude = np.linalg.norm(v1) * np.linalg.norm(v2)
        
        if magnitude == 0:
            return 0.0
        
        return float(dot_product / magnitude)


# 全局服务实例
embedding_service = EmbeddingService()
