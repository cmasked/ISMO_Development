import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export function handleServiceError(
  error: unknown,
  logger: Logger,
  method: string,
): never {
  if (error instanceof HttpException) throw error;
  if (error instanceof QueryFailedError && error.driverError.code === '23503') {
    throw new ConflictException(
      'Related resource changed; refresh and try again',
    );
  }
  if (error instanceof QueryFailedError && error.driverError.code === '23514') {
    throw new BadRequestException(
      'Data violates a database constraint; refresh and check the submitted values',
    );
  }
  logger.error(`${method} failed`, error instanceof Error ? error.stack : error);
  throw new InternalServerErrorException();
}
