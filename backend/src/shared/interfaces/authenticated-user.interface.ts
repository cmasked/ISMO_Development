export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}

export interface JwtPayload {
  sub: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}
