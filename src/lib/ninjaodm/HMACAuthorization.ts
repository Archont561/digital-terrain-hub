import * as crypto from "node:crypto";

// =====================
// Errors
// =====================

export class HMACAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HMACAuthError";
  }
}

export class InvalidHeaderError extends HMACAuthError {
  constructor(message = "Invalid or missing authorization header") {
    super(message);
    this.name = "InvalidHeaderError";
  }
}

export class InvalidApiKeyError extends HMACAuthError {
  public readonly apiKey: string;
  public readonly timestamp: number;

  constructor(apiKey: string, timestamp: number) {
    super("Invalid API key");
    this.name = "InvalidApiKeyError";
    this.apiKey = apiKey;
    this.timestamp = timestamp;
  }
}

export class TimestampExpiredError extends HMACAuthError {
  public readonly apiKey: string;
  public readonly timestamp: number;

  constructor(apiKey: string, timestamp: number) {
    super("Timestamp expired or invalid");
    this.name = "TimestampExpiredError";
    this.apiKey = apiKey;
    this.timestamp = timestamp;
  }
}

export class InvalidSignatureError extends HMACAuthError {
  public readonly apiKey: string;
  public readonly timestamp: number;

  constructor(apiKey: string, timestamp: number) {
    super("Invalid signature");
    this.name = "InvalidSignatureError";
    this.apiKey = apiKey;
    this.timestamp = timestamp;
  }
}

// =====================
// Types
// =====================

export interface HMACAuthConfig {
  apiKey: string;
  apiSecret: string;
  timestampWindowSeconds?: number;
}

export interface RequestOptions {
  method: string;
  path: string;
  timestamp?: number;
}

export interface ParsedToken {
  apiKey: string;
  timestamp: number;
  signature: string;
}

export interface VerificationResult {
  valid: boolean;
  apiKey: string;
  timestamp: number;
}

// =====================
// HMACAuthorization class
// =====================

export default class HMACAuthorization {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly timestampWindowSeconds: number;

  static create(config: HMACAuthConfig) {
    return new HMACAuthorization(config);
  }

  constructor(config: HMACAuthConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.timestampWindowSeconds = config.timestampWindowSeconds ?? 300;
  }

  getConfig(): HMACAuthConfig {
    return {
      apiKey: this.apiKey,
      apiSecret: this.apiSecret,
      timestampWindowSeconds: this.timestampWindowSeconds,
    };
  }

  sign(options: RequestOptions): string {
    const timestamp = options.timestamp ?? this.getCurrentTimestamp();
    const message = this.buildMessage(timestamp, options.method, options.path);
    return this.generateSignature(message);
  }

  createToken(options: RequestOptions): string {
    const timestamp = options.timestamp ?? this.getCurrentTimestamp();
    const signature = this.sign({ ...options, timestamp });
    return `${this.apiKey}:${timestamp}:${signature}`;
  }

  /**
   * Verifies the authorization header.
   * @throws {InvalidHeaderError} If header is missing or malformed
   * @throws {InvalidApiKeyError} If API key doesn't match
   * @throws {TimestampExpiredError} If timestamp is outside the allowed window
   * @throws {InvalidSignatureError} If signature verification fails
   */
  verify(
    authHeader: string | null | undefined,
    options: RequestOptions,
  ): VerificationResult {
    const parsed = this.parseAuthHeader(authHeader);

    if (!parsed) {
      throw new InvalidHeaderError();
    }

    if (parsed.apiKey !== this.apiKey) {
      throw new InvalidApiKeyError(parsed.apiKey, parsed.timestamp);
    }

    if (!this.isTimestampValid(parsed.timestamp, options.timestamp)) {
      throw new TimestampExpiredError(parsed.apiKey, parsed.timestamp);
    }

    const message = this.buildMessage(
      parsed.timestamp,
      options.method,
      options.path,
    );
    const expectedSignature = this.generateSignature(message);

    if (!this.secureCompare(expectedSignature, parsed.signature)) {
      throw new InvalidSignatureError(parsed.apiKey, parsed.timestamp);
    }

    return {
      valid: true,
      apiKey: parsed.apiKey,
      timestamp: parsed.timestamp,
    };
  }

  /**
   * Verifies a request object.
   * @throws {InvalidHeaderError} If header is missing or malformed
   * @throws {InvalidApiKeyError} If API key doesn't match
   * @throws {TimestampExpiredError} If timestamp is outside the allowed window
   * @throws {InvalidSignatureError} If signature verification fails
   */
  verifyRequest(request: Request): VerificationResult {
    const authHeader =
      request.headers.get("authorization") ??
      request.headers.get("Authorization");
    const path = new URL(request.url || "", "http://localhost").pathname;

    return this.verify(authHeader, { method: request.method, path });
  }

  // =====================
  // Parsing
  // =====================

  parseToken(token: string | null | undefined): ParsedToken | null {
    if (!token) {
      return null;
    }

    const parts = token.split(":");
    if (parts.length !== 3) {
      return null;
    }

    const [apiKey, timestampStr, signature] = parts;

    const timestamp = parseInt(timestampStr, 10);
    if (Number.isNaN(timestamp)) {
      return null;
    }

    if (!apiKey || !signature) {
      return null;
    }

    return { apiKey, timestamp, signature };
  }

  parseAuthHeader(authHeader: string | null | undefined): ParsedToken | null {
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");

    return this.parseToken(token);
  }

  // =====================
  // Private Helpers
  // =====================

  private getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  private buildMessage(
    timestamp: number,
    method: string,
    path: string,
  ): string {
    return `${this.apiKey}:${timestamp}:${method.toUpperCase()}:${path}`;
  }

  private generateSignature(message: string): string {
    return crypto
      .createHmac("sha256", this.apiSecret)
      .update(message)
      .digest("hex");
  }

  private isTimestampValid(timestamp: number, currentTime?: number): boolean {
    const now = currentTime ?? this.getCurrentTimestamp();
    return Math.abs(now - timestamp) <= this.timestampWindowSeconds;
  }

  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
