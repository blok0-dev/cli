#!/usr/bin/env node

import { mkdirSync } from 'fs';
import { createInterface } from 'readline';
import { checkEmptyDirectory } from './detectors';
import { generateStarter } from './handlers/generate';
import { handleLogin, handleLogout } from './handlers/login';
import { handleAddBlock } from './handlers/add-block';
import { createEmptyRegistry } from './registry';
import { setUIFlags } from './ui';

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function showHelp() {
  console.log(`
Blok0 - PayloadCMS Block Management CLI

USAGE:
  blok0 <command> [subcommand] [options]

COMMANDS:
  login                    Authenticate via browser or token
  logout                   Remove stored credentials
  debug                    Show authentication debug info
  generate starter [folder] Generate PayloadCMS starter project
  add block <url>          Add a block from remote API
  update block <id>        Update existing block (future)
  remove block <id>        Remove block and clean up (future)
  registry validate        Validate registry integrity (future)

OPTIONS:
  --help, -h               Show this help message
  --version, -v            Show version information
  --verbose                Enable verbose logging
  --dry-run                Preview changes without applying them
  --no-animation           Disable animations and spinners
  --no-emoji               Disable emoji in output
  --ci                     Optimize for CI environments (implies --no-animation and --no-emoji)

EXAMPLES:
  blok0 login
  blok0 generate starter my-project
  blok0 add block https://www.blok0.com/api/cli/sections/123

For more information, visit: https://github.com/blok0-payload/cli
`);
}

async function main() {
  const args = process.argv.slice(2);

  // Parse global UI flags
  const noAnimation = args.includes('--no-animation');
  const noEmoji = args.includes('--no-emoji');
  const ciMode = args.includes('--ci');

  setUIFlags({ noAnimation, noEmoji, ci: ciMode });

  // Filter out global flags from args
  const filteredArgs = args.filter(arg =>
    !['--no-animation', '--no-emoji', '--ci'].includes(arg)
  );

  if (filteredArgs.length === 0 || filteredArgs.includes('--help') || filteredArgs.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (filteredArgs.includes('--version') || filteredArgs.includes('-v')) {
    const pkg = require('../package.json');
    console.log(`blok0 v${pkg.version}`);
    process.exit(0);
  }

  const [command, ...restArgs] = filteredArgs;

  try {
    switch (command) {
      case 'generate':
        const [genSubcommand, ...genRestArgs] = restArgs;
        if (genSubcommand === 'starter') {
          await handleGenerateStarter(genRestArgs);
        } else {
          console.error('Error: Invalid subcommand. Use: blok0 generate starter [folder]');
          process.exit(1);
        }
        break;

      case 'login':
        // Check for flags
        const tokenIndex = restArgs.indexOf('--token');
        const manualIndex = restArgs.indexOf('--manual');

        if (tokenIndex !== -1 && tokenIndex + 1 < restArgs.length) {
          const token = restArgs[tokenIndex + 1];
          await handleLogin(token);
        } else if (manualIndex !== -1) {
          await handleLogin(undefined, true);
        } else {
          await handleLogin();
        }
        break;

      case 'logout':
        await handleLogout();
        break;

      case 'debug':
        await handleDebug();
        break;

      case 'add':
        const [addSubcommand, ...addRestArgs] = restArgs;
        if (addSubcommand === 'block') {
          const blockUrl = `https://www.blok0.com/api/cli/sections/${addRestArgs[0]}`;
          if (!blockUrl) {
            console.error('Error: Block Slug is required. Use: blok0 add block <slug>');
            process.exit(1);
          }
          const options = {
            force: addRestArgs.includes('--force'),
            dryRun: addRestArgs.includes('--dry-run')
          };
          await handleAddBlock(blockUrl, options);
        } else {
          console.error('Error: Invalid subcommand. Use: blok0 add block <slug>');
          process.exit(1);
        }
        break;

      case 'update':
      case 'remove':
      case 'registry':
        console.log(`${command} functionality coming soon...`);
        break;

      default:
        console.error(`Error: Unknown command '${command}'`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function handleGenerateStarter(args: string[]) {
  let targetFolder = args[0];
  if (!targetFolder) {
    targetFolder = await prompt('Enter project folder name: ');
  }

  if (targetFolder !== '.') {
    mkdirSync(targetFolder, { recursive: true });
    process.chdir(targetFolder);
  }

  if (!checkEmptyDirectory()) {
    process.exit(1);
  }

  await generateStarter();

  // Initialize empty registry for the new project
  try {
    createEmptyRegistry();
    console.log('📝 Initialized blok0-registry.json');
  } catch (error) {
    console.warn('⚠️  Failed to initialize registry:', (error as Error).message);
  }
}

async function handleDebug() {
  const { showSection, log, withSpinner, EMOJIS } = await import('./ui');

  showSection('🔍 Blok0 CLI Debug Information', EMOJIS.SEARCH);

  // Check stored token
  const { getAccessToken, isAuthenticated } = await import('./auth');
  const token = await getAccessToken();
  const isAuth = await isAuthenticated();

  log.header('🔐 Authentication Status:');
  console.log(`  Authenticated: ${isAuth ? '✅ Yes' : '❌ No'}`);
  console.log(`  Token Stored: ${token ? '✅ Yes' : '❌ No'}`);

  if (token) {
    console.log(`  Token Preview: ${token.substring(0, 20)}...`);
    console.log(`  Authorization Header: Bearer ${token}`);
  }

  log.header('🌐 API Configuration:');
  console.log('  Base URL: https://www.blok0.xyz');
  console.log('  User Agent: blok0-cli/1.0.0');

  log.header('🧪 Test API Connection:');

  // Test API connection
  const { apiClient } = await import('./api');
  try {
    const connectionTest = await withSpinner(
      'Testing API connection',
      () => apiClient.testConnection()
    );
    console.log(`  Connection Test: ${connectionTest ? '✅ Passed' : '❌ Failed'}`);
  } catch (error) {
    console.log(`  Connection Test: ❌ Failed - ${(error as Error).message}`);
  }

  log.header('💡 Next Steps:');
  console.log('  1. If no token, run: blok0 login');
  console.log('  2. Test API with: blok0 add block <url>');
  console.log('  3. Check server logs for detailed request info');
}

main();
