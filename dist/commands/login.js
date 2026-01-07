"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoginCommand = createLoginCommand;
const commander_1 = require("commander");
const authService_1 = require("../auth/authService");
function createLoginCommand() {
    const command = new commander_1.Command('login');
    command
        .description('Authenticate with Blok0')
        .option('--token', 'Use token authentication instead of email/password')
        .action(async (options) => {
        try {
            await authService_1.AuthService.login(options.token || false);
        }
        catch (error) {
            console.error('❌ Login failed:', error.message);
            process.exit(1);
        }
    });
    return command;
}
