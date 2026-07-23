# 本地Embedding服务使用指南

## 📦 模型信息

**模型名称**: paraphrase-multilingual-MiniLM-L12-v2
- **大小**: 420MB
- **维度**: 384
- **语言**: 支持中英文（多语言）
- **速度**: 快速（CPU可运行）
- **质量**: 适合生产环境

## 🚀 快速开始

### 1. 安装（首次运行）
```bash
cd /Users/alwan/code/qicheng/miniapp/backend
./install_embedding.sh
```

**安装内容**：
- sentence-transformers (模型库)
- flask (Web服务)
- numpy (数值计算)
- 模型文件 (~420MB)

**安装位置**：
```
~/.cache/torch/sentence_transformers/
```

### 2. 启动服务
```bash
./start_embedding.sh
```

**服务信息**：
- 地址: http://localhost:5001
- API: POST /embeddings
- 健康检查: GET /health

### 3. 配置后端使用本地服务
编辑 `.env` 文件：
```bash
# 使用本地embedding服务
OPENAI_BASE_URL=http://localhost:5001
OPENAI_API_KEY=dummy  # 本地服务不需要真实key
EMBEDDING_MODEL=paraphrase-multilingual-MiniLM-L12-v2
```

---

## 📝 API使用示例

### 生成单个文本的向量
```bash
curl -X POST http://localhost:5001/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "input": "平面设计能力"
  }'
```

**返回**：
```json
{
  "object": "list",
  "data": [{
    "object": "embedding",
    "index": 0,
    "embedding": [0.123, -0.456, ...] // 384维向量
  }],
  "model": "paraphrase-multilingual-MiniLM-L12-v2"
}
```

### 批量生成向量
```bash
curl -X POST http://localhost:5001/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "input": ["平面设计", "前端开发", "产品规划"]
  }'
```

### 健康检查
```bash
curl http://localhost:5001/health
```

**返回**：
```json
{
  "status": "ok",
  "model": "paraphrase-multilingual-MiniLM-L12-v2",
  "dimensions": 384
}
```

---

## 🔧 与后端集成

### 修改QdrantVector服务
需要修改 `src/services/qdrantVector.service.ts` 的向量维度：

```typescript
// 原来是1536维（OpenAI）
// 现在改为384维（本地模型）

async initializeCollections() {
  const collections = [
    {
      name: 'qicheng_tags',
      vectorSize: 384, // 改为384
      ...
    },
    {
      name: 'qicheng_student_profiles',
      vectorSize: 384, // 改为384
      ...
    },
    // ... 其他collections
  ]
}
```

### 使用OpenAI客户端
后端代码无需修改，OpenAI客户端会自动使用配置的baseURL：

```typescript
import { openai } from '../config/openai'

// 自动调用本地服务
const embedding = await openai.embeddings.create({
  model: 'paraphrase-multilingual-MiniLM-L12-v2',
  input: '测试文本'
})
```

---

## ⚡ 性能对比

| 指标 | OpenAI API | 本地模型 |
|------|-----------|---------|
| 速度 | 100-500ms (网络) | 10-50ms (本地) |
| 成本 | $0.02 / 1M tokens | 免费 |
| 维度 | 1536 | 384 |
| 质量 | 很好 | 好 |
| 稳定性 | 依赖网络 | 本地稳定 |

**本地模型优势**：
- ✅ 免费无限使用
- ✅ 速度更快（无网络延迟）
- ✅ 数据隐私（不发送到外部）
- ✅ 不依赖API配额

**劣势**：
- ⚠️ 向量维度较低（384 vs 1536）
- ⚠️ 需要占用约420MB内存
- ⚠️ 质量略低于OpenAI

---

## 🔄 从Mock数据切换到真实向量

### 1. 启动本地embedding服务
```bash
./start_embedding.sh
```

### 2. 修改配置
```bash
# .env
OPENAI_BASE_URL=http://localhost:5001
```

### 3. 修改向量维度
```bash
# 修改所有Collections的vectorSize从1536改为384
```

### 4. 重新初始化Qdrant
```bash
npm run qdrant:init
```

### 5. 导入真实数据
```bash
npm run vector:import-mock
```

现在使用的是真实的语义向量，不是Mock数据！

---

## 📊 内存使用

### 运行时内存占用
```
模型文件: 420MB (磁盘)
运行时内存: ~600MB (RAM)
单次推理: ~10MB (临时)
```

### 总计
```
磁盘: 420MB
内存: 600MB
```

**适合的设备**：
- ✅ 普通笔记本（8GB+内存）
- ✅ 云服务器（2GB+内存）
- ✅ 开发环境

---

## 🐛 故障排查

### 1. 端口被占用
```bash
# 查看5001端口
lsof -i :5001

# 修改端口
# 编辑 embedding_service.py
app.run(host='0.0.0.0', port=5002)
```

### 2. 模型下载失败
```bash
# 手动下载
python3 -c "
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
"
```

### 3. 内存不足
```bash
# 使用更小的模型 (只有110MB)
paraphrase-MiniLM-L3-v2
```

---

## 🎯 生产环境建议

### 使用systemd管理服务
创建 `/etc/systemd/system/embedding.service`:
```ini
[Unit]
Description=Local Embedding Service
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/python3 embedding_service.py
Restart=always

[Install]
WantedBy=multi-user.target
```

启动：
```bash
sudo systemctl start embedding
sudo systemctl enable embedding
```

### 使用Docker
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY embedding_service.py .
RUN pip install sentence-transformers flask numpy
EXPOSE 5001
CMD ["python", "embedding_service.py"]
```

---

## 📈 扩展选项

### 使用GPU加速（如果有GPU）
```python
# 修改 embedding_service.py
model = SentenceTransformer(
    'paraphrase-multilingual-MiniLM-L12-v2',
    device='cuda'  # 使用GPU
)
```

### 使用更大的模型（更好质量）
```python
# 1.1GB，768维
model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
```

---

## ✅ 验证安装

```bash
# 1. 启动服务
./start_embedding.sh

# 2. 测试API
curl -X POST http://localhost:5001/embeddings \
  -H "Content-Type: application/json" \
  -d '{"input": "测试"}'

# 3. 查看健康状态
curl http://localhost:5001/health
```

**成功标志**：
```
✓ 返回384维向量
✓ 服务响应时间 < 100ms
✓ 支持中英文文本
```

---

## 🎉 总结

**本地embedding服务的优势**：
1. ✅ 免费无限使用
2. ✅ 只需420MB空间
3. ✅ 速度快（本地推理）
4. ✅ 数据隐私
5. ✅ 不依赖外部API

**适合的场景**：
- 开发测试环境
- 预算有限的项目
- 对数据隐私有要求
- 需要高并发的场景

**立即开始使用！** 🚀
