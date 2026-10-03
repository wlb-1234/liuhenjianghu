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
# 官网域名（info 子域，与 App 业务/接口域名隔离）
SITE_DOMAIN="info.liuhenjianghu.com"

echo "=============================================="
echo "  流痕江湖 官网部署  ($SITE_DOMAIN)"
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

# 2. 创建站点目录并拷贝静态文件（含图片素材目录）
mkdir -p "$SITE_ROOT"
cp "$SITE_SRC/index.html"  "$SITE_ROOT/"
cp "$SITE_SRC/privacy.html" "$SITE_ROOT/"
cp "$SITE_SRC/terms.html" "$SITE_ROOT/"
if [ -d "$SITE_SRC/images" ]; then
  cp -r "$SITE_SRC/images" "$SITE_ROOT/"
  echo "图片素材已拷贝到 $SITE_ROOT/images"
fi
echo "静态文件已拷贝到 $SITE_ROOT"

# 2.5 校验 info 证书是否存在（私钥不入库，需手动放置）
CERT="/etc/nginx/ssl/info.liuhenjianghu.com.pem"
CRTKEY="/etc/nginx/ssl/info.liuhenjianghu.com.key"
if [ -f "$CERT" ] && [ -f "$CRTKEY" ]; then
  echo "检测到证书：$CERT 与 $CRTKEY"
else
  echo "⚠️ 未找到 info 证书：$CERT / $CRTKEY"
  echo "   请手动将证书(.pem)与私钥(.key)上传到 /etc/nginx/ssl/ 后再部署 HTTPS。"
fi

# 3. 尝试用 Nginx 托管
if command -v nginx >/dev/null 2>&1; then
  NGINX_CONF="/etc/nginx/conf.d/liuhenjianghu-sitelanding.conf"
  echo "检测到 Nginx，生成站点配置：$NGINX_CONF"
  cat > "$NGINX_CONF" <<NGINX_EOF
# 80 端口：HTTP 访问统一跳转 HTTPS（官网以 HTTPS 示审更规范）
server {
    listen 80;
    server_name ${SITE_DOMAIN};
    return 301 https://\${SITE_DOMAIN}\$request_uri;
}

# 443 端口：官网静态站（落地页 / 隐私政策 / 用户协议）
server {
    listen 443 ssl;
    server_name ${SITE_DOMAIN};

    # info 子域专用证书（双域名 DV 证书，SAN 覆盖 info/www.info）
    # 请将证书文件放到服务器下方路径（私有密钥勿入库）
    ssl_certificate     /etc/nginx/ssl/info.liuhenjianghu.com.pem;
    ssl_certificate_key /etc/nginx/ssl/info.liuhenjianghu.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;

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
echo "  官网地址：https://$SITE_DOMAIN"
echo "  提示：请确认 80 端口放行、DNS 解析、ICP 备案均已生效。"
echo "  ⚠️ 证书为免费 90 天 DV 证书，到期需在证书商后台手动续期并更新 /etc/nginx/ssl/ 下文件。"
echo "  如你的站点由宝塔/云速建站托管，可忽略 Nginx 步骤，"
echo "  直接将 website/ 三个 html 上传到站点根目录即可。"
echo "----------------------------------------------"