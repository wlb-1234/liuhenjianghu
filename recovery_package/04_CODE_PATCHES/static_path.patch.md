# 静态文件路径修复补丁

> **文件**：server/src/index.ts  
> **问题**：访问 /admin 返回 500 错误  
> **原因**：publicDir 路径配置错误

---

## 问题现象

```
Error: ENOENT: no such file or directory, stat '/workspace/projects/server/src/public/admin.html'
```

## 原因

编译后的 JavaScript 文件位于 `server/dist/index.js`，但 public 目录在 `server/public/`。

## 修复代码

```typescript
// 找到以下代码（约在第 66 行）：
// const publicDir = path.join(__dirname, 'public');

// 修改为：
const publicDir = path.join(__dirname, '..', 'public');
```

---

## 应用步骤

1. 打开 `server/src/index.ts` 文件
2. 搜索 `const publicDir = path.join(__dirname, 'public');`
3. 修改为 `const publicDir = path.join(__dirname, '..', 'public');`
4. 保存文件
5. 重新构建：`pnpm run build`
6. 提交代码：`git add -A && git commit -m "fix: 修复静态文件路径" && git push`

---

## 路径对照

| 修复前 | 修复后 |
|--------|--------|
| `dist/src/public/` | `dist/public/` |
| ❌ 找不到 | ✅ 正确 |

---

## 验证

```bash
# 本地测试
curl http://localhost:9091/admin

# 应该返回包含 "流痕江湖管理后台" 的 HTML
```
