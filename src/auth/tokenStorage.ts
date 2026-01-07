import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import keytar from 'keytar';
import { AuthTokens } from './types';

const SERVICE_NAME = 'blok0-cli';
const ACCOUNT_NAME = 'auth-tokens';

export class TokenStorage {
  private static configPath = path.join(os.homedir(), '.blok0', 'config.json');

  static async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      // Try keytar first (secure storage)
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(tokens));
    } catch (error) {
      // Fallback to file storage
      console.warn('Secure storage unavailable, using file storage');
      this.ensureConfigDir();
      fs.writeFileSync(this.configPath, JSON.stringify(tokens, null, 2), {
        mode: 0o600, // Owner read/write only
      });
    }
  }

  static async getTokens(): Promise<AuthTokens | null> {
    try {
      // Try keytar first
      const stored = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      // Fallback to file
      if (fs.existsSync(this.configPath)) {
        try {
          const data = fs.readFileSync(this.configPath, 'utf8');
          return JSON.parse(data);
        } catch (parseError) {
          console.warn('Failed to parse stored tokens from file');
        }
      }
    }
    return null;
  }

  static async clearTokens(): Promise<void> {
    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    } catch (error) {
      // Also try to remove file if it exists
      if (fs.existsSync(this.configPath)) {
        fs.unlinkSync(this.configPath);
      }
    }
  }

  static async isTokenExpired(tokens: AuthTokens): Promise<boolean> {
    // Add 5 minute buffer for expiration
    return Date.now() >= (tokens.expiresAt - 5 * 60 * 1000);
  }

  private static ensureConfigDir(): void {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
    }
  }
}