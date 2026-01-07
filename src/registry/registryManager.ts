import * as fs from 'fs';
import * as path from 'path';
import { Blok0Registry, RegistryEntry } from '../blocks/types';

const REGISTRY_FILE = 'blok0-registry.json';

export class RegistryManager {
  private static registryPath = path.join(process.cwd(), REGISTRY_FILE);

  static loadRegistry(): Blok0Registry {
    if (!fs.existsSync(this.registryPath)) {
      return { version: '1.0', blocks: [] };
    }

    try {
      const data = fs.readFileSync(this.registryPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse registry file, creating new one');
      return { version: '1.0', blocks: [] };
    }
  }

  static saveRegistry(registry: Blok0Registry): void {
    const data = JSON.stringify(registry, null, 2);
    fs.writeFileSync(this.registryPath, data, 'utf8');
  }

  static addBlock(entry: Omit<RegistryEntry, 'addedAt' | 'addedBy'>): void {
    const registry = this.loadRegistry();
    const existingIndex = registry.blocks.findIndex(b => b.slug === entry.slug);

    const newEntry: RegistryEntry = {
      ...entry,
      addedAt: new Date().toISOString(),
      addedBy: this.getCurrentUser()
    };

    if (existingIndex >= 0) {
      registry.blocks[existingIndex] = newEntry;
    } else {
      registry.blocks.push(newEntry);
    }

    this.saveRegistry(registry);
  }

  static removeBlock(slug: string): boolean {
    const registry = this.loadRegistry();
    const initialLength = registry.blocks.length;
    registry.blocks = registry.blocks.filter(b => b.slug !== slug);

    if (registry.blocks.length < initialLength) {
      this.saveRegistry(registry);
      return true;
    }

    return false;
  }

  static getBlock(slug: string): RegistryEntry | undefined {
    const registry = this.loadRegistry();
    return registry.blocks.find(b => b.slug === slug);
  }

  static listBlocks(): RegistryEntry[] {
    const registry = this.loadRegistry();
    return registry.blocks;
  }

  static hasBlock(slug: string): boolean {
    return this.getBlock(slug) !== undefined;
  }

  static validateRegistry(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const registry = this.loadRegistry();

    // Check for duplicate slugs
    const slugs = new Set<string>();
    for (const block of registry.blocks) {
      if (slugs.has(block.slug)) {
        errors.push(`Duplicate slug found: ${block.slug}`);
      }
      slugs.add(block.slug);

      // Check if files exist
      if (!fs.existsSync(block.configPath)) {
        errors.push(`Config file missing: ${block.configPath}`);
      }
      if (!fs.existsSync(block.componentPath)) {
        errors.push(`Component file missing: ${block.componentPath}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private static getCurrentUser(): string {
    // In a real implementation, this would get the user from auth
    return process.env.USER || process.env.USERNAME || 'unknown';
  }
}