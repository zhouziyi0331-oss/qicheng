#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  安装本地Embedding服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python3，请先安装Python"
    exit 1
fi

echo "✓ Python版本: $(python3 --version)"
echo ""

# 安装依赖
echo "[1/3] 安装Python依赖..."
pip3 install sentence-transformers flask numpy -q

if [ $? -eq 0 ]; then
    echo "✓ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

echo ""
echo "[2/3] 下载embedding模型（首次运行，约420MB）..."
echo "提示：模型会缓存到 ~/.cache/torch/sentence_transformers/"
echo ""

# 测试模型下载
python3 -c "
from sentence_transformers import SentenceTransformer
print('正在下载模型...')
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print('✓ 模型下载完成')
print(f'✓ 向量维度: {model.get_sentence_embedding_dimension()}')
"

if [ $? -eq 0 ]; then
    echo ""
    echo "[3/3] 安装完成！"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  启动命令"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "python3 embedding_service.py"
    echo ""
    echo "或使用："
    echo "./start_embedding.sh"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ 安装失败"
    exit 1
fi
