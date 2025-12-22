import jwt from 'jsonwebtoken';

export class JWTUtil {
    private static readonly SECRET: jwt.Secret = 'a';
    private static readonly EXPIRES_IN: jwt.SignOptions['expiresIn'] = '7d';
    private static readonly REFRESH_EXPIRES_IN: jwt.SignOptions['expiresIn'] = '30d';

    static generateToken(payload: object): string {
        return jwt.sign(
            {
                ...payload,
                iat: Math.floor(Date.now() / 1000),
            },
            this.SECRET,
            { expiresIn: this.EXPIRES_IN },
        );
    }

    static verifyToken(token: string): any {
        try {
            return jwt.verify(token, this.SECRET);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) throw new Error('Token has expired');
            else if (error instanceof jwt.JsonWebTokenError) throw new Error('Invalid token');

            throw error;
        }
    }

    static decodeToken(token: string): any {
        try {
            return jwt.decode(token);
        } catch (error) {
            return null;
        }
    }

    static generateRefreshToken(payload: any): string {
        return jwt.sign(
            {
                ...payload,
                type: 'refresh',
                iat: Math.floor(Date.now() / 1000),
            },
            this.SECRET as jwt.Secret,
            { expiresIn: this.REFRESH_EXPIRES_IN },
        );
    }

    static verifyRefreshToken(token: string): any {
        try {
            const decoded = jwt.verify(token, this.SECRET);

            if ((decoded as any).type !== 'refresh') throw new Error('Invalid token type');

            return decoded;
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
}
