const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_CONFIG = {
  agentsDir: '',
  debounceMs: 5000,
  branch: 'main',
  remote: 'origin',
  maxRetries: 3,
  retryBaseDelayMs: 1000,
  watchPaths: ['skills/', '.skill-lock.json'],
  addPaths: ['skills', '.skill-lock.json', 'package.json', 'sync.config.json'],
  logToFile: true,
  logFileName: 'sync.log'
};

function loadConfig() {
  const agentsDir = process.env.AGENTS_DIR || path.join(os.homedir(), '.agents');
  const configPath = path.join(agentsDir, 'sync.config.json');

  let userConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.error(`⚠️  配置文件解析失败，使用默认配置: ${e.message}`);
    }
  }

  const config = { ...DEFAULT_CONFIG, ...userConfig, agentsDir: userConfig.agentsDir || agentsDir };
  return config;
}

const config = loadConfig();

function getTimestamp() {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function log(message) {
  const line = `[${getTimestamp()}] ${message}`;
  console.log(line);

  if (config.logToFile) {
    const logPath = path.join(config.agentsDir, config.logFileName);
    try {
      fs.appendFileSync(logPath, line + '\n');
    } catch (_) {}
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(fn, maxRetries = config.maxRetries, baseDelay = config.retryBaseDelayMs) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      log(`⚠️  第 ${i + 1} 次重试失败，${delay}ms 后重试...`);
      await sleep(delay);
    }
  }
}

module.exports = { config, loadConfig, getTimestamp, log, sleep, retry };
