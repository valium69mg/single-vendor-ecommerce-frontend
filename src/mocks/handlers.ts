import type { RequestHandler } from "msw";

/**
 * Default (always-on) MSW request handlers.
 *
 * Kept empty by design: integration tests register their own handlers per case
 * with `server.use(...)`. Shared handlers can be added here as the integration
 * suite grows (T1-T6).
 */
export const handlers: RequestHandler[] = [];
