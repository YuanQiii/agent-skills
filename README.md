# Agent Skills Sync

Agent Skills 双向同步工具，支持本地实时监视和 GitHub Actions 定时同步。

## 📋 功能特性

- ✅ 本地文件变化自动监视并同步到 GitHub
- ✅ GitHub Actions 定时备份（每2小时）
- ✅ 支持手动触发同步
- ✅ 完整的 Git 版本控制

## 🚀 快速开始

### 第一步：安装依赖

```bash
cd c:\Users\93402\.agents
pnpm install
```

### 第二步：配置 Git 认证

```bash
git config --global credential.helper store
git remote add origin https://github.com/YuanQiii/agent-skills.git
```

### 第三步：推送到 GitHub

```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 第四步：启动本地监视（可选）

```bash
pnpm run watch
```

## 📁 目录结构

```
c:\Users\93402\.agents\
├── skills/                    # Skills 文件夹
│   ├── skill-a/
│   │   └── SKILL.md
│   └── skill-b/
│       └── SKILL.md
├── .github/
│   └── workflows/             # GitHub Actions
│       ├── manual-sync.yml    # 手动同步
│       ├── scheduled-backup.yml # 定时备份
│       └── auto-sync.yml      # 自动确认
├── .skill-lock.json           # Skills 锁定文件
├── package.json              # 方案三依赖
├── watch.js                  # 本地监视脚本
├── sync.js                   # 手动同步脚本
└── .gitignore
```

## 🔧 使用方法

### 本地监视模式（方案三）

```bash
pnpm run watch
```

监视到文件变化后 5 秒自动同步到 GitHub。

### 手动同步

```bash
pnpm run sync
```

立即同步所有变更到 GitHub。

### GitHub Actions

#### 手动同步
1. 访问 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 选择 "手动同步" workflow
4. 点击 "Run workflow"

#### 定时同步
每2小时自动执行一次。

## ⚠️ 注意事项

1. **首次推送需要认证**：确保已配置 GitHub 认证
2. **监视延迟**：文件变化后 5 秒才触发同步
3. **网络要求**：需要网络连接才能同步

## 🔐 GitHub 认证配置

### 方法1：Personal Access Token
```bash
git remote set-url origin https://<TOKEN>@github.com/YuanQiii/agent-skills.git
```

### 方法2：Git Credential Helper
```bash
git config --global credential.helper store
git push # 首次会提示输入用户名和密码
```

## 📝 更新日志

- 2026-05-02: 初始版本
