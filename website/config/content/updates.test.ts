import { describe, expect, it } from 'vitest';
import {
  UPDATE_PROJECTS,
  getUpdateProjectById,
} from '@/config/content/updates';

describe('updates config', () => {
  it('includes website updates project metadata', () => {
    const website = getUpdateProjectById('website');

    expect(website).toBeDefined();
    expect(website?.basePath).toBe('/website/updates');
    expect(website?.currentVersion).toBe('v1.0.0');
  });

  it('keeps update project ids unique', () => {
    const ids = UPDATE_PROJECTS.map((project) => project.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });
});
