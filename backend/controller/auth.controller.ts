import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../modules/user/user.model.ts';
import type { Request, Response } from 'express';


const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
class AuthController {
    registerUser = async (req: Request, res: Response) => {
        try {
            const { username, password, confirmPassword, email, role } = req.body;
            if (password !== confirmPassword) {
                return res.status(400).json({ message: 'Passwords do not match' });
            }

            const existingUser = await UserModel.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in exist' });
            }

            if (role && !['user', 'admin'].includes(role)) {
                return res.status(400).json({ message: 'Invalid role specified' });
            }


            const user = await UserModel.create({
                username,
                password,
                email,
                confirmPassword,
                role
            });

            // Generate token
            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '30d' }
            );

            return res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };

    loginUser = async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({ success: true, user: { id: user._id, email: user.email, role: user.role }, token });
    }
}
export default new AuthController();
