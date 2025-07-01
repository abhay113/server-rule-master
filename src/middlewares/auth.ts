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

export interface AuthenticatedUser {
    username: string;
    roles: string[];
    group?: string[];
    department?: string;
    isSuperAdmin?: boolean;
    raw: jwt.JwtPayload;
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
                return res.status(403).json({ message: 'Invalid token', error: err });
            }

            const jwtPayload = decoded as jwt.JwtPayload;
            const username = jwtPayload.preferred_username;

            const realmRoles = jwtPayload.realm_access?.roles || [];
            const clientRoles = Object.values(jwtPayload.resource_access || {})
                .flatMap((client: any) => client?.roles || []);
            const allRoles = [...new Set([...realmRoles, ...clientRoles])];

            const group: string[] = jwtPayload.group || []; // keycloak group claim
            const groupPath = group[0] || ''; // e.g., "/sales/sales_admin"
            const parts = groupPath.split('/').filter(Boolean);
            const department = parts[0] || undefined;
            const isSuperAdmin = department === 'admin';

            const userContext: AuthenticatedUser = {
                username,
                roles: allRoles,
                group,
                department,
                isSuperAdmin,
                raw: jwtPayload
            };

            res.locals.user = userContext; // or attach to req.user if preferred

            next();
        }
    );
};
