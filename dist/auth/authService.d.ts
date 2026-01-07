import { AuthTokens, UserInfo } from './types';
export declare class AuthService {
    private static config;
    private static httpClient;
    static login(useToken?: boolean): Promise<void>;
    static logout(): Promise<void>;
    static whoami(): Promise<UserInfo | null>;
    static ensureValidTokens(): Promise<AuthTokens | null>;
    private static loginWithCredentials;
    private static loginWithOAuth;
    private static loginWithToken;
    private static refreshTokens;
    private static parseTokensResponse;
}
