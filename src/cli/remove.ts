import fs from 'node:fs';
import path from 'node:path';

const SKILL_LOCK_PATH = path.join(process.cwd(), '.skill-lock.json');

interface SkillLock {
  version: number;
  skills: Record<string, {
    source: string;
    sourceType: string;
    sourceUrl: string;
    skillPath: string;
    skillFolderHash?: string;
    pluginName?: string;
    installedAt: string;
    updatedAt: string;
  }>;
}

function readSkillLock(): SkillLock {
  if (!fs.existsSync(SKILL_LOCK_PATH)) {
    console.error(`Error: ${SKILL_LOCK_PATH} not found`);
    process.exit(1);
  }
  const content = fs.readFileSync(SKILL_LOCK_PATH, 'utf-8');
  return JSON.parse(content);
}

function writeSkillLock(data: SkillLock): void {
  fs.writeFileSync(SKILL_LOCK_PATH, JSON.stringify(data, null, 2));
}

function listSkills(): void {
  const lock = readSkillLock();
  console.log('Installed skills:');
  console.log('----------------');
  Object.keys(lock.skills).forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
}

async function removeSkill(skillName: string, force: boolean): Promise<void> {
  const lock = readSkillLock();
  
  if (!lock.skills[skillName]) {
    console.error(`Error: Skill "${skillName}" not found in ${SKILL_LOCK_PATH}`);
    console.log('\nAvailable skills:');
    Object.keys(lock.skills).forEach(name => console.log(`  - ${name}`));
    process.exit(1);
  }

  if (!force) {
    const readline = await import('node:readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question(`Are you sure you want to remove skill "${skillName}"? (yes/no): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase());
      });
    });

    if (answer !== 'yes') {
      console.log('Operation cancelled.');
      process.exit(0);
    }
  }

  delete lock.skills[skillName];
  writeSkillLock(lock);
  
  console.log(`Successfully removed skill: ${skillName}`);
}

function showHelp(): void {
  console.log(`
Usage: npx skills remove [options] <skill-name>

Remove a skill from the .skill-lock.json file

Options:
  -y, --yes     Skip confirmation prompt
  -l, --list    List all installed skills
  -h, --help    Show this help message

Examples:
  npx skills remove my-skill        # Remove with confirmation
  npx skills remove my-skill --yes  # Remove without confirmation
  npx skills remove --list          # List all skills
  `);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('-l') || args.includes('--list')) {
    listSkills();
    process.exit(0);
  }

  const force = args.includes('-y') || args.includes('--yes');
  const skillName = args.find(arg => !arg.startsWith('-'));

  if (!skillName) {
    console.error('Error: Skill name is required');
    showHelp();
    process.exit(1);
  }

  await removeSkill(skillName, force);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});