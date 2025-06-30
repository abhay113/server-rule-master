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

            // 🔍 Extract roles from Keycloak
            const realmRoles = jwtPayload.realm_access?.roles || [];
            const clientRoles = Object.values(jwtPayload.resource_access || {})
                .flatMap((client: any) => client?.roles || []);

            const allRoles = [...new Set([...realmRoles, ...clientRoles])];

            // ✅ Attach to res.locals
            res.locals.user = {
                username,
                roles: allRoles,        // Add roles here
                raw: jwtPayload         // Optional: keep full token payload
            };

            next(); // ✅ Continue
        }
    );
};

export const hasAdminRole = (roles: string[]): boolean => {
    return roles.some(role => role.toLowerCase().endsWith('_admin_role'));
};
