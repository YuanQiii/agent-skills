import { logger } from '../infra/logger.js';

export interface CategoryDef {
  label: string;
  keywords: string[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    label: '前端框架与库',
    keywords: ['vue', 'react', 'next', 'nuxt', 'svelte', 'angular', 'javascript', 'typescript', 'pinia', 'composition'],
  },
  {
    label: 'UI/UX 设计',
    keywords: ['ui', 'ux', 'design', 'css', 'tailwind', 'shadcn', 'color', 'typography', 'layout', 'animate', 'theme', 'style', 'brand', 'banner', 'slide', 'stitch', 'canvas', 'visual', 'polish', 'delight', 'bolder', 'quieter', 'distill', 'critique', 'clarify', 'shape', 'impeccable', 'frontend-design', 'imagegen', 'image-to-code', 'web-artifacts', 'kpi-dashboard', 'interaction', 'accessibility', 'wcag', 'screen-reader', 'responsive', 'adapt', 'optimize', 'typeset', 'gpt-taste', 'high-end', 'design-taste', 'industrial', 'minimalist', 'overdrive', 'ckm', 'web-design', 'web-component-design', 'design-system', 'unocss'],
  },
  {
    label: '后端开发',
    keywords: ['nodejs', 'nestjs', 'fastapi', 'dotnet', 'api', 'auth', 'stripe', 'paypal', 'backend', 'error-handling', 'openapi', 'better-auth', 'email-and-password', 'organization-best', 'create-auth'],
  },
  {
    label: '数据库与存储',
    keywords: ['postgres', 'supabase', 'database', 'migration', 'sql'],
  },
  {
    label: 'DevOps 与云基础设施',
    keywords: ['docker', 'k8s', 'kubernetes', 'helm', 'terraform', 'github-actions', 'gitlab', 'deployment', 'gitops', 'istio', 'linkerd', 'mtls', 'cloud', 'cost-optimization', 'prometheus', 'grafana', 'tracing', 'service-mesh', 'slo', 'secrets', 'sast', 'secure-linux', 'openclaw', 'bazel', 'monorepo', 'turborepo', 'nx', 'pnpm', 'vite', 'tsdown', 'dependency'],
  },
  {
    label: '测试与质量保证',
    keywords: ['test', 'vitest', 'e2e', 'debugging', 'debug', 'code-review', 'verification', 'systematic', 'parallel-debug', 'bats'],
  },
  {
    label: 'Python 生态',
    keywords: ['python', 'uv-package', 'async-python', 'fastapi-template'],
  },
  {
    label: 'AI/ML 与数据工程',
    keywords: ['langchain', 'rag', 'llm', 'embedding', 'similarity', 'vector', 'hybrid-search', 'prompt-engineering', 'mcp-builder', 'ml-pipeline', 'data-quality', 'dbt', 'spark', 'airflow', 'backtesting', 'risk-metrics', 'algorithmic-art', 'claude-api'],
  },
  {
    label: '安全',
    keywords: ['stride', 'attack-tree', 'threat', 'security', 'anti-reversing', 'binary-analysis', 'memory-forensics', 'memory-safety', 'protocol-reverse', 'solidity-security', 'pci', 'gdpr'],
  },
  {
    label: '文档与内容处理',
    keywords: ['pdf', 'docx', 'xlsx', 'pptx', 'ocr', 'paddleocr', 'vitepress', 'slidev', 'technical-writer', 'hads', 'baoyu', 'readme-i18n', 'doc-coauthoring', 'changelog', 'slack-gif', 'pdftk'],
  },
  {
    label: 'Git 与版本控制',
    keywords: ['git', 'worktree', 'receiving-code', 'requesting-code', 'finishing-a'],
  },
  {
    label: '架构与设计模式',
    keywords: ['architecture', 'cqrs', 'event-store', 'projection', 'saga', 'microservices', 'workflow-orchestration', 'architecture-decision', 'rust-async'],
  },
  {
    label: '移动端开发',
    keywords: ['react-native', 'mobile', 'uni-app', 'uni-helper', 'uniapp', 'wechat', 'miniprogram', 'wot-ui', 'sleek-design', 'create-adaptable'],
  },
  {
    label: '区块链与 Web3',
    keywords: ['nft', 'defi', 'web3-testing'],
  },
  {
    label: '创业与商业',
    keywords: ['startup', 'market-sizing', 'competitive', 'team-composition-analysis', 'billing', 'data-storytelling', 'internal-comms', 'employment', 'postmortem', 'incident', 'on-call'],
  },
  {
    label: '开发工作流与协作',
    keywords: ['brainstorming', 'simple', 'writing-plans', 'executing-plans', 'context-driven', 'track-management', 'workflow-patterns', 'task-coordination', 'team-communication', 'team-composition-patterns', 'dispatching', 'subagent', 'parallel-feature', 'multi-reviewer', 'karpathy', 'using-superpowers', 'skill-creator', 'skills-cli', 'find-skills', 'writing-skills', 'self-improving'],
  },
  {
    label: '工具与实用程序',
    keywords: ['firecrawl', 'browser-use', 'use-my-browser', 'webapp-testing', 'xdrop', 'xget', 'tzst', 'elite-longterm', 'soultrace', 'excel-automation', 'python-executor', 'python-sdk', 'running-claude'],
  },
  {
    label: '其他',
    keywords: ['godot', 'unity', 'go-concurrency', 'template-skill', 'evaluation', 'redesign', 'enhance-prompt', 'remotion', 'opensource', 'antfu'],
  },
];

export function classifySkill(name: string, desc: string, categories: CategoryDef[] = CATEGORIES): string {
  const text = `${name} ${desc}`.toLowerCase();
  for (const cat of categories) {
    for (const kw of cat.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return cat.label;
      }
    }
  }
  logger.warn({ skillName: name }, '技能未匹配到任何分类，归入"其他"');
  return '其他';
}
