import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

// Exercises the real eslint.config.js (auto-discovered from cwd) against inline
// fixtures. Asserts on the specific `no-restricted-imports` rule id firing —
// NOT a clean `npm run lint` (the repo carries a pre-existing 5-error / 6-warning
// baseline tracked in tickets/DEV-hygiene-coverage-lint.md).
let eslint: ESLint;

const RULE = "no-restricted-imports";

async function ruleMessages(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === RULE).map((m) => m.message);
}

describe("eslint icon import boundary", () => {
  beforeAll(() => {
    eslint = new ESLint();
  });

  it("flags a lucide-react import under src/pages/", async () => {
    const messages = await ruleMessages(
      `import { Menu } from "lucide-react";\nexport const x = Menu;\n`,
      "src/pages/FakePage.tsx",
    );
    expect(messages.length).toBeGreaterThan(0);
  });

  it("does not flag a lucide-react import under src/components/ui/", async () => {
    const messages = await ruleMessages(
      `import { X } from "lucide-react";\nexport const x = X;\n`,
      "src/components/ui/fake-primitive.tsx",
    );
    expect(messages).toEqual([]);
  });

  it("flags a react-icons import everywhere, including src/components/ui/", async () => {
    const page = await ruleMessages(
      `import { FaRegUser } from "react-icons/fa";\nexport const x = FaRegUser;\n`,
      "src/pages/FakePage.tsx",
    );
    const ui = await ruleMessages(
      `import { FaRegUser } from "react-icons/fa";\nexport const x = FaRegUser;\n`,
      "src/components/ui/fake-primitive.tsx",
    );
    expect(page.length).toBeGreaterThan(0);
    expect(ui.length).toBeGreaterThan(0);
  });
});
