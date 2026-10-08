import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { isUUID } from 'class-validator';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorCodes } from '../../../shared/constants/error-codes';
import {
  AuthenticatedUser,
  JwtPayload,
} from '../../../shared/interfaces/authenticated-user.interface';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
      algorithms: ['HS256'],
      issuer: 'ismo-backend',
      audience: 'ismo-clients',
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!isUUID(payload.sub, '4') || !isUUID(payload.sessionId, '4')) {
      throw new UnauthorizedException('Invalid token');
    }
    const session = await this.authRepository.findActive(
      payload.sessionId,
      payload.sub,
    );
    if (!session) {
      throw new UnauthorizedException({
        message: 'Session ended; please log in again',
        code: ErrorCodes.SESSION_INVALID,
      });
    }
    return { userId: payload.sub, sessionId: payload.sessionId };
  }
}
