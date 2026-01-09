"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStarter = generateStarter;
const readline_1 = require("readline");
const child_process_1 = require("child_process");
const util_1 = require("util");
const ui_1 = require("../ui");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const repoUrl = 'https://github.com/blok0-payload/starter.git';
function prompt(question) {
    return new Promise((resolve) => {
        const rl = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase().startsWith('y'));
        });
    });
}
async function generateStarter() {
    ui_1.log.header('🚀 Setting up Blok0 starter project...');
    // Clone repository with spinner
    await (0, ui_1.withSpinner)('Cloning starter repository', async () => {
        await execAsync(`git clone --depth 1 ${repoUrl} .`);
    }, {
        emoji: ui_1.EMOJIS.DOWNLOAD,
        successText: 'Repository cloned successfully'
    });
    // Prompt for git init
    const initGit = await prompt('Initialize git repository? (y/n): ');
    if (initGit) {
        await (0, ui_1.withSpinner)('Initializing git repository', async () => {
            await execAsync('git init');
        }, {
            emoji: ui_1.EMOJIS.GEAR,
            successText: 'Git repository initialized'
        });
    }
    ui_1.log.success('Starter project ready!');
    (0, ui_1.showNextSteps)([
        'Run \'npm install\' or \'bun install\' to install dependencies',
        'Start developing your Blok0 x PayloadCMS project'
    ]);
}
