# Agent Skills Sync

Agent Skills 双向同步工具，支持本地实时监视和 GitHub Actions 定时同步。

## 📋 功能特性

- ✅ 本地文件变化自动监视并同步到 GitHub
- ✅ GitHub Actions 定时备份（每2小时）
- ✅ 支持手动触发同步
- ✅ 完整的 Git 版本控制
- ✅ 指数退避重试机制
- ✅ 结构化日志 (pino) + 自动轮转
- ✅ DeepSeek API 自动翻译技能描述
- ✅ 技能分类索引自动生成
- ✅ TypeScript 严格模式 + 单元测试
- ✅ 可配置参数（sync.config.json）
- ✅ 删除的技能用横线标记保留历史记录

## 🚀 快速开始

### 第一步：安装依赖

```bash
cd ~/.agents
pnpm install
```

### 第二步：构建

```bash
pnpm run build
```

### 第三步：配置 Git 认证

```bash
# 方式1：Git Credential Manager（推荐 Windows）
git config --global credential.helper manager

# 方式2：GitHub CLI（推荐跨平台）
gh auth login

# 添加远程仓库
git remote add origin https://github.com/YuanQiii/agent-skills.git
```

### 第四步：推送到 GitHub

```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 第五步：启动本地监视（可选）

```bash
pnpm run watch
```

## 📁 目录结构

```
~/.agents/
├── skills/                       # Skills 文件夹
│   ├── skill-a/
│   │   └── SKILL.md
│   └── skill-b/
│       └── SKILL.md
├── src/                          # TypeScript 源码
│   ├── shared/                   # 跨层共享
│   │   ├── errors.ts             # 自定义错误类型
│   │   └── retry.ts              # 重试工具
│   ├── infra/                    # 基础设施层（外部依赖封装）
│   │   ├── config.ts             # 配置加载
│   │   ├── logger.ts             # pino 日志（中文输出）
│   │   ├── git-operations.ts     # Git 操作
│   │   └── translator.ts         # 翻译逻辑
│   ├── core/                     # 核心领域（纯业务逻辑）
│   │   ├── skills.ts             # 技能解析
│   │   └── catalog.ts            # 目录生成（含分类）
│   ├── sync/                     # 应用服务（同步编排）
│   │   ├── orchestrator.ts       # 同步编排
│   │   └── watcher.ts            # 文件监视
│   ├── cli/                      # CLI 入口
│   │   ├── catalog.ts
│   │   ├── sync.ts
│   │   └── translate.ts
│   └── __tests__/                # 单元测试
├── data/                         # 运行时生成的数据
│   ├── skills-catalog.md         # 自动生成的技能索引
│   └── translated-descriptions.json  # 翻译缓存
├── logs/                         # 日志文件（自动轮转，git 忽略）
├── dist/                         # 编译输出
├── .github/
│   └── workflows/
│       ├── ci.yml                # CI 构建 + 测试
│       ├── auto-sync.yml         # 自动同步确认
│       ├── manual-sync.yml       # 手动同步
│       └── scheduled-backup.yml  # 定时备份
├── .skill-lock.json
├── package.json
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── sync.config.json
├── pnpm-lock.yaml
└── .gitignore
```

## 🔧 使用方法

### 本地监视模式

```bash
pnpm run watch
```

监视到文件变化后自动同步到 GitHub（默认5秒防抖），新增 Skill 自动翻译。

### 手动同步

```bash
pnpm run sync
```

### 生成技能目录

```bash
pnpm run catalog
```

### 批量翻译

```bash
pnpm run translate
```

需要设置 `DEEPSEEK_API_KEY` 环境变量。

### 开发模式（无需编译）

```bash
pnpm run dev:watch
pnpm run dev:sync
pnpm run dev:catalog
pnpm run dev:translate
```

### 测试

```bash
pnpm test           # 运行测试
pnpm run lint       # ESLint 检查
pnpm run typecheck  # 类型检查
```

## ⚙️ 配置文件

编辑 `sync.config.json` 自定义行为：

```json
{
  "debounceMs": 5000,
  "branch": "main",
  "remote": "origin",
  "maxRetries": 3,
  "retryBaseDelayMs": 1000,
  "logLevel": "info",
  "translationRpm": 30
}
```

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `debounceMs` | 5000 | 防抖延迟（毫秒） |
| `branch` | "main" | 推送分支 |
| `remote` | "origin" | 远程名称 |
| `maxRetries` | 3 | 最大重试次数 |
| `retryBaseDelayMs` | 1000 | 重试基础延迟（毫秒） |
| `logLevel` | "info" | 日志级别 (trace/debug/info/warn/error) |
| `translationRpm` | 30 | 翻译 API 每分钟请求限制 |

## 🔐 环境变量

| 变量 | 说明 |
|------|------|
| `AGENTS_DIR` | 自定义 .agents 目录路径 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥（翻译功能必需） |
| `LOG_LEVEL` | 日志级别覆盖 |

## 📝 更新日志

- 2026-05-08: v3.1.0 — 迁移至 pnpm，日志改为中文，技能删除保留历史记录
- 2026-05-03: v3.0.0 — TypeScript 重构，pino 日志，单元测试，CI/CD
- 2026-05-02: 修复安全问题、添加重试机制、配置文件支持
- 2026-05-02: 初始版本