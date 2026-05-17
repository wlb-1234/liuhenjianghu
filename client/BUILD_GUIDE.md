# 流痕江湖 - App 构建与更新指南

## 一、打包 APK（Android 安装包）

### 方式一：云端构建（推荐 - 无需本地配置）

使用 EAS Build 云端服务：

```bash
cd client

# 1. 登录 EAS (首次需要)
eas login

# 2. 初始化项目
eas project:init

# 3. 构建预览版
eas build --platform android --profile preview

# 4. 构建正式版
eas build --platform android --profile production
```

构建完成后，下载链接会自动生成。

### 方式二：本地构建（需要 Android SDK）

```bash
# 确保已安装 Android SDK
export ANDROID_HOME=~/Android/Sdk

# 预览版
eas build --platform android --profile preview --local

# 正式版
eas build --platform android --profile production --local
```

构建完成后，APK 文件位于 `./android/app/build/outputs/apk/` 目录。

### 方式二：使用构建脚本

```bash
cd client
./scripts/build.sh
```

---

## 二、后续更新 App（无需重新打包）

当您修改代码后，可以直接发布更新，无需重新构建 APK：

### 1. 发布更新

```bash
cd client
eas update --branch production --message "修复了xxx问题"
```

### 2. 用户端自动接收

已安装 App 的用户会自动检测到更新并提示安装。

---

## 三、EAS Update 工作原理

```
首次安装 → 完整 App (APK)
    ↓
代码更新 → 仅更新部分 (JS Bundle)
    ↓
用户自动下载 → 无需重新安装
```

**优势**：
- 更新包体积小（仅几百 KB）
- 用户无需卸载重装
- 发布后几秒内即可推送给用户

---

## 四、常见问题

### Q: 需要配置 EAS 账号吗？
A: 是的，首次使用需要：
1. 在 https://expo.dev 注册账号
2. 运行 `eas login` 登录
3. 运行 `eas project:init` 关联项目

### Q: 如何发布到应用市场？
A: 正式发布需要：
1. 配置 Google Play 开发者账号
2. 使用正式版 APK 提交审核
3. 审核通过后自动上架

### Q: 更新失败怎么办？
A: 可以回退到旧版本：
```bash
eas update:rollback --branch production
```

---

## 五、更新检查清单

发布更新前请确认：

- [ ] 代码已提交到 git
- [ ] 静态检查通过 (`pnpm -w lint:client`)
- [ ] 后端服务正常
- [ ] 测试过新功能
