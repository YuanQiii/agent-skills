const { simpleGit } = require('simple-git');
const { config, log, retry, getTimestamp } = require('./utils');
const { generateCatalog } = require('./generate-catalog');

async function sync() {
  log('🔄 开始同步...\n');

  try {
    const git = simpleGit(config.agentsDir);
    const status = await git.status();

    log('📊 Git 状态:');
    log(`   当前分支: ${status.current}`);
    log(`   领先: ${status.ahead}`);
    log(`   落后: ${status.behind}\n`);

    const relevantChanges = status.files.filter(f => {
      const filePath = f.path;
      return filePath.startsWith('skills/') ||
             filePath === '.skill-lock.json' ||
             filePath === 'package.json' ||
             filePath === 'sync.config.json';
    });

    const hasSkillsChange = relevantChanges.some(f =>
      f.path.startsWith('skills/') || f.path === '.skill-lock.json'
    );

    if (hasSkillsChange) {
      log('📋 Skills 变化，重新生成目录...');
      try {
        generateCatalog();
      } catch (e) {
        log(`⚠️  目录生成失败: ${e.message}`);
      }
    }

    if (relevantChanges.length === 0 && !hasSkillsChange) {
      log('ℹ️  无变化需要同步\n');
      return;
    }

    log('📝 变化文件:');
    relevantChanges.forEach(f => {
      const statusSymbol = f.index === '?' ? '+' : f.index === 'M' ? 'M' : f.index;
      log(`   [${statusSymbol}] ${f.path}`);
    });
    log('');

    await git.add([...config.addPaths, 'skills-catalog.md']);

    const commitMessage = `手动同步: ${getTimestamp()}`;
    log(`📝 提交信息: ${commitMessage}\n`);

    await git.commit(commitMessage);

    const commit = await git.log({ maxCount: 1 });
    log(`✅ 提交成功: ${commit.latest.hash.substring(0, 7)} - ${commit.latest.message}`);

    log('\n📤 推送到 GitHub...');
    await retry(() => git.push(config.remote, config.branch));

    log('✅ 同步完成!\n');

  } catch (error) {
    log(`\n❌ 同步失败: ${error.message}`);

    if (error.message.includes('Authentication failed')) {
      log('\n💡 解决方案:');
      log('   1. 使用 Git Credential Manager: git config --global credential.helper manager');
      log('   2. 或使用 GitHub CLI: gh auth login');
      log('   3. 或设置环境变量 AGENTS_DIR 指向 .agents 目录');
    }

    process.exit(1);
  }
}

sync();
