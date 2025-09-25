export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: string[];

  constructor(status: number, code: string, message: string, options?: { details?: string[] }) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = options?.details;
  }
}

export class BadRequestError extends HttpError {
  constructor(code = 'bad_request', message = 'Invalid request', options?: { details?: string[] }) {
    super(400, code, message, options);
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(code = 'too_many_requests', message = 'Too many requests', options?: { details?: string[] }) {
    super(429, code, message, options);
  }
}

export class InternalServerError extends HttpError {
  constructor(message = 'Internal server error') {
    super(500, 'internal_error', message);
  }
}
