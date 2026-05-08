import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from '../infra/config.js';
import { logger } from '../infra/logger.js';
import { readAllSkills } from './skills.js';
import { loadTranslations } from '../infra/translator.js';
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
  md += `> ${totalActive} active skills (${totalDeleted} deleted), ${totalCategories} categories\n\n`;
  md += '---\n\n## Table of Contents\n\n';

  categorized.forEach((c, i) => {
    const anchor = `${i + 1}-${encodeURIComponent(c.category.replace(/\s/g, '-'))}`;
    const deletedCount = c.deletedSkills.length;
    const countText = deletedCount > 0 ? `${c.skills.length} (${deletedCount} deleted)` : c.skills.length;
    md += `- [${i + 1}. ${c.category}](#${anchor}) (${countText})\n`;
  });

  md += '\n---\n\n';

  categorized.forEach((c, i) => {
    md += `## ${i + 1}. ${c.category}\n\n`;
    md += '| Skill Name | Description |\n';
    md += '|------------|-------------|\n';

    for (const skill of c.skills) {
      const cn = translations[skill.name] || translations[skill.dir] || skill.desc || '(no description)';
      md += `| \`${skill.name}\` | ${cn} |\n`;
    }

    for (const skill of c.deletedSkills) {
      const cn = translations[skill.name] || translations[skill.dir] || '(deleted)';
      md += `| ~~\`${skill.name}\`~~ | ~~${cn}~~ |\n`;
    }

    md += '\n';
  });

  md += `> Stats: ${totalCategories} categories, ${totalActive} skills (${totalDeleted} deleted)\n`;
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
  { label: 'Frontend Framework & Libraries', keywords: ['vue', 'react', 'next', 'nuxt', 'svelte', 'angular', 'javascript', 'typescript', 'pinia', 'composition'] },
  { label: 'UI/UX Design', keywords: ['ui', 'ux', 'design', 'css', 'tailwind', 'shadcn', 'color', 'typography', 'layout', 'animate', 'theme', 'style', 'brand', 'banner', 'slide', 'stitch', 'canvas', 'visual', 'polish', 'delight', 'bolder', 'quieter', 'distill', 'critique', 'clarify', 'shape', 'impeccable', 'frontend-design', 'imagegen', 'image-to-code', 'web-artifacts', 'kpi-dashboard', 'interaction', 'accessibility', 'wcag', 'screen-reader', 'responsive', 'adapt', 'optimize', 'typeset', 'gpt-taste', 'high-end', 'design-taste', 'industrial', 'minimalist', 'overdrive', 'ckm', 'web-design', 'web-component-design', 'design-system', 'unocss'] },
  { label: 'Backend Development', keywords: ['nodejs', 'nestjs', 'fastapi', 'dotnet', 'api', 'auth', 'stripe', 'paypal', 'backend', 'error-handling', 'openapi', 'better-auth', 'email-and-password', 'organization-best', 'create-auth'] },
  { label: 'Database & Storage', keywords: ['postgres', 'supabase', 'database', 'migration', 'sql'] },
  { label: 'DevOps & Cloud', keywords: ['docker', 'k8s', 'kubernetes', 'helm', 'terraform', 'github-actions', 'gitlab', 'deployment', 'gitops', 'istio', 'linkerd', 'mtls', 'cloud', 'cost-optimization', 'prometheus', 'grafana', 'tracing', 'service-mesh', 'slo', 'secrets', 'sast', 'secure-linux', 'openclaw', 'bazel', 'monorepo', 'turborepo', 'nx', 'pnpm', 'vite', 'tsdown', 'dependency'] },
  { label: 'Testing & QA', keywords: ['test', 'vitest', 'e2e', 'debugging', 'debug', 'code-review', 'verification', 'systematic', 'parallel-debug', 'bats'] },
  { label: 'Python Ecosystem', keywords: ['python', 'uv-package', 'async-python', 'fastapi-template'] },
  { label: 'AI/ML & Data Engineering', keywords: ['langchain', 'rag', 'llm', 'embedding', 'similarity', 'vector', 'hybrid-search', 'prompt-engineering', 'mcp-builder', 'ml-pipeline', 'data-quality', 'dbt', 'spark', 'airflow', 'backtesting', 'risk-metrics', 'algorithmic-art', 'claude-api'] },
  { label: 'Security', keywords: ['stride', 'attack-tree', 'threat', 'security', 'anti-reversing', 'binary-analysis', 'memory-forensics', 'memory-safety', 'protocol-reverse', 'solidity-security', 'pci', 'gdpr'] },
  { label: 'Documentation & Content', keywords: ['pdf', 'docx', 'xlsx', 'pptx', 'ocr', 'paddleocr', 'vitepress', 'slidev', 'technical-writer', 'hads', 'baoyu', 'readme-i18n', 'doc-coauthoring', 'changelog', 'slack-gif', 'pdftk'] },
  { label: 'Git & Version Control', keywords: ['git', 'worktree', 'receiving-code', 'requesting-code', 'finishing-a'] },
  { label: 'Architecture & Design Patterns', keywords: ['architecture', 'cqrs', 'event-store', 'projection', 'saga', 'microservices', 'workflow-orchestration', 'architecture-decision', 'rust-async'] },
  { label: 'Mobile Development', keywords: ['react-native', 'mobile', 'uni-app', 'uni-helper', 'uniapp', 'wechat', 'miniprogram', 'wot-ui', 'sleek-design', 'create-adaptable'] },
  { label: 'Blockchain & Web3', keywords: ['nft', 'defi', 'web3-testing'] },
  { label: 'Startup & Business', keywords: ['startup', 'market-sizing', 'competitive', 'team-composition-analysis', 'billing', 'data-storytelling', 'internal-comms', 'employment', 'postmortem', 'incident', 'on-call'] },
  { label: 'Development Workflow & Collaboration', keywords: ['brainstorming', 'simple', 'writing-plans', 'executing-plans', 'context-driven', 'track-management', 'workflow-patterns', 'task-coordination', 'team-communication', 'team-composition-patterns', 'dispatching', 'subagent', 'parallel-feature', 'multi-reviewer', 'karpathy', 'using-superpowers', 'skill-creator', 'skills-cli', 'find-skills', 'writing-skills', 'self-improving'] },
  { label: 'Tools & Utilities', keywords: ['firecrawl', 'browser-use', 'use-my-browser', 'webapp-testing', 'xdrop', 'xget', 'tzst', 'elite-longterm', 'soultrace', 'excel-automation', 'python-executor', 'python-sdk', 'running-claude'] },
  { label: 'Other', keywords: ['godot', 'unity', 'go-concurrency', 'template-skill', 'evaluation', 'redesign', 'enhance-prompt', 'remotion', 'opensource', 'antfu'] },
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
  logger.warn({ skillName: name }, '技能未匹配任何分类，归类为"Other"');
  return 'Other';
}
