# IPFS 去中心化存储配置指南

## 概述

「流痕江湖」已集成 IPFS 去中心化存储，图片将上传到 IPFS 网络，永久保存，去中心化分发。

## Pinata 免费账号注册

### 1. 注册 Pinata 账号

1. 访问 https://app.pinata.cloud/
2. 点击 "Sign Up" 注册账号
3. 使用邮箱注册（Google/GitHub 登录也支持）

### 2. 获取 API Key

1. 登录后进入 Dashboard
2. 点击右上角头像 → "API Keys"
3. 点击 "New Key" 创建新密钥
4. 复制 API Key 和 API Secret

### 3. 免费额度

| 项目 | 免费额度 |
|------|---------|
| 存储空间 | 1GB |
| 固定(Pin) | 无限制 |
| 带宽 | 足够个人使用 |

## 配置步骤

### 1. 创建 .env 文件

```bash
cd server
cp .env.example .env
```

### 2. 编辑 .env 文件

```bash
# 添加 Pinata API 密钥
PINATA_API_KEY=你的APIKey
PINATA_API_SECRET=你的APISecret
```

### 3. 重启服务

```bash
pnpm run dev
```

## 工作原理

```
用户上传图片
     ↓
后端接收图片
     ↓
上传到 IPFS (Pinata)
     ↓
返回 IPFS Gateway URL
     ↓
图片永久存储在 IPFS 网络
```

## 返回格式

```json
{
  "success": true,
  "files": [
    {
      "url": "https://gateway.pinata.cloud/ipfs/Qmxxx...",
      "cid": "Qmxxx...",
      "filename": "photo.jpg",
      "size": 102400,
      "storage": "ipfs"
    }
  ],
  "storage": "ipfs"
}
```

## 图片访问

- **通过 Pinata 网关访问**：`https://gateway.pinata.cloud/ipfs/{CID}`
- **通过公共网关访问**：`https://ipfs.io/ipfs/{CID}`
- **通过 Cloudflare 网关**：`https://cloudflare-ipfs.com/ipfs/{CID}`

## 备选方案

当 Pinata API 未配置时，系统会自动使用本地存储作为备选：

```
uploads/
  └── {timestamp}_{random}.{ext}
```

本地存储的图片通过 `http://localhost:9091/uploads/{filename}` 访问。

## 故障排查

### Q: 上传失败？
A: 检查 `PINATA_API_KEY` 和 `PINATA_API_SECRET` 是否正确

### Q: 图片无法访问？
A: 可能是网关拥堵，尝试更换网关或等待重试

### Q: 存储空间不足？
A: Pinata 免费 1GB，可删除不需要的文件或升级付费套餐

## 未来升级

当用户量增加后，可考虑：

1. **升级 Pinata 套餐** - 更多存储空间
2. **自建 IPFS 节点** - 完全控制
3. **Filecoin 存储** - 更便宜、更持久
4. **IPFS Cluster** - 多节点分发
