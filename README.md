# Agent Skills Sync

Agent Skills 双向同步工具，支持本地实时监视和 GitHub Actions 定时同步。

## 📋 功能特性

- ✅ 本地文件变化自动监视并同步到 GitHub
- ✅ GitHub Actions 定时备份（每2小时）
- ✅ 支持手动触发同步
- ✅ 完整的 Git 版本控制
- ✅ 指数退避重试机制
- ✅ 文件日志记录
- ✅ 可配置参数（sync.config.json）

## 🚀 快速开始

### 第一步：安装依赖

```bash
cd ~/.agents
pnpm install
```

### 第二步：配置 Git 认证

```bash
# 方式1：Git Credential Manager（推荐 Windows）
git config --global credential.helper manager

# 方式2：GitHub CLI（推荐跨平台）
gh auth login

# 添加远程仓库
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
~/.agents/
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
├── package.json               # 依赖配置
├── sync.config.json           # 同步配置文件
├── utils.js                   # 公共工具模块
├── watch.js                   # 本地监视脚本
├── sync.js                    # 手动同步脚本
├── .gitignore
└── .gitattributes
```

## 🔧 使用方法

### 本地监视模式（方案三）

```bash
pnpm run watch
```

监视到文件变化后自动同步到 GitHub（默认5秒防抖）。

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

## ⚙️ 配置文件

编辑 `sync.config.json` 自定义行为：

```json
{
  "debounceMs": 5000,
  "branch": "main",
  "remote": "origin",
  "maxRetries": 3,
  "retryBaseDelayMs": 1000,
  "logToFile": true
}
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `debounceMs` | 5000 | 防抖延迟（毫秒） |
| `branch` | "main" | 推送分支 |
| `remote` | "origin" | 远程名称 |
| `maxRetries` | 3 | 最大重试次数 |
| `retryBaseDelayMs` | 1000 | 重试基础延迟（毫秒） |
| `logToFile` | true | 是否写入日志文件 |
| `logFileName` | "sync.log" | 日志文件名 |

## ⚠️ 注意事项

1. **首次推送需要认证**：确保已配置 GitHub 认证
2. **监视延迟**：文件变化后 5 秒才触发同步
3. **网络要求**：需要网络连接才能同步
4. **重试机制**：网络失败后自动重试3次（指数退避）

## 🔐 GitHub 认证配置

### 方法1：Git Credential Manager（推荐 Windows）
```bash
git config --global credential.helper manager
git push  # 首次会弹出 Windows 凭据管理器
```

### 方法2：GitHub CLI（推荐跨平台）
```bash
gh auth login
```

### 方法3：环境变量
```bash
# 设置自定义 .agents 目录
export AGENTS_DIR=/path/to/.agents
```

## 📝 更新日志

- 2026-05-02: 初始版本
- 2026-05-02: 修复安全问题、添加重试机制、配置文件支持
