
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔐 Auth header:', authHeader);
    console.log('🔐 Token extracted:', token ? token.substring(0, 20) + '...' : 'No token');

    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified successfully:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Token verification failed:');
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};