"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWhoamiCommand = createWhoamiCommand;
const commander_1 = require("commander");
const authService_1 = require("../auth/authService");
function createWhoamiCommand() {
    const command = new commander_1.Command('whoami');
    command
        .description('Display current user information')
        .action(async () => {
        try {
            const user = await authService_1.AuthService.whoami();
            if (user) {
                console.log(`👤 Logged in as: ${user.name || user.email} (${user.email})`);
            }
        }
        catch (error) {
            console.error('❌ Failed to get user info:', error.message);
            process.exit(1);
        }
    });
    return command;
}
