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
    messageKey: 'msg',
    base: {
      pid: process.pid,
    },
    formatters: {
      level(label) {
        return { level: label };
      },
    },
    mixin() {
      return { ts: new Date().toISOString() };
    },
  },
  pino.multistream([
    {
      level: 'info',
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname,ts',
          messageKey: 'msg',
          crlf: false,
          singleLine: true,
        },
      }),
    },
    {
      level: 'error',
      stream: pino.transport({
        target: 'pino-roll',
        options: {
          file: logFilePath,
          size: '5m',
          mkdir: true,
          maxFiles: 5,
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
          maxFiles: 5,
        },
      }),
    },
    {
      level: 'warn',
      stream: pino.transport({
        target: 'pino-roll',
        options: {
          file: logFilePath,
          size: '5m',
          mkdir: true,
          maxFiles: 5,
        },
      }),
    },
  ]),
);

export function createChildLogger(module: string): pino.Logger {
  return logger.child({ module });
}

export function getTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}
