import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from '../infra/config.js';
import { logger } from '../infra/logger.js';
import { type SkillInfo } from './skills.js';
import { CATEGORIES, classifySkill } from './categories.js';

export interface CategorizedSkills {
  category: string;
  skills: SkillInfo[];
}

export function categorizeSkills(
  skills: SkillInfo[],
  categories = CATEGORIES,
): CategorizedSkills[] {
  const map = new Map<string, SkillInfo[]>();
  for (const cat of categories) {
    map.set(cat.label, []);
  }

  for (const skill of skills) {
    const cat = classifySkill(skill.name, skill.desc, categories);
    const list = map.get(cat);
    if (list) {
      list.push(skill);
    }
  }

  return categories
    .map(cat => ({ category: cat.label, skills: map.get(cat.label) ?? [] }))
    .filter(c => c.skills.length > 0);
}

export function generateCatalogMarkdown(
  skills: SkillInfo[],
  translations: Record<string, string>,
  categories = CATEGORIES,
): string {
  const categorized = categorizeSkills(skills, categories);
  const totalCategories = categorized.length;

  let md = '# Agent Skills 技能分类索引\n\n';
  md += `> 共计 ${skills.length} 个技能，按功能领域分为 ${totalCategories} 大类\n\n`;
  md += '---\n\n## 📑 目录\n\n';

  categorized.forEach((c, i) => {
    const anchor = `${i + 1}-${encodeURIComponent(c.category.replace(/\s/g, '-'))}`;
    md += `- [${i + 1}. ${c.category}](#${anchor}) (${c.skills.length})\n`;
  });

  md += '\n---\n\n';

  categorized.forEach((c, i) => {
    md += `## ${i + 1}. ${c.category}\n\n`;
    md += '| 技能名称 | 中文简介 |\n';
    md += '|---------|---------|\n';
    for (const skill of c.skills) {
      const cn = translations[skill.name] || translations[skill.dir] || skill.desc || '（暂无描述）';
      md += `| \`${skill.name}\` | ${cn} |\n`;
    }
    md += '\n';
  });

  md += `> 📊 统计：共 ${totalCategories} 个分类，${skills.length} 个技能\n`;
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
