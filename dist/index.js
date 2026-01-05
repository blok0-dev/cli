#!/usr/bin/env bun
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const readline_1 = require("readline");
const detectors_1 = require("./detectors");
const generate_1 = require("./handlers/generate");
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
async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2 || args[0] !== 'generate' || args[1] !== 'starter') {
        console.error('Error: Invalid command. Supported: generate starter [folder]');
        process.exit(1);
    }
    let targetFolder = args[2];
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
    try {
        await (0, generate_1.generateStarter)();
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}
main();
