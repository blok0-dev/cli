import axios, { AxiosInstance } from 'axios';
import open from 'open';
import inquirer from 'inquirer';
import { AuthTokens, UserInfo, LoginCredentials, AuthConfig } from './types';
import { TokenStorage } from './tokenStorage';

export class AuthService {
  private static config: AuthConfig = {
    apiBaseUrl: process.env.BLOK0_API_URL || 'https://www.blok0.xyz',
    clientId: process.env.BLOK0_CLIENT_ID || 'blok0-cli',
    redirectUri: 'http://localhost:3000/callback'
  };

  private static httpClient: AxiosInstance = axios.create({
    baseURL: this.config.apiBaseUrl,
    timeout: 30000,
  });

  static async login(useToken: boolean = false): Promise<void> {
    console.log('🔐 Logging into Blok0...');

    let tokens: AuthTokens;

    if (useToken) {
      tokens = await this.loginWithToken();
    } else {
      tokens = await this.loginWithCredentials();
    }

    await TokenStorage.storeTokens(tokens);
    console.log('✅ Successfully logged in to Blok0!');
  }

  static async logout(): Promise<void> {
    await TokenStorage.clearTokens();
    console.log('✅ Successfully logged out of Blok0!');
  }

  static async whoami(): Promise<UserInfo | null> {
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
    } catch (error) {
      console.log('❌ Failed to get user info. You may need to login again.');
      return null;
    }
  }

  static async ensureValidTokens(): Promise<AuthTokens | null> {
    let tokens = await TokenStorage.getTokens();
    if (!tokens) {
      return null;
    }

    if (await TokenStorage.isTokenExpired(tokens)) {
      if (tokens.refreshToken) {
        try {
          tokens = await this.refreshTokens(tokens.refreshToken);
          await TokenStorage.storeTokens(tokens);
        } catch (error) {
          console.log('❌ Token refresh failed. Please login again.');
          await TokenStorage.clearTokens();
          return null;
        }
      } else {
        console.log('❌ Access token expired. Please login again.');
        await TokenStorage.clearTokens();
        return null;
      }
    }

    return tokens;
  }

  private static async loginWithCredentials(): Promise<AuthTokens> {
    const credentials = await inquirer.prompt<LoginCredentials>([
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

  private static async loginWithOAuth(): Promise<AuthTokens> {
    // This would implement OAuth flow with local server callback
    // For now, return a placeholder
    throw new Error('OAuth login not yet implemented');
  }

  private static async loginWithToken(): Promise<AuthTokens> {
    const { token } = await inquirer.prompt([
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

  private static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const response = await this.httpClient.post('/api/auth/refresh', {
      refreshToken
    });
    return this.parseTokensResponse(response.data);
  }

  private static parseTokensResponse(data: any): AuthTokens {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + (data.expiresIn * 1000),
      provider: 'blok0'
    };
  }
}
