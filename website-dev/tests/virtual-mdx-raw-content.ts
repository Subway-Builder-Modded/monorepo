import path from "node:path";
import { collectDocsContent } from "@/app/config/docs/content-validation";

const contentRoot = path.resolve(process.cwd(), "content", "docs");
const { rawByPath, frontmatterByPath, errors } = collectDocsContent(contentRoot);

if (errors.length > 0) {
  const details = errors.map((e) => ` - ${e}`).join("\n");
  throw new Error(`[docs-content:test] Validation failed:\n${details}`);
}

export default {
  rawByPath,
  frontmatterByPath,
};
