import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import AppRoutes from './routes';
import multer from 'multer';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        exposedHeaders: ['set-cookie'],
        maxAge: 3600,
    })
);

// Routes
app.use('/api', AppRoutes.routes());

// Error handling middleware for multer and other errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name for file upload.'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Handle custom errors (like file filter errors)
    if (err.message) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Default error
    console.error(err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
