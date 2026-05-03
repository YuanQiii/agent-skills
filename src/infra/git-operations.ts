import { simpleGit, type SimpleGit } from 'simple-git';
import { getConfig } from './config.js';
import { logger } from './logger.js';
import { retry } from '../shared/retry.js';
import { isGitAuthError, GitAuthError } from '../shared/errors.js';

const RELEVANT_PATTERNS = [
  /^skills\//,
  /^\.skill-lock\.json$/,
  /^package\.json$/,
  /^sync\.config\.json$/,
];

export function isRelevantChange(filePath: string): boolean {
  return RELEVANT_PATTERNS.some(p => p.test(filePath));
}

export function isSkillsChange(filePath: string): boolean {
  return filePath.startsWith('skills/') || filePath === '.skill-lock.json';
}

export function isNewSkillFile(filePath: string): boolean {
  return /\/SKILL\.md$/.test(filePath);
}

export function extractSkillDirFromPath(filePath: string): string | null {
  const match = filePath.match(/skills\/([^/]+)\/SKILL\.md$/);
  return match ? match[1] : null;
}

export function createGitInstance(): SimpleGit {
  const config = getConfig();
  return simpleGit(config.agentsDir);
}

export interface GitCommitResult {
  hash: string;
  message: string;
}

export async function gitStatus(git: SimpleGit) {
  return git.status();
}

export async function gitAddCommitPush(
  git: SimpleGit,
  addPaths: string[],
  commitMessage: string,
  remote: string,
  branch: string,
): Promise<GitCommitResult> {
  await git.add(addPaths);
  await git.commit(commitMessage);

  const commit = await git.log({ maxCount: 1 });
  const latest = commit.latest;
  if (!latest) throw new Error('提交后无法获取 commit 日志');

  const hash = latest.hash.substring(0, 7);
  logger.info({ hash, message: latest.message }, '提交成功');

  logger.info({ remote, branch }, '推送到 GitHub...');
  await retry(() => git.push(remote, branch, ['-u']));

  return { hash, message: latest.message };
}

export function handleGitError(error: unknown): Error {
  const err = error as Error;
  logger.error({ err: err.message }, 'Git 操作失败');

  if (isGitAuthError(err)) {
    logger.error('Git 认证失败，请检查:');
    logger.error('  1. git config --global credential.helper manager');
    logger.error('  2. gh auth login');
    logger.error('  3. 设置 AGENTS_DIR 环境变量');
    return new GitAuthError(err.message);
  }

  return err;
}
