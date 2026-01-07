import { Command } from 'commander';
import { AuthService } from '../auth/authService';

export function createLogoutCommand(): Command {
  const command = new Command('logout');

  command
    .description('Sign out of Blok0')
    .action(async () => {
      try {
        await AuthService.logout();
      } catch (error) {
        console.error('❌ Logout failed:', (error as Error).message);
        process.exit(1);
      }
    });

  return command;
}