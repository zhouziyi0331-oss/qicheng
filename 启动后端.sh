#!/bin/bash

echo "🚀 启动后端服务"
echo ""

cd /Users/alwan/code/qicheng/backend

# 1. 修复 npm 权限（需要密码）
echo "1️⃣ 修复 npm 权限..."
sudo chown -R 501:20 "/Users/alwan/.npm"
echo ""

# 2. 安装缺失的依赖
echo "2️⃣ 安装缺失的依赖..."
npm install nanoid
echo ""

# 3. 启动后端
echo "3️⃣ 启动后端服务..."
npm run dev
