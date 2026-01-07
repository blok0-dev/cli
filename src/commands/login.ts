import { Command } from 'commander';
import { AuthService } from '../auth/authService';

export function createLoginCommand(): Command {
  const command = new Command('login');

  command
    .description('Authenticate with Blok0')
    .option('--token', 'Use token authentication instead of email/password')
    .action(async (options: { token?: boolean }) => {
      try {
        await AuthService.login(options.token || false);
      } catch (error) {
        console.error('❌ Login failed:', (error as Error).message);
        process.exit(1);
      }
    });

  return command;
}
