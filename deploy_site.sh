#!/bin/bash
# ==============================================
#  流痕江湖 - 官网静态站部署脚本
#
#  说明：将 website/ 目录发布到服务器 Nginx 静态站点。
#  适用：已通过 SSH 访问的阿里云服务器（liuhenjianghu.com）
#
#  用法：
#   方式一（服务器本地执行）：
#      将本仓库传至服务器后，cd 仓库根目录执行：
#      bash deploy_site.sh
#   方式二（先本地打包上传）：
#      tar czf website.tar.gz website/ deploy_site.sh
#      scp website.tar.gz user@47.116.142.121:/opt/
#      ssh user@47.116.142.121 "cd /opt && tar xzf website.tar.gz && bash deploy_site.sh"
# ==============================================

set -e

SITE_SRC="./website"
DEFAULT_ROOT="/opt/site/liuhenjianghu"
SITE_ROOT="${SITE_ROOT:-$DEFAULT_ROOT}"

echo "=============================================="
echo "  流痕江湖 官网部署"
echo "=============================================="

# 1. 校验源目录（允许在根目录或含 website 的任意上级执行）
if [ ! -d "$SITE_SRC" ]; then
  echo "错误：未找到 ./website 目录，请在仓库根目录执行"
  exit 1
fi
if [ ! -f "$SITE_SRC/index.html" ]; then
  echo "错误：website/index.html 不存在"
  exit 1
fi

# 2. 创建站点目录并拷贝静态文件
mkdir -p "$SITE_ROOT"
cp "$SITE_SRC/index.html"  "$SITE_ROOT/"
cp "$SITE_SRC/privacy.html" "$SITE_ROOT/"
cp "$SITE_SRC/terms.html" "$SITE_ROOT/"
echo "静态文件已拷贝到 $SITE_ROOT"

# 3. 尝试用 Nginx 托管
if command -v nginx >/dev/null 2>&1; then
  NGINX_CONF="/etc/nginx/conf.d/liuhenjianghu-sitelanding.conf"
  echo "检测到 Nginx，生成站点配置：$NGINX_CONF"
  cat > "$NGINX_CONF" <<NGINX_EOF
server {
    listen 80;
    server_name liuhenjianghu.com www.liuhenjianghu.com;

    # 官网静态站（落地页 / 隐私政策 / 用户协议）
    root $SITE_ROOT;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_types text/html text/css application/javascript application/json image/svg+xml;
}
NGINX_EOF
  if nginx -t 2>/dev/null; then
    systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true
    echo "Nginx 配置已生效"
  else
    echo "警告：Nginx 配置检测未通过，请手动检查：$NGINX_CONF"
  fi
else
  echo "未检测到 Nginx，请手动将 $SITE_ROOT 指向你的网站根目录执行。"
fi

echo ""
echo "----------------------------------------------"
echo "  部署完成。"
echo "  站点根目录：$SITE_ROOT"
echo "  官网地址：https://liuhenjianghu.com"
echo "  提示：请确认 80 端口放行、DNS 解析、ICP 备案均已生效。"
echo "  如你的站点由宝塔/云速建站托管，可忽略 Nginx 步骤，"
echo "  直接将 website/ 三个 html 上传到站点根目录即可。"
echo "----------------------------------------------"