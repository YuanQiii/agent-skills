import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from '../infra/config.js';
import { logger } from '../infra/logger.js';
import type { SkillInfo } from './skills.js';

export interface CategorizedSkills {
  category: string;
  skills: SkillInfo[];
  deletedSkills: SkillInfo[];
}

export function categorizeSkills(
  skills: SkillInfo[],
  deletedSkills: SkillInfo[] = [],
  categories?: CategoryDef[],
): CategorizedSkills[] {
  const cats = categories ?? DEFAULT_CATEGORIES;
  const map = new Map<string, { active: SkillInfo[]; deleted: SkillInfo[] }>();
  for (const cat of cats) {
    map.set(cat.label, { active: [], deleted: [] });
  }

  for (const skill of skills) {
    const cat = classifySkill(skill.name, skill.desc, cats);
    const entry = map.get(cat);
    if (entry) {
      entry.active.push(skill);
    }
  }

  for (const skill of deletedSkills) {
    const cat = classifySkill(skill.name, skill.desc, cats);
    const entry = map.get(cat);
    if (entry) {
      entry.deleted.push(skill);
    }
  }

  return cats
    .map(cat => ({
      category: cat.label,
      skills: map.get(cat.label)?.active ?? [],
      deletedSkills: map.get(cat.label)?.deleted ?? [],
    }))
    .filter(c => c.skills.length > 0 || c.deletedSkills.length > 0);
}

const MAX_DESC_LENGTH = 120;

function cleanDescription(desc: string | undefined | null): string {
  if (!desc || desc.trim() === '') {
    return '(无描述)';
  }

  const cleaned = desc.trim();

  const invalidPatterns = [
    /^>\s*—?\s*$/,
    /^>\s*$/,
    /^\|\s*\|$/,
    /^\|\s*$/,
    /^\s*$/,
    /^>—$/,
    /^\|>$/,
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(cleaned)) {
      return '(无描述)';
    }
  }

  return cleaned;
}

function truncateDescription(desc: string): string {
  const cleaned = cleanDescription(desc);
  if (cleaned === '(无描述)') {
    return cleaned;
  }
  if (cleaned.length <= MAX_DESC_LENGTH) {
    return cleaned;
  }
  return cleaned.substring(0, MAX_DESC_LENGTH).trim() + '...';
}

export function generateCatalogMarkdown(
  skills: SkillInfo[],
  translations: Record<string, string>,
  categories?: CategoryDef[],
): string {
  const cats = categories ?? DEFAULT_CATEGORIES;
  const currentSkillNames = new Set(skills.map(s => s.name));
  const deletedSkillNames = Object.keys(translations).filter(name => !currentSkillNames.has(name));

  const deletedSkills: SkillInfo[] = deletedSkillNames.map(name => ({
    name,
    dir: name,
    desc: translations[name] || '(deleted)',
  }));

  const categorized = categorizeSkills(skills, deletedSkills, cats);
  const totalCategories = categorized.length;
  const totalActive = skills.length;
  const totalDeleted = deletedSkillNames.length;

  let md = '# Agent Skills Catalog\n\n';
  md += `> ${totalActive} 个可用技能 (${totalDeleted} 个已删除), ${totalCategories} 个分类\n\n`;
  md += '---\n\n## 目录\n\n';

  categorized.forEach((c, i) => {
    const anchor = `${i + 1}-${encodeURIComponent(c.category.replace(/\s/g, '-'))}`;
    const deletedCount = c.deletedSkills.length;
    const countText = deletedCount > 0 ? `${c.skills.length} (${deletedCount} 已删除)` : c.skills.length;
    md += `- [${i + 1}. ${c.category}](#${anchor}) (${countText})\n`;
  });

  md += '\n---\n\n';

  categorized.forEach((c, i) => {
    md += `## ${i + 1}. ${c.category}\n\n`;
    md += '| 技能名称 | 描述 |\n';
    md += '|----------|------|\n';

    for (const skill of c.skills) {
      const cn = translations[skill.name] || translations[skill.dir] || skill.desc || '(无描述)';
      md += `| ${skill.name} | ${truncateDescription(cn)} |\n`;
    }

    for (const skill of c.deletedSkills) {
      const cn = translations[skill.name] || translations[skill.dir] || '(已删除)';
      md += `| ~~${skill.name}~~ | ~~${truncateDescription(cn)}~~ |\n`;
    }

    md += '\n';
  });

  md += `> 统计: ${totalCategories} 个分类, ${totalActive} 个技能 (${totalDeleted} 个已删除)\n`;
  return md;
}

export function generateCatalog(
  skills: SkillInfo[],
  translations: Record<string, string>,
): number {
  const md = generateCatalogMarkdown(skills, translations);
  const config = getConfig();
  const outputPath = path.join(config.dataDir, 'skills-catalog.md');
  fs.writeFileSync(outputPath, md, 'utf8');
  logger.info({ path: outputPath, count: skills.length }, '目录已生成');
  return skills.length;
}

export interface CategoryDef {
  label: string;
  keywords: string[];
}

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { label: '前端框架与库', keywords: ['vue', 'react', 'next', 'nuxt', 'svelte', 'angular', 'javascript', 'typescript', 'pinia', 'composition', 'vite', 'vitepress', 'vite.config', 'rollup', 'esbuild', 'webpack'] },
  { label: '后端开发', keywords: ['nodejs', 'nestjs', 'nestjs-expert', 'nestjs-best', 'fastapi', 'fastapi-template', 'dotnet', 'dotnet-backend', 'nodejs-backend', 'api-design', 'api-principles', 'auth-implementation', 'stripe', 'paypal', 'backend', 'error-handling', 'openapi', 'openapi-spec', 'better-auth', 'email-and-password', 'organization-best', 'create-auth', 'express', 'fastify', 'go-concurrency'] },
  { label: '数据库与存储', keywords: ['postgres', 'postgresql', 'supabase', 'database', 'migration', 'sql', 'sql-optimization', 'sql-patterns', 'dbt', 'redis', 'mongodb'] },
  { label: 'DevOps 与云', keywords: ['docker', 'docker-expert', 'k8s', 'kubernetes', 'helm', 'helm-chart', 'terraform', 'terraform-module', 'github-actions', 'github-actions-template', 'gitlab', 'gitlab-ci', 'deployment', 'deployment-pipeline', 'gitops', 'gitops-workflow', 'istio', 'linkerd', 'mtls', 'mtls-configuration', 'cloud', 'cost-optimization', 'prometheus', 'grafana', 'grafana-dashboard', 'tracing', 'distributed-tracing', 'service-mesh', 'slo', 'secrets', 'sast', 'secure-linux', 'openclaw', 'bazel', 'monorepo', 'turborepo', 'nx', 'pnpm', 'dependency', 'dependency-upgrade', 'incident-runbook', 'hybrid-cloud', 'secure-web'] },
  { label: '测试与质量保障', keywords: ['test', 'testing', 'vitest', 'e2e', 'e2e-testing', 'bats', 'bats-testing', 'debugging', 'debug', 'systematic-debugging', 'parallel-debugging', 'code-review', 'verification', 'python-testing', 'python-anti', 'tdd', 'test-driven'] },
  { label: 'Python 生态', keywords: ['python', 'python-', 'async-python', 'uv-package', 'python-background', 'python-packaging', 'python-type', 'python-code', 'python-error', 'python-performance', 'python-project', 'python-resilience', 'python-resource', 'python-observability', 'python-configuration'] },
  { label: 'AI/ML 与数据工程', keywords: ['langchain', 'rag', 'llm', 'embedding', 'similarity', 'vector', 'hybrid-search', 'prompt-engineering', 'mcp-builder', 'ml-pipeline', 'data-quality', 'dbt', 'dbt-transform', 'spark', 'spark-optimization', 'airflow', 'airflow-dag', 'backtesting', 'risk-metrics', 'algorithmic-art', 'claude-api', 'llm-evaluation', 'embedding-strategy', 'hybrid-search-implementation', 'vector-index', 'data-storytelling'] },
  { label: '安全', keywords: ['security', 'stride', 'attack-tree', 'threat', 'anti-reversing', 'binary-analysis', 'memory-forensics', 'memory-safety', 'protocol-reverse', 'solidity-security', 'pci', 'gdpr', 'pci-compliance', 'security-requirement'] },
  { label: '文档与内容', keywords: ['pdf', 'docx', 'xlsx', 'pptx', 'ocr', 'paddleocr', 'vitepress', 'slidev', 'technical-writer', 'hads', 'baoyu', 'readme-i18n', 'doc-coauthoring', 'changelog', 'slack-gif', 'pdftk', 'excel-automation'] },
  { label: 'Git 与版本控制', keywords: ['git', 'worktree', 'git-worktree', 'receiving-code', 'requesting-code', 'finishing-a', 'git-advanced'] },
  { label: '架构与设计模式', keywords: ['architecture', 'architecture-pattern', 'cqrs', 'cqrs-implementation', 'event-store', 'event-store-design', 'projection', 'projection-pattern', 'saga', 'saga-orchestration', 'microservices', 'microservice-pattern', 'workflow-orchestration', 'architecture-decision', 'rust-async', 'rust-async-pattern', 'microservices-patterns'] },
  { label: '移动开发', keywords: ['react-native', 'react-native-architecture', 'react-native-design', 'mobile', 'mobile-ios', 'mobile-android', 'uni-app', 'uni-helper', 'uniapp', 'wechat', 'miniprogram', 'wot-ui', 'sleek-design', 'create-adaptable'] },
  { label: '区块链与 Web3', keywords: ['nft', 'nft-standard', 'defi', 'defi-protocol', 'web3', 'web3-testing', 'solidity'] },
  { label: '创业与商业', keywords: ['startup', 'startup-', 'market-sizing', 'market-sizing-analysis', 'competitive', 'competitive-landscape', 'billing', 'billing-automation', 'team-composition', 'employment', 'employment-contract', 'internal-comms', 'postmortem', 'incident', 'on-call', 'startup-metrics', 'startup-financial'] },
  { label: 'UI/UX 设计', keywords: ['ui', 'ux', 'css', 'tailwind', 'shadcn', 'tailwind-design', 'color', 'typography', 'layout', 'animate', 'animation', 'theme', 'style', 'brand', 'brandkit', 'banner', 'canvas', 'visual', 'visual-design', 'polish', 'delight', 'bolder', 'quieter', 'distill', 'critique', 'clarify', 'shape', 'impeccable', 'frontend-design', 'imagegen', 'image-to-code', 'web-artifacts', 'kpi-dashboard', 'interaction', 'interaction-design', 'accessibility', 'accessibility-compliance', 'wcag', 'wcag-audit', 'screen-reader', 'screen-reader-testing', 'responsive', 'responsive-design', 'adapt', 'optimize', 'typeset', 'gpt-taste', 'high-end', 'design-taste', 'industrial', 'industrial-brutalist', 'minimalist', 'minimalist-ui', 'overdrive', 'ckm', 'ckm:', 'web-design', 'web-design-guideline', 'web-component', 'web-component-design', 'design-system', 'design-system-pattern', 'unocss', 'impeccable', 'redesign', 'remotion', 'theme-factory', 'high-end-visual'] },
  { label: '开发工作流与协作', keywords: ['brainstorming', 'simple', 'writing-plans', 'executing-plans', 'context-driven', 'track-management', 'workflow-patterns', 'task-coordination', 'team-communication', 'team-composition-patterns', 'dispatching', 'dispatching-parallel', 'subagent', 'subagent-driven', 'parallel-feature', 'multi-reviewer', 'karpathy', 'using-superpowers', 'skill-creator', 'skills-cli', 'find-skills', 'writing-skills', 'self-improving', 'finishing-a-development', 'full-output', 'receiving-code-review', 'requesting-code-review', 'verification-before', 'context-driven-development'] },
  { label: '工具与实用程序', keywords: ['firecrawl', 'firecrawl-', 'browser-use', 'use-my-browser', 'webapp-testing', 'xdrop', 'xget', 'tzst', 'elite-longterm', 'soultrace', 'python-executor', 'python-sdk', 'running-claude', 'webapp-testing', 'caveman', 'template-skill'] },
  { label: '其他', keywords: ['godot', 'godot-', 'unity', 'unity-ecs', 'evaluation', 'evaluation-methodology', 'antfu', 'opensource', 'enhance-prompt', 'shellcheck', 'shellcheck-configuration'] },
];

export const CATEGORIES = DEFAULT_CATEGORIES;

export function classifySkill(name: string, desc: string, categories: CategoryDef[] = DEFAULT_CATEGORIES): string {
  const text = `${name} ${desc}`.toLowerCase();
  for (const cat of categories) {
    for (const kw of cat.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return cat.label;
      }
    }
  }
  logger.warn({ skillName: name }, '技能未匹配任何分类，归类为"其他"');
  return '其他';
}
