import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: number;
  permission?: string;
}

export function generateToken(payload: TokenPayload) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as TokenPayload;
  } catch (error) {
    return null;
  }
} 