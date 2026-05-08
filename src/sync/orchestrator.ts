import path from 'node:path';
import type { SimpleGit, StatusResult } from 'simple-git';
import { getConfig } from '../infra/config.js';
import { logger } from '../infra/logger.js';
import { readAllSkills, parseSkillMd } from '../core/skills.js';
import { generateCatalog } from '../core/catalog.js';
import { loadTranslations, translateAndSave } from '../infra/translator.js';
import {
  isRelevantChange,
  isSkillsChange,
  isNewSkillFile,
  extractSkillDirFromPath,
  gitAddCommitPush,
  handleGitError,
} from '../infra/git-operations.js';

export interface SyncResult {
  success: boolean;
  commitHash?: string;
  error?: Error;
}

export async function syncToGitHub(
  git: SimpleGit,
  options?: { autoTranslate?: boolean },
): Promise<SyncResult> {
  const config = getConfig();
  const { autoTranslate = false } = options ?? {};

  try {
    const status: StatusResult = await git.status();

    logger.info({ branch: status.current, ahead: status.ahead, behind: status.behind }, 'Git 状态');

    const relevantChanges = status.files.filter(f => isRelevantChange(f.path));
    const hasSkillsChange = relevantChanges.some(f => isSkillsChange(f.path));

    if (autoTranslate) {
      await translateNewSkills(relevantChanges, config.agentsDir);
    }

    if (hasSkillsChange) {
      logger.info('Skills 变化，重新生成目录...');
      try {
        const skills = readAllSkills();
        const translations = loadTranslations();
        generateCatalog(skills, translations);
      } catch (e) {
        logger.warn({ err: (e as Error).message }, '目录生成失败');
      }
    }

    if (relevantChanges.length === 0 && !hasSkillsChange) {
      logger.info('无变化需要同步');
      return { success: true };
    }

    logger.info({
      files: relevantChanges.map(f => ({
        path: f.path,
        status: f.index === '?' ? 'added' : f.index === 'M' ? 'modified' : f.index,
      })),
    }, '检测到变化文件');

    const commitMessage = `${autoTranslate ? '自动' : '手动'}同步: ${new Date().toISOString()}`;
    const result = await gitAddCommitPush(
      git,
      [...config.addPaths, 'data/'],
      commitMessage,
      config.remote,
      config.branch,
    );

    logger.info('同步完成');
    return { success: true, commitHash: result.hash };

  } catch (error) {
    const handled = handleGitError(error);
    return { success: false, error: handled };
  }
}

async function translateNewSkills(
  relevantChanges: StatusResult['files'],
  agentsDir: string,
): Promise<void> {
  const newSkillFiles = relevantChanges.filter(f => isNewSkillFile(f.path));
  if (newSkillFiles.length === 0) return;

  logger.info({ count: newSkillFiles.length }, '检测到新技能，开始翻译');

  for (const f of newSkillFiles) {
    const skillDir = extractSkillDirFromPath(f.path);
    if (!skillDir) continue;

    const skillsDir = path.join(agentsDir, 'skills');
    const skillFile = path.join(skillsDir, skillDir, 'SKILL.md');
    const parsed = parseSkillMd(skillFile);
    if (!parsed?.desc) continue;

    const skillKey = parsed.name || skillDir;
    const translations = loadTranslations();
    if (translations[skillKey]) {
      logger.info({ skillKey }, '技能已有翻译');
      continue;
    }

    logger.info({ skillKey, desc: parsed.desc.substring(0, 30) }, '翻译新技能');
    const cn = await translateAndSave(skillKey, parsed.desc);
    logger.info({ skillKey, translation: cn }, '翻译完成');
  }
}
