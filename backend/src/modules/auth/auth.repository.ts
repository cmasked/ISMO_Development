import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthSession } from './entities/auth-session.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(AuthSession)
    private readonly sessions: Repository<AuthSession>,
  ) {}

  createSession(userId: string, expiresAt: Date): Promise<AuthSession> {
    return this.sessions.save(this.sessions.create({ userId, expiresAt }));
  }

  findActive(id: string, userId: string): Promise<AuthSession | null> {
    return this.sessions
      .createQueryBuilder('session')
      .innerJoin('session.user', 'user')
      .where('session.id = :id AND session.userId = :userId', { id, userId })
      .andWhere(
        'session.revokedAt IS NULL AND session.expiresAt > CURRENT_TIMESTAMP',
      )
      .getOne();
  }

  async revoke(id: string, userId: string): Promise<void> {
    await this.sessions.update({ id, userId }, { revokedAt: new Date() });
  }
}
