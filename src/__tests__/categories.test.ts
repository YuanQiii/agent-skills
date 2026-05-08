import { describe, it, expect } from 'vitest';
import { classifySkill, DEFAULT_CATEGORIES, CATEGORIES } from '../core/catalog.js';

describe('classifySkill', () => {
  it('should classify vue-related skills', () => {
    expect(classifySkill('vue-best-practices', 'Vue 3 composition API patterns')).toBe('Frontend Framework & Libraries');
  });

  it('should classify react skills', () => {
    expect(classifySkill('react-state-management', 'React state management')).toBe('Frontend Framework & Libraries');
  });

  it('should classify UI/UX skills', () => {
    expect(classifySkill('shadcn-ui', 'Beautiful UI components')).toBe('UI/UX Design');
  });

  it('should classify backend skills', () => {
    expect(classifySkill('nestjs-expert', 'NestJS backend patterns')).toBe('Backend Development');
  });

  it('should classify DevOps skills', () => {
    expect(classifySkill('docker-expert', 'Docker containerization')).toBe('DevOps & Cloud');
  });

  it('should classify security skills', () => {
    expect(classifySkill('stride-analysis', 'STRIDE threat modeling')).toBe('Security');
  });

  it('should classify database skills', () => {
    expect(classifySkill('postgresql-optimization', 'Postgres query optimization')).toBe('Database & Storage');
  });

  it('should return Other for unmatched skills', () => {
    expect(classifySkill('some-random-skill', 'A completely unique description')).toBe('Other');
  });

  it('should match keywords in description', () => {
    expect(classifySkill('my-tool', 'A tool for kubernetes deployment')).toBe('DevOps & Cloud');
  });

  it('should be case-insensitive', () => {
    expect(classifySkill('VUE-PATTERNS', 'Vue patterns')).toBe('Frontend Framework & Libraries');
  });

  it('should accept custom categories', () => {
    const custom = [{ label: 'Custom', keywords: ['custom-kw'] }];
    expect(classifySkill('my-thing', 'custom-kw tool', custom)).toBe('Custom');
  });
});

describe('CATEGORIES', () => {
  it('should have at least 15 categories', () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(15);
  });

  it('should have non-empty keywords for each category', () => {
    for (const cat of CATEGORIES) {
      expect(cat.keywords.length).toBeGreaterThan(0);
      expect(cat.label).toBeTruthy();
    }
  });

  it('should have unique labels', () => {
    const labels = CATEGORIES.map(c => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('should export DEFAULT_CATEGORIES', () => {
    expect(DEFAULT_CATEGORIES).toBe(CATEGORIES);
  });
});
