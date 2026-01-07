import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface BlockSource {
  url: string;
  id: number;
}

export interface BlockEntry {
  id: number;
  name: string;
  slug: string;
  dir: string;
  configPath: string;
  componentPath: string;
  source: BlockSource & {
    fetchedAt: string;
  };
  checksums: {
    [filename: string]: string;
  };
}

export interface RegistryData {
  version: string;
  blocks: {
    [slug: string]: BlockEntry;
  };
}

const REGISTRY_FILE = 'blok0-registry.json';
const REGISTRY_VERSION = '1.0';

/**
 * Get registry file path
 */
function getRegistryPath(): string {
  return path.join(process.cwd(), REGISTRY_FILE);
}

/**
 * Load registry from file
 */
export function loadRegistry(): RegistryData {
  const registryPath = getRegistryPath();

  if (!fs.existsSync(registryPath)) {
    return {
      version: REGISTRY_VERSION,
      blocks: {}
    };
  }

  try {
    const data = fs.readFileSync(registryPath, 'utf-8');
    const registry = JSON.parse(data);

    // Validate registry structure
    if (!registry.version || !registry.blocks) {
      throw new Error('Invalid registry structure');
    }

    return registry;
  } catch (error) {
    throw new Error(`Failed to load registry: ${(error as Error).message}`);
  }
}

/**
 * Save registry to file
 */
export function saveRegistry(registry: RegistryData): void {
  const registryPath = getRegistryPath();

  try {
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  } catch (error) {
    throw new Error(`Failed to save registry: ${(error as Error).message}`);
  }
}

/**
 * Check if block slug already exists in registry
 */
export function isBlockRegistered(slug: string): boolean {
  const registry = loadRegistry();
  return slug in registry.blocks;
}

/**
 * Get block entry by slug
 */
export function getBlockEntry(slug: string): BlockEntry | null {
  const registry = loadRegistry();
  return registry.blocks[slug] || null;
}

/**
 * Add block to registry
 */
export function addBlockToRegistry(entry: BlockEntry): void {
  const registry = loadRegistry();

  if (entry.slug in registry.blocks) {
    throw new Error(`Block with slug '${entry.slug}' is already registered`);
  }

  registry.blocks[entry.slug] = entry;
  saveRegistry(registry);
}

/**
 * Remove block from registry
 */
export function removeBlockFromRegistry(slug: string): void {
  const registry = loadRegistry();

  if (!(slug in registry.blocks)) {
    throw new Error(`Block with slug '${slug}' is not registered`);
  }

  delete registry.blocks[slug];
  saveRegistry(registry);
}

/**
 * Update block checksums
 */
export function updateBlockChecksums(slug: string, checksums: { [filename: string]: string }): void {
  const registry = loadRegistry();

  if (!(slug in registry.blocks)) {
    throw new Error(`Block with slug '${slug}' is not registered`);
  }

  registry.blocks[slug].checksums = checksums;
  saveRegistry(registry);
}

/**
 * Calculate file checksum
 */
export function calculateChecksum(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Calculate checksums for all files in a directory
 */
export function calculateDirectoryChecksums(dirPath: string): { [filename: string]: string } {
  const checksums: { [filename: string]: string } = {};

  function walkDirectory(dir: string): void {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDirectory(filePath);
      } else {
        const relativePath = path.relative(dirPath, filePath);
        checksums[relativePath] = calculateChecksum(filePath);
      }
    }
  }

  walkDirectory(dirPath);
  return checksums;
}

/**
 * Validate registry integrity
 */
export function validateRegistry(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const registry = loadRegistry();

    for (const [slug, entry] of Object.entries(registry.blocks)) {
      // Check if block directory exists
      if (!fs.existsSync(entry.dir)) {
        errors.push(`Block '${slug}': directory '${entry.dir}' does not exist`);
        continue;
      }

      // Check if config file exists
      if (!fs.existsSync(entry.configPath)) {
        errors.push(`Block '${slug}': config file '${entry.configPath}' does not exist`);
      }

      // Check if component file exists
      if (!fs.existsSync(entry.componentPath)) {
        errors.push(`Block '${slug}': component file '${entry.componentPath}' does not exist`);
      }

      // Validate checksums if they exist
      if (entry.checksums) {
        for (const [file, expectedChecksum] of Object.entries(entry.checksums)) {
          const filePath = path.join(entry.dir, file);
          if (fs.existsSync(filePath)) {
            const actualChecksum = calculateChecksum(filePath);
            if (actualChecksum !== expectedChecksum) {
              errors.push(`Block '${slug}': checksum mismatch for '${file}'`);
            }
          } else {
            errors.push(`Block '${slug}': file '${file}' referenced in checksums does not exist`);
          }
        }
      }
    }
  } catch (error) {
    errors.push(`Registry validation failed: ${(error as Error).message}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create empty registry for new projects
 */
export function createEmptyRegistry(): void {
  const registryPath = getRegistryPath();

  if (fs.existsSync(registryPath)) {
    throw new Error('Registry already exists');
  }

  const emptyRegistry: RegistryData = {
    version: REGISTRY_VERSION,
    blocks: {}
  };

  saveRegistry(emptyRegistry);
}