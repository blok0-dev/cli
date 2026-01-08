import * as http from 'http';
import { EventEmitter } from 'events';
import { randomBytes } from 'crypto';
import { AuthCallback, AuthServerOptions } from './index';
import {
  AUTH_BASE_URL,
  AUTHORIZE_ENDPOINT,
  DEFAULT_TIMEOUT,
  PORT_RANGE,
  CALLBACK_PATH,
  SUCCESS_HTML,
  ERROR_HTML,
  TIMEOUT_HTML
} from './constants';

export class AuthServer extends EventEmitter {
  private server?: http.Server;
  private port?: number;
  private state: string;
  private timeoutId?: NodeJS.Timeout;
  private resolveCallback?: (value: AuthCallback) => void;
  private rejectCallback?: (error: Error) => void;

  constructor(options: AuthServerOptions = {}) {
    super();
    this.state = options.state || this.generateState();
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  private generateState(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Find an available port in the configured range
   */
  private async findAvailablePort(): Promise<number> {
    const { min, max } = PORT_RANGE;

    for (let port = min; port <= max; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    throw new Error('No available ports found in range');
  }

  /**
   * Check if a port is available
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const testServer = http.createServer();
      testServer.listen(port, '127.0.0.1', () => {
        testServer.close(() => resolve(true));
      });
      testServer.on('error', () => resolve(false));
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private handleRequest = (req: http.IncomingMessage, res: http.ServerResponse): void => {
    try {
      const fullUrl = `http://localhost:${this.port}${req.url}`;
      const parsedUrl = new URL(fullUrl);
      const pathname = parsedUrl.pathname;

      // Handle callback endpoint
      if (pathname === CALLBACK_PATH && req.method === 'GET') {
        this.handleCallback(parsedUrl, res);
        return;
      }

      // Handle any other request with a 404
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } catch (error) {
      console.error('Error parsing request URL:', error);
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad request');
    }
  };

  /**
   * Handle the OAuth callback
   */
  private handleCallback(parsedUrl: URL, res: http.ServerResponse): void {
    const searchParams = parsedUrl.searchParams;
    const state = searchParams.get('state');
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    // Validate state parameter
    if (!state || state !== this.state) {
      console.error('State parameter mismatch - possible CSRF attack');
      console.error(`Expected: ${this.state}, Received: ${state}`);
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(ERROR_HTML);
      this.emit('error', new Error('Invalid state parameter'));
      return;
    }

    // Handle error from authorization server
    if (error) {
      console.error('Authorization error:', error);
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(ERROR_HTML);
      this.emit('error', new Error(`Authorization failed: ${error}`));
      return;
    }

    // Handle successful authorization
    if (token) {
      const authCallback: AuthCallback = { token };
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(SUCCESS_HTML);
      this.emit('success', authCallback);
      return;
    }

    // Handle missing token
    console.error('No token received in callback');
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(ERROR_HTML);
    this.emit('error', new Error('No token received'));
  }

  /**
   * Initialize the server by finding an available port
   */
  async initialize(): Promise<void> {
    if (!this.port) {
      this.port = await this.findAvailablePort();
    }
  }

  /**
   * Start the authentication server
   */
  async start(): Promise<AuthCallback> {
    return new Promise(async (resolve, reject) => {
      this.resolveCallback = resolve;
      this.rejectCallback = reject;

      try {
        // Initialize (find port) if not already done
        await this.initialize();

        // Create server
        this.server = http.createServer(this.handleRequest);

        // Set up event listeners
        this.on('success', (callback: AuthCallback) => {
          this.cleanup();
          this.resolveCallback!(callback);
        });

        this.on('error', (error: Error) => {
          this.cleanup();
          this.rejectCallback!(error);
        });

        // Set timeout
        this.timeoutId = setTimeout(() => {
          this.handleTimeout();
        }, DEFAULT_TIMEOUT);

        // Start server
        await new Promise<void>((resolveServer, rejectServer) => {
          this.server!.listen(this.port, '127.0.0.1', () => {
            console.log(`🔐 Authentication server started on http://localhost:${this.port}`);
            resolveServer();
          });
          this.server!.on('error', rejectServer);
        });

      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Handle authentication timeout
   */
  private handleTimeout(): void {
    console.log('⏱️  Authentication timed out');

    // Send timeout page to any open browser windows
    if (this.server) {
      // Note: In a real implementation, we'd track active connections
      // For now, we'll just emit the error
    }

    this.emit('error', new Error('Authentication timed out'));
  }

  /**
   * Get the authorization URL to open in browser
   */
  getAuthorizationUrl(): string {
    const redirectUri = `http://localhost:${this.port}${CALLBACK_PATH}`;
    const params = new URLSearchParams({
      redirect_uri: redirectUri,
      state: this.state,
    });

    return `${AUTH_BASE_URL}${AUTHORIZE_ENDPOINT}?${params.toString()}`;
  }

  /**
   * Clean up server resources
   */
  private cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }

    if (this.server) {
      this.server.close();
      this.server = undefined;
    }

    this.removeAllListeners();
  }

  /**
   * Stop the server
   */
  stop(): void {
    this.cleanup();
  }
}
