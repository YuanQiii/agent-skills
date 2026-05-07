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
  logger.info({ debounceMs: config.debounceMs }, 'File change detected, syncing in a moment...');
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    await performSync();
  }, config.debounceMs);
}

async function performSync(round = 1): Promise<void> {
  if (isSyncing) {
    hasPendingChanges = true;
    logger.info('Sync in progress, recording pending changes');
    return;
  }

  if (round > MAX_SYNC_ROUNDS) {
    logger.warn({ maxRounds: MAX_SYNC_ROUNDS }, 'Max sync rounds reached, stopping recursion');
    return;
  }

  isSyncing = true;
  hasPendingChanges = false;

  try {
    const git = createGitInstance();
    currentSyncPromise = syncToGitHub(git, { autoTranslate: true }).then(() => {});
    await currentSyncPromise;

    if (hasPendingChanges) {
      logger.info('Pending changes detected, continuing sync...');
      await performSync(round + 1);
    }
  } catch (error) {
    logger.error({ err: (error as Error).message }, 'Watch sync failed');
  } finally {
    isSyncing = false;
    currentSyncPromise = null;
  }
}

export async function gracefulShutdown(watcher: chokidar.FSWatcher): Promise<void> {
  logger.info('Stopping watcher...');

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (currentSyncPromise) {
    logger.info('Waiting for ongoing sync to complete...');
    await currentSyncPromise.catch(() => {});
  }

  await watcher.close();
  logger.info('Watcher stopped');
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
      logger.info({ event: 'add', path: filePath }, 'File added');
      debouncedSync();
    })
    .on('change', filePath => {
      logger.info({ event: 'change', path: filePath }, 'File modified');
      debouncedSync();
    })
    .on('unlink', filePath => {
      logger.info({ event: 'unlink', path: filePath }, 'File deleted');
      debouncedSync();
    })
    .on('error', error => {
      logger.error({ error }, 'Watcher error');
    })
    .on('ready', () => {
      logger.info({ dir: skillsDir }, 'Agent Skills watcher started');
      logger.info({ debounceMs: config.debounceMs }, 'Auto-sync to GitHub on changes');
      logger.info('Auto-translate new skills using DeepSeek');
      logger.info('Press Ctrl+C to stop watching');
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
    logger.error({ err }, 'Uncaught exception');
  });

  process.on('unhandledRejection', reason => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
}

const __filename = fileURLToPath(import.meta.url);
if (__filename === process.argv[1]) {
  startWatcher();
}
