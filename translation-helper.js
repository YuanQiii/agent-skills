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
    messages: [{ role: 'user', content: prompt }],
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
            resolve(result.choices[0].message.content.trim());
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadTranslations() {
  if (fs.existsSync(TRANSLATED_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TRANSLATED_FILE, 'utf8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveTranslations(translations) {
  fs.writeFileSync(TRANSLATED_FILE, JSON.stringify(translations, null, 2), 'utf8');
}

async function translateAndSave(skillName, description) {
  const translations = loadTranslations();

  if (translations[skillName]) {
    return translations[skillName];
  }

  if (!description || !description.trim()) {
    translations[skillName] = '';
    saveTranslations(translations);
    return '';
  }

  try {
    const cn = await translateText(description);
    translations[skillName] = cn;
    saveTranslations(translations);
    return cn;
  } catch (e) {
    console.error(`❌ 翻译失败 [${skillName}]: ${e.message}`);
    return description;
  }
}

async function translateNewSkills(newSkills) {
  console.log(`🔄 开始翻译 ${newSkills.length} 个新技能...`);
  const results = [];

  for (const skill of newSkills) {
    process.stdout.write(`[翻译] ${skill.name}: ${skill.desc?.substring(0, 20)}... -> `);
    const cn = await translateAndSave(skill.name, skill.desc);
    console.log(cn);
    results.push({ name: skill.name, translation: cn });
    await sleep(300);
  }

  console.log(`✅ 完成 ${results.length} 个新技能翻译`);
  return results;
}

module.exports = {
  translateText,
  sleep,
  loadTranslations,
  saveTranslations,
  translateAndSave,
  translateNewSkills
};
