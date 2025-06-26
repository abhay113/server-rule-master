// src/middlewares/logger.ts
import pino from 'pino';
import { Request, Response, NextFunction } from "express";

export const logger = pino({
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
        },
    },
});
export const logRequestResponse = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    logger.info({
        method: req.method,
        url: req.url,
        body: req.body,
        headers: req.headers,
        ip,
        statusCode: res.statusCode,
    }, 'Incoming request');

    const originalJson = res.json;
    res.json = function (data) {
        const MAX_ITEMS = 2; // Maximum number of items to log in an array response
        let responseBody: any = data;

        if (Array.isArray(data)) {
            responseBody = data.slice(0, MAX_ITEMS);
            if (data.length > MAX_ITEMS) {
                responseBody.push({ note: '...truncated' });
            }
        } else if (typeof data === 'object') {
            const str = JSON.stringify(data);
            if (str.length > 1000) {
                responseBody = { ...data, note: '...response truncated for logging' };
            }
        }

        logger.info({
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: Date.now() - start,
            responseBody
        }, 'Response sent');

        return originalJson.call(this, data);
    };
    next();
};
