import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ErrorCodes } from '../constants/error-codes';
import { ApiResponse } from '../interfaces/api-response.interface';

const STATUS_CODES: Record<number, ErrorCodes> = {
  400: ErrorCodes.VALIDATION_ERROR,
  401: ErrorCodes.UNAUTHORIZED,
  403: ErrorCodes.FORBIDDEN,
  404: ErrorCodes.NOT_FOUND,
  409: ErrorCodes.CONFLICT,
  429: ErrorCodes.RATE_LIMITED,
  503: ErrorCodes.SERVICE_UNAVAILABLE,
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const code = STATUS_CODES[status] ?? (status >= 500 ? ErrorCodes.INTERNAL_ERROR : ErrorCodes.HTTP_ERROR);
    let message = status >= 500 ? 'Internal server error' : 'Request failed';

    if (exception instanceof HttpException && status < 500) {
      const body = exception.getResponse();
      const detail: unknown = typeof body === 'string' ? body : (body as Record<string, unknown>).message;
      if (typeof detail === 'string') message = detail;
      if (Array.isArray(detail) && detail.every((item) => typeof item === 'string')) {
        message = detail.join('; ');
      }
    }
    // Nest's default 404 embeds the requested URL, which may contain sensitive query values.
    if (status === 404) message = 'Resource not found';
    if (status === 503) message = 'Service unavailable';

    // Never log exception messages, stacks, bodies, URLs, headers, or driver parameters.
    if (status >= 500) this.logger.error(`Request failed: status=${status}, code=${code}`);

    const body: ApiResponse<null> = { success: false, data: null, message, code };
    response.status(status).json(body);
  }
}
