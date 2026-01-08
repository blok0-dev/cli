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
            console.log('🔐 Saving authentication token...');
            await (0, auth_1.storeAccessToken)(token);
            console.log('✅ Successfully authenticated!');
            console.log('');
            console.log('You can now use blok0 commands that require authentication.');
        }
        catch (error) {
            console.error('❌ Failed to save authentication token:', error.message);
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
    console.log('🔐 Blok0 Authentication');
    console.log('======================');
    console.log('');
    // Create authentication server
    const authServer = new server_1.AuthServer();
    try {
        // Initialize server (find available port)
        console.log('🚀 Starting authentication server...');
        await authServer.initialize();
        // Get the authorization URL (now port is available)
        const authUrl = authServer.getAuthorizationUrl();
        console.log('🌐 Opening browser for authentication...');
        await (0, open_1.default)(authUrl);
        console.log('📱 Please complete authentication in your browser.');
        console.log('⏳ Waiting for authentication to complete...');
        // Start server and wait for callback
        const authCallback = await authServer.start();
        // Store the token
        console.log('🔐 Saving authentication token...');
        await (0, auth_1.storeAccessToken)(authCallback.token);
        console.log('✅ Successfully authenticated!');
        console.log('');
        console.log('You can now use blok0 commands that require authentication.');
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
    console.log('🔐 Blok0 Manual Authentication');
    console.log('==============================');
    console.log('');
    console.log('To authenticate with the Blok0 API, make a POST request to:');
    console.log('https://www.blok0.xyz/api/customers/login');
    console.log('');
    console.log('Example using curl:');
    console.log('curl -X POST https://www.blok0.xyz/api/customers/login \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email": "your-email@example.com", "password": "your-password"}\'');
    console.log('');
    console.log('Then copy the access token and run:');
    console.log('blok0 login --token <your-token>');
    console.log('');
    console.log('For CI/CD environments, set the BLOK0_TOKEN environment variable.');
    console.log('');
    console.log('💡 For browser-based login, run: blok0 login');
}
/**
 * Handle logout command
 */
async function handleLogout() {
    try {
        const wasAuthenticated = await (0, auth_1.isAuthenticated)();
        if (!wasAuthenticated) {
            console.log('You are not currently logged in.');
            return;
        }
        await (0, auth_1.clearCredentials)();
        console.log('✅ Successfully logged out and cleared stored credentials.');
    }
    catch (error) {
        console.error('❌ Failed to logout:', error.message);
        process.exit(1);
    }
}
