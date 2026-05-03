import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ConfigError } from '../shared/errors.js';

export interface SyncConfig {
  agentsDir: string;
  dataDir: string;
  logsDir: string;
  debounceMs: number;
  branch: string;
  remote: string;
  maxRetries: number;
  retryBaseDelayMs: number;
  watchPaths: string[];
  addPaths: string[];
  logLevel: string;
  translationRpm: number;
}

const DEFAULT_CONFIG: SyncConfig = {
  agentsDir: '',
  dataDir: '',
  logsDir: '',
  debounceMs: 5000,
  branch: 'main',
  remote: 'origin',
  maxRetries: 3,
  retryBaseDelayMs: 1000,
  watchPaths: ['skills/', '.skill-lock.json'],
  addPaths: ['skills', '.skill-lock.json', 'package.json', 'sync.config.json', 'data/', 'src/', 'tsconfig.json'],
  logLevel: 'info',
  translationRpm: 30,
};

const ARRAY_KEYS: (keyof SyncConfig)[] = ['watchPaths', 'addPaths'];

export function loadConfig(overrides?: Partial<SyncConfig>): SyncConfig {
  const agentsDir = process.env.AGENTS_DIR || path.join(os.homedir(), '.agents');
  const configPath = path.join(agentsDir, 'sync.config.json');

  let userConfig: Partial<SyncConfig> = {};
  if (fs.existsSync(configPath)) {
    try {
      userConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      throw new ConfigError(`配置文件解析失败: ${(e as Error).message}`, { cause: e });
    }
  }

  const resolvedAgentsDir = overrides?.agentsDir || userConfig.agentsDir || agentsDir;
  const dataDir = overrides?.dataDir || userConfig.dataDir || path.join(resolvedAgentsDir, 'data');
  const logsDir = overrides?.logsDir || userConfig.logsDir || path.join(resolvedAgentsDir, 'logs');

  for (const dir of [dataDir, logsDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const merged = {
    ...DEFAULT_CONFIG,
    ...userConfig,
    ...overrides,
    agentsDir: resolvedAgentsDir,
    dataDir,
    logsDir,
  };

  for (const key of ARRAY_KEYS) {
    const defaultArr = DEFAULT_CONFIG[key] as string[];
    const userArr = userConfig[key] as string[] | undefined;
    const overrideArr = overrides?.[key] as string[] | undefined;
    if (overrideArr) {
      (merged as Record<string, unknown>)[key] = [...defaultArr, ...overrideArr];
    } else if (userArr) {
      (merged as Record<string, unknown>)[key] = [...defaultArr, ...userArr];
    }
  }

  return merged;
}

let _config: SyncConfig | null = null;

export function getConfig(): SyncConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}

export function resetConfig(): void {
  _config = null;
}
