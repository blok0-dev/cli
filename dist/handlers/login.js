"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLogin = handleLogin;
exports.handleLogout = handleLogout;
const auth_1 = require("../auth");
/**
 * Handle login command
 */
async function handleLogin(token) {
    if (token) {
        // Save the provided token
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
    }
    else {
        // Show authentication instructions
        console.log('🔐 Blok0 Authentication');
        console.log('======================');
        console.log('');
        console.log('To authenticate with the Blok0 API, make a POST request to:');
        console.log('http://localhost:3000/api/customers/login');
        console.log('');
        console.log('Example using curl:');
        console.log('curl -X POST http://localhost:3000/api/customers/login \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{"email": "your-email@example.com", "password": "your-password"}\'');
        console.log('');
        console.log('Then copy the access token and run:');
        console.log('blok0 login --token <your-token>');
        console.log('');
        console.log('For CI/CD environments, set the BLOK0_TOKEN environment variable.');
    }
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
