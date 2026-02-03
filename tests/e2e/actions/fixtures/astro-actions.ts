import { expect } from '@playwright/test';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { ReadStream } from 'fs';
import { parse as parseDevalue } from 'devalue';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ActionResult<T = unknown> =
  | { data: T; error: undefined }
  | { data: undefined; error: ActionError };

export interface ActionError {
  type: 'AstroActionError' | 'AstroActionInputError';
  code: string;
  status: number;
  message: string;
  stack?: string;
  issues?: Array<{
    path: (string | number)[];
    message: string;
  }>;
  fields?: Record<string, string[]>;
}

type MultipartValue =
  | string
  | number
  | boolean
  | ReadStream
  | {
    name: string;
    mimeType: string;
    buffer: Buffer;
  };

type MultipartData = Record<string, MultipartValue>;

/* -------------------------------------------------------------------------- */
/* AstroActionRequest                                                          */
/* -------------------------------------------------------------------------- */

export class AstroActionRequest {
  private readonly baseURL: string;
  private readonly trailingSlash: boolean;

  constructor(
    private readonly request: APIRequestContext,
    baseURL: string,
    options: { trailingSlash?: boolean } = {}
  ) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.trailingSlash = options.trailingSlash ?? false;
  }

  /* ---------------------------------- URL --------------------------------- */

  private actionUrl(actionName: string): string {
    return (
      `${this.baseURL}/_actions/${actionName}` +
      (this.trailingSlash ? '/' : '')
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Public API                                                                 */
  /* -------------------------------------------------------------------------- */

  async callAction<T = unknown>(
    actionName: string,
    data?: unknown
  ): Promise<{ response: APIResponse; result: ActionResult<T> }> {
    const response = await this.post(actionName, this.buildPayload(data));
    const result = await this.deserialize<T>(response);
    return { response, result };
  }

  async callActionWithForm<T = unknown>(
    actionName: string,
    multipart: MultipartData
  ): Promise<{ response: APIResponse; result: ActionResult<T> }> {
    const response = await this.request.post(this.actionUrl(actionName), {
      multipart,
      headers: {
        Accept: 'application/json',
      },
    });

    const result = await this.deserialize<T>(response);
    return { response, result };
  }

  /* -------------------------------------------------------------------------- */
  /* Expectations (Test Helpers)                                                */
  /* -------------------------------------------------------------------------- */

  async expectSuccess<T = unknown>(
    actionName: string,
    data?: unknown
  ): Promise<T> {
    const { response, result } = await this.callAction<T>(actionName, data);

    expect(response.ok()).toBeTruthy();
    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();

    return result.data!;
  }

  async expectError(
    actionName: string,
    data?: unknown,
    expectedCode?: string
  ): Promise<ActionError> {
    const { response, result } = await this.callAction(actionName, data);

    expect(response.ok()).toBeFalsy();
    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();

    if (expectedCode) {
      expect(result.error!.code).toBe(expectedCode);
    }

    return result.error!;
  }

  async expectValidationError(
    actionName: string,
    data?: unknown
  ): Promise<ActionError> {
    const error = await this.expectError(actionName, data, 'INTERNAL_SERVER_ERROR');

    expect(error.type).toBe('AstroActionInputError');
    expect(Array.isArray(error.issues)).toBeTruthy();

    return error;
  }

  /* -------------------------------------------------------------------------- */
  /* Internals                                                                  */
  /* -------------------------------------------------------------------------- */

  private async post(
    actionName: string,
    options: Parameters<APIRequestContext['post']>[1]
  ): Promise<APIResponse> {
    return await this.request.post(this.actionUrl(actionName), options);
  }

  private buildPayload(data?: unknown): {
    data?: any;
    headers?: Record<string, string>;
  } {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    // FormData
    if (data instanceof FormData) {
      return { data, headers };
    }

    // No body
    if (data === undefined) {
      headers['Content-Length'] = '0';
      return { headers };
    }

    // Use plain JSON instead of devalue
    headers['Content-Type'] = 'application/json';

    return {
      data, 
      headers,
    };
  }

  private async deserialize<T>(response: APIResponse): Promise<ActionResult<T>> {
    const status = response.status();
    const text = await response.text();

    // 204 No Content → return undefined data
    if (status === 204) {
      return { data: undefined as T, error: undefined };
    }

    // Success response → parse using devalue
    if (response.ok()) {
      return this.parseSuccess<T>(text);
    }

    // Error response → parse JSON or fallback
    return this.parseError<T>(text, status);
  }

  private parseSuccess<T>(text: string): ActionResult<T> {
    try {
      const data = parseDevalue(text) as T;
      return { data, error: undefined };
    } catch {
      throw new Error(`Failed to parse success response: ${text}`);
    }
  }

  private parseError<T>(text: string, status: number): ActionResult<T> {
    try {
      const json = JSON.parse(text);
      return {
        data: undefined,
        error: {
          type: json.type ?? 'AstroActionError',
          code: json.code ?? 'INTERNAL_SERVER_ERROR',
          status,
          message: json.message ?? text,
          ...(json.issues && { issues: json.issues }),
          ...(json.fields && { fields: json.fields }),
        },
      } as ActionResult<T>;
    } catch {
      return {
        data: undefined,
        error: {
          type: 'AstroActionError',
          code: 'INTERNAL_SERVER_ERROR',
          status,
          message: text,
        },
      } as ActionResult<T>;
    }
  }
}
