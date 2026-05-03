import pino from 'pino';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const agentsDir = process.env.AGENTS_DIR || path.join(os.homedir(), '.agents');
const logsDir = path.join(agentsDir, 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'sync.log');

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  },
  pino.multistream([
    {
      level: 'info',
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }),
    },
    {
      level: 'info',
      stream: pino.transport({
        target: 'pino-roll',
        options: {
          file: logFilePath,
          size: '5m',
          mkdir: true,
        },
      }),
    },
  ]),
);

export function getTimestamp(): string {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
