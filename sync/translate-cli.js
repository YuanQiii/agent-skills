const { log, sleep, readAllSkills } = require('./utils');
const { translateText, loadTranslations, saveTranslations } = require('./translator');

async function main() {
  const skills = readAllSkills();

  console.log(`📊 共发现 ${skills.length} 个技能\n`);

  const existingTranslations = loadTranslations();
  const newTranslations = {};
  let updated = 0;
  let unchanged = 0;

  for (const skill of skills) {
    if (existingTranslations[skill.name]) {
      newTranslations[skill.name] = existingTranslations[skill.name];
      unchanged++;
    } else if (skill.desc && skill.desc.trim()) {
      process.stdout.write(`[${updated + unchanged + 1}/${skills.length}] ${skill.name}: ${skill.desc.substring(0, 30)}... -> `);
      try {
        const cn = await translateText(skill.desc);
        newTranslations[skill.name] = cn;
        console.log(cn);
        updated++;
        await sleep(300);
      } catch (e) {
        console.error(`❌ 失败: ${e.message}`);
        newTranslations[skill.name] = skill.desc;
        updated++;
      }
    } else {
      newTranslations[skill.name] = '';
    }
  }

  saveTranslations(newTranslations);

  console.log(`\n✅ 完成!`);
  console.log(`   - 新翻译: ${updated}`);
  console.log(`   - 已有翻译: ${unchanged}`);
}

main().catch(console.error);
