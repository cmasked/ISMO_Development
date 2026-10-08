import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export function ApiSuccessResponse(
  model: Type<unknown>,
  status = 200,
  isArray = false,
) {
  const item = { $ref: getSchemaPath(model) };
  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      schema: {
        type: 'object',
        required: ['success', 'data', 'message', 'code'],
        properties: {
          success: { type: 'boolean', example: true },
          data: isArray ? { type: 'array', items: item } : item,
          message: { type: 'string', example: 'Success' },
          code: { type: 'string', example: 'OK' },
        },
      },
    }),
  );
}
