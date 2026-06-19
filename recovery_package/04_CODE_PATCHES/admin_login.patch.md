# 管理后台登录测试模式代码补丁

> **文件**：server/src/index.ts  
> **位置**：在 `/api/v1/admin/login` 路由处理函数中添加  
> **作用**：允许指定账号直接登录（绕过数据库验证）

---

## 补丁代码

```typescript
// 查找以下代码（大约在文件中部）：
app.post('/api/v1/admin/login', async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  
  // === 在这里添加测试模式代码 ===
  
  // 测试模式登录 - 指定账号直接通过
  if (phone === '15613594588' && password === 'admin123') {
    console.log('[ADMIN] 测试模式登录成功:', phone);
    return res.json({
      success: true,
      data: {
        id: 999,
        phone: '15613594588',
        nickname: '管理员',
        member_level: 4,
        token: 'test_token_' + Date.now()
      }
    });
  }
  
  // === 测试模式结束 ===
  
  // ... 原有验证逻辑继续
});
```

---

## 应用步骤

1. 打开 `server/src/index.ts` 文件
2. 搜索 `app.post('/api/v1/admin/login'`
3. 在 `const { phone, password } = req.body;` 之后添加测试模式代码
4. 保存文件
5. 提交代码：`git add -A && git commit -m "feat: 添加管理后台登录测试模式" && git push`

---

## 测试验证

```bash
# 测试登录
curl -X POST https://liuhenjianghu-production.up.railway.app/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"15613594588","password":"admin123"}'

# 预期返回：
# {"success":true,"data":{"id":999,"phone":"15613594588","nickname":"管理员","member_level":4,...}}
```

---

## 登录信息

| 字段 | 值 |
|------|-----|
| 手机号 | 15613594588 |
| 密码 | admin123 |
| 昵称 | 管理员 |
| 会员等级 | 4（L4 全国级会员）|
| 用户ID | 999 |
