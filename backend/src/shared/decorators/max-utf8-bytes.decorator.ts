import { registerDecorator } from 'class-validator';

/** bcrypt uses at most 72 UTF-8 bytes; reject passwords that would be truncated. */
export function MaxUtf8Bytes(max: number): PropertyDecorator {
  return (target, propertyKey) =>
    registerDecorator({
      name: 'maxUtf8Bytes',
      target: target.constructor,
      propertyName: String(propertyKey),
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= max,
        defaultMessage: () => `$property must not exceed ${max} UTF-8 bytes`,
      },
    });
}
