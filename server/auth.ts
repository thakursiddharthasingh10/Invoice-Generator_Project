import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'invoice_generator_super_secret_jwt_key_2026';
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      fullName: user.fullName 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): { userId: string; email: string; fullName: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({ error: 'Session expired or token invalid. Please sign in again.' });
  }

  // Look up user in database to ensure account still exists
  const stmt = db.prepare('SELECT id, full_name, email FROM users WHERE id = ?');
  const user = stmt.get(decoded.userId) as any;

  if (!user) {
    return res.status(401).json({ error: 'User account not found. Please sign up or sign in again.' });
  }

  req.user = {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
  };

  next();
}
