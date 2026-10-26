import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { hashPassword, comparePassword, signToken, requireAuth, AuthenticatedRequest } from '../auth';

const router = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a valid full name (at least 2 characters).' });
    }

    if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO users (id, full_name, email, password_hash, auth_provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'local', ?, ?)
    `);

    insertStmt.run(userId, fullName.trim(), cleanEmail, passwordHash, now, now);

    const userPayload = {
      id: userId,
      fullName: fullName.trim(),
      email: cleanEmail,
    };

    const token = signToken(userPayload);

    return res.status(201).json({
      token,
      user: userPayload,
      message: 'Account created successfully!',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const stmt = db.prepare('SELECT id, full_name, email, password_hash FROM users WHERE email = ?');
    const user = stmt.get(cleanEmail) as any;

    if (!user) {
      // Safe generic message to prevent account enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userPayload = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
    };

    const token = signToken(userPayload);

    return res.status(200).json({
      token,
      user: userPayload,
      message: 'Signed in successfully!',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const stmt = db.prepare('SELECT id, full_name, email, business_profile, created_at FROM users WHERE id = ?');
    const user = stmt.get(req.user!.id) as any;

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let businessProfile = null;
    if (user.business_profile) {
      try {
        businessProfile = JSON.parse(user.business_profile);
      } catch (e) {}
    }

    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        businessProfile,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  // Stateless JWT: client discards token
  return res.status(200).json({ success: true, message: 'Signed out successfully.' });
});

export default router;
