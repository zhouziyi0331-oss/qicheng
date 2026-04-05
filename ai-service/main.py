"""
启程 AI 微服务
FastAPI · Claude API (主) + OpenAI (备)
5 个引擎: AI-01 测试分析 / AI-02 任务匹配 / AI-03 任务辅助 / AI-04 交付审核 / AI-05 报告生成
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from engines.ai01_test_analyzer import router as ai01_router
from engines.ai02_task_matcher import router as ai02_router
from engines.ai03_task_assistant import router as ai03_router
from engines.ai04_delivery_reviewer import router as ai04_router
from engines.ai05_report_generator import router as ai05_router

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s %(message)s')
logger = logging.getLogger("qicheng-ai")

app = FastAPI(
    title="启程 AI Service",
    description="AI engines for Qicheng platform — Test Analysis, Task Matching, Task Assistance, Delivery Review, Report Generation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai01_router, prefix="/ai", tags=["AI-01 Test Analyzer"])
app.include_router(ai02_router, prefix="/ai", tags=["AI-02 Task Matcher"])
app.include_router(ai03_router, prefix="/ai", tags=["AI-03 Task Assistant"])
app.include_router(ai04_router, prefix="/ai", tags=["AI-04 Delivery Reviewer"])
app.include_router(ai05_router, prefix="/ai", tags=["AI-05 Report Generator"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "qicheng-ai"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
