import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const srcRoot = join(projectRoot, "src");
const UI_DIR = join("components", "ui");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const sourceFiles = walk(srcRoot);
const lucideImport = /from\s+["']lucide-react["']/;
const reactIconsImport = /from\s+["']react-icons(?:\/[^"']*)?["']/;

function relative(file: string): string {
  return file.slice(srcRoot.length + 1);
}

describe("icon library migration", () => {
  it("has no lucide-react import outside src/components/ui/**", () => {
    const offenders = sourceFiles
      .filter((file) => lucideImport.test(readFileSync(file, "utf8")))
      .map(relative)
      .filter((rel) => !rel.startsWith(UI_DIR));

    expect(offenders).toEqual([]);
  });

  it("has no react-icons import anywhere under src/", () => {
    const offenders = sourceFiles
      .filter((file) => reactIconsImport.test(readFileSync(file, "utf8")))
      .map(relative);

    expect(offenders).toEqual([]);
  });

  it("no longer ships the IconWrapper component", () => {
    expect(existsSync(join(srcRoot, "components", "common", "IconWrapper.tsx"))).toBe(false);
  });

  it("does not list react-icons as a dependency", () => {
    const pkg = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.["react-icons"]).toBeUndefined();
    expect(pkg.devDependencies?.["react-icons"]).toBeUndefined();
  });

  it("pins @phosphor-icons/react to an exact version", () => {
    const pkg = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const version = pkg.dependencies?.["@phosphor-icons/react"];
    expect(version).toBeDefined();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
