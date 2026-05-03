import fs from 'node:fs';
import path from 'node:path';
import { getConfig } from '../infra/config.js';

export interface SkillInfo {
  name: string;
  dir: string;
  desc: string;
}

export function parseSkillMd(filePath: string): SkillInfo | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  let name = '';
  let desc = '';

  const nm = content.match(/^name:\s*(.+)$/m);
  if (nm) name = nm[1].trim();

  const dm = content.match(/^description:\s*["']?(.+?)["']?\s*$/m);
  if (dm) {
    desc = dm[1].trim();
  } else {
    const dm2 = content.match(/description:\s*\n\s+(.+)/);
    if (dm2) desc = dm2[1].trim();
  }

  return { name, dir: '', desc };
}

export function readAllSkills(): SkillInfo[] {
  const config = getConfig();
  const skillsDir = path.join(config.agentsDir, 'skills');
  if (!fs.existsSync(skillsDir)) return [];

  const items = fs.readdirSync(skillsDir).filter(f =>
    fs.statSync(path.join(skillsDir, f)).isDirectory(),
  );

  const skills: SkillInfo[] = [];
  for (const dirName of items) {
    const sf = path.join(skillsDir, dirName, 'SKILL.md');
    const parsed = parseSkillMd(sf);
    if (parsed) {
      skills.push({ name: parsed.name, dir: dirName, desc: parsed.desc });
    }
  }
  return skills;
}
