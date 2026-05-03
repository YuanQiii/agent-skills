import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from './config.js';
import { logger } from './logger.js';
import { sleep } from '../shared/retry.js';
import { TranslationError } from '../shared/errors.js';

const API_URL = 'https://api.deepseek.com/chat/completions';

let lastCallTime = 0;

function getApiKey(): string {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new TranslationError('请设置 DEEPSEEK_API_KEY 环境变量');
  }
  return apiKey;
}

async function enforceRateLimit(): Promise<void> {
  const config = getConfig();
  const minInterval = 60_000 / config.translationRpm;
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < minInterval) {
    await sleep(minInterval - elapsed);
  }
  lastCallTime = Date.now();
}

export async function translateText(text: string): Promise<string> {
  if (!text || text.trim() === '') return '';

  await enforceRateLimit();

  const prompt = `Translate the following English text to Chinese. Keep it concise (within 50 characters). Only output the translation, no explanations.

English: "${text}"

Chinese:`;

  const body = JSON.stringify({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 100,
  });

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
    },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new TranslationError(`DeepSeek API 错误 ${response.status}: ${errorBody}`);
  }

  const result = await response.json() as { choices: Array<{ message: { content: string } }>; error?: { message: string } };

  if (result.error) {
    throw new TranslationError(result.error.message);
  }

  return result.choices[0].message.content.trim();
}

export function getTranslationsFilePath(): string {
  const config = getConfig();
  return path.join(config.dataDir, 'translated-descriptions.json');
}

export function loadTranslations(filePath?: string): Record<string, string> {
  const p = filePath ?? getTranslationsFilePath();
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

export function saveTranslations(translations: Record<string, string>, filePath?: string): void {
  const p = filePath ?? getTranslationsFilePath();
  fs.writeFileSync(p, JSON.stringify(translations, null, 2), 'utf8');
}

export async function translateAndSave(skillName: string, description: string): Promise<string> {
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
    logger.error({ skillName, err: (e as Error).message }, '翻译失败');
    return description;
  }
}
