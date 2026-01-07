import { AuthTokens } from './types';
export declare class TokenStorage {
    private static configPath;
    static storeTokens(tokens: AuthTokens): Promise<void>;
    static getTokens(): Promise<AuthTokens | null>;
    static clearTokens(): Promise<void>;
    static isTokenExpired(tokens: AuthTokens): Promise<boolean>;
    private static ensureConfigDir;
}
