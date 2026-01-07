import * as fs from 'fs';
import * as path from 'path';
import { BlockEntry } from '../registry';
import { CodeFile } from '../api';

/**
 * Convert slug to PascalCase identifier
 */
export function slugToIdentifier(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Convert slug to folder name (direct mapping)
 */
export function slugToFolderName(slug: string): string {
  return slug;
}

/**
 * Validate that a directory contains a valid block
 */
export function validateBlockDirectory(dirPath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!fs.existsSync(dirPath)) {
    errors.push('Block directory does not exist');
    return { valid: false, errors };
  }

  const configPath = path.join(dirPath, 'config.ts');
  if (!fs.existsSync(configPath)) {
    errors.push('config.ts file is missing');
  }

  // Check if config.ts exports a valid block configuration
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');

      // Basic validation - check for required exports
      if (!configContent.includes('export') || !configContent.includes('Block')) {
        errors.push('config.ts does not appear to export a valid block configuration');
      }
    } catch (error) {
      errors.push(`Failed to read config.ts: ${(error as Error).message}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create block directory structure and write files
 */
export function createBlockDirectory(
  baseDir: string,
  slug: string,
  files: CodeFile[]
): { dir: string; configPath: string; componentPath: string } {
  const blockDir = path.join(baseDir, slugToFolderName(slug));

  // Check if directory already exists
  if (fs.existsSync(blockDir)) {
    throw new Error(`Block directory already exists: ${blockDir}`);
  }

  // Create directory
  fs.mkdirSync(blockDir, { recursive: true });

  let configPath = '';
  let componentPath = '';

  // Write files
  for (const file of files) {
    const filePath = path.join(blockDir, file.name);
    fs.writeFileSync(filePath, file.content);

    if (file.name === 'config.ts') {
      configPath = filePath;
    } else if (file.name === 'Component.tsx') {
      componentPath = filePath;
    }
  }

  if (!configPath) {
    throw new Error('config.ts file was not found in downloaded files');
  }

  if (!componentPath) {
    throw new Error('Component.tsx file was not found in downloaded files');
  }

  return { dir: blockDir, configPath, componentPath };
}

/**
 * Remove block directory
 */
export function removeBlockDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Create block entry from metadata and file paths
 */
export function createBlockEntry(
  metadata: { id: number; name: string; slug: string; sourceUrl: string },
  dir: string,
  configPath: string,
  componentPath: string,
  checksums: { [filename: string]: string }
): BlockEntry {
  return {
    id: metadata.id,
    name: metadata.name,
    slug: metadata.slug,
    dir,
    configPath,
    componentPath,
    source: {
      url: metadata.sourceUrl,
      id: metadata.id,
      fetchedAt: new Date().toISOString()
    },
    checksums
  };
}

/**
 * Get all block directories in src/blocks
 */
export function getBlockDirectories(blocksDir: string = 'src/blocks'): string[] {
  const fullBlocksDir = path.join(process.cwd(), blocksDir);

  if (!fs.existsSync(fullBlocksDir)) {
    return [];
  }

  const entries = fs.readdirSync(fullBlocksDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(fullBlocksDir, entry.name));
}

/**
 * Find blocks by scanning filesystem (fallback when registry is unavailable)
 */
export function discoverBlocksFromFilesystem(): Array<{ slug: string; dir: string; hasConfig: boolean }> {
  const blocksDir = path.join(process.cwd(), 'src/blocks');

  if (!fs.existsSync(blocksDir)) {
    return [];
  }

  const blockDirs = getBlockDirectories();
  const blocks: Array<{ slug: string; dir: string; hasConfig: boolean }> = [];

  for (const dir of blockDirs) {
    const slug = path.basename(dir);
    const configPath = path.join(dir, 'config.ts');
    const hasConfig = fs.existsSync(configPath);

    blocks.push({ slug, dir, hasConfig });
  }

  return blocks;
}

/**
 * Ensure src/blocks directory exists
 */
export function ensureBlocksDirectory(): string {
  const blocksDir = path.join(process.cwd(), 'src/blocks');

  if (!fs.existsSync(blocksDir)) {
    fs.mkdirSync(blocksDir, { recursive: true });
  }

  return blocksDir;
}