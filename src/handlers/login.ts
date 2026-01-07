import { isAuthenticated, clearCredentials, storeAccessToken } from '../auth';

/**
 * Handle login command
 */
export async function handleLogin(token?: string): Promise<void> {
  if (token) {
    // Save the provided token
    try {
      console.log('🔐 Saving authentication token...');
      await storeAccessToken(token);
      console.log('✅ Successfully authenticated!');
      console.log('');
      console.log('You can now use blok0 commands that require authentication.');
    } catch (error) {
      console.error('❌ Failed to save authentication token:', (error as Error).message);
      process.exit(1);
    }
  } else {
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
export async function handleLogout(): Promise<void> {
  try {
    const wasAuthenticated = await isAuthenticated();

    if (!wasAuthenticated) {
      console.log('You are not currently logged in.');
      return;
    }

    await clearCredentials();
    console.log('✅ Successfully logged out and cleared stored credentials.');
  } catch (error) {
    console.error('❌ Failed to logout:', (error as Error).message);
    process.exit(1);
  }
}