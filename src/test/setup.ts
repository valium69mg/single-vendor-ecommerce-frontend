import "@testing-library/jest-dom";
import "@/i18n";

import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "@/mocks/server";

// MSW node server lifecycle for integration tests (*.integration.test.tsx).
// `onUnhandledRequest: "error"` fails any test that makes a real network call.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
