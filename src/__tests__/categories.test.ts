import { describe, it, expect } from 'vitest';
import { classifySkill, CATEGORIES } from '../core/categories.js';

describe('classifySkill', () => {
  it('should classify vue-related skills', () => {
    expect(classifySkill('vue-best-practices', 'Vue 3 composition API patterns')).toBe('前端框架与库');
  });

  it('should classify react skills', () => {
    expect(classifySkill('react-state-management', 'React state management')).toBe('前端框架与库');
  });

  it('should classify UI/UX skills', () => {
    expect(classifySkill('shadcn-ui', 'Beautiful UI components')).toBe('UI/UX 设计');
  });

  it('should classify backend skills', () => {
    expect(classifySkill('nestjs-expert', 'NestJS backend patterns')).toBe('后端开发');
  });

  it('should classify DevOps skills', () => {
    expect(classifySkill('docker-expert', 'Docker containerization')).toBe('DevOps 与云基础设施');
  });

  it('should classify security skills', () => {
    expect(classifySkill('stride-analysis', 'STRIDE threat modeling')).toBe('安全');
  });

  it('should classify database skills', () => {
    expect(classifySkill('postgresql-optimization', 'Postgres query optimization')).toBe('数据库与存储');
  });

  it('should return 其他 for unmatched skills', () => {
    expect(classifySkill('some-random-skill', 'A completely unique description')).toBe('其他');
  });

  it('should match keywords in description', () => {
    expect(classifySkill('my-tool', 'A tool for kubernetes deployment')).toBe('DevOps 与云基础设施');
  });

  it('should be case-insensitive', () => {
    expect(classifySkill('VUE-PATTERNS', 'Vue patterns')).toBe('前端框架与库');
  });

  it('should accept custom categories', () => {
    const custom = [{ label: '自定义', keywords: ['custom-kw'] }];
    expect(classifySkill('my-thing', 'custom-kw tool', custom)).toBe('自定义');
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
});
