# 流痕江湖 官网（website/）

本目录存放 `info.liuhenjianghu.com` 官网所需的 **纯静态页面**，用于：
- 微信开放平台「移动应用」AppID 申请时的**应用官网**；
- 苹果 App Store / 安卓市场上架所需的**隐私政策**、**用户协议**公开页面。

## 文件说明

| 文件 | 用途 |
|------|------|
| `index.html` | 官网首页（品牌介绍、核心功能、下载引导、关于我们、备案号） |
| `privacy.html` | 隐私政策（对齐 App 相机/相册/定位/通知权限及主体信息） |
| `terms.html` | 用户协议（含账号、内容规范、付费会员、注销条款） |

## 部署方式

在**服务器**（阿里云 `47.116.142.121`）上执行项目根目录的 `deploy_site.sh`：

```bash
# 先把仓库同步到服务器（复用已有 SSH 部署链路）
git fetch origin && git reset --hard origin/main

# 执行官网部署
bash deploy_site.sh
```

脚本会：
1. 将 3 个 HTML 拷贝到 `/opt/site/liuhenjianghu/`；
2. 若检测到 Nginx，自动生成 `liuhenjianghu-sitelanding.conf` 站点配置（HTTP 80 跳转 HTTPS 443）并重载。证书需放在 `/etc/nginx/ssl/`（见脚本内注释）。

> 若你的服务器用**宝塔面板**或已有 Nginx 站点，直接忽略脚本的 Nginx 步骤，将 `website/` 三个 HTML 上传到已有站点根目录即可，并确保该站点 root 指向含 `index.html` 的目录。

## 需要你补充/注意

1. **图片素材**：首页当前为纯色占位。建议替换为 App 真实截图（发布动态 / 社交互动 / 会员特权等）放入 `website/images/` 并引用，以提升审核通过率和转化。
2. **备案号展示**：页脚已含「冀ICP备2026026350号-1」并链接到工信部备案查询，与你的备案一致。
3. **邮箱**：`support@liuhenjianghu.com` 是对外联系邮箱，若有实际可用邮箱请替换。
4. **HTTPS（可选）**：微信与上架建议启用 HTTPS。若服务器已装 certbot，可在 Nginx 配置上追加 443 SSL 段（需在网站根目录提供 `.well-known/acme-challenge/`）。