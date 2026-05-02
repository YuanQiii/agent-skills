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

function generateCatalog() {
  const translatedPath = path.join(__dirname, 'translated-descriptions.json');
  let translated = {};
  if (fs.existsSync(translatedPath)) {
    try {
      translated = JSON.parse(fs.readFileSync(translatedPath, 'utf8'));
    } catch (e) {
      log(`⚠️  翻译文件加载失败: ${e.message}`);
    }
  }

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
      const cn = translated[skill.name] || translated[skill.dir] || skill.desc || '（暂无描述）';
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
