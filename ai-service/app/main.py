"""FastAPI主应用"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.routes import task_breakdown, qa, invitation_matching, dynamic_profile
from app.config import get_settings
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

settings = get_settings()

# 创建FastAPI应用
app = FastAPI(
    title="启程AI服务",
    description="为启程平台提供AI能力支持",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router)
app.include_router(task_breakdown.router, prefix="/api/ai/task-breakdown", tags=["任务拆解"])
app.include_router(qa.router, prefix="/api/ai/qa", tags=["实时答疑"])
app.include_router(invitation_matching.router, prefix="/api/ai/matching", tags=["邀请制匹配"])
app.include_router(dynamic_profile.router, prefix="/api/ai/profile", tags=["动态能力画像"])


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "启程AI服务",
        "version": "1.0.0",
        "status": "运行中"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug
    )
