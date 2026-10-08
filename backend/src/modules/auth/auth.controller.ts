import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { MessageResponseDto } from '../../shared/dto/message-response.dto';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { ApiSuccessResponse } from '../../swagger/api-success-response.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  @ApiOperation({ summary: 'Register an account shared by web and mobile' })
  @ApiSuccessResponse(UserResponseDto, 201)
  register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Create an expiring login session' })
  @ApiSuccessResponse(LoginResponseDto)
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke the current session immediately' })
  @ApiSuccessResponse(MessageResponseDto)
  logout(@CurrentUser() user: AuthenticatedUser): Promise<MessageResponseDto> {
    return this.authService.logout(user);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Get the authenticated user without credential fields',
  })
  @ApiSuccessResponse(UserResponseDto)
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.authService.me(user.userId);
  }
}
