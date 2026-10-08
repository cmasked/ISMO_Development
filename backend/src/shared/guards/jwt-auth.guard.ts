import {
  ExecutionContext,
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ErrorCodes } from '../constants/error-codes';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    return super.canActivate(context);
  }

  handleRequest<TUser>(
    error: unknown,
    user: TUser | false | null,
    info?: { name?: string },
  ): TUser {
    if (error instanceof HttpException) throw error;
    if (error) throw new ServiceUnavailableException();
    if (!user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          message: 'Login expired; please log in again',
          code: ErrorCodes.TOKEN_EXPIRED,
        });
      }
      throw new UnauthorizedException(
        'Authentication required or invalid token',
      );
    }
    return user;
  }
}
