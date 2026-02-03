import type { NetworkFixture } from "@msw/playwright";
import type { Page, Response } from "@playwright/test";
import { HttpResponse, http, type JsonBodyType } from "msw";

// =======================
// TYPES
// =======================

export const ASTRO_ERROR_STATUS_MAP = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,

  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511,
} as const;

export type AstroActionErrorCode = keyof typeof ASTRO_ERROR_STATUS_MAP;

export function getStatusFromErrorCode(code: AstroActionErrorCode): number {
  return ASTRO_ERROR_STATUS_MAP[code] ?? 500;
}

export interface AstroActionErrorBody {
  type: "AstroActionError";
  code: AstroActionErrorCode;
  message: string;
  status: number;
  stack?: string;
}

export interface ActionContextManagerConfig {
  page: Page;
  network: NetworkFixture;
  actionName: string;
}

export interface MockErrorOptions {
  code: AstroActionErrorCode;
  message?: string;
}

export interface MockSuccessDataOptions<T extends JsonBodyType> {
  data: T;
  status?: number;
}

type MockState =
  | { type: "success"; status: number }
  | { type: "successWithData"; data: JsonBodyType; status: number }
  | { type: "error"; options: MockErrorOptions & { status: number } };

// =======================
// ACTION MANAGER
// =======================

export class ActionContextManager {
  private mockState: MockState = { type: "success", status: 204 };

  constructor(private config: ActionContextManagerConfig) {}

  static with(config: ActionContextManagerConfig) {
    return new ActionContextManager(config);
  }

  mockSuccess(options?: { status?: number }): this {
    this.mockState = {
      type: "success",
      status: options?.status ?? 204,
    };
    return this;
  }

  mockSuccessWithData<T extends JsonBodyType>(
    options: MockSuccessDataOptions<T>,
  ): this {
    this.mockState = {
      type: "successWithData",
      data: options.data,
      status: options.status ?? 200,
    };
    return this;
  }

  mockError(options: MockErrorOptions): this {
    this.mockState = {
      type: "error",
      options: { ...options, status: getStatusFromErrorCode(options.code) },
    };
    return this;
  }

  private get urlPattern(): string {
    return `**/_actions/${this.config.actionName}`;
  }

  private setupMock(): void {
    const state = this.mockState;

    const handler = http.post(this.urlPattern, () => {
      switch (state.type) {
        case "success":
          return HttpResponse.text(null, { status: state.status });

        case "successWithData":
          return HttpResponse.json(state.data, { status: state.status });

        case "error": {
          const { code, message, status } = state.options;

          const body: AstroActionErrorBody = {
            type: "AstroActionError",
            code: code,
            message: message || "Mocked Action Error",
            status: status,
          };

          return HttpResponse.json(body, { status });
        }
      }
    });

    this.config.network.use(handler);
  }

  async execute<T>(
    callback: () => Promise<T>,
  ): Promise<{ result: T; response: Response }> {
    this.setupMock();
    const responsePromise = this.config.page.waitForResponse((response) =>
      response.url().includes(`/_actions/${this.config.actionName}`),
    );
    const result = await callback();
    const response = await responsePromise;
    return { result, response };
  }
}
