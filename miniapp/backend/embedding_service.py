# Local Embedding Service
# 本地向量生成服务（免费，不依赖API）

from sentence_transformers import SentenceTransformer
from flask import Flask, request, jsonify
import numpy as np

app = Flask(__name__)

# 加载模型（首次运行会自动下载，约420MB）
print("加载embedding模型...")
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
print("模型加载完成！")

@app.route('/embeddings', methods=['POST'])
def create_embeddings():
    """
    生成向量
    请求格式：
    {
      "input": "文本" 或 ["文本1", "文本2"],
      "model": "paraphrase-multilingual-MiniLM-L12-v2" (可选)
    }
    """
    try:
        data = request.json
        input_text = data.get('input')

        if not input_text:
            return jsonify({'error': '缺少input参数'}), 400

        # 支持单个文本或文本数组
        if isinstance(input_text, str):
            texts = [input_text]
        else:
            texts = input_text

        # 生成向量
        embeddings = model.encode(texts, convert_to_numpy=True)

        # 转换为OpenAI格式
        response = {
            'object': 'list',
            'data': [],
            'model': 'paraphrase-multilingual-MiniLM-L12-v2',
            'usage': {
                'prompt_tokens': sum(len(t.split()) for t in texts),
                'total_tokens': sum(len(t.split()) for t in texts)
            }
        }

        for i, embedding in enumerate(embeddings):
            response['data'].append({
                'object': 'embedding',
                'index': i,
                'embedding': embedding.tolist()
            })

        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model': 'paraphrase-multilingual-MiniLM-L12-v2',
        'dimensions': 384
    })

if __name__ == '__main__':
    print("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  本地Embedding服务已启动")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("地址: http://localhost:5001")
    print("API: POST /embeddings")
    print("模型: paraphrase-multilingual-MiniLM-L12-v2")
    print("维度: 384")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    app.run(host='0.0.0.0', port=5001, debug=False)
