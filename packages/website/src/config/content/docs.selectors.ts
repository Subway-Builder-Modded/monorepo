import type {
  DocsInstance,
  DocsSidebarOrderItem,
} from '@/config/content/docs.types';
import { DOCS_INSTANCES } from '@/config/content/docs.instances';

export function getDocsInstanceById(id: string) {
  return DOCS_INSTANCES.find((instance) => instance.id === id);
}

export function getSidebarOrder(
  instance: DocsInstance,
  version: string | null,
): DocsSidebarOrderItem[] {
  if (instance.versioned && version && instance.versions) {
    const matchedVersion = instance.versions.find(
      (entry) => entry.value === version,
    );
    return matchedVersion?.sidebarOrder ?? instance.sidebarOrder ?? [];
  }

  return instance.sidebarOrder ?? [];
}
