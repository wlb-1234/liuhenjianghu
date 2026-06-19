# 静态文件路径修复补丁

> **文件**：server/src/index.ts  
> **问题**：访问 /admin 返回 500 错误  
> **原因**：publicDir 路径配置错误

---

## 当前状态：✅ 已修复

在 `server/src/index.ts` 第 66 行：

```typescript
// 静态文件目录（从 src/ 回到 server/ 目录）
const publicDir = path.join(__dirname, '..', 'public');
```

---

## 路径对照

| 项目 | 路径 |
|------|------|
| 编译后 JS | `dist/src/index.js` |
| public 目录 | `dist/../public` = `dist/public` 的上一级 |
| 正确指向 | `server/public/` |

---

## 验证

```bash
# 本地测试
curl http://localhost:9091/admin

# 应该返回包含 "流痕江湖管理后台" 的 HTML
```

---

## 管理后台路由

```typescript
// server/src/index.ts
app.use(express.static(publicDir));           // 静态文件
app.get('/admin', (req, res) => {              // 管理后台页面
  res.sendFile(path.join(publicDir, 'admin.html'));
});
app.get('/admin-mobile', (req, res) => {      // 移动端后台
  res.sendFile(path.join(publicDir, 'admin-mobile.html'));
});
```
