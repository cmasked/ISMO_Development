import { BadRequestException } from '@nestjs/common';

export function requireUpdateFields(dto: object): void {
  if (!Object.values(dto).some((value) => value !== undefined)) {
    throw new BadRequestException('Provide at least one field to update');
  }
}
