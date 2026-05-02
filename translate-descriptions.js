const fs = require('fs');
const path = require('path');
const { translateText, sleep, loadTranslations, saveTranslations } = require('./translation-helper');

async function main() {
  const skillsDir = path.join(__dirname, 'skills');
  const items = fs.readdirSync(skillsDir).filter(f =>
    fs.statSync(path.join(skillsDir, f)).isDirectory()
  );

  const skills = [];
  items.forEach(dirName => {
    const sf = path.join(skillsDir, dirName, 'SKILL.md');
    if (!fs.existsSync(sf)) return;
    const c = fs.readFileSync(sf, 'utf8');
    let name = dirName, desc = '';
    const nm = c.match(/^name:\s*(.+)$/m);
    if (nm) name = nm[1].trim();
    const dm = c.match(/^description:\s*["']?(.+?)["']?\s*$/m);
    if (dm) desc = dm[1].trim();
    else {
      const dm2 = c.match(/description:\s*\n\s+(.+)/);
      if (dm2) desc = dm2[1].trim();
    }
    skills.push({ name, dir: dirName, desc });
  });

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
