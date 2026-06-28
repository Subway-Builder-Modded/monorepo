import path from "node:path";
import { collectDocsContent } from "@/config/docs/content-validation";
import { collectRegistryTemplatesContent } from "@/config/registry/template-content-validation";
import { collectUpdatesContent } from "@/config/updates/content-validation";

const contentRoot = path.resolve(process.cwd(), "content");
const docsResult = collectDocsContent(contentRoot);
const updatesResult = collectUpdatesContent(contentRoot);
const templatesResult = collectRegistryTemplatesContent(contentRoot);
const errors = [...docsResult.errors, ...updatesResult.errors, ...templatesResult.errors];

if (errors.length > 0) {
  const details = errors.map((e) => ` - ${e}`).join("\n");
  throw new Error(`[docs-content:test] Validation failed:\n${details}`);
}

export default {
  rawByPath: {
    ...docsResult.rawByPath,
    ...updatesResult.rawByPath,
    ...templatesResult.rawByPath,
  },
  frontmatterByPath: {
    ...docsResult.frontmatterByPath,
    ...updatesResult.frontmatterByPath,
    ...templatesResult.frontmatterByPath,
  },
};
