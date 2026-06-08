#!/usr/bin/env bash
# 产物部署使用
set -euo pipefail

ROOT_DIR="$(pwd)"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-5000}"

# ==================== 工具函数 ====================
info() {
  echo "[INFO] $1"
}
warn() {
  echo "[WARN] $1"
}
error() {
  echo "[ERROR] $1"
  exit 1
}
check_command() {
  if ! command -v "$1" &> /dev/null; then
    error "命令 $1 未找到，请先安装"
  fi
}

# ============== 启动服务 ======================
# 检查核心命令
check_command "pnpm"
check_command "npm"

# Railway 可能把代码放在 /app/workspace/projects/ 或直接 /app/
if [ -d "/app/workspace/projects/server" ]; then
  SERVER_DIR="/app/workspace/projects/server"
elif [ -d "/app/server" ]; then
  SERVER_DIR="/app/server"
else
  SERVER_DIR="$ROOT_DIR/server"
fi

info "Server 目录: $SERVER_DIR"
info "开始执行：pnpm run start (server)"
(pushd "$SERVER_DIR" > /dev/null && PORT="$PORT" pnpm run start; popd > /dev/null) || error "服务启动失败"
info "服务启动完成！\n"
