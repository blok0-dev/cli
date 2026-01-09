"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLogin = handleLogin;
exports.handleLogout = handleLogout;
const auth_1 = require("../auth");
const server_1 = require("../auth/server");
const open_1 = __importDefault(require("open"));
const ui_1 = require("../ui");
// Add SIGINT handler for graceful cleanup
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Authentication cancelled by user.');
    process.exit(0);
});
/**
 * Handle login command
 */
async function handleLogin(token, manual) {
    // Direct token authentication (CI/CD)
    if (token) {
        try {
            await (0, ui_1.withSpinner)('Saving authentication token', () => (0, auth_1.storeAccessToken)(token), { emoji: ui_1.EMOJIS.LOCK, successText: 'Successfully authenticated!' });
            console.log('');
            ui_1.log.info('You can now use blok0 commands that require authentication.');
        }
        catch (error) {
            ui_1.log.error('Failed to save authentication token: ' + error.message);
            process.exit(1);
        }
        return;
    }
    // Manual authentication instructions
    if (manual) {
        showManualInstructions();
        return;
    }
    // Default: Browser-based authentication
    try {
        await handleBrowserLogin();
    }
    catch (error) {
        console.error('❌ Browser authentication failed:', error.message);
        console.log('');
        console.log('💡 Try manual authentication:');
        console.log('   blok0 login --manual');
        process.exit(1);
    }
}
/**
 * Handle browser-based authentication flow
 */
async function handleBrowserLogin() {
    (0, ui_1.showSection)('🔐 Blok0 Authentication', ui_1.EMOJIS.LOCK);
    // Create authentication server
    const authServer = new server_1.AuthServer();
    try {
        // Initialize server (find available port)
        await (0, ui_1.withSpinner)('Starting authentication server', () => authServer.initialize(), { emoji: ui_1.EMOJIS.ROCKET });
        // Get the authorization URL (now port is available)
        const authUrl = authServer.getAuthorizationUrl();
        ui_1.log.info('Opening browser for authentication...');
        await (0, open_1.default)(authUrl);
        ui_1.log.info('Please complete authentication in your browser.');
        ui_1.log.plain('⏳ Waiting for authentication to complete...');
        // Start server and wait for callback
        const authCallback = await authServer.start();
        // Store the token
        await (0, ui_1.withSpinner)('Saving authentication token', () => (0, auth_1.storeAccessToken)(authCallback.token), { emoji: ui_1.EMOJIS.LOCK, successText: 'Successfully authenticated!' });
        console.log('');
        ui_1.log.info('You can now use blok0 commands that require authentication.');
    }
    catch (error) {
        authServer.stop();
        throw error;
    }
}
/**
 * Show manual authentication instructions
 */
function showManualInstructions() {
    (0, ui_1.showSection)('🔐 Blok0 Manual Authentication', ui_1.EMOJIS.LOCK);
    console.log('To authenticate with the Blok0 API, make a POST request to:');
    console.log('https://www.blok0.xyz/api/customers/login');
    console.log('');
    ui_1.log.info('Example using curl:');
    console.log('curl -X POST https://www.blok0.xyz/api/customers/login \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email": "your-email@example.com", "password": "your-password"}\'');
    console.log('');
    ui_1.log.info('Then copy the access token and run:');
    console.log('blok0 login --token <your-token>');
    console.log('');
    ui_1.log.info('For CI/CD environments, set the BLOK0_TOKEN environment variable.');
    console.log('');
    ui_1.log.info('For browser-based login, run: blok0 login');
}
/**
 * Handle logout command
 */
async function handleLogout() {
    try {
        const wasAuthenticated = await (0, ui_1.withSpinner)('Checking authentication status', () => (0, auth_1.isAuthenticated)());
        if (!wasAuthenticated) {
            ui_1.log.warning('You are not currently logged in.');
            return;
        }
        await (0, ui_1.withSpinner)('Clearing stored credentials', () => (0, auth_1.clearCredentials)(), { emoji: ui_1.EMOJIS.LOCK, successText: 'Successfully logged out and cleared stored credentials.' });
    }
    catch (error) {
        ui_1.log.error('Failed to logout: ' + error.message);
        process.exit(1);
    }
}
