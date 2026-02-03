import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
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

// ---------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------
const originalDateNow = Date.now;
const mockDateNow = mock(() => FIXED_TIMESTAMP * 1000);

// ---------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------
function createAuth(overrides = {}) {
  return new HMACAuthorization({
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    timestampWindowSeconds: 300,
    ...overrides,
  });
}

function createValidToken(auth: HMACAuthorization, overrides = {}) {
  return auth.createToken({ ...REQUEST_OPTS, ...overrides });
}

function createExpiredToken(auth: HMACAuthorization) {
  return auth.createToken({
    ...REQUEST_OPTS,
    timestamp: FIXED_TIMESTAMP - 1000000,
  });
}

function createTamperedToken(validToken: string) {
  const [key, ts, sig] = validToken.split(":");
  return `${key}:${ts}:${sig.slice(0, -1)}0`;
}

function createRequestWithAuth(token: string, bearerPrefix = "Bearer") {
  return new Request(new URL(PATH, "http://localhost"), {
    method: METHOD,
    headers: {
      Authorization: `${bearerPrefix} ${token}`,
    },
  });
}

// ---------------------------------------------------------------------
// Mock Time Management
// ---------------------------------------------------------------------
function freezeTime(timestamp = FIXED_TIMESTAMP) {
  mockDateNow.mockImplementation(() => timestamp * 1000);
  Date.now = mockDateNow;
}

function unfreezeTime() {
  Date.now = originalDateNow;
  mockDateNow.mockClear();
}

beforeEach(() => {
  freezeTime();
});

afterEach(() => {
  unfreezeTime();
});

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------
describe("HMACAuthorization", () => {
  describe("Token Creation", () => {
    test("creates a valid token with correct format", () => {
      const auth = createAuth();
      const token = createValidToken(auth);
      const parts = token.split(":");

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe(API_KEY);
      expect(Number(parts[1])).toBe(FIXED_TIMESTAMP);
      expect(parts[2]).toMatch(/^[a-f0-9]{64}$/);

      // Verify Date.now was called
      expect(mockDateNow).toHaveBeenCalled();
    });

    test("creates consistent tokens for same inputs", () => {
      const auth = createAuth();
      const token1 = createValidToken(auth);
      const token2 = createValidToken(auth);

      expect(token1).toBe(token2);
      expect(mockDateNow).toHaveBeenCalledTimes(2);
    });

    test("creates different tokens for different methods", () => {
      const auth = createAuth();
      const getToken = auth.createToken({ method: "GET", path: PATH });
      const postToken = auth.createToken({ method: "POST", path: PATH });

      expect(getToken).not.toBe(postToken);
    });

    test("creates different tokens for different paths", () => {
      const auth = createAuth();
      const token1 = auth.createToken({ method: METHOD, path: "/path1" });
      const token2 = auth.createToken({ method: METHOD, path: "/path2" });

      expect(token1).not.toBe(token2);
    });

    test("uses custom timestamp when provided", () => {
      const auth = createAuth();
      const customTimestamp = 1234567890;

      const token = auth.createToken({
        ...REQUEST_OPTS,
        timestamp: customTimestamp,
      });

      const parts = token.split(":");
      expect(Number(parts[1])).toBe(customTimestamp);

      // Date.now should not be called when timestamp is provided
      expect(mockDateNow).not.toHaveBeenCalled();
    });
  });

  describe("Token Verification with Time Manipulation", () => {
    test("verifies a valid token successfully", () => {
      const auth = createAuth();
      const token = createValidToken(auth);

      const result = auth.verify(token, REQUEST_OPTS);

      expect(result.valid).toBe(true);
      expect(result.apiKey).toBe(API_KEY);
    });

    test("accepts token within timestamp window", () => {
      const auth = createAuth({ timestampWindowSeconds: 300 });

      // Create token at FIXED_TIMESTAMP
      const token = auth.createToken({
        ...REQUEST_OPTS,
        timestamp: FIXED_TIMESTAMP,
      });

      // Move time forward by 299 seconds (still within window)
      freezeTime(FIXED_TIMESTAMP + 299);

      const result = auth.verify(token, REQUEST_OPTS);
      expect(result.valid).toBe(true);
    });

    test("rejects token outside timestamp window", () => {
      const auth = createAuth({ timestampWindowSeconds: 300 });

      // Create token at FIXED_TIMESTAMP
      const token = auth.createToken({
        ...REQUEST_OPTS,
        timestamp: FIXED_TIMESTAMP,
      });

      // Move time forward by 301 seconds (outside window)
      freezeTime(FIXED_TIMESTAMP + 301);

      expect(() => {
        auth.verify(token, REQUEST_OPTS);
      }).toThrow(TimestampExpiredError);
    });

    test("rejects future timestamps", () => {
      const auth = createAuth({ timestampWindowSeconds: 300 });

      // Create token with future timestamp
      const futureTimestamp = FIXED_TIMESTAMP + 400;
      const token = auth.createToken({
        ...REQUEST_OPTS,
        timestamp: futureTimestamp,
      });

      // Current time is still FIXED_TIMESTAMP
      expect(() => {
        auth.verify(token, REQUEST_OPTS);
      }).toThrow(TimestampExpiredError);
    });

    test("handles exact window boundary", () => {
      const auth = createAuth({ timestampWindowSeconds: 300 });

      const token = auth.createToken({
        ...REQUEST_OPTS,
        timestamp: FIXED_TIMESTAMP,
      });

      // Test at exact boundary (300 seconds)
      freezeTime(FIXED_TIMESTAMP + 300);

      const result = auth.verify(token, REQUEST_OPTS);
      expect(result.valid).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("throws InvalidHeaderError for null token", () => {
      const auth = createAuth();

      expect(() => {
        auth.verify(null, REQUEST_OPTS);
      }).toThrow(InvalidHeaderError);
    });

    test("throws InvalidHeaderError for undefined token", () => {
      const auth = createAuth();

      expect(() => {
        auth.verify(undefined as any, REQUEST_OPTS);
      }).toThrow(InvalidHeaderError);
    });

    test("throws InvalidHeaderError for malformed token", () => {
      const auth = createAuth();

      const malformedTokens = [
        "invalid-token",
        "part1:part2",
        ":::",
        "part1:part2:part3:part4",
        "",
      ];

      for (const token of malformedTokens) {
        expect(() => {
          auth.verify(token, REQUEST_OPTS);
        }).toThrow(InvalidHeaderError);
      }
    });

    test("throws InvalidApiKeyError for wrong API key", () => {
      const auth = createAuth();
      const otherAuth = createAuth({ apiKey: "wrong-key" });
      const badToken = createValidToken(otherAuth);

      expect(() => {
        auth.verify(badToken, REQUEST_OPTS);
      }).toThrow(InvalidApiKeyError);
    });

    test("throws TimestampExpiredError for expired timestamp", () => {
      const auth = createAuth();
      const expiredToken = createExpiredToken(auth);

      expect(() => {
        auth.verify(expiredToken, REQUEST_OPTS);
      }).toThrow(TimestampExpiredError);
    });

    test("throws InvalidSignatureError for tampered signature", () => {
      const auth = createAuth();
      const validToken = createValidToken(auth);
      const tamperedToken = createTamperedToken(validToken);

      expect(() => {
        auth.verify(tamperedToken, REQUEST_OPTS);
      }).toThrow(InvalidSignatureError);
    });

    test("throws InvalidSignatureError for wrong secret", () => {
      const auth1 = createAuth({ apiSecret: "secret1" });
      const auth2 = createAuth({ apiSecret: "secret2" });
      const token = createValidToken(auth1);

      expect(() => {
        auth2.verify(token, REQUEST_OPTS);
      }).toThrow(InvalidSignatureError);
    });
  });

  describe("Request Verification", () => {
    test("verifies request with valid Authorization header", () => {
      const auth = createAuth();
      const token = createValidToken(auth);
      const request = createRequestWithAuth(token);

      const result = auth.verifyRequest(request);

      expect(result.valid).toBe(true);
      expect(result.apiKey).toBe(API_KEY);
    });

    test("throws InvalidHeaderError for missing Authorization header", () => {
      const auth = createAuth();
      const request = new Request("http://localhost/test-path", {
        method: METHOD,
      });

      expect(() => {
        auth.verifyRequest(request);
      }).toThrow(InvalidHeaderError);
    });

    test("handles Bearer token extraction correctly", () => {
      const auth = createAuth();
      const token = createValidToken(auth);

      // Test with "Bearer " prefix (case-sensitive)
      const requestWithBearer = new Request("http://localhost/test-path", {
        method: METHOD,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resultWithBearer = auth.verifyRequest(requestWithBearer);
      expect(resultWithBearer.valid).toBe(true);

      // Test without "Bearer " prefix (raw token)
      const requestWithoutBearer = new Request("http://localhost/test-path", {
        method: METHOD,
        headers: {
          Authorization: token,
        },
      });

      const resultWithoutBearer = auth.verifyRequest(requestWithoutBearer);
      expect(resultWithoutBearer.valid).toBe(true);
    });

    test("verifyRequest ignores query parameters from URL", () => {
      const auth = createAuth();
      const pathWithoutQuery = "/test-path";

      // Create token for path WITHOUT query params (as verifyRequest will extract)
      const token = auth.createToken({
        method: METHOD,
        path: pathWithoutQuery,
      });

      // Create request with query params in URL
      const request = new Request(
        "http://localhost/test-path?param=value&other=123",
        {
          method: METHOD,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Should succeed because verifyRequest uses pathname only
      const result = auth.verifyRequest(request);
      expect(result.valid).toBe(true);
    });

    test("verify method with query parameters requires exact match", () => {
      const auth = createAuth();
      const pathWithQuery = "/test-path?param=value";

      // Create token with query params
      const token = auth.createToken({
        method: METHOD,
        path: pathWithQuery,
      });

      // Direct verify call with matching query params should succeed
      const result1 = auth.verify(token, {
        method: METHOD,
        path: pathWithQuery,
      });
      expect(result1.valid).toBe(true);

      // Direct verify call with different query params should fail
      expect(() => {
        auth.verify(token, {
          method: METHOD,
          path: "/test-path?param=different",
        });
      }).toThrow(InvalidSignatureError);

      // Direct verify call without query params should fail
      expect(() => {
        auth.verify(token, {
          method: METHOD,
          path: "/test-path",
        });
      }).toThrow(InvalidSignatureError);
    });

    test("verifies different HTTP methods correctly", () => {
      const auth = createAuth();
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

      for (const method of methods) {
        const token = auth.createToken({ method, path: PATH });

        const request = new Request(`http://localhost${PATH}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = auth.verifyRequest(request);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe("Edge Cases", () => {
    test("handles empty path", () => {
      const auth = createAuth();
      const token = auth.createToken({ method: METHOD, path: "" });

      const result = auth.verify(token, { method: METHOD, path: "" });
      expect(result.valid).toBe(true);
    });

    test("handles special characters in path", () => {
      const auth = createAuth();
      const specialPaths = [
        "/path/with/@special/#chars/",
        "/path/with/unicode/🔒/emoji",
        "/path/with/encoded%20spaces",
        "/path/with/[brackets]/and/{braces}",
      ];

      for (const path of specialPaths) {
        const token = auth.createToken({ method: METHOD, path });
        const result = auth.verify(token, { method: METHOD, path });
        expect(result.valid).toBe(true);
      }
    });

    test("is not case-sensitive for methods", () => {
      const auth = createAuth();
      const token = auth.createToken({ method: "GET", path: PATH });

      // Should succeed with same case
      const result = auth.verify(token, { method: "get", path: PATH });
      expect(result.valid).toBe(true);
    });

    test("verifies extremely long paths", () => {
      const auth = createAuth();
      const longPath = "/segment".repeat(100);
      const token = auth.createToken({ method: METHOD, path: longPath });

      const result = auth.verify(token, { method: METHOD, path: longPath });
      expect(result.valid).toBe(true);
    });

    test("handles concurrent verifications", async () => {
      const auth = createAuth();
      const tokens = Array.from({ length: 10 }, (_, i) =>
        auth.createToken({ method: METHOD, path: `/path${i}` }),
      );

      const verifications = tokens.map((token, i) =>
        Promise.resolve(
          auth.verify(token, { method: METHOD, path: `/path${i}` }),
        ),
      );

      const results = await Promise.all(verifications);
      expect(results.every((r) => r.valid)).toBe(true);
    });

    test("handles token without Bearer prefix", () => {
      const auth = createAuth();
      const token = createValidToken(auth);

      // Direct token without Bearer prefix
      const result = auth.verify(token, REQUEST_OPTS);
      expect(result.valid).toBe(true);
    });

    test("handles root path correctly", () => {
      const auth = createAuth();
      const token = auth.createToken({ method: METHOD, path: "/" });

      const result = auth.verify(token, { method: METHOD, path: "/" });
      expect(result.valid).toBe(true);
    });

    test("verifyRequest strips query params while verify does not", () => {
      const auth = createAuth();

      // For verifyRequest: token should be created without query params
      const tokenForRequest = auth.createToken({
        method: METHOD,
        path: "/api/test",
      });
      const requestWithQuery = new Request(
        "http://localhost/api/test?foo=bar",
        {
          method: METHOD,
          headers: { Authorization: `Bearer ${tokenForRequest}` },
        },
      );

      // verifyRequest should succeed (ignores query in URL)
      const requestResult = auth.verifyRequest(requestWithQuery);
      expect(requestResult.valid).toBe(true);

      // For direct verify: token must include query params
      const tokenWithQuery = auth.createToken({
        method: METHOD,
        path: "/api/test?foo=bar",
      });

      // verify should succeed with matching query
      const verifyResult = auth.verify(tokenWithQuery, {
        method: METHOD,
        path: "/api/test?foo=bar",
      });
      expect(verifyResult.valid).toBe(true);

      // verify should fail without query
      expect(() => {
        auth.verify(tokenWithQuery, { method: METHOD, path: "/api/test" });
      }).toThrow(InvalidSignatureError);
    });
  });

  describe("Mock Behavior Verification", () => {
    test("tracks Date.now calls during token creation", () => {
      mockDateNow.mockClear();
      const auth = createAuth();

      // Create multiple tokens without custom timestamp
      auth.createToken(REQUEST_OPTS);
      auth.createToken(REQUEST_OPTS);
      auth.createToken(REQUEST_OPTS);

      expect(mockDateNow).toHaveBeenCalledTimes(3);
      expect(mockDateNow.mock.calls).toHaveLength(3);
      expect(mockDateNow.mock.results).toEqual([
        { type: "return", value: FIXED_TIMESTAMP * 1000 },
        { type: "return", value: FIXED_TIMESTAMP * 1000 },
        { type: "return", value: FIXED_TIMESTAMP * 1000 },
      ]);
    });

    test("simulates time progression", () => {
      const auth = createAuth({ timestampWindowSeconds: 60 });

      // Create token at t=0
      const token = createValidToken(auth);

      // Verify at different time points
      const timePoints = [0, 30, 59, 60, 61];

      for (const seconds of timePoints) {
        freezeTime(FIXED_TIMESTAMP + seconds);

        if (seconds <= 60) {
          const result = auth.verify(token, REQUEST_OPTS);
          expect(result.valid).toBe(true);
        } else {
          expect(() => {
            auth.verify(token, REQUEST_OPTS);
          }).toThrow(TimestampExpiredError);
        }
      }
    });
  });
});
