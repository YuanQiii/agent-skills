import { readAllSkills } from '../core/skills.js';
import { translateText, loadTranslations, saveTranslations } from '../infra/translator.js';
import { logger } from '../infra/logger.js';

async function main(): Promise<void> {
  const skills = readAllSkills();
  const existingTranslations = loadTranslations();
  const newTranslations: Record<string, string> = {};
  let updated = 0;
  let unchanged = 0;

  logger.info({ total: skills.length }, '开始批量翻译');

  for (const skill of skills) {
    if (existingTranslations[skill.name]) {
      newTranslations[skill.name] = existingTranslations[skill.name];
      unchanged++;
    } else if (skill.desc && skill.desc.trim()) {
      logger.info({ index: updated + unchanged + 1, total: skills.length, skill: skill.name }, '翻译中');
      try {
        const cn = await translateText(skill.desc);
        newTranslations[skill.name] = cn;
        logger.info({ skill: skill.name, translation: cn }, '翻译完成');
        updated++;
      } catch (e) {
        logger.error({ skill: skill.name, err: (e as Error).message }, '翻译失败');
        newTranslations[skill.name] = skill.desc;
        updated++;
      }
    } else {
      newTranslations[skill.name] = '';
    }
  }

  saveTranslations(newTranslations);

  logger.info({ updated, unchanged }, '批量翻译完成');
}

main().catch(err => {
  logger.error({ err: (err as Error).message }, '翻译任务失败');
  process.exit(1);
});
