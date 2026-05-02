const { simpleGit } = require('simple-git');
const path = require('path');

const AGENTS_DIR = 'c:\\Users\\93402\\.agents';

async function sync() {
  console.log('🔄 开始同步...\n');

  try {
    const git = simpleGit(AGENTS_DIR);
    const status = await git.status();

    console.log('📊 Git 状态:');
    console.log(`   当前分支: ${status.current}`);
    console.log(`   领先: ${status.ahead}`);
    console.log(`   落后: ${status.behind}\n`);

    const relevantChanges = status.files.filter(f => {
      const filePath = f.path;
      return filePath.startsWith('skills/') ||
             filePath === '.skill-lock.json' ||
             filePath === 'package.json';
    });

    if (relevantChanges.length === 0) {
      console.log('ℹ️  无变化需要同步\n');
      return;
    }

    console.log('📝 变化文件:');
    relevantChanges.forEach(f => {
      const statusSymbol = f.index === '?' ? '+' : f.index === 'M' ? 'M' : f.index;
      console.log(`   [${statusSymbol}] ${f.path}`);
    });
    console.log('');

    await git.add(['skills', '.skill-lock.json', 'package.json']);

    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const commitMessage = `手动同步: ${timestamp}`;
    console.log(`📝 提交信息: ${commitMessage}\n`);

    await git.commit(commitMessage);

    const commit = await git.log({ maxCount: 1 });
    console.log(`✅ 提交成功: ${commit.latest.hash.substring(0, 7)} - ${commit.latest.message}`);

    console.log('\n📤 推送到 GitHub...');
    await git.push('origin', 'main');

    console.log('✅ 同步完成!\n');

  } catch (error) {
    console.error('\n❌ 同步失败:', error.message);

    if (error.message.includes('Authentication failed')) {
      console.error('\n💡 解决方案:');
      console.error('   1. 运行: git config --global credential.helper store');
      console.error('   2. 下次推送时会提示输入用户名和密码');
      console.error('   3. 或使用 GitHub Personal Access Token');
    }

    process.exit(1);
  }
}

sync();
