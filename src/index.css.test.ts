/// <reference types="node" />
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindConfig from "../tailwind.config";

/**
 * jsdom does not compile Tailwind `@layer` / `@apply` / `@media`, so the token
 * contract is verified against the raw text of `src/index.css` and the imported
 * `tailwind.config.ts` default export — never `getComputedStyle`.
 */
const fromRoot = (relative: string) => resolve(process.cwd(), relative);
const css = readFileSync(fromRoot("src/index.css"), "utf8");

const HSL_TRIPLE = /^\d+(\.\d+)? \d+(\.\d+)?% \d+(\.\d+)?%$/;

const SEMANTIC_TOKENS = [
  "surface-page",
  "surface-raised",
  "surface-inverse",
  "border-default",
  "border-strong",
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "brand",
  "brand-hover",
  "danger",
  "success",
  "warning",
] as const;

function rootBlock(source: string): string {
  const match = source.match(/:root\s*\{([\s\S]*?)\}/);
  if (!match) throw new Error(":root block not found in index.css");
  return match[1];
}

function adminBlock(source: string): string {
  const match = source.match(/\[data-context="admin"\]\s*\{([\s\S]*?)\}/);
  if (!match) throw new Error('[data-context="admin"] block not found');
  return match[1];
}

describe("index.css — semantic token contract", () => {
  it("declares all 13 semantic tokens exactly once in :root as HSL triples", () => {
    const root = rootBlock(css);
    for (const token of SEMANTIC_TOKENS) {
      const occurrences = root.match(new RegExp(`--${token}:`, "g")) ?? [];
      expect(occurrences).toHaveLength(1);
      const value = root.match(new RegExp(`--${token}:\\s*([^;]+);`))?.[1].trim();
      expect(value).toBeDefined();
      expect(value).toMatch(HSL_TRIPLE);
    }
  });

  it("names the brand-accent token --brand / --brand-hover and leaves shadcn --accent untouched", () => {
    expect(css).toMatch(/--brand:\s/);
    expect(css).toMatch(/--brand-hover:\s/);
    expect(css).toMatch(/--accent:\s*0 0% 96\.1%/);
    expect(css).not.toMatch(/--accent-hover/);
  });

  it("sets --radius to 0 and drops the 0.5rem value", () => {
    expect(css).toMatch(/--radius:\s*0\s*;/);
    expect(css).not.toMatch(/--radius:\s*0\.5rem/);
  });

  it("defines the three motion-duration tokens", () => {
    expect(css).toMatch(/--motion-fast:\s*150ms/);
    expect(css).toMatch(/--motion-base:\s*250ms/);
    expect(css).toMatch(/--motion-slow:\s*400ms/);
  });

  it("overrides only --brand / --brand-hover under [data-context=\"admin\"]", () => {
    const block = adminBlock(css);
    const declared = block.match(/--[\w-]+(?=:)/g) ?? [];
    expect(new Set(declared)).toEqual(new Set(["--brand", "--brand-hover"]));
    expect(block).toMatch(/--brand:\s*\d/);
    expect(block).toMatch(/--brand-hover:\s*\d/);
  });

  it("applies the store heading font to h1-h3 in a base layer", () => {
    expect(css).toMatch(/@layer base/);
    expect(css).toMatch(/h1,\s*h2,\s*h3\s*\{[^}]*font-store-heading/);
  });

  it("sources the body background from the page token, not bg-background", () => {
    const body = css.match(/body\s*\{([^}]*)\}/)?.[1];
    expect(body).toBeDefined();
    expect(body).toMatch(/bg-surface-page/);
    expect(css).not.toMatch(/bg-background/);
  });

  it("has a global prefers-reduced-motion reset with all three declarations", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/animation-duration:\s*[\d.]+ms\s*!important/);
    expect(css).toMatch(/transition-duration:\s*[\d.]+ms\s*!important/);
    expect(css).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });

  it("no longer ships the dead .dark block", () => {
    expect(css).not.toMatch(/\.dark\b/);
  });
});

type ColorValue = string | Record<string, string>;
interface ExtendTheme {
  colors: Record<string, ColorValue>;
  borderRadius: Record<string, string>;
}

describe("tailwind.config — semantic color mapping", () => {
  const theme = tailwindConfig.theme?.extend as unknown as ExtendTheme;
  const colors = theme.colors;
  const scale = (key: string): Record<string, string> =>
    colors[key] as Record<string, string>;

  it("maps the three surface tokens to hsl(var(--…))", () => {
    expect(colors["surface-page"]).toBe("hsl(var(--surface-page))");
    expect(colors["surface-raised"]).toBe("hsl(var(--surface-raised))");
    expect(colors["surface-inverse"]).toBe("hsl(var(--surface-inverse))");
  });

  it("exposes the short line / fg / brand keys backed by the semantic CSS vars", () => {
    expect(scale("line").DEFAULT).toBe("hsl(var(--border-default))");
    expect(scale("line").strong).toBe("hsl(var(--border-strong))");
    expect(scale("fg").DEFAULT).toBe("hsl(var(--text-primary))");
    expect(scale("fg").muted).toBe("hsl(var(--text-secondary))");
    expect(scale("fg").subtle).toBe("hsl(var(--text-tertiary))");
    expect(scale("brand").DEFAULT).toBe("hsl(var(--brand))");
    expect(scale("brand").hover).toBe("hsl(var(--brand-hover))");
  });

  it("maps the status tokens", () => {
    expect(colors.danger).toBe("hsl(var(--danger))");
    expect(colors.success).toBe("hsl(var(--success))");
    expect(colors.warning).toBe("hsl(var(--warning))");
  });

  it("keeps the pre-existing shadcn color keys", () => {
    expect(colors.accent).toBeDefined();
    expect(colors.primary).toBeDefined();
    expect(colors.border).toBeDefined();
    expect(colors.ring).toBeDefined();
  });

  it("keeps the borderRadius scale intact", () => {
    expect(theme.borderRadius.lg).toBeDefined();
    expect(theme.borderRadius.md).toBeDefined();
    expect(theme.borderRadius.sm).toBeDefined();
  });
});

describe("dynamic viewport-height wrapper sweep", () => {
  const WRAPPER_FILES = [
    "src/pages/LoginPage.tsx",
    "src/pages/OrderDetailPage.tsx",
    "src/pages/HomePage.tsx",
    "src/pages/AdminHomePage.tsx",
    "src/pages/AccountLayout.tsx",
    "src/pages/CategoryDetailPage.tsx",
    "src/pages/ProductDetailPage.tsx",
    "src/pages/RegisterPage.tsx",
    "src/pages/OrdersListPage.tsx",
    "src/pages/BrandDetailPage.tsx",
    "src/pages/NotFoundPage.tsx",
    "src/pages/CartPage.tsx",
    "src/pages/BrandsListPage.tsx",
    "src/pages/CategoriesListPage.tsx",
    "src/pages/CheckoutPage.tsx",
  ];

  it.each(WRAPPER_FILES)("%s uses a dvh viewport wrapper, never screen-height", (file) => {
    const source = readFileSync(fromRoot(file), "utf8");
    expect(source).not.toMatch(/\bmin-h-screen\b/);
    expect(source).not.toMatch(/\bh-screen\b/);
    expect(source).toMatch(/\b(min-h-dvh|h-dvh)\b/);
  });
});
