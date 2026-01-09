import { isAuthenticated, clearCredentials, storeAccessToken, AuthCallback } from '../auth';
import { AuthServer } from '../auth/server';
import open from 'open';
import { withSpinner, log, showSection, EMOJIS } from '../ui';

// Add SIGINT handler for graceful cleanup
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Authentication cancelled by user.');
  process.exit(0);
});

/**
 * Handle login command
 */
export async function handleLogin(token?: string, manual?: boolean): Promise<void> {
  // Direct token authentication (CI/CD)
  if (token) {
    try {
      await withSpinner(
        'Saving authentication token',
        () => storeAccessToken(token),
        { emoji: EMOJIS.LOCK, successText: 'Successfully authenticated!' }
      );
      console.log('');
      log.info('You can now use blok0 commands that require authentication.');
    } catch (error) {
      log.error('Failed to save authentication token: ' + (error as Error).message);
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
  } catch (error) {
    console.error('❌ Browser authentication failed:', (error as Error).message);
    console.log('');
    console.log('💡 Try manual authentication:');
    console.log('   blok0 login --manual');
    process.exit(1);
  }
}

/**
 * Handle browser-based authentication flow
 */
async function handleBrowserLogin(): Promise<void> {
  showSection('🔐 Blok0 Authentication', EMOJIS.LOCK);

  // Create authentication server
  const authServer = new AuthServer();

  try {
    // Initialize server (find available port)
    await withSpinner(
      'Starting authentication server',
      () => authServer.initialize(),
      { emoji: EMOJIS.ROCKET }
    );

    // Get the authorization URL (now port is available)
    const authUrl = authServer.getAuthorizationUrl();

    log.info('Opening browser for authentication...');
    await open(authUrl);

    log.info('Please complete authentication in your browser.');
    log.plain('⏳ Waiting for authentication to complete...');

    // Start server and wait for callback
    const authCallback: AuthCallback = await authServer.start();

    // Store the token
    await withSpinner(
      'Saving authentication token',
      () => storeAccessToken(authCallback.token),
      { emoji: EMOJIS.LOCK, successText: 'Successfully authenticated!' }
    );

    console.log('');
    log.info('You can now use blok0 commands that require authentication.');

  } catch (error) {
    authServer.stop();
    throw error;
  }
}

/**
 * Show manual authentication instructions
 */
function showManualInstructions(): void {
  showSection('🔐 Blok0 Manual Authentication', EMOJIS.LOCK);
  console.log('To authenticate with the Blok0 API, make a POST request to:');
  console.log('https://www.blok0.xyz/api/customers/login');
  console.log('');
  log.info('Example using curl:');
  console.log('curl -X POST https://www.blok0.xyz/api/customers/login \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email": "your-email@example.com", "password": "your-password"}\'');
  console.log('');
  log.info('Then copy the access token and run:');
  console.log('blok0 login --token <your-token>');
  console.log('');
  log.info('For CI/CD environments, set the BLOK0_TOKEN environment variable.');
  console.log('');
  log.info('For browser-based login, run: blok0 login');
}

/**
 * Handle logout command
 */
export async function handleLogout(): Promise<void> {
  try {
    const wasAuthenticated = await withSpinner(
      'Checking authentication status',
      () => isAuthenticated()
    );

    if (!wasAuthenticated) {
      log.warning('You are not currently logged in.');
      return;
    }

    await withSpinner(
      'Clearing stored credentials',
      () => clearCredentials(),
      { emoji: EMOJIS.LOCK, successText: 'Successfully logged out and cleared stored credentials.' }
    );
  } catch (error) {
    log.error('Failed to logout: ' + (error as Error).message);
    process.exit(1);
  }
}
