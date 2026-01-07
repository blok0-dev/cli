"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const axios_1 = __importDefault(require("axios"));
const inquirer_1 = __importDefault(require("inquirer"));
const tokenStorage_1 = require("./tokenStorage");
class AuthService {
    static config = {
        apiBaseUrl: process.env.BLOK0_API_URL || 'https://www.blok0.xyz',
        clientId: process.env.BLOK0_CLIENT_ID || 'blok0-cli',
        redirectUri: 'http://localhost:3000/callback'
    };
    static httpClient = axios_1.default.create({
        baseURL: this.config.apiBaseUrl,
        timeout: 30000,
    });
    static async login(useToken = false) {
        console.log('🔐 Logging into Blok0...');
        let tokens;
        if (useToken) {
            tokens = await this.loginWithToken();
        }
        else {
            tokens = await this.loginWithCredentials();
        }
        await tokenStorage_1.TokenStorage.storeTokens(tokens);
        console.log('✅ Successfully logged in to Blok0!');
    }
    static async logout() {
        await tokenStorage_1.TokenStorage.clearTokens();
        console.log('✅ Successfully logged out of Blok0!');
    }
    static async whoami() {
        const tokens = await this.ensureValidTokens();
        if (!tokens) {
            console.log('❌ You are not logged in. Run `blok0 login` first.');
            return null;
        }
        try {
            const response = await this.httpClient.get('/api/auth/me', {
                headers: { Authorization: `Bearer ${tokens.accessToken}` }
            });
            return response.data;
        }
        catch (error) {
            console.log('❌ Failed to get user info. You may need to login again.');
            return null;
        }
    }
    static async ensureValidTokens() {
        let tokens = await tokenStorage_1.TokenStorage.getTokens();
        if (!tokens) {
            return null;
        }
        if (await tokenStorage_1.TokenStorage.isTokenExpired(tokens)) {
            if (tokens.refreshToken) {
                try {
                    tokens = await this.refreshTokens(tokens.refreshToken);
                    await tokenStorage_1.TokenStorage.storeTokens(tokens);
                }
                catch (error) {
                    console.log('❌ Token refresh failed. Please login again.');
                    await tokenStorage_1.TokenStorage.clearTokens();
                    return null;
                }
            }
            else {
                console.log('❌ Access token expired. Please login again.');
                await tokenStorage_1.TokenStorage.clearTokens();
                return null;
            }
        }
        return tokens;
    }
    static async loginWithCredentials() {
        const credentials = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'email',
                message: 'Email:',
                validate: (input) => input.includes('@') || 'Please enter a valid email'
            },
            {
                type: 'password',
                name: 'password',
                message: 'Password:',
                mask: '*'
            }
        ]);
        const response = await this.httpClient.post('/api/auth/login', credentials);
        return this.parseTokensResponse(response.data);
    }
    static async loginWithOAuth() {
        // This would implement OAuth flow with local server callback
        // For now, return a placeholder
        throw new Error('OAuth login not yet implemented');
    }
    static async loginWithToken() {
        const { token } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'token',
                message: 'Access Token:',
                validate: (input) => input.length > 0 || 'Token cannot be empty'
            }
        ]);
        // Validate token by making a test request
        const response = await this.httpClient.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return {
            accessToken: token,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // Assume 24h expiry
            provider: 'blok0'
        };
    }
    static async refreshTokens(refreshToken) {
        const response = await this.httpClient.post('/api/auth/refresh', {
            refreshToken
        });
        return this.parseTokensResponse(response.data);
    }
    static parseTokensResponse(data) {
        return {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: Date.now() + (data.expiresIn * 1000),
            provider: 'blok0'
        };
    }
}
exports.AuthService = AuthService;
