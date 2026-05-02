const fs = require('fs');
const path = require('path');
const https = require('https');
const { config, log } = require('./utils');

const API_URL = 'api.deepseek.com';
const TRANSLATED_FILE = path.join(config.agentsDir, 'translated-descriptions.json');

function getApiKey() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('请设置 DEEPSEEK_API_KEY 环境变量');
  }
  return apiKey;
}

async function translateText(text) {
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
      'Authorization': `Bearer ${getApiKey()}`,
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
    log(`❌ 翻译失败 [${skillName}]: ${e.message}`);
    return description;
  }
}

module.exports = {
  getApiKey,
  translateText,
  loadTranslations,
  saveTranslations,
  translateAndSave,
  TRANSLATED_FILE
};
