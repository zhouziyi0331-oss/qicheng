# Qdrant向量数据库 - Docker部署指南

## 📋 什么是Qdrant？

Qdrant是一个**开源的高性能向量数据库**，专门用于存储和检索向量embeddings。它支持：

- ✅ **毫秒级向量检索** - ANN (Approximate Nearest Neighbor) 算法
- ✅ **高性能** - Rust编写，性能优异
- ✅ **轻量级** - 资源占用少，适合中小规模
- ✅ **易部署** - Docker一键启动
- ✅ **生产级** - 被很多公司用在生产环境

---

## 🚀 快速开始（5分钟）

### 方式1: Docker命令启动（推荐）

```bash
# 启动Qdrant（本地开发）
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# 检查是否启动成功
curl http://localhost:6333
# 返回: {"title":"qdrant - vector search engine","version":"..."}
```

**端口说明**：
- `6333` - HTTP API端口（主要使用）
- `6334` - gRPC端口（可选）

**数据持久化**：
- `-v $(pwd)/qdrant_storage:/qdrant/storage` - 数据存储在本地`qdrant_storage`目录

### 方式2: Docker Compose启动

创建 `docker-compose.qdrant.yml`:

```yaml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: unless-stopped
```

启动：
```bash
docker-compose -f docker-compose.qdrant.yml up -d
```

---

## ⚙️ 配置后端

### 1. 环境变量配置

编辑 `.env` 文件：

```bash
# Qdrant配置
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # 本地开发可以为空，生产环境必须设置

# OpenAI API Key（生成向量）
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx  # 你的真实密钥
```

### 2. 初始化Qdrant Collections

```bash
cd /Users/alwan/code/qicheng/miniapp/backend

# 初始化Qdrant（创建Collections）
npx ts-node src/scripts/initQdrant.ts
```

输出：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Qdrant向量数据库初始化
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/3] 检查Qdrant连接...
✓ Qdrant连接成功

[2/3] 创建Collections...
✓ Collections创建完成

[3/3] 获取统计信息...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Collection统计信息
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
标签向量:     0 个
学生画像:     0 个
项目画像:     0 个
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Qdrant初始化完成！
```

### 3. 导入标签数据

```bash
# 导入200+标签并生成向量
npx ts-node src/scripts/importTags.ts
```

这会：
1. 在MongoDB中创建标签文档
2. 为每个标签生成1536维向量（OpenAI）
3. 将向量存入Qdrant

**预计时间**：3-5分钟（取决于OpenAI API速度）

---

## 🔍 验证部署

### 1. 检查Qdrant Web UI

浏览器访问：`http://localhost:6333/dashboard`

你会看到：
- Collections列表
- 向量数量
- 集群状态

### 2. 使用API测试

```bash
# 获取所有Collections
curl http://localhost:6333/collections

# 获取标签向量Collection信息
curl http://localhost:6333/collections/qicheng_tags

# 搜索向量（示例）
curl -X POST http://localhost:6333/collections/qicheng_tags/points/search \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, ...],
    "limit": 10
  }'
```

### 3. 测试后端推荐API

```bash
# 启动后端
npm run dev

# 测试智能推荐
curl -X GET http://localhost:3000/api/vector-match/recommendations?limit=10 \
  -H "Authorization: Bearer <token>"
```

---

## 📦 生产环境部署

### 阿里云/腾讯云服务器部署

#### 1. 安装Docker

```bash
# CentOS/RedHat
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
```

#### 2. 启动Qdrant

```bash
# 创建数据目录
mkdir -p /data/qdrant

# 启动Qdrant
docker run -d \
  --name qdrant \
  --restart=always \
  -p 6333:6333 \
  -p 6334:6334 \
  -v /data/qdrant:/qdrant/storage \
  -e QDRANT__SERVICE__API_KEY=你的密钥 \
  qdrant/qdrant
```

#### 3. 配置防火墙

```bash
# 开放端口（内网访问）
sudo firewall-cmd --permanent --add-port=6333/tcp
sudo firewall-cmd --reload

# 或使用iptables
sudo iptables -A INPUT -p tcp --dport 6333 -j ACCEPT
```

**安全建议**：
- ⚠️ **不要**将6333端口暴露到公网
- ✅ 只允许后端服务器内网访问
- ✅ 使用`QDRANT__SERVICE__API_KEY`设置API密钥

#### 4. 更新后端配置

```bash
# 生产环境 .env
QDRANT_URL=http://内网IP:6333
QDRANT_API_KEY=你的密钥
```

---

## 🔧 常用操作

### 查看日志

```bash
docker logs -f qdrant
```

### 停止/重启

```bash
# 停止
docker stop qdrant

# 重启
docker restart qdrant

# 删除（会删除容器，但数据保留在volume）
docker rm -f qdrant
```

### 备份数据

```bash
# 数据在qdrant_storage目录
tar -czf qdrant_backup_$(date +%Y%m%d).tar.gz qdrant_storage/

# 恢复
tar -xzf qdrant_backup_20260717.tar.gz
```

### 清空数据（重新开始）

```bash
# 停止容器
docker stop qdrant

# 删除数据
rm -rf qdrant_storage/

# 重新启动
docker start qdrant

# 重新初始化
npx ts-node src/scripts/initQdrant.ts
npx ts-node src/scripts/importTags.ts
```

---

## 📊 性能监控

### 查看Collection统计

```bash
curl http://localhost:6333/collections/qicheng_tags
```

返回：
```json
{
  "result": {
    "status": "green",
    "points_count": 200,
    "indexed_vectors_count": 200,
    "vectors_count": 200
  }
}
```

### 监控资源占用

```bash
# CPU和内存
docker stats qdrant

# 磁盘占用
du -sh qdrant_storage/
```

---

## ⚡ 性能优化

### 1. 增加内存限制

```bash
docker run -d \
  --name qdrant \
  --memory=2g \
  --memory-swap=2g \
  -p 6333:6333 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

### 2. 优化索引配置

在创建Collection时调整参数（已在代码中配置）：

```typescript
optimizers_config: {
  default_segment_number: 2  // 段数量
},
replication_factor: 1  // 副本数（集群模式）
```

### 3. 批量操作

- ✅ 批量插入向量（已实现）
- ✅ 批量检索（已实现）

---

## 🐛 常见问题

### Q1: 端口6333被占用

```bash
# 查看占用进程
lsof -i :6333

# 使用其他端口
docker run -d \
  --name qdrant \
  -p 7333:6333 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# 更新.env
QDRANT_URL=http://localhost:7333
```

### Q2: 连接失败

```
错误：Qdrant连接失败
```

检查：
1. Qdrant是否启动：`docker ps | grep qdrant`
2. 端口是否正确：`curl http://localhost:6333`
3. 防火墙是否阻止：`telnet localhost 6333`

### Q3: 性能慢

原因：
- 向量维度高（1536维）
- 数据量大
- 磁盘IO慢

优化：
1. 使用SSD存储
2. 增加内存
3. 调整`default_segment_number`

### Q4: 内存占用高

Qdrant会将索引加载到内存以提高性能。正常情况：

- 200个向量：~50MB
- 1000个向量：~200MB
- 10000个向量：~1.5GB

如果内存不足，可以限制：
```bash
docker run -d \
  --name qdrant \
  --memory=512m \
  -p 6333:6333 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

---

## 📚 更多资源

- **Qdrant官方文档**: https://qdrant.tech/documentation/
- **Docker Hub**: https://hub.docker.com/r/qdrant/qdrant
- **GitHub**: https://github.com/qdrant/qdrant
- **社区**: https://discord.gg/qdrant

---

## 🎯 下一步

部署完成后：

1. ✅ 启动Qdrant容器
2. ✅ 初始化Collections
3. ✅ 导入标签数据
4. ✅ 测试推荐API
5. 📈 监控性能和资源

然后就可以享受**真正的向量检索**了！🚀
