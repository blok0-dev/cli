#!/usr/bin/env node

import { mkdirSync } from 'fs';
import { createInterface } from 'readline';
import { checkEmptyDirectory } from './detectors';
import { generateStarter } from './handlers/generate';
import { handleLogin, handleLogout } from './handlers/login';
import { handleAddBlock } from './handlers/add-block';
import { createEmptyRegistry } from './registry';

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
  login                    Authenticate with remote API
  logout                   Remove stored credentials
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

EXAMPLES:
  blok0 login
  blok0 generate starter my-project
  blok0 add block https://www.blok0.com/api/cli/sections/123

For more information, visit: https://github.com/blok0-payload/cli
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('../package.json');
    console.log(`blok0 v${pkg.version}`);
    process.exit(0);
  }

  const [command, ...restArgs] = args;

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
        // Check for --token flag
        const tokenIndex = restArgs.indexOf('--token');
        if (tokenIndex !== -1 && tokenIndex + 1 < restArgs.length) {
          const token = restArgs[tokenIndex + 1];
          await handleLogin(token);
        } else {
          await handleLogin();
        }
        break;

      case 'logout':
        await handleLogout();
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
          console.error('Error: Invalid subcommand. Use: blok0 add block <url>');
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

main();
