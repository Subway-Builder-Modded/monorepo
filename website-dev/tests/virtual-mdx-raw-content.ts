import path from "node:path";
import { collectDocsContent } from "@/config/docs/content-validation";
import { collectUpdatesContent } from "@/config/updates/content-validation";

const contentRoot = path.resolve(process.cwd(), "content");
const docsResult = collectDocsContent(contentRoot);
const updatesResult = collectUpdatesContent(contentRoot);
const errors = [...docsResult.errors, ...updatesResult.errors];

if (errors.length > 0) {
  const details = errors.map((e) => ` - ${e}`).join("\n");
  throw new Error(`[docs-content:test] Validation failed:\n${details}`);
}

export default {
  rawByPath: {
    ...docsResult.rawByPath,
    ...updatesResult.rawByPath,
  },
  frontmatterByPath: {
    ...docsResult.frontmatterByPath,
    ...updatesResult.frontmatterByPath,
  },
};
