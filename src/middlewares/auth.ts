// middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const keycloakIssuer = 'http://localhost:8080/realms/RULE_MASTER';

const client = jwksClient({
    jwksUri: `${keycloakIssuer}/protocol/openid-connect/certs`
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    client.getSigningKey(header.kid!, (err, key) => {
        if (err || !key) return callback(err || new Error('No key found'), undefined);
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
    });
}

export const authenticateUser = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Missing or invalid Authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        getKey,
        { algorithms: ['RS256'], issuer: keycloakIssuer },
        (err, decoded) => {
            if (err || !decoded) {
                res.status(403).json({ message: 'Invalid token', error: err });
                return;
            }

            const jwtPayload = decoded as jwt.JwtPayload;

            const username = jwtPayload.preferred_username;

            // ✅ Attach username to res.locals.user
            res.locals.user = {
                username,
                raw: jwtPayload // Optional: keep full token payload if needed
            };

            next(); // ✅ Continue to the next middleware/route
        }
    );
};
