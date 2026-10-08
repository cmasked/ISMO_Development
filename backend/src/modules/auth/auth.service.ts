import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { ErrorCodes } from '../../shared/constants/error-codes';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../shared/interfaces/authenticated-user.interface';
import { MessageResponseDto } from '../../shared/dto/message-response.dto';
import { handleServiceError } from '../../shared/utils/service-error.util';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersRepository } from '../users/users.repository';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly dummyHash = bcrypt.hash(randomBytes(32).toString('hex'), 12);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    try {
      const passwordHash = await bcrypt.hash(dto.password, 12);
      const user = await this.usersRepository.createAndSave({
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
      });
      this.logger.log('Registration completed');
      return UserResponseDto.fromEntity(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === '23505'
      ) {
        throw new ConflictException({
          message: 'Email address already registered',
          code: ErrorCodes.EMAIL_ALREADY_EXISTS,
        });
      }
      handleServiceError(error, this.logger, 'register');
    }
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    try {
      const user = await this.usersRepository.findForLogin(dto.email);
      // Unknown accounts still perform a password comparison to reduce timing differences.
      const valid = await bcrypt.compare(
        dto.password,
        user?.passwordHash ?? (await this.dummyHash),
      );
      if (!user || !valid)
        throw new UnauthorizedException('Invalid email or password');

      const issuedAt = Math.floor(Date.now() / 1000);
      const ttl = this.config.getOrThrow<number>('jwt.accessTokenTtlSeconds');
      const expiresAt = new Date((issuedAt + ttl) * 1000);
      const session = await this.authRepository.createSession(
        user.id,
        expiresAt,
      );
      const payload: JwtPayload = {
        sub: user.id,
        sessionId: session.id,
        iat: issuedAt,
      };
      const accessToken = this.jwtService.sign(payload);
      this.logger.log('Login completed');
      return {
        accessToken,
        tokenType: 'Bearer',
        expiresAt,
        user: UserResponseDto.fromEntity(user),
      };
    } catch (error) {
      handleServiceError(error, this.logger, 'login');
    }
  }

  async me(userId: string): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findById(userId);
      if (!user) throw new UnauthorizedException('Session is no longer valid');
      return UserResponseDto.fromEntity(user);
    } catch (error) {
      handleServiceError(error, this.logger, 'me');
    }
  }

  async logout(user: AuthenticatedUser): Promise<MessageResponseDto> {
    try {
      await this.authRepository.revoke(user.sessionId, user.userId);
      this.logger.log('Logout completed');
      return { message: 'Logged out successfully' };
    } catch (error) {
      handleServiceError(error, this.logger, 'logout');
    }
  }
}
