import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;
  @ApiProperty({ enum: ['Bearer'] })
  tokenType!: 'Bearer';
  @ApiProperty({ format: 'date-time' })
  expiresAt!: Date;
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
