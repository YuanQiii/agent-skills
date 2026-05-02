const chokidar = require('chokidar');
const { simpleGit } = require('simple-git');
const path = require('path');

const AGENTS_DIR = 'c:\\Users\\93402\\.agents';
const SKILLS_DIR = path.join(AGENTS_DIR, 'skills');
const LOCK_FILE = '.skill-lock.json';

const git = simpleGit(AGENTS_DIR);
let debounceTimer = null;
let isSyncing = false;

const watcher = chokidar.watch([SKILLS_DIR, LOCK_FILE], {
  cwd: AGENTS_DIR,
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

async function syncToGitHub() {
  if (isSyncing) {
    console.log('⏳ 同步中，跳过本次触发...');
    return;
  }

  isSyncing = true;
  try {
    const status = await git.status();

    const relevantChanges = status.files.filter(f => {
      const filePath = f.path;
      return filePath.startsWith('skills/') || filePath === '.skill-lock.json';
    });

    if (relevantChanges.length > 0) {
      console.log('📝 检测到变化文件:');
      relevantChanges.forEach(f => console.log(`   - ${f.path} (${f.index}${f.workingDir})`));

      await git.add(['skills', '.skill-lock.json', 'package.json']);

      const timestamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const commitMessage = `自动同步: ${timestamp}`;
      await git.commit(commitMessage);

      console.log('📤 推送到 GitHub...');
      await git.push('origin', 'main', ['-u']);

      console.log('✅ 同步成功!');
    } else {
      console.log('ℹ️  无相关变化');
    }
  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    if (error.message.includes('Authentication failed')) {
      console.error('💡 提示: 请检查 GitHub 认证信息');
    }
  } finally {
    isSyncing = false;
  }
}

function debouncedSync() {
  console.log('🔍 检测到文件变化，5秒后同步...');
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(syncToGitHub, 5000);
}

watcher
  .on('add', path => {
    console.log(`➕ 文件添加: ${path}`);
    debouncedSync();
  })
  .on('change', path => {
    console.log(`📝 文件修改: ${path}`);
    debouncedSync();
  })
  .on('unlink', path => {
    console.log(`🗑️ 文件删除: ${path}`);
    debouncedSync();
  })
  .on('error', error => {
    console.error('❌ 监视错误:', error);
  })
  .on('ready', () => {
    console.log('👀 Agent Skills 监视已启动');
    console.log('📂 监视目录:', SKILLS_DIR);
    console.log('📄 监视文件:', LOCK_FILE);
    console.log('⏰ 变化后 5 秒自动同步到 GitHub');
    console.log('按 Ctrl+C 停止监视\n');
  });

process.on('SIGINT', () => {
  console.log('\n\n🛑 正在停止监视...');
  watcher.close().then(() => {
    console.log('✅ 监视已停止');
    process.exit(0);
  });
});
