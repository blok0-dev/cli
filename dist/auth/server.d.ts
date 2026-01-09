import { EventEmitter } from 'events';
import { AuthCallback, AuthServerOptions } from './index';
export declare class AuthServer extends EventEmitter {
    private server?;
    private port?;
    private state;
    private timeoutId?;
    private resolveCallback?;
    private rejectCallback?;
    constructor(options?: AuthServerOptions);
    /**
     * Generate a random state parameter for CSRF protection
     */
    private generateState;
    /**
     * Find an available port in the configured range
     */
    private findAvailablePort;
    /**
     * Check if a port is available
     */
    private isPortAvailable;
    /**
     * Handle incoming HTTP requests
     */
    private handleRequest;
    /**
     * Handle the OAuth callback
     */
    private handleCallback;
    /**
     * Initialize the server by finding an available port
     */
    initialize(): Promise<void>;
    /**
     * Start the authentication server
     */
    start(): Promise<AuthCallback>;
    /**
     * Handle authentication timeout
     */
    private handleTimeout;
    /**
     * Get the authorization URL to open in browser
     */
    getAuthorizationUrl(): string;
    /**
     * Clean up server resources
     */
    private cleanup;
    /**
     * Stop the server
     */
    stop(): void;
}
