const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = 'sk-fd66016421434d89919a3c5223f04a00';
const API_URL = 'api.deepseek.com';

const TRANSLATED_FILE = path.join(__dirname, 'translated-descriptions.json');

async function translateText(text, retries = 3) {
  if (!text || text.trim() === '') return '';

  const prompt = `Translate the following English text to Chinese. Keep it concise (within 50 characters). Only output the translation, no explanations.

English: "${text}"

Chinese:`;

  const data = JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 100
  });

  const options = {
    hostname: API_URL,
    path: '/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.error) {
            reject(new Error(result.error.message));
          } else {
            const translation = result.choices[0].message.content.trim();
            resolve(translation);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateAll(skills) {
  const translated = {};
  let completed = 0;
  const total = skills.length;

  console.log(`🚀 开始翻译 ${total} 个技能描述...\n`);

  for (const skill of skills) {
    if (skill.desc && skill.desc.trim()) {
      try {
        console.log(`[${++completed}/${total}] 翻译: ${skill.name}`);
        const cn = await translateText(skill.desc);
        translated[skill.name] = cn;
        await sleep(300);
      } catch (e) {
        console.error(`  ❌ 翻译失败: ${e.message}`);
        translated[skill.name] = skill.desc;
      }
    } else {
      translated[skill.name] = '';
      console.log(`[${++completed}/${total}] 跳过（无描述）: ${skill.name}`);
    }
  }

  return translated;
}

function loadExistingTranslations() {
  if (fs.existsSync(TRANSLATED_FILE)) {
    return JSON.parse(fs.readFileSync(TRANSLATED_FILE, 'utf8'));
  }
  return {};
}

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

  const existingTranslations = loadExistingTranslations();
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

  fs.writeFileSync(TRANSLATED_FILE, JSON.stringify(newTranslations, null, 2), 'utf8');

  console.log(`\n✅ 完成!`);
  console.log(`   - 新翻译: ${updated}`);
  console.log(`   - 已有翻译: ${unchanged}`);
  console.log(`   - 保存至: ${TRANSLATED_FILE}`);
}

main().catch(console.error);
