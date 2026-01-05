import { existsSync } from 'fs';
import { join } from 'path';

export function checkEmptyDirectory(): boolean {
  const cwd = process.cwd();

  const pkgPath = join(cwd, 'package.json');
  const configJs = join(cwd, 'payload.config.js');
  const configTs = join(cwd, 'payload.config.ts');

  if (existsSync(pkgPath)) {
    console.error('Error: package.json already exists. Please run in an empty directory.');
    return false;
  }

  if (existsSync(configJs) || existsSync(configTs)) {
    console.error('Error: Payload config file already exists. Please run in an empty directory.');
    return false;
  }

  return true;
}
