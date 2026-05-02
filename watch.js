const chokidar = require('chokidar');
const { simpleGit } = require('simple-git');
const path = require('path');
const fs = require('fs');
const { config, log, retry, getTimestamp } = require('./utils');
const { generateCatalog } = require('./generate-catalog');
const { translateAndSave, loadTranslations } = require('./translation-helper');

const SKILLS_DIR = path.join(config.agentsDir, 'skills');
const git = simpleGit(config.agentsDir);

let debounceTimer = null;
let isSyncing = false;
let hasPendingChanges = false;

const WATCHED_PATTERNS = [
  /^skills\//,
  /^\.skill-lock\.json$/,
  /^package\.json$/,
  /^sync\.config\.json$/
];

function isRelevantChange(filePath) {
  return WATCHED_PATTERNS.some(pattern => pattern.test(filePath));
}

function isSkillsChange(filePath) {
  return filePath.startsWith('skills/') || filePath === '.skill-lock.json';
}

function isNewSkillFile(filePath) {
  return /\/SKILL\.md$/.test(filePath);
}

function extractSkillNameFromPath(filePath) {
  const match = filePath.match(/skills\/([^\/]+)\/SKILL\.md$/);
  return match ? match[1] : null;
}

async function translateNewSkillIfNeeded(filePath) {
  const skillName = extractSkillNameFromPath(filePath);
  if (!skillName) return null;

  const translations = loadTranslations();
  if (translations[skillName]) {
    log(`ℹ️  技能 [${skillName}] 已有翻译`);
    return null;
  }

  const skillFile = path.join(SKILLS_DIR, skillName, 'SKILL.md');
  if (!fs.existsSync(skillFile)) return null;

  const content = fs.readFileSync(skillFile, 'utf8');
  let description = '';

  const dm = content.match(/^description:\s*["']?(.+?)["']?\s*$/m);
  if (dm) description = dm[1].trim();
  else {
    const dm2 = content.match(/description:\s*\n\s+(.+)/);
    if (dm2) description = dm2[1].trim();
  }

  log(`🔤 翻译新技能 [${skillName}]: ${description?.substring(0, 30)}...`);
  const cn = await translateAndSave(skillName, description);
  log(`✅ 翻译完成: ${cn}`);
  return { name: skillName, translation: cn };
}

async function syncToGitHub() {
  if (isSyncing) {
    hasPendingChanges = true;
    log('⏳ 同步中，记录待处理变更...');
    return;
  }

  isSyncing = true;
  hasPendingChanges = false;

  try {
    const status = await git.status();

    const relevantChanges = status.files.filter(f => isRelevantChange(f.path));

    const newSkillFiles = relevantChanges.filter(f => isNewSkillFile(f.path));

    if (newSkillFiles.length > 0) {
      log(`🔤 检测到 ${newSkillFiles.length} 个新技能，开始翻译...`);
      for (const f of newSkillFiles) {
        await translateNewSkillIfNeeded(f.path);
      }
    }

    if (relevantChanges.length === 0) {
      log('ℹ️  无相关变化');
      return;
    }

    log('📝 检测到变化文件:');
    relevantChanges.forEach(f => log(`   - ${f.path} (${f.index || ''}${f.working_dir || ''})`));

    const hasSkillsChange = relevantChanges.some(f => isSkillsChange(f.path));
    if (hasSkillsChange) {
      log('📋 Skills 变化，重新生成目录...');
      try {
        generateCatalog();
      } catch (e) {
        log(`⚠️  目录生成失败: ${e.message}`);
      }
    }

    await git.add([...config.addPaths, 'skills-catalog.md']);

    const commitMessage = `自动同步: ${getTimestamp()}`;
    await git.commit(commitMessage);

    log('📤 推送到 GitHub...');
    await retry(() => git.push(config.remote, config.branch, ['-u']));

    log('✅ 同步成功!');

    if (hasPendingChanges) {
      log('🔄 检测到待处理变更，继续同步...');
      await syncToGitHub();
    }
  } catch (error) {
    log(`❌ 同步失败: ${error.message}`);
    if (error.message.includes('Authentication failed')) {
      log('💡 提示: 请检查 GitHub 认证信息');
    }
  } finally {
    isSyncing = false;
  }
}

function debouncedSync() {
  log(`🔍 检测到文件变化，${config.debounceMs / 1000}秒后同步...`);
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(syncToGitHub, config.debounceMs);
}

const watcher = chokidar.watch(config.watchPaths, {
  cwd: config.agentsDir,
  ignored: [
    /node_modules/,
    /\.git/,
    /.*\.log$/,
    /\.tmp$/
  ],
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
});

watcher
  .on('add', filePath => {
    log(`➕ 文件添加: ${filePath}`);
    debouncedSync();
  })
  .on('change', filePath => {
    log(`📝 文件修改: ${filePath}`);
    debouncedSync();
  })
  .on('unlink', filePath => {
    log(`🗑️ 文件删除: ${filePath}`);
    debouncedSync();
  })
  .on('error', error => {
    log(`❌ 监视错误: ${error}`);
  })
  .on('ready', () => {
    log('👀 Agent Skills 监视已启动');
    log(`📂 监视目录: ${SKILLS_DIR}`);
    log('📄 监视文件: .skill-lock.json, package.json, sync.config.json');
    log(`⏰ 变化后 ${config.debounceMs / 1000} 秒自动同步到 GitHub`);
    log('🔤 新增 Skill 时自动调用 DeepSeek 翻译');
    log('按 Ctrl+C 停止监视\n');
  });

process.on('SIGINT', () => {
  log('\n🛑 正在停止监视...');
  watcher.close().then(() => {
    log('✅ 监视已停止');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  log(`❌ 未捕获异常: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  log(`❌ 未处理的 Promise 拒绝: ${reason}`);
});
