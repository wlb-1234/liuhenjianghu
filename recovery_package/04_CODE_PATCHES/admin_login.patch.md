# 管理后台登录测试模式代码补丁

> **文件**：server/src/index.ts  
> **位置**：在 `app.post('/api/v1/admin/login'` 路由处理函数中  
> **作用**：允许指定账号直接登录（绕过数据库验证）

---

## 实际代码（已存在）

在 `server/src/index.ts` 第 100-114 行：

```typescript
// 测试模式：只要密码是 admin123 就允许登录（临时解决方案）
if (password === 'admin123' && phone === '15613594588') {
  console.log('[Admin Login] 测试模式登录成功 - 账号:', phone);
  const token = crypto.randomBytes(32).toString('hex');
  return res.json({
    success: true,
    data: {
      id: 999,
      phone: phone,
      nickname: '管理员',
      member_level: 4,
      token
    }
  });
}
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
| Token | 32位随机十六进制字符串 |

---

## 测试验证

```bash
# 测试登录
curl -X POST https://liuhenjianghu-production.up.railway.app/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"15613594588","password":"admin123"}'

# 预期返回：
# {"success":true,"data":{"id":999,"phone":"15613594588","nickname":"管理员","member_level":4,"token":"..."}}
```

---

## 管理后台地址

- URL: https://liuhenjianghu-production.up.railway.app/admin
- 路由文件: server/public/admin.html
- 静态资源路径: server/public/
