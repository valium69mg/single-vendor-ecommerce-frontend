import { setupServer } from "msw/node";

import { handlers } from "./handlers";

/**
 * MSW node server for Vitest. Lifecycle (listen / resetHandlers / close) is
 * wired in `src/test/setup.ts` with `onUnhandledRequest: "error"`.
 */
export const server = setupServer(...handlers);
