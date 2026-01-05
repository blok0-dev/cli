#!/usr/bin/env bun

import { mkdirSync } from 'fs';
import { createInterface } from 'readline';
import { checkEmptyDirectory } from './detectors';
import { generateStarter } from './handlers/generate';

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
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
    mkdirSync(targetFolder, { recursive: true });
    process.chdir(targetFolder);
  }

  if (!checkEmptyDirectory()) {
    process.exit(1);
  }

  try {
    await generateStarter();
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
