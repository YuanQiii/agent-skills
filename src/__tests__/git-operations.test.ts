import { describe, it, expect } from 'vitest';
import { isRelevantChange, isSkillsChange, isNewSkillFile, extractSkillDirFromPath } from '../infra/git-operations.js';

describe('isRelevantChange', () => {
  it('should match skills/ paths', () => {
    expect(isRelevantChange('skills/vue/SKILL.md')).toBe(true);
    expect(isRelevantChange('skills/.skill-lock.json')).toBe(true);
  });

  it('should match .skill-lock.json', () => {
    expect(isRelevantChange('.skill-lock.json')).toBe(true);
  });

  it('should match package.json', () => {
    expect(isRelevantChange('package.json')).toBe(true);
  });

  it('should not match irrelevant paths', () => {
    expect(isRelevantChange('README.md')).toBe(false);
    expect(isRelevantChange('src/logger.ts')).toBe(false);
    expect(isRelevantChange('dist/catalog.js')).toBe(false);
  });
});

describe('isSkillsChange', () => {
  it('should detect skills/ paths', () => {
    expect(isSkillsChange('skills/vue/SKILL.md')).toBe(true);
  });

  it('should detect .skill-lock.json', () => {
    expect(isSkillsChange('.skill-lock.json')).toBe(true);
  });

  it('should not match other paths', () => {
    expect(isSkillsChange('package.json')).toBe(false);
  });
});

describe('isNewSkillFile', () => {
  it('should match SKILL.md files', () => {
    expect(isNewSkillFile('skills/vue/SKILL.md')).toBe(true);
  });

  it('should not match other files', () => {
    expect(isNewSkillFile('skills/vue/README.md')).toBe(false);
    expect(isNewSkillFile('package.json')).toBe(false);
  });
});

describe('extractSkillDirFromPath', () => {
  it('should extract skill directory name', () => {
    expect(extractSkillDirFromPath('skills/vue-best-practices/SKILL.md')).toBe('vue-best-practices');
  });

  it('should return null for non-matching paths', () => {
    expect(extractSkillDirFromPath('package.json')).toBeNull();
    expect(extractSkillDirFromPath('skills/')).toBeNull();
  });
});
