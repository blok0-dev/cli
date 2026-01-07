"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogoutCommand = createLogoutCommand;
const commander_1 = require("commander");
const authService_1 = require("../auth/authService");
function createLogoutCommand() {
    const command = new commander_1.Command('logout');
    command
        .description('Sign out of Blok0')
        .action(async () => {
        try {
            await authService_1.AuthService.logout();
        }
        catch (error) {
            console.error('❌ Logout failed:', error.message);
            process.exit(1);
        }
    });
    return command;
}
