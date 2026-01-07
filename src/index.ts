#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createLoginCommand } from './commands/login';
import { createLogoutCommand } from './commands/logout';
import { createWhoamiCommand } from './commands/whoami';
import { createAddBlockCommand } from './commands/addBlock';

const program = new Command();

program
  .name('blok0')
  .description('CLI tool for Payload CMS block management')
  .version('0.1.0');

// Add commands
program.addCommand(createLoginCommand());
program.addCommand(createLogoutCommand());
program.addCommand(createWhoamiCommand());
program.addCommand(createAddBlockCommand());

// Global error handling
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === 'commander.help' || error.code === 'commander.version') {
    // Help/version commands are normal exits
    process.exit(0);
  }

  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
}
