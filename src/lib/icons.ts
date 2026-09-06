/**
 * Single source of truth for icon sizing (FRONTEND-STANDARD §3.11).
 *
 * Icons are sized exclusively through the Phosphor `size` prop fed one of these
 * values — never with Tailwind `h-*`/`w-*` utilities or arbitrary numeric
 * literals. `md` (20) is the default for inline/content icons, `sm` (16) for
 * dense UI, `lg` (24) for touch controls, `xl`/`2xl` for decorative icons.
 */
export const ICON = { sm: 16, md: 20, lg: 24, xl: 32, "2xl": 48 } as const;

export type IconSizeToken = keyof typeof ICON;

/**
 * Phosphor's implicit default weight. Exported so explicit call-sites can name
 * it instead of relying on the library default.
 */
export const ICON_WEIGHT = "regular" as const;
