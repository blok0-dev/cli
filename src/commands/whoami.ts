import { Command } from 'commander';
import { AuthService } from '../auth/authService';

export function createWhoamiCommand(): Command {
  const command = new Command('whoami');

  command
    .description('Display current user information')
    .action(async () => {
      try {
        const user = await AuthService.whoami();
        if (user) {
          console.log(`👤 Logged in as: ${user.name || user.email} (${user.email})`);
        }
      } catch (error) {
        console.error('❌ Failed to get user info:', (error as Error).message);
        process.exit(1);
      }
    });

  return command;
}