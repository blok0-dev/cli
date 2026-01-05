"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStarter = generateStarter;
const readline_1 = require("readline");
const child_process_1 = require("child_process");
const util_1 = require("util");
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
    console.log('Cloning starter repository...');
    try {
        await execAsync(`git clone --depth 1 ${repoUrl} .`);
        console.log('Repository cloned successfully.');
    }
    catch (error) {
        throw new Error(`Failed to clone repository: ${error}`);
    }
    // Prompt for bun install
    const installDeps = await prompt('Run \'bun install\' to install dependencies? (y/n): ');
    if (installDeps) {
        console.log('Installing dependencies...');
        try {
            await new Promise((resolve, reject) => {
                const child = (0, child_process_1.spawn)('bun', ['install'], { stdio: 'inherit' });
                child.on('close', (code) => {
                    if (code === 0)
                        resolve();
                    else
                        reject(new Error('Failed to install dependencies'));
                });
                child.on('error', reject);
            });
        }
        catch (error) {
            console.error('Failed to install dependencies:', error);
        }
    }
    // Prompt for git init
    const initGit = await prompt('Initialize git repository? (y/n): ');
    if (initGit) {
        console.log('Initializing git repository...');
        try {
            await execAsync('git init');
            console.log('Git repository initialized.');
        }
        catch (error) {
            console.error('Failed to initialize git:', error);
        }
    }
    console.log('Blok0 starter project created successfully!');
}
