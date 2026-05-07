import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from '../infra/config.js';
import { logger } from '../infra/logger.js';
import { type SkillInfo } from './skills.js';
import { CATEGORIES, classifySkill } from './categories.js';

export interface CategorizedSkills {
  category: string;
  skills: SkillInfo[];
  deletedSkills: SkillInfo[];
}

export function categorizeSkills(
  skills: SkillInfo[],
  deletedSkills: SkillInfo[] = [],
  categories = CATEGORIES,
): CategorizedSkills[] {
  const map = new Map<string, { active: SkillInfo[]; deleted: SkillInfo[] }>();
  for (const cat of categories) {
    map.set(cat.label, { active: [], deleted: [] });
  }

  for (const skill of skills) {
    const cat = classifySkill(skill.name, skill.desc, categories);
    const entry = map.get(cat);
    if (entry) {
      entry.active.push(skill);
    }
  }

  for (const skill of deletedSkills) {
    const cat = classifySkill(skill.name, skill.desc, categories);
    const entry = map.get(cat);
    if (entry) {
      entry.deleted.push(skill);
    }
  }

  return categories
    .map(cat => {
      const entry = map.get(cat.label);
      return {
        category: cat.label,
        skills: entry?.active ?? [],
        deletedSkills: entry?.deleted ?? [],
      };
    })
    .filter(c => c.skills.length > 0 || c.deletedSkills.length > 0);
}

export function generateCatalogMarkdown(
  skills: SkillInfo[],
  translations: Record<string, string>,
  categories = CATEGORIES,
): string {
  const currentSkillNames = new Set(skills.map(s => s.name));
  const deletedSkillNames = Object.keys(translations).filter(name => !currentSkillNames.has(name));

  const deletedSkills: SkillInfo[] = deletedSkillNames.map(name => ({
    name,
    dir: name,
    desc: translations[name] || '(已删除)',
  }));

  const categorized = categorizeSkills(skills, deletedSkills, categories);
  const totalCategories = categorized.length;
  const totalActive = skills.length;
  const totalDeleted = deletedSkillNames.length;

  let md = '# Agent Skills 技能分类索引\n\n';
  md += `> 共计 ${totalActive} 个技能（${totalDeleted} 个已删除），按功能领域分为 ${totalCategories} 大类\n\n`;
  md += '---\n\n## 📑 目录\n\n';

  categorized.forEach((c, i) => {
    const anchor = `${i + 1}-${encodeURIComponent(c.category.replace(/\s/g, '-'))}`;
    const deletedCount = c.deletedSkills.length;
    const countText = deletedCount > 0 ? `${c.skills.length} (${deletedCount} 删除)` : c.skills.length;
    md += `- [${i + 1}. ${c.category}](#${anchor}) (${countText})\n`;
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
    
    for (const skill of c.deletedSkills) {
      const cn = translations[skill.name] || translations[skill.dir] || '(已删除)';
      md += `| ~~\`${skill.name}\`~~ | ~~${cn}~~ |\n`;
    }
    
    md += '\n';
  });

  md += `> 📊 统计：共 ${totalCategories} 个分类，${totalActive} 个技能（${totalDeleted} 个已删除）\n`;
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
