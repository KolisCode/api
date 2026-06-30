import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Convierte cualquier excepción en una respuesta RFC 7807
 * (application/problem+json), con formato consistente en toda la API.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail: string | undefined;
    let errors: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        title = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        title = (body.error as string) ?? exception.name;
        // class-validator devuelve `message` como array de strings
        if (Array.isArray(body.message)) {
          detail = 'La solicitud contiene campos inválidos.';
          errors = body.message;
        } else {
          detail = body.message as string;
        }
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      this.logger.error(exception.message, exception.stack);
    }

    const problem: Record<string, unknown> = {
      type: 'about:blank',
      title,
      status,
      instance: request.url,
    };
    if (detail) problem.detail = detail;
    if (errors) problem.errors = errors;

    response
      .status(status)
      .setHeader('Content-Type', 'application/problem+json');
    response.json(problem);
  }
}
