import * as keytar from 'keytar';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

const SERVICE_NAME = 'blok0';
const CONFIG_DIR = path.join(os.homedir(), '.blok0');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface AuthConfig {
  apiEndpoint?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export interface AuthCallback {
  token: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface AuthServerOptions {
  port?: number;
  timeout?: number;
  state?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load auth configuration from file
 */
export function loadAuthConfig(): AuthConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Failed to load auth config:', error);
  }
  return {};
}

/**
 * Save auth configuration to file
 */
export function saveAuthConfig(config: AuthConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Store access token securely
 */
export async function storeAccessToken(token: string): Promise<void> {
  try {
    await keytar.setPassword(SERVICE_NAME, 'access_token', token);
  } catch (error) {
    console.error('Failed to store access token:', error);
    throw new Error('Unable to securely store access token');
  }
}

/**
 * Get stored access token
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await keytar.getPassword(SERVICE_NAME, 'access_token');
  } catch (error) {
    console.error('Failed to retrieve access token:', error);
    return null;
  }
}

/**
 * Store refresh token securely
 */
export async function storeRefreshToken(token: string): Promise<void> {
  try {
    await keytar.setPassword(SERVICE_NAME, 'refresh_token', token);
  } catch (error) {
    console.error('Failed to store refresh token:', error);
    throw new Error('Unable to securely store refresh token');
  }
}

/**
 * Get stored refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await keytar.getPassword(SERVICE_NAME, 'refresh_token');
  } catch (error) {
    console.error('Failed to retrieve refresh token:', error);
    return null;
  }
}

/**
 * Clear all stored credentials
 */
export async function clearCredentials(): Promise<void> {
  try {
    await keytar.deletePassword(SERVICE_NAME, 'access_token');
    await keytar.deletePassword(SERVICE_NAME, 'refresh_token');

    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  } catch (error) {
    console.error('Failed to clear credentials:', error);
    throw new Error('Unable to clear stored credentials');
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

/**
 * Validate token expiry (basic check)
 */
export function isTokenExpired(expiry?: number): boolean {
  if (!expiry) return false;
  return Date.now() >= expiry;
}

/**
 * Get authorization header for API requests
 */
export async function getAuthHeader(): Promise<string | null> {
  const token = await getAccessToken();
  return token ? `Bearer ${token}` : null;
}