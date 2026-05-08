import { describe, it, expect } from 'vitest';
import { categorizeSkills, generateCatalogMarkdown } from '../core/catalog.js';
import type { SkillInfo } from '../core/skills.js';

const mockSkills: SkillInfo[] = [
  { name: 'vue', dir: 'vue', desc: 'Vue 3 patterns' },
  { name: 'docker-expert', dir: 'docker-expert', desc: 'Docker containerization' },
  { name: 'sast-config', dir: 'sast-configuration', desc: 'Security scanning' },
  { name: 'unknown-tool', dir: 'unknown', desc: 'Something completely random' },
];

describe('categorizeSkills', () => {
  it('should categorize skills into correct groups', () => {
    const result = categorizeSkills(mockSkills);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should not include empty categories', () => {
    const result = categorizeSkills(mockSkills);
    for (const cat of result) {
      expect(cat.skills.length).toBeGreaterThan(0);
    }
  });

  it('should preserve all skills across categories', () => {
    const result = categorizeSkills(mockSkills);
    const totalSkills = result.reduce((sum, cat) => sum + cat.skills.length, 0);
    expect(totalSkills).toBe(mockSkills.length);
  });

  it('should handle empty skills array', () => {
    const result = categorizeSkills([]);
    expect(result.length).toBe(0);
  });
});

describe('generateCatalogMarkdown', () => {
  it('should generate valid markdown', () => {
    const md = generateCatalogMarkdown(mockSkills, {});
    expect(md).toContain('# Agent Skills Catalog');
    expect(md).toContain('4 active skills');
    expect(md).toContain('vue');
    expect(md).toContain('docker-expert');
  });

  it('should use translations when available', () => {
    const translations = { 'vue': 'Vue 3 Best Practices' };
    const md = generateCatalogMarkdown(mockSkills, translations);
    expect(md).toContain('Vue 3 Best Practices');
  });

  it('should fallback to description when no translation', () => {
    const md = generateCatalogMarkdown(mockSkills, {});
    expect(md).toContain('Vue 3 patterns');
  });

  it('should show (no description) for skills without desc or translation', () => {
    const skills: SkillInfo[] = [{ name: 'empty', dir: 'empty', desc: '' }];
    const md = generateCatalogMarkdown(skills, {});
    expect(md).toContain('(no description)');
  });
});
