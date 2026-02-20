import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { Employee, IEmployee } from '../models/Employee';
import { RefreshToken } from '../models/RefreshToken';

const BCRYPT_ROUNDS = 12;

export interface TokenPayload {
  sub: string;       // employee._id
  role: string;
  workplaceId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function comparePassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

export function signAccessToken(employee: IEmployee): string {
  const payload: TokenPayload = {
    sub: employee._id.toString(),
    role: employee.role,
    workplaceId: employee.workplaceId?.toString(),
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export async function storeRefreshToken(
  employeeId: string,
  rawToken: string,
  userAgent: string | null,
  ipAddress: string | null
): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await RefreshToken.create({ employeeId, tokenHash, expiresAt, userAgent, ipAddress });
}

export async function rotateRefreshToken(
  rawToken: string
): Promise<{ employee: IEmployee; tokens: AuthTokens } | null> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await stored.deleteOne();
    return null;
  }

  const employee = await Employee.findById(stored.employeeId);
  if (!employee || employee.status === 'inactive') {
    await stored.deleteOne();
    return null;
  }

  // Rotate: delete old, issue new
  await stored.deleteOne();
  const newRawToken = signRefreshToken();
  await storeRefreshToken(employee._id.toString(), newRawToken, null, null);

  return {
    employee,
    tokens: {
      accessToken: signAccessToken(employee),
      refreshToken: newRawToken,
    },
  };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await RefreshToken.deleteOne({ tokenHash });
}
