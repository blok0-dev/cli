export interface AuthConfig {
    apiEndpoint?: string;
    refreshToken?: string;
    tokenExpiry?: number;
}
export interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
}
/**
 * Load auth configuration from file
 */
export declare function loadAuthConfig(): AuthConfig;
/**
 * Save auth configuration to file
 */
export declare function saveAuthConfig(config: AuthConfig): void;
/**
 * Store access token securely
 */
export declare function storeAccessToken(token: string): Promise<void>;
/**
 * Get stored access token
 */
export declare function getAccessToken(): Promise<string | null>;
/**
 * Store refresh token securely
 */
export declare function storeRefreshToken(token: string): Promise<void>;
/**
 * Get stored refresh token
 */
export declare function getRefreshToken(): Promise<string | null>;
/**
 * Clear all stored credentials
 */
export declare function clearCredentials(): Promise<void>;
/**
 * Check if user is authenticated
 */
export declare function isAuthenticated(): Promise<boolean>;
/**
 * Validate token expiry (basic check)
 */
export declare function isTokenExpired(expiry?: number): boolean;
/**
 * Get authorization header for API requests
 */
export declare function getAuthHeader(): Promise<string | null>;
