#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const login_1 = require("./commands/login");
const logout_1 = require("./commands/logout");
const whoami_1 = require("./commands/whoami");
const addBlock_1 = require("./commands/addBlock");
const program = new commander_1.Command();
program
    .name('blok0')
    .description('CLI tool for Payload CMS block management')
    .version('0.1.0');
// Add commands
program.addCommand((0, login_1.createLoginCommand)());
program.addCommand((0, logout_1.createLogoutCommand)());
program.addCommand((0, whoami_1.createWhoamiCommand)());
program.addCommand((0, addBlock_1.createAddBlockCommand)());
// Global error handling
program.exitOverride();
try {
    program.parse();
}
catch (error) {
    if (error.code === 'commander.help' || error.code === 'commander.version') {
        // Help/version commands are normal exits
        process.exit(0);
    }
    console.error(chalk_1.default.red('Error:'), error.message);
    process.exit(1);
}
