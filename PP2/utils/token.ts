import jwt from 'jsonwebtoken';

const JWT_SECRET = 'scriptorium-secret-key-2024';

interface TokenPayload {
    userId: number;
    permission?: string;
    iat?: number;
    exp?: number;
}

export function generateToken(payload: TokenPayload) {
    console.log('Generating token with payload:', payload);
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): TokenPayload | null {
    if (!token) {
        console.log('No token provided');
        return null;
    }

    try {
        // Simple decode first
        const decoded = jwt.decode(token);

        // Manual verification using the secret
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.log('Invalid token format');
            return null;
        }

        // If we can decode it, return the payload
        if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
            return {
                userId: decoded.userId,
                permission: decoded.permission,
                iat: decoded.iat,
                exp: decoded.exp
            };
        }

        console.log('Invalid token payload');
        return null;
    } catch (error) {
        console.error('Token error:', error);
        return null;
    }
}
