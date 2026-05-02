const fs = require('fs');
const path = require('path');
const { config, log } = require('./utils');

const CATEGORIES = {
  '前端框架与库': {
    keywords: ['vue', 'react', 'next', 'nuxt', 'svelte', 'angular', 'javascript', 'typescript', 'pinia', 'composition'],
    skills: []
  },
  'UI/UX 设计': {
    keywords: ['ui', 'ux', 'design', 'css', 'tailwind', 'shadcn', 'color', 'typography', 'layout', 'animate', 'theme', 'style', 'brand', 'banner', 'slide', 'stitch', 'canvas', 'visual', 'polish', 'delight', 'bolder', 'quieter', 'distill', 'critique', 'clarify', 'shape', 'impeccable', 'frontend-design', 'imagegen', 'image-to-code', 'web-artifacts', 'kpi-dashboard', 'interaction', 'accessibility', 'wcag', 'screen-reader', 'responsive', 'adapt', 'optimize', 'typeset', 'gpt-taste', 'high-end', 'design-taste', 'industrial', 'minimalist', 'overdrive', 'ckm', 'web-design', 'web-component-design', 'design-system', 'unocss'],
    skills: []
  },
  '后端开发': {
    keywords: ['nodejs', 'nestjs', 'fastapi', 'dotnet', 'api', 'auth', 'stripe', 'paypal', 'backend', 'error-handling', 'openapi', 'better-auth', 'email-and-password', 'organization-best', 'create-auth'],
    skills: []
  },
  '数据库与存储': {
    keywords: ['postgres', 'supabase', 'database', 'migration', 'sql'],
    skills: []
  },
  'DevOps 与云基础设施': {
    keywords: ['docker', 'k8s', 'kubernetes', 'helm', 'terraform', 'github-actions', 'gitlab', 'deployment', 'gitops', 'istio', 'linkerd', 'mtls', 'cloud', 'cost-optimization', 'prometheus', 'grafana', 'tracing', 'service-mesh', 'slo', 'secrets', 'sast', 'secure-linux', 'openclaw', 'bazel', 'monorepo', 'turborepo', 'nx', 'pnpm', 'vite', 'tsdown', 'dependency'],
    skills: []
  },
  '测试与质量保证': {
    keywords: ['test', 'vitest', 'e2e', 'debugging', 'debug', 'code-review', 'verification', 'systematic', 'parallel-debug', 'bats'],
    skills: []
  },
  'Python 生态': {
    keywords: ['python', 'uv-package', 'async-python', 'fastapi-template'],
    skills: []
  },
  'AI/ML 与数据工程': {
    keywords: ['langchain', 'rag', 'llm', 'embedding', 'similarity', 'vector', 'hybrid-search', 'prompt-engineering', 'mcp-builder', 'ml-pipeline', 'data-quality', 'dbt', 'spark', 'airflow', 'backtesting', 'risk-metrics', 'algorithmic-art', 'claude-api'],
    skills: []
  },
  '安全': {
    keywords: ['stride', 'attack-tree', 'threat', 'security', 'anti-reversing', 'binary-analysis', 'memory-forensics', 'memory-safety', 'protocol-reverse', 'solidity-security', 'pci', 'gdpr'],
    skills: []
  },
  '文档与内容处理': {
    keywords: ['pdf', 'docx', 'xlsx', 'pptx', 'ocr', 'paddleocr', 'vitepress', 'slidev', 'technical-writer', 'hads', 'baoyu', 'readme-i18n', 'doc-coauthoring', 'changelog', 'slack-gif', 'pdftk'],
    skills: []
  },
  'Git 与版本控制': {
    keywords: ['git', 'worktree', 'receiving-code', 'requesting-code', 'finishing-a'],
    skills: []
  },
  '架构与设计模式': {
    keywords: ['architecture', 'cqrs', 'event-store', 'projection', 'saga', 'microservices', 'workflow-orchestration', 'architecture-decision', 'rust-async'],
    skills: []
  },
  '移动端开发': {
    keywords: ['react-native', 'mobile', 'uni-app', 'uni-helper', 'uniapp', 'wechat', 'miniprogram', 'wot-ui', 'sleek-design', 'create-adaptable'],
    skills: []
  },
  '区块链与 Web3': {
    keywords: ['nft', 'defi', 'web3-testing'],
    skills: []
  },
  '创业与商业': {
    keywords: ['startup', 'market-sizing', 'competitive', 'team-composition-analysis', 'billing', 'data-storytelling', 'internal-comms', 'employment', 'postmortem', 'incident', 'on-call'],
    skills: []
  },
  '开发工作流与协作': {
    keywords: ['brainstorming', 'simple', 'writing-plans', 'executing-plans', 'context-driven', 'track-management', 'workflow-patterns', 'task-coordination', 'team-communication', 'team-composition-patterns', 'dispatching', 'subagent', 'parallel-feature', 'multi-reviewer', 'karpathy', 'using-superpowers', 'skill-creator', 'skills-cli', 'find-skills', 'writing-skills', 'self-improving'],
    skills: []
  },
  '工具与实用程序': {
    keywords: ['firecrawl', 'browser-use', 'use-my-browser', 'webapp-testing', 'xdrop', 'xget', 'tzst', 'elite-longterm', 'soultrace', 'excel-automation', 'python-executor', 'python-sdk', 'running-claude'],
    skills: []
  },
  '其他': {
    keywords: ['godot', 'unity', 'go-concurrency', 'template-skill', 'evaluation', 'redesign', 'enhance-prompt', 'remotion', 'opensource', 'antfu'],
    skills: []
  }
};

const CATEGORY_ORDER = [
  '前端框架与库', 'UI/UX 设计', '后端开发', '数据库与存储',
  'DevOps 与云基础设施', '测试与质量保证', 'Python 生态',
  'AI/ML 与数据工程', '安全', '文档与内容处理',
  'Git 与版本控制', '架构与设计模式', '移动端开发',
  '区块链与 Web3', '创业与商业', '开发工作流与协作',
  '工具与实用程序', '其他'
];

function classifySkill(name, desc) {
  const text = (name + ' ' + desc).toLowerCase();
  for (const [category, data] of Object.entries(CATEGORIES)) {
    for (const kw of data.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return category;
      }
    }
  }
  return '其他';
}

const DESC_CN = {
  'accessibility-compliance': 'WCAG 2.2 无障碍合规实现，包括移动端无障碍和辅助技术支持',
  'adapt': '响应式设计适配，实现断点、流式布局和触控目标',
  'airflow-dag-patterns': 'Apache Airflow DAG 构建，包括 Operator、Sensor 和测试',
  'algorithmic-art': '使用 p5.js 创建算法艺术，支持种子随机和交互参数',
  'angular-migration': 'AngularJS 到 Angular 的迁移，使用混合模式和增量组件重写',
  'animate': '功能增强动画，包括微交互、运动效果和可用性提升',
  'antfu': 'Anthony Fu 的工具链和约定，用于 JS/TS 项目',
  'anti-reversing-techniques': '反逆向工程技术，包括混淆、反调试和虚拟化检测',
  'api-design-principles': 'REST 和 GraphQL API 设计原则，构建直观可扩展的 API',
  'architecture-decision-records': '架构决策记录，文档化重大技术决策',
  'architecture-patterns': '后端架构模式，包括整洁架构、六边形架构和 DDD',
  'attack-tree-construction': '攻击树构建，可视化威胁路径和防御缺口',
  'auth-implementation-patterns': '认证与授权模式，涵盖 JWT、OAuth2、会话管理和 RBAC',
  'auth-wechat-miniprogram': 'CloudBase 微信小程序原生认证',
  'backtesting-frameworks': '交易策略回测系统，处理前瞻偏差和交易成本',
  'baoyu-format-markdown': 'Markdown 格式化，添加标题、摘要、加粗和代码块',
  'bash-defensive-patterns': '防御性 Bash 编程，用于生产级 Shell 脚本',
  'bats-testing-patterns': 'Bash 自动化测试系统，用于 Shell 脚本全面测试',
  'bazel-build-optimization': 'Bazel 构建优化，用于大规模 monorepo 的构建配置',
  'better-auth-best-practices': 'Better Auth 服务器和客户端配置，包括数据库适配器和插件管理',
  'billing-automation': '自动化计费系统，包括订阅、发票和催收管理',
  'binary-analysis-patterns': '二进制分析模式，包括反汇编、反编译和控制流分析',
  'bolder': '放大安全设计，增加视觉冲击力和个性特征',
  'brainstorming': '创意工作前的头脑风暴，探索需求和设计',
  'browser-use': '浏览器自动化，用于 Web 测试、截图和数据提取',
  'canvas-design': '使用设计哲学创建精美的 PNG/PDF 视觉艺术作品',
  'caveman': '超压缩通信模式，减少约 75% token 使用',
  'changelog-automation': '变更日志自动生成，遵循 Keep a Changelog 格式',
  'ckm:banner-design': '社交媒体和广告横幅设计，支持多种风格和平台',
  'ckm:brand': '品牌声音、视觉识别、消息框架和资产管理',
  'ckm:design': '综合设计技能，涵盖品牌识别、设计令牌、图标生成和社交图片',
  'ckm:design-system': '令牌架构、组件规格和幻灯片生成',
  'ckm:slides': '使用 Chart.js 和设计令牌创建战略性 HTML 演示文稿',
  'ckm:ui-styling': '基于 shadcn/ui + Tailwind 的美观无障碍界面创建',
  'clarify': '改善模糊的 UX 文案、错误消息和界面说明',
  'claude-api': 'Claude API / Anthropic SDK 应用构建、调试和优化',
  'code-review-excellence': '高效代码审查实践，提供建设性反馈和知识共享',
  'colorize': '为单调界面添加策略性色彩，使其更具表现力和吸引力',
  'competitive-landscape': '竞争格局分析，使用波特五力和蓝海战略',
  'context-driven-development': '项目上下文管理，维护 product.md/tech-stack.md 等文档',
  'cost-optimization': '云成本优化，包括资源调优、标签策略和预留实例管理',
  'cqrs-implementation': 'CQRS 实现，分离读写模型以优化查询性能',
  'create-adaptable-composable': '创建可适配的 Vue 组合式函数，支持 MaybeRef 输入',
  'create-auth-skill': '使用 Better Auth 搭建 TypeScript/JavaScript 应用认证系统',
  'critique': 'UX 视角设计评审，含量化评分、角色测试和反模式检测',
  'data-quality-frameworks': '数据质量验证，使用 Great Expectations、dbt 和数据契约',
  'data-storytelling': '数据叙事，将数据转化为有说服力的可视化报告',
  'database-migration': '数据库迁移执行，包括零停机策略、数据转换和回滚程序',
  'dbt-transformation-patterns': 'dbt 分析工程，包括模型组织、测试和增量策略',
  'debugging-strategies': '系统化调试技术、性能分析和根因分析',
  'defi-protocol-templates': 'DeFi 协议模板，包括质押、AMM、治理和借贷',
  'delight': '添加愉悦感和个性元素，使界面令人难忘和享受',
  'dependency-upgrade': '依赖版本升级管理，包括兼容性分析和分阶段推出',
  'deployment-pipeline-design': '多阶段 CI/CD 流水线设计，包括审批门和安全检查',
  'design-system-patterns': '设计系统架构模式，包括设计令牌、主题切换和组件库构建',
  'design-taste-frontend': '资深 UI/UX 工程师，强制指标规则和严格组件架构',
  'design-md': '分析 Stitch 项目并合成语义设计系统到 DESIGN.md 文件',
  'develop-userscripts': '浏览器用户脚本开发，包括 Tampermonkey 和 ScriptCat',
  'digital-ocean-deploy': '（无描述）',
  'dispatching-parallel-agents': '并行 Agent 调度，处理独立任务',
  'distill': '简化设计，去除不必要复杂度，聚焦核心功能',
  'distributed-tracing': '分布式追踪，使用 Jaeger 和 Tempo 跟踪跨服务请求',
  'doc-coauthoring': '文档协作写作，包括规格、提案和技术文档',
  'docker-expert': 'Docker 容器化专家，涵盖多阶段构建、安全加固和编排模式',
  'docx': 'Word 文档创建、编辑和格式化',
  'dotnet-backend-patterns': 'C#/.NET 后端模式，涵盖 async/await、EF Core、Dapper 和 xUnit',
  'e2e-testing-patterns': 'E2E 测试，使用 Playwright 和 Cypress 构建可靠测试套件',
  'elite-longterm-memory': 'AI 代理终极记忆系统，结合 WAL 协议和向量搜索',
  'email-and-password-best-practices': 'Better Auth 邮箱/密码认证，包括邮箱验证、密码重置和安全策略',
  'embedding-strategies': '嵌入模型选择与优化，用于语义搜索和 RAG 应用',
  'employment-contract-templates': '雇佣合同和 HR 政策文档模板',
  'enhance-prompt': '将模糊 UI 想法转化为优化的提示',
  'error-handling-patterns': '跨语言错误处理模式，包括异常、Result 类型和优雅降级',
  'event-store-design': '事件存储设计，用于事件溯源系统的持久化',
  'excel-automation': 'Excel 自动化操作',
  'executing-plans': '按计划执行实施，含审查检查点',
  'fastapi-templates': 'FastAPI 生产级项目模板，包括异步模式和依赖注入',
  'find-skills': '发现和安装可用的 Agent 技能',
  'finishing-a-development-branch': '完成开发分支，决定合并、PR 或清理策略',
  'firecrawl': '网页抓取、搜索和爬取，支持 JS 渲染页面',
  'firecrawl-agent': 'AI 驱动的自主数据提取，返回结构化 JSON',
  'firecrawl-crawl': '批量提取整个网站或站点分区的内容',
  'firecrawl-download': '下载整个网站为本地文件',
  'firecrawl-interact': '控制实时浏览器会话，点击按钮和填写表单',
  'firecrawl-map': '发现和列出网站所有 URL',
  'firecrawl-scrape': '从 URL 提取干净的 Markdown，支持 JS 渲染',
  'firecrawl-search': '网页搜索并提取完整页面内容',
  'frontend-design': '高品质前端界面设计，生成避免通用 AI 美学的创意代码',
  'gdpr-data-handling': 'GDPR 数据处理合规，包括同意管理和隐私设计',
  'git-advanced-workflows': 'Git 高级工作流，包括变基、cherry-pick、bisect 和 worktree',
  'github-actions-docs': 'GitHub Actions 官方文档查询和工作流语法指导',
  'github-actions-templates': 'GitHub Actions 工作流模板，用于自动化测试、构建和部署',
  'gitlab-ci-patterns': 'GitLab CI/CD 流水线，包括多阶段工作流和分布式 Runner',
  'gitops-workflow': 'GitOps 工作流，使用 ArgoCD 和 Flux 实现声明式 K8s 部署',
  'go-concurrency-patterns': 'Go 并发编程，包括 goroutine、channel 和 sync 原语',
  'godot-gdscript-patterns': 'Godot 4 GDScript 模式，包括信号、场景和状态机',
  'gpt-taste': '精英 UX/UI 和 GSAP 动效工程师，强制 Python 随机化和 AIDA 结构',
  'grafana-dashboards': 'Grafana 仪表盘创建，用于系统指标实时可视化',
  'hads': '人机双读文档格式，优化 AI 消耗的 token 效率',
  'helm-chart-scaffolding': 'Helm Chart 设计和组织，用于 Kubernetes 应用模板化部署',
  'high-end-visual-design': '高端设计标准，定义精确字体、间距、阴影和动画',
  'hybrid-cloud-networking': '混合云网络配置，使用 VPN 和专用连接实现安全互联',
  'hybrid-search-implementation': '混合搜索（向量+关键词），提升检索召回率',
  'image-to-code': '图像到代码转换，先生成设计图再精确实现',
  'imagegen-frontend-mobile': '高端移动端屏幕概念和流程图像生成',
  'imagegen-frontend-web': '高端前端设计参考图像生成，避免重复 AI 美学',
  'impeccable': '高品质前端界面制作，支持 craft/teach/extract 三种模式',
  'incident-runbook-templates': '事件响应 Runbook，包括步骤程序和升级路径',
  'industrial-brutalist-ui': '工业粗野主义界面，融合瑞士印刷和军事终端美学',
  'interaction-design': '交互设计与微交互模式，包括动效设计、过渡动画和用户反馈',
  'internal-comms': '内部沟通文档，包括状态报告、项目更新和事件报告',
  'istio-traffic-management': 'Istio 流量管理，包括路由、负载均衡、熔断器和金丝雀部署',
  'javascript-testing-patterns': 'JavaScript 测试策略，使用 Jest、Vitest 和 Testing Library',
  'k8s-manifest-generator': 'Kubernetes 清单生成，遵循最佳实践和安全标准',
  'k8s-security-policies': 'Kubernetes 安全策略，包括 NetworkPolicy、PodSecurity 和 RBAC',
  'karpathy-guidelines': 'Karpathy 编码准则，减少常见 LLM 编码错误',
  'kpi-dashboard-design': 'KPI 仪表盘设计，包括指标选择、可视化最佳实践和实时监控',
  'langchain-architecture': 'LangChain 1.x 应用设计，包括代理、记忆和工具集成',
  'layout': '布局改进，修复间距不一致、视觉层级弱和构图问题',
  'linkerd-patterns': 'Linkerd 服务网格模式，轻量级安全优先的服务网格部署',
  'llm-evaluation': 'LLM 应用评估策略，包括自动化指标和人类反馈',
  'market-sizing-analysis': '市场规模分析，使用 TAM/SAM/SOM 方法论',
  'mcp-builder': 'MCP 服务器构建指南，使 LLM 与外部服务交互',
  'memory-forensics': '内存取证技术，使用 Volatility 分析内存转储',
  'memory-safety-patterns': '内存安全编程，包括 RAII、所有权和智能指针',
  'microservices-patterns': '微服务架构设计，包括服务边界和弹性模式',
  'minimalist-ui': '极简编辑风格界面，暖色单色调、排版对比、扁平网格',
  'ml-pipeline-workflow': 'MLOps 端到端管道，从数据准备到模型部署',
  'mobile-android-design': 'Android Material Design 3 和 Jetpack Compose',
  'mobile-ios-design': 'iOS Human Interface Guidelines 和 SwiftUI',
  'modern-javascript-patterns': 'ES6+ 现代语法模式，包括异步、解构、箭头函数和函数式编程',
  'monorepo-management': 'Monorepo 管理，使用 Turborepo、Nx 和 pnpm workspaces',
  'mtls-configuration': '双向 TLS 配置，实现零信任服务间通信',
  'multi-cloud-architecture': '多云架构设计，使用决策框架选择和集成多云服务',
  'multi-reviewer-patterns': '多审查者模式，协调并行代码审查和发现去重',
  'next-best-practices': 'Next.js 最佳实践，涵盖文件约定、RSC 边界和数据模式优化',
  'next-cache-components': 'Next.js 16 缓存组件，包括 PPR、use cache 指令和 cacheTag',
  'nextjs-app-router-patterns': 'Next.js 14+ App Router 模式，包括 Server Components 和流式渲染',
  'nestjs-best-practices': 'NestJS 最佳实践，包括模块、依赖注入、安全和性能模式',
  'nestjs-expert': 'NestJS 企业级架构专家，涵盖 DI、装饰器、守卫和拦截器',
  'nft-standards': 'NFT 标准实现（ERC-721、ERC-1155），包括元数据和铸造',
  'nodejs-backend-patterns': 'Node.js 后端服务，涵盖 Express/Fastify、中间件、认证和 API 设计',
  'nuxt': 'Nuxt 全栈 Vue 框架，支持 SSR、自动导入和文件路由',
  'nx-workspace-patterns': 'Nx 工作区配置和优化，包括项目边界和构建缓存',
  'ocr-document-processor': 'OCR 文字识别，从扫描件和图片中提取文本和结构',
  'on-call-handoff-patterns': '值班交接模式，包括上下文转移和升级程序',
  'openapi-spec-generation': 'OpenAPI 3.1 规范生成与维护',
  'openclaw-secure-linux-cloud': 'OpenClaw 安全云端自托管，涵盖 SSH 隧道和沙箱配置',
  'optimize': 'UI 性能诊断与修复，涵盖加载速度、渲染、动画和包大小',
  'organization-best-practices': 'Better Auth 多租户组织管理，包括成员邀请、自定义角色和 RBAC',
  'overdrive': '超越常规的界面实现，包括着色器、弹簧物理和 60fps 动画',
  'paddleocr-text-recognition': '使用 PaddleOCR 从图像和 PDF 中提取文本及位置',
  'parallel-debugging': '并行调试，使用竞争假设和并行调查进行根因分析',
  'parallel-feature-development': '并行功能开发，包括文件所有权和冲突避免',
  'pcidss-compliance': 'PCI DSS 合规，安全处理支付卡数据',
  'pdf': 'PDF 文件处理，包括读取、合并、拆分、加密和 OCR',
  'pdftk-server': 'PDFtk 命令行工具，用于 PDF 合并、拆分、旋转和表单填写',
  'pinia': 'Pinia 官方 Vue 状态管理库，类型安全且可扩展',
  'pnpm': 'pnpm 包管理器，包括严格依赖解析、workspaces 和 catalogs',
  'polish': '最终质量打磨，修复对齐、间距、一致性和细节问题',
  'postgresql-best-practices': 'PostgreSQL 开发最佳实践，涵盖模式设计和查询优化',
  'postgresql-code-review': 'PostgreSQL 代码审查，聚焦 JSONB、RLS 和函数优化',
  'postgresql-optimization': 'PostgreSQL 高级功能，包括全文搜索、窗口函数和扩展生态',
  'postgresql-table-design': 'PostgreSQL 表设计，涵盖数据类型、索引、约束和性能模式',
  'postmortem-writing': '无责事后总结，包括根因分析和时间线',
  'power-platform': '（无描述）',
  'pptx': 'PowerPoint 演示文稿创建、编辑和管理',
  'prometheus-configuration': 'Prometheus 配置，实现全面的指标收集、存储和监控',
  'prompt-engineering-patterns': '高级提示工程，最大化 LLM 性能、可靠性和可控性',
  'protocol-reverse-engineering': '网络协议逆向工程，包括数据包分析和协议文档',
  'python-anti-patterns': 'Python 反模式检查清单，用于代码审查和调试',
  'python-background-jobs': 'Python 后台任务模式，包括任务队列、Worker 和事件驱动架构',
  'python-code-style': 'Python 代码风格、命名约定和文档标准',
  'python-configuration': 'Python 配置管理，使用环境变量和 pydantic-settings',
  'python-design-patterns': 'Python 设计模式，包括 KISS、关注点分离和组合优于继承',
  'python-error-handling': 'Python 错误处理，包括输入验证、异常层级和部分失败处理',
  'python-executor': 'Python 代码沙箱执行，预装 NumPy、Pandas 等 100+ 库',
  'python-observability': 'Python 可观测性，包括结构化日志、指标和分布式追踪',
  'python-packaging': 'Python 包打包与分发，包括 pyproject.toml 和 PyPI 发布',
  'python-performance-optimization': 'Python 性能优化，使用 cProfile 和内存分析器定位瓶颈',
  'python-project-structure': 'Python 项目组织、模块架构和公共 API 设计',
  'python-resilience': 'Python 弹性模式，包括自动重试、指数退避和超时处理',
  'python-resource-management': 'Python 资源管理，包括上下文管理器、清理模式和流式处理',
  'python-sdk': 'inference.sh Python SDK，用于运行 AI 应用和构建代理',
  'python-testing-patterns': 'Python 测试策略，使用 pytest、fixtures 和 TDD',
  'python-type-safety': 'Python 类型安全，包括类型提示、泛型、协议和 mypy 配置',
  'quiet': '降低视觉攻击性，使设计更冷静精致',
  'rag-implementation': 'RAG 系统构建，使用向量数据库和语义搜索增强 LLM',
  'react-modernization': 'React 应用现代化升级，包括类组件迁移到 Hooks',
  'react-native-architecture': 'React Native 生产级应用架构',
  'react-native-design': 'React Native 样式、导航和 Reanimated 动画',
  'react-state-management': 'React 状态管理方案，涵盖 Redux Toolkit、Zustand、Jotai 和 React Query',
  'react:components': '将 Stitch 设计转换为模块化的 Vite + React 组件',
  'readme-i18n': 'README 多语言翻译和国际化',
  'receiving-code-review': '接收代码审查反馈，在实施建议前进行技术验证',
  'redesign-existing-projects': '升级现有网站到高品质设计',
  'remotion': '使用 Remotion 从 Stitch 项目生成演示视频',
  'requesting-code-review': '请求代码审查，在完成任务或合并前验证工作',
  'responsive-design': '现代响应式布局，包括容器查询、流式排版和移动优先策略',
  'risk-metrics-calculation': '投资组合风险指标计算，包括 VaR、CVaR 和夏普比率',
  'running-claude-code-via-litellm-copilot': '通过 LiteLLM 代理路由 Claude Code 到 GitHub Copilot',
  'rust-async-patterns': 'Rust 异步编程，使用 Tokio、async traits 和并发模式',
  'saga-orchestration': 'Saga 编排模式，用于分布式事务和跨聚合工作流',
  'sast-configuration': '静态应用安全测试配置，用于自动化代码漏洞检测',
  'screen-reader-testing': '屏幕阅读器测试，涵盖 VoiceOver、NVDA 和 JAWS 兼容性验证',
  'secrets-management': 'CI/CD 密钥管理，使用 Vault、AWS Secrets Manager 等',
  'secure-linux-web-hosting': '安全 Linux Web 托管，包括 DNS、SSH、Nginx 和 HTTPS 配置',
  'security-requirement-extraction': '从威胁模型和业务上下文推导安全需求',
  'self-improving-agent': '自我改进代理，使用多记忆架构持续进化',
  'service-mesh-observability': '服务网格可观测性，包括分布式追踪、指标和可视化',
  'shape': '编码前规划 UX/UI，运行结构化发现访谈并生成设计简报',
  'shadcn-ui': 'shadcn/ui 组件集成指南，包括组件发现、安装、自定义和最佳实践',
  'simple': '简化的头脑风暴，快速聚焦决策',
  'similarity-search-patterns': '相似性搜索实现，使用向量数据库进行最近邻查询',
  'skill-creator': '技能创建、编辑和性能测量',
  'skills-cli': '技能 CLI 管理，包括安装、更新和同步',
  'slack-gif-creator': '创建 Slack 优化的动画 GIF',
  'sleek-design-mobile-apps': 'Sleek 移动应用设计和 UI 创建',
  'slidev': 'Slidev 开发者幻灯片，使用 Markdown + Vue 组件',
  'slo-implementation': 'SLI/SLO 实现，包括错误预算和告警机制',
  'solidity-security': 'Solidity 智能合约安全最佳实践',
  'soultrace': '性格评估测试，使用 5 色心理模型和贝叶斯自适应',
  'spark-optimization': 'Apache Spark 优化，包括分区、缓存和 Shuffle 调优',
  'sql-optimization-patterns': 'SQL 查询优化，包括索引策略和 EXPLAIN 分析',
  'startup-financial-modeling': '创业财务建模，3-5 年收入预测和现金流分析',
  'startup-metrics-framework': '创业指标框架，计算 CAC/LTV/燃烧倍率和基准健康度',
  'stitch-design': 'Stitch 设计统一入口，处理提示增强和设计系统合成',
  'stitch-design-taste': 'Stitch 语义设计系统，生成高级反通用 UI 标准的 DESIGN.md',
  'stitch-loop': 'Stitch 迭代式网站构建，自主接力循环模式',
  'stride-analysis-patterns': 'STRIDE 威胁分析方法，系统识别安全威胁',
  'stripe-integration': 'Stripe 支付集成，包括结账、订阅和 Webhook 处理',
  'subagent-driven-development': '子代理驱动开发，在当前会话中执行独立任务',
  'supabase': 'Supabase 全栈后端平台，涵盖数据库、认证、存储、实时和向量搜索',
  'supabase-postgres-best-practices': 'Supabase Postgres 性能优化和最佳实践',
  'systematic-debugging': '系统化调试，遇到 bug 或测试失败时先分析再修复',
  'tailwind-design-system': '基于 Tailwind CSS v4 构建可扩展设计系统、设计令牌和组件库',
  'task-coordination-strategies': '任务协调策略，分解复杂任务和管理工作负载',
  'taste-design': 'Stitch 语义设计系统，生成高级反通用 UI 标准的 DESIGN.md',
  'team-communication-protocols': '团队通信协议，包括消息类型和审批流程',
  'team-composition-analysis': '创业团队设计，包括招聘计划、薪酬和股权分配',
  'team-composition-patterns': 'Agent 团队组成设计，包括规模和角色选择',
  'technical-writer': '技术文档写作，创建 API 参考、指南和教程',
  'template-skill': '技能模板，替换为实际描述',
  'temporal-python-testing': 'Temporal 工作流测试，使用 pytest 和时间跳过策略',
  'terraform-module-library': 'Terraform 可复用模块库，遵循基础设施即代码最佳实践',
  'test-driven-development': '测试驱动开发，在编写实现代码之前先写测试',
  'theme-factory': '主题样式工具包，含 10 种预设主题，可应用于幻灯片、文档等',
  'threat-mitigation-mapping': '威胁到安全控制的映射，优先安全投资和修复计划',
  'track-management': 'Conductor Track 管理，包括 spec.md 和 plan.md',
  'tsdown': '基于 Rolldown 的 TypeScript/JavaScript 库打包工具',
  'turborepo': 'Turborepo monorepo 构建系统，涵盖任务管道和缓存配置',
  'turborepo-caching': 'Turborepo 缓存配置，实现高效的本地和远程构建缓存',
  'typescript-advanced-types': 'TypeScript 高级类型系统，包括泛型、条件类型和映射类型',
  'typeset': '排版优化，修复字体选择、层级、大小、粗细和可读性',
  'tzst': '.tzst/.tar.zst 归档文件的创建、提取和管理',
  'ui-ux-pro-max': 'UI/UX 设计智能引擎，含 50+ 风格、161 色板、57 字体配对、99 UX 准则',
  'uni-app': 'uni-app 跨平台开发框架综合参考',
  'uni-helper': 'uni-helper 生态，AI 驱动的 uni-app 开发工具',
  'uniapp说明': '移动端 uni-app 开发说明',
  'unity-ecs-patterns': 'Unity ECS 实体组件系统，使用 DOTS 和 Burst 高性能游戏开发',
  'unocss': 'UnoCSS 即时原子化 CSS 引擎，Tailwind CSS 超集',
  'use-my-browser': '使用用户实时浏览器会话进行调试和交互',
  'using-git-worktrees': 'Git Worktree 使用，创建隔离的工作目录进行特性开发',
  'using-superpowers': '对话启动时建立技能查找和使用规范',
  'uv-package-manager': 'uv 包管理器，快速 Python 依赖管理和虚拟环境',
  'vector-index-tuning': '向量索引性能调优，包括 HNSW 参数和量化策略',
  'verification-before-completion': '完成前验证，要求运行验证命令确认输出后再声称完成',
  'visual-design-foundations': '视觉设计基础，涵盖排版、色彩理论、间距系统和图标设计原则',
  'vite': 'Vite 构建工具配置，包括插件 API、SSR 和 Rolldown 迁移',
  'vitepress': 'VitePress 静态文档站点生成，基于 Vite 和 Vue',
  'vitest': 'Vitest 快速单元测试框架，兼容 Jest API，由 Vite 驱动',
  'vue': 'Vue 3 Composition API、script setup 宏、响应式系统和内置组件开发',
  'vue-best-practices': 'Vue.js 最佳实践，推荐 Composition API + TypeScript 标准方案',
  'vue-debug-guides': 'Vue 3 调试与错误处理，涵盖运行时错误、异步失败和 SSR 水合问题',
  'vue-jsx-best-practices': 'Vue 中 JSX 语法使用，包括 class 与 className 区别、JSX 插件配置',
  'vue-options-api-best-practices': 'Vue 3 Options API 风格开发，包括 data()、methods、this 上下文',
  'vue-pinia-best-practices': 'Pinia 状态管理，包括 Store 定义、状态/获取器/操作模式和响应式集成',
  'vue-router-best-practices': 'Vue Router 4 路由模式，包括导航守卫、路由参数和组件生命周期交互',
  'vue-testing-best-practices': 'Vue.js 测试实践，涵盖 Vitest、Vue Test Utils 和 E2E 测试',
  'vueuse-functions': 'VueUse 组合式函数库，用于构建简洁可维护的 Vue/Nuxt 功能',
  'wcag-audit-patterns': 'WCAG 2.2 无障碍审计，包括自动化测试、手动验证和修复指导',
  'web-artifacts-builder': '多组件 HTML 制品构建，使用 React + Tailwind + shadcn/ui',
  'web-component-design': 'React/Vue/Svelte 组件模式，包括 CSS-in-JS 和可复用架构',
  'web-design-guidelines': 'Web 界面设计准则审查，检查 UI 代码合规性和最佳实践',
  'web3-testing': 'Web3 智能合约测试，使用 Hardhat 和 Foundry',
  'webapp-testing': '使用 Playwright 与本地 Web 应用交互和测试',
  'wechat-miniprogram-skill': '微信小程序原生开发，聚焦性能和代码体积',
  'workflow-orchestration-patterns': 'Temporal 工作流编排，包括 Saga 模式和状态管理',
  'workflow-patterns': 'Conductor TDD 工作流，包括阶段检查点和 Git 提交',
  'wot-ui': 'wot-ui uni-app 组件库开发指南',
  'writing-plans': '多步骤任务的实施计划编写',
  'writing-skills': '创建和编辑技能，部署前验证',
  'xdrop': '通过 Xdrop 服务器发送和获取加密文件',
  'xget': 'URL 重写和注册表/包/容器加速',
  'xlsx': 'Excel 电子表格处理，包括读取、编辑、公式和图表',
};

function generateCatalog() {
  const skillsDir = path.join(config.agentsDir, 'skills');
  const items = fs.readdirSync(skillsDir).filter(f =>
    fs.statSync(path.join(skillsDir, f)).isDirectory()
  );

  const skills = [];
  items.forEach(dirName => {
    const sf = path.join(skillsDir, dirName, 'SKILL.md');
    if (!fs.existsSync(sf)) return;
    const c = fs.readFileSync(sf, 'utf8');
    let sname = dirName, desc = '';
    const nm = c.match(/^name:\s*(.+)$/m);
    if (nm) sname = nm[1].trim();
    const dm = c.match(/^description:\s*["']?(.+?)["']?\s*$/m);
    if (dm) desc = dm[1].trim();
    else {
      const dm2 = c.match(/description:\s*\n\s+(.+)/);
      if (dm2) desc = dm2[1].trim();
    }
    skills.push({ name: sname, dir: dirName, desc });
  });

  for (const cat of Object.keys(CATEGORIES)) {
    CATEGORIES[cat].skills = [];
  }

  skills.forEach(skill => {
    const category = classifySkill(skill.name, skill.desc);
    CATEGORIES[category].skills.push(skill);
  });

  let md = '# Agent Skills 技能分类索引\n\n';
  md += `> 共计 ${skills.length} 个技能，按功能领域分为 ${CATEGORY_ORDER.length} 大类\n\n`;
  md += '---\n\n## 📑 目录\n\n';

  CATEGORY_ORDER.forEach((cat, i) => {
    const count = CATEGORIES[cat].skills.length;
    md += `- [${i + 1}. ${cat}](#${i + 1}-${encodeURIComponent(cat.replace(/\s/g, '-'))}) (${count})\n`;
  });

  md += '\n---\n\n';

  CATEGORY_ORDER.forEach((cat, i) => {
    const catSkills = CATEGORIES[cat].skills;
    if (catSkills.length === 0) return;
    md += `## ${i + 1}. ${cat}\n\n`;
    md += '| 技能名称 | 中文简介 |\n';
    md += '|---------|---------|\n';
    catSkills.forEach(skill => {
      const cn = DESC_CN[skill.name] || DESC_CN[skill.dir] || skill.desc || '（暂无描述）';
      md += `| \`${skill.name}\` | ${cn} |\n`;
    });
    md += '\n';
  });

  md += `> 📊 统计：共 ${CATEGORY_ORDER.length} 个分类，${skills.length} 个技能\n`;

  const outputPath = path.join(config.agentsDir, 'skills-catalog.md');
  fs.writeFileSync(outputPath, md, 'utf8');
  log(`📄 目录已生成: ${outputPath} (${skills.length} 个技能)`);
  return skills.length;
}

module.exports = { generateCatalog };

if (require.main === module) {
  generateCatalog();
}
