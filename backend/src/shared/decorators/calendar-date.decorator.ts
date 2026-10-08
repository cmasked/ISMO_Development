import { registerDecorator, ValidationOptions } from 'class-validator';

/** A date-only value must represent a real calendar day, including leap-year rules. */
export function IsCalendarDate(options?: ValidationOptions): PropertyDecorator {
  return (target, propertyKey) =>
    registerDecorator({
      name: 'isCalendarDate',
      target: target.constructor,
      propertyName: String(propertyKey),
      options,
      validator: {
        validate(value: unknown): boolean {
          if (
            typeof value !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            value.startsWith('0000-')
          )
            return false;
          const date = new Date(`${value}T00:00:00.000Z`);
          return (
            !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value
          );
        },
        defaultMessage: () =>
          '$property must be a valid calendar date in YYYY-MM-DD format',
      },
    });
}
