export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  provider: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthConfig {
  apiBaseUrl: string;
  clientId: string;
  redirectUri: string;
}