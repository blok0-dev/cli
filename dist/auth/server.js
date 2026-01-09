"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServer = void 0;
const http = __importStar(require("http"));
const events_1 = require("events");
const crypto_1 = require("crypto");
const constants_1 = require("./constants");
class AuthServer extends events_1.EventEmitter {
    server;
    port;
    state;
    timeoutId;
    resolveCallback;
    rejectCallback;
    constructor(options = {}) {
        super();
        this.state = options.state || this.generateState();
    }
    /**
     * Generate a random state parameter for CSRF protection
     */
    generateState() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    /**
     * Find an available port in the configured range
     */
    async findAvailablePort() {
        const { min, max } = constants_1.PORT_RANGE;
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
    async isPortAvailable(port) {
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
    handleRequest = (req, res) => {
        try {
            const fullUrl = `http://localhost:${this.port}${req.url}`;
            const parsedUrl = new URL(fullUrl);
            const pathname = parsedUrl.pathname;
            // Handle callback endpoint
            if (pathname === constants_1.CALLBACK_PATH && req.method === 'GET') {
                this.handleCallback(parsedUrl, res);
                return;
            }
            // Handle any other request with a 404
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
        }
        catch (error) {
            console.error('Error parsing request URL:', error);
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Bad request');
        }
    };
    /**
     * Handle the OAuth callback
     */
    handleCallback(parsedUrl, res) {
        const searchParams = parsedUrl.searchParams;
        const state = searchParams.get('state');
        const token = searchParams.get('token');
        const error = searchParams.get('error');
        // Validate state parameter
        if (!state || state !== this.state) {
            console.error('State parameter mismatch - possible CSRF attack');
            console.error(`Expected: ${this.state}, Received: ${state}`);
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(constants_1.ERROR_HTML);
            this.emit('error', new Error('Invalid state parameter'));
            return;
        }
        // Handle error from authorization server
        if (error) {
            console.error('Authorization error:', error);
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(constants_1.ERROR_HTML);
            this.emit('error', new Error(`Authorization failed: ${error}`));
            return;
        }
        // Handle successful authorization
        if (token) {
            const authCallback = { token };
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(constants_1.SUCCESS_HTML);
            this.emit('success', authCallback);
            return;
        }
        // Handle missing token
        console.error('No token received in callback');
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(constants_1.ERROR_HTML);
        this.emit('error', new Error('No token received'));
    }
    /**
     * Initialize the server by finding an available port
     */
    async initialize() {
        if (!this.port) {
            this.port = await this.findAvailablePort();
        }
    }
    /**
     * Start the authentication server
     */
    async start() {
        return new Promise(async (resolve, reject) => {
            this.resolveCallback = resolve;
            this.rejectCallback = reject;
            try {
                // Initialize (find port) if not already done
                await this.initialize();
                // Create server
                this.server = http.createServer(this.handleRequest);
                // Set up event listeners
                this.on('success', (callback) => {
                    this.cleanup();
                    this.resolveCallback(callback);
                });
                this.on('error', (error) => {
                    this.cleanup();
                    this.rejectCallback(error);
                });
                // Set timeout
                this.timeoutId = setTimeout(() => {
                    this.handleTimeout();
                }, constants_1.DEFAULT_TIMEOUT);
                // Start server
                await new Promise((resolveServer, rejectServer) => {
                    this.server.listen(this.port, '127.0.0.1', () => {
                        console.log(`🔐 Authentication server started on http://localhost:${this.port}`);
                        resolveServer();
                    });
                    this.server.on('error', rejectServer);
                });
            }
            catch (error) {
                this.cleanup();
                reject(error);
            }
        });
    }
    /**
     * Handle authentication timeout
     */
    handleTimeout() {
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
    getAuthorizationUrl() {
        const redirectUri = `http://localhost:${this.port}${constants_1.CALLBACK_PATH}`;
        const params = new URLSearchParams({
            redirect_uri: redirectUri,
            state: this.state,
        });
        return `${constants_1.AUTH_BASE_URL}${constants_1.AUTHORIZE_ENDPOINT}?${params.toString()}`;
    }
    /**
     * Clean up server resources
     */
    cleanup() {
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
    stop() {
        this.cleanup();
    }
}
exports.AuthServer = AuthServer;
