import express from 'express';
import tenantRoutes from './routes/tenant.routes';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import ruleRoutes from './routes/rule.routes';
import cors from 'cors';
import { logRequestResponse } from './middlewares/logger';
import { errorHandler } from './middlewares/errorHandler';

import dotenv from 'dotenv';
dotenv.config();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

const app = express();
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.options("*", cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());

// Simple logging middleware to log requests and responses data
app.use(logRequestResponse);

app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rules', ruleRoutes);


app.use(errorHandler);
export default app;
