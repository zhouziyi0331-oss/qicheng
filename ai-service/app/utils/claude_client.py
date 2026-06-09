"""Claude API客户端封装"""
from anthropic import Anthropic
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class ClaudeClient:
    """Claude API客户端"""
    
    def __init__(self):
        self.client = Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-sonnet-4-6"
    
    async def generate_text(self, prompt: str, max_tokens: int = 2048) -> str:
        """生成文本"""
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            content = message.content[0]
            if content.type != 'text':
                raise ValueError("Unexpected response type from Claude")
            
            return content.text
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            raise
    
    async def generate_embedding_scores(self, text: str) -> list[float]:
        """生成语义特征分数（8维）"""
        try:
            prompt = f"""分析以下文本的语义特征，为每个维度打分(0-1)：
技术复杂度、创意程度、商业价值、时间紧迫度、协作需求、学习成长、行业相关性、用户影响。
只返回8个数字，用逗号分隔，不要其他内容。

文本：{text[:500]}"""
            
            response = await self.generate_text(prompt, max_tokens=100)
            scores = [float(s.strip()) for s in response.strip().split(',')]
            
            if len(scores) != 8:
                raise ValueError(f"Expected 8 scores, got {len(scores)}")
            
            return scores
        except Exception as e:
            logger.warning(f"Failed to generate embedding scores: {e}")
            # 返回默认分数
            return [0.5] * 8


# 全局客户端实例
claude_client = ClaudeClient()
