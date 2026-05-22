#!/bin/bash
set -e

echo "==================== Railway 构建脚本 ===================="
echo "开始安装依赖..."

cd /workspace/projects/server
pnpm install

echo "构建完成，开始启动服务..."
pnpm run start
