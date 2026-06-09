"""配置管理"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""
    
    # 数据库配置
    database_url: str
    
    # Anthropic API配置
    anthropic_api_key: str
    
    # 服务配置
    host: str = "0.0.0.0"
    port: int = 8001
    debug: bool = True
    
    # 向量配置
    embedding_dimensions: int = 1536
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()
