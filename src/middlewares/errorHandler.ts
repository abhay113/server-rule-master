
import { NextFunction, Request, Response } from 'express';
import { logger } from './logger';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    const statusCode = err.status || 500;
    const username = (req as any).user?.username || 'anonymous';

    logger.error({
        level: 'error',
        message: err.message,
        name: err.name,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        body: req.body,
        params: req.params,
        query: req.query,
        user: username,
        statusCode,
        timestamp: new Date().toISOString(),
    }, 'Unhandled error occurred');

    res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
    });
}
