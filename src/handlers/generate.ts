import { createInterface } from 'readline';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { withSpinner, log, showNextSteps, EMOJIS } from '../ui';

const execAsync = promisify(exec);

const repoUrl = 'https://github.com/blok0-payload/starter.git';

function prompt(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

export async function generateStarter(): Promise<void> {
  log.header('🚀 Setting up Blok0 starter project...');

  // Clone repository with spinner
  await withSpinner(
    'Cloning starter repository',
    async () => {
      await execAsync(`git clone --depth 1 ${repoUrl} .`);
    },
    {
      emoji: EMOJIS.DOWNLOAD,
      successText: 'Repository cloned successfully'
    }
  );

  // Prompt for git init
  const initGit = await prompt('Initialize git repository? (y/n): ');
  if (initGit) {
    await withSpinner(
      'Initializing git repository',
      async () => {
        await execAsync('git init');
      },
      {
        emoji: EMOJIS.GEAR,
        successText: 'Git repository initialized'
      }
    );
  }

  log.success('Starter project ready!');
  showNextSteps([
    'Run \'npm install\' or \'bun install\' to install dependencies',
    'Start developing your Blok0 x PayloadCMS project'
  ]);
}

