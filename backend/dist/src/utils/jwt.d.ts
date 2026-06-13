export interface JwtPayload {
    userId: string;
    role: 'student' | 'company' | 'admin';
    adminRole?: 'super' | 'ops' | 'cs';
    accountType?: 'student' | 'enterprise';
    selectedTrack?: 'content' | 'dev';
}
/**
 * Generate a single JWT token (for backward compatibility)
 */
export declare function generateToken(payload: JwtPayload): string;
/**
 * Generate access + refresh token pair
 */
export declare function generateTokens(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
};
/**
 * Verify a JWT token
 */
export declare function verifyToken(token: string): JwtPayload;
/**
 * Verify a refresh token
 */
export declare function verifyRefreshToken(token: string): JwtPayload;
//# sourceMappingURL=jwt.d.ts.map