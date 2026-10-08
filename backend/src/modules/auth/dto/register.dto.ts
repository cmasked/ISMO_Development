import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MaxUtf8Bytes } from '../../../shared/decorators/max-utf8-bytes.decorator';
import { Trim } from '../../../shared/decorators/trim.decorator';

export class RegisterDto {
  @ApiProperty({ maxLength: 150, example: 'Test User' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName!: string;

  @ApiProperty({
    format: 'email',
    maxLength: 254,
    example: 'user@example.test',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 72, writeOnly: true })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @MaxUtf8Bytes(72)
  @Matches(/\S/, { message: 'password must not consist only of whitespace' })
  password!: string;
}
