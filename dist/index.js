#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const readline_1 = require("readline");
const detectors_1 = require("./detectors");
const generate_1 = require("./handlers/generate");
const login_1 = require("./handlers/login");
const add_block_1 = require("./handlers/add-block");
const registry_1 = require("./registry");
function prompt(question) {
    return new Promise((resolve) => {
        const rl = (0, readline_1.createInterface)({
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
  blok0 add block https://api.example.com/blocks/123

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
                }
                else {
                    console.error('Error: Invalid subcommand. Use: blok0 generate starter [folder]');
                    process.exit(1);
                }
                break;
            case 'login':
                // Check for --token flag
                const tokenIndex = restArgs.indexOf('--token');
                if (tokenIndex !== -1 && tokenIndex + 1 < restArgs.length) {
                    const token = restArgs[tokenIndex + 1];
                    await (0, login_1.handleLogin)(token);
                }
                else {
                    await (0, login_1.handleLogin)();
                }
                break;
            case 'logout':
                await (0, login_1.handleLogout)();
                break;
            case 'add':
                const [addSubcommand, ...addRestArgs] = restArgs;
                if (addSubcommand === 'block') {
                    const blockUrl = addRestArgs[0];
                    if (!blockUrl) {
                        console.error('Error: Block URL is required. Use: blok0 add block <url>');
                        process.exit(1);
                    }
                    const options = {
                        force: addRestArgs.includes('--force'),
                        dryRun: addRestArgs.includes('--dry-run')
                    };
                    await (0, add_block_1.handleAddBlock)(blockUrl, options);
                }
                else {
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
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}
async function handleGenerateStarter(args) {
    let targetFolder = args[0];
    if (!targetFolder) {
        targetFolder = await prompt('Enter project folder name: ');
    }
    if (targetFolder !== '.') {
        (0, fs_1.mkdirSync)(targetFolder, { recursive: true });
        process.chdir(targetFolder);
    }
    if (!(0, detectors_1.checkEmptyDirectory)()) {
        process.exit(1);
    }
    await (0, generate_1.generateStarter)();
    // Initialize empty registry for the new project
    try {
        (0, registry_1.createEmptyRegistry)();
        console.log('📝 Initialized blok0-registry.json');
    }
    catch (error) {
        console.warn('⚠️  Failed to initialize registry:', error.message);
    }
}
main();
