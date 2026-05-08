import chokidar from 'chokidar';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfig } from '../infra/config.js';
import { logger } from '../infra/logger.js';
import { createGitInstance } from '../infra/git-operations.js';
import { syncToGitHub } from './orchestrator.js';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;
let hasPendingChanges = false;
let currentSyncPromise: Promise<void> | null = null;
const MAX_SYNC_ROUNDS = 5;

function debouncedSync(): void {
  const config = getConfig();
  logger.info({ debounceMs: config.debounceMs }, '检测到文件变化，稍后同步...');
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    await performSync();
  }, config.debounceMs);
}

async function performSync(round = 1): Promise<void> {
  if (isSyncing) {
    hasPendingChanges = true;
    logger.info('同步中，记录待处理变更');
    return;
  }

  if (round > MAX_SYNC_ROUNDS) {
    logger.warn({ maxRounds: MAX_SYNC_ROUNDS }, '达到最大同步轮次，停止递归');
    return;
  }

  isSyncing = true;
  hasPendingChanges = false;

  try {
    const git = createGitInstance();
    currentSyncPromise = syncToGitHub(git, { autoTranslate: true }).then(() => {});
    await currentSyncPromise;

    if (hasPendingChanges) {
      logger.info('检测到待处理变更，继续同步...');
      await performSync(round + 1);
    }
  } catch (error) {
    logger.error({ err: error }, '监视同步失败');
  } finally {
    isSyncing = false;
    currentSyncPromise = null;
  }
}

export async function gracefulShutdown(watcher: chokidar.FSWatcher): Promise<void> {
  logger.info('正在停止监视...');

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (currentSyncPromise) {
    logger.info('等待进行中的同步完成...');
    await currentSyncPromise.catch(() => {});
  }

  await watcher.close();
  logger.info('监视已停止');
}

export function startWatcher(): void {
  const config = getConfig();
  const skillsDir = path.join(config.agentsDir, 'skills');

  const watcher = chokidar.watch(config.watchPaths, {
    cwd: config.agentsDir,
    ignored: [
      /node_modules/,
      /\.git/,
      /.*\.log$/,
      /\.tmp$/,
      /src\//,
      /dist\//,
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  watcher
    .on('add', filePath => {
      logger.info({ event: 'add', path: filePath }, '文件添加');
      debouncedSync();
    })
    .on('change', filePath => {
      logger.info({ event: 'change', path: filePath }, '文件修改');
      debouncedSync();
    })
    .on('unlink', filePath => {
      logger.info({ event: 'unlink', path: filePath }, '文件删除');
      debouncedSync();
    })
    .on('error', error => {
      logger.error({ err: error }, '监视错误');
    })
    .on('ready', () => {
      logger.info({ dir: skillsDir }, 'Agent Skills 监视已启动');
      logger.info({ debounceMs: config.debounceMs }, '变化后自动同步到 GitHub');
      logger.info('新增 Skill 时自动调用 DeepSeek 翻译');
      logger.info('按 Ctrl+C 停止监视');
    });

  process.on('SIGINT', async () => {
    await gracefulShutdown(watcher);
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await gracefulShutdown(watcher);
    process.exit(0);
  });

  process.on('uncaughtException', err => {
    logger.error({ err }, '未捕获异常');
  });

  process.on('unhandledRejection', reason => {
    logger.error({ reason }, '未处理的 Promise 拒绝');
  });
}

const __filename = fileURLToPath(import.meta.url);
if (__filename === process.argv[1]) {
  startWatcher();
}
