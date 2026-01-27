import { afterEach, test as base, beforeEach, expect, suite, vi } from "vitest";
import {
  HMACAuthorization,
  InvalidApiKeyError,
  InvalidHeaderError,
  InvalidSignatureError,
  TimestampExpiredError,
} from "@/lib";

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------
const FIXED_TIMESTAMP = 1_700_000_000;
const FIXED_DATE = new Date(FIXED_TIMESTAMP * 1000);

const API_KEY = process.env.NINJAODM_API_KEY || "test-api-key";
const API_SECRET = process.env.NINJAODM_SECRET_KEY || "test-api-key";

const METHOD = "GET";
const PATH = "/test-path";

const REQUEST_OPTS = {
  method: METHOD,
  path: PATH,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------
const test = base.extend<{
  auth: HMACAuthorization;

  validToken: string;
  expiredToken: string;
  tamperedToken: string;

  verifyToken: (
    token: string | null,
    overrides?: Record<string, unknown>,
  ) => unknown;

  requestWithAuth: Request;
}>({
  auth: [
    async ({}, use) => {
      const auth = new HMACAuthorization({
        apiKey: API_KEY,
        apiSecret: API_SECRET,
        timestampWindowSeconds: 300,
      });
      await use(auth);
    },
    { scope: "file" },
  ],

  validToken: async ({ auth }, use) => {
    const token = auth.createToken(REQUEST_OPTS);
    await use(token);
  },

  expiredToken: async ({ auth }, use) => {
    const token = auth.createToken({
      ...REQUEST_OPTS,
      timestamp: Date.now() - 1000,
    });
    await use(token);
  },

  tamperedToken: async ({ validToken }, use) => {
    const [key, ts, sig] = validToken.split(":");
    const badToken = `${key}:${ts}:${sig.slice(0, -1)}0`;
    await use(badToken);
  },

  verifyToken: async ({ auth }, use) => {
    await use((token, overrides = {}) =>
      auth.verify(token, { ...REQUEST_OPTS, ...overrides }),
    );
  },

  requestWithAuth: async ({ validToken }, use) => {
    const request = new Request(new URL(PATH, "http://localhost"), {
      method: METHOD,
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });
    await use(request);
  },
});

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------
suite.sequential("HMACAuthorization Test Suite", () => {
  test("creates a valid token", ({ validToken }) => {
    const parts = validToken.split(":");

    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe(API_KEY);
    expect(Number(parts[1])).toBe(FIXED_TIMESTAMP);
    expect(parts[2]).toMatch(/^[a-f0-9]{64}$/);
  });

  test("throws InvalidHeaderError for missing header", ({ verifyToken }) => {
    expect(() => verifyToken(null)).toThrow(InvalidHeaderError);
  });

  test("throws InvalidHeaderError for malformed token", ({ verifyToken }) => {
    expect(() => verifyToken("Bearer invalid-token")).toThrow(
      InvalidHeaderError,
    );
  });

  test("throws InvalidApiKeyError for wrong API key", ({ verifyToken }) => {
    const otherAuth = new HMACAuthorization({
      apiKey: "wrong-key",
      apiSecret: API_SECRET,
    });

    const badToken = otherAuth.createToken(REQUEST_OPTS);

    expect(() => verifyToken(badToken)).toThrow(InvalidApiKeyError);
  });

  test("throws TimestampExpiredError for expired timestamp", ({
    expiredToken,
    verifyToken,
  }) => {
    expect(() => verifyToken(expiredToken)).toThrow(TimestampExpiredError);
  });

  test("throws InvalidSignatureError for tampered signature", ({
    tamperedToken,
    verifyToken,
  }) => {
    expect(() => verifyToken(tamperedToken)).toThrow(InvalidSignatureError);
  });

  test("verifies request object via verifyRequest()", ({
    auth,
    requestWithAuth,
  }) => {
    const result = auth.verifyRequest(requestWithAuth);

    expect(result.valid).toBe(true);
    expect(result.apiKey).toBe(API_KEY);
  });
});
