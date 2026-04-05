-- ============================================================
-- 启程 · pgvector 扩展安装与向量索引
-- 需在 001_init_schema.sql 执行后运行
-- ============================================================

-- 安装 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 为 test_results 的开放题答案向量添加 IVFFlat 索引
-- 注意: IVFFlat 需要至少有一些数据才能高效, 生产环境数据量大时创建
-- lists 参数: sqrt(行数), 最小100, 最大1000
CREATE INDEX IF NOT EXISTS idx_test_results_embedding_ivfflat
  ON test_results USING ivfflat (open_answer_embedding vector_cosine_ops)
  WITH (lists = 100);

-- 为未来的学生向量档案预留 (语义搜索匹配用)
COMMENT ON COLUMN test_results.open_answer_embedding IS
  '25题中开放填写题目(Q01/Q07/Q08/Q10/Q17)的语义向量, 用于OPC标签相似度匹配';
