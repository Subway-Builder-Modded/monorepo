import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LightMarkdown } from "@/features/content/components/light-markdown";

describe("LightMarkdown", () => {
  it("renders inline markdown emphasis and code", async () => {
    const { container } = render(
      <LightMarkdown>
        {"This has **bold**, *italic*, ~~strikethrough~~, and `inline code`."}
      </LightMarkdown>,
    );

    await waitFor(() => {
      expect(container.querySelector("strong")?.textContent).toBe("bold");
      expect(container.querySelector("em")?.textContent).toBe("italic");
      expect(container.querySelector("del, s")?.textContent).toBe("strikethrough");
      expect(container.querySelector("code")?.textContent).toBe("inline code");
    });
  });

  it("renders fenced code blocks", async () => {
    const { container } = render(
      <LightMarkdown>
        {"```ts\nconst mode = 'dev';\nconsole.log(mode);\n```"}
      </LightMarkdown>,
    );

    await waitFor(() => {
      const codeBlock = container.querySelector("pre code");
      expect(codeBlock).not.toBeNull();
      expect(codeBlock?.textContent).toContain("const mode = 'dev';");
      expect(codeBlock?.textContent).toContain("console.log(mode);");
    });
  });
});