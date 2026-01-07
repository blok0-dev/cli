import * as fs from 'fs';
import * as path from 'path';
import { BlockDefinition, DownloadedBlockFile, HydratedBlock } from './types';
import { SlugUtils } from '../utils/slugUtils';
import { RegistryManager } from '../registry/registryManager';

export class BlockHydrator {
  static async hydrateBlock(
    definition: BlockDefinition,
    files: DownloadedBlockFile[]
  ): Promise<HydratedBlock> {
    const { pascalCase, isValid } = SlugUtils.normalizeSlug(definition.slug);

    if (!isValid) {
      throw new Error(`Invalid slug "${definition.slug}" - cannot convert to valid identifier`);
    }

    // Check for conflicts
    if (RegistryManager.hasBlock(definition.slug)) {
      throw new Error(`Block "${definition.slug}" already exists. Use update command instead.`);
    }

    const blockDir = path.join(process.cwd(), 'src', 'blocks', pascalCase);

    // Create directory
    fs.mkdirSync(blockDir, { recursive: true });

    // Write files
    for (const file of files) {
      const filePath = path.join(blockDir, file.name);
      fs.writeFileSync(filePath, file.content, 'utf8');
    }

    // Validate the config file
    await this.validateBlockConfig(definition, blockDir);

    const configPath = path.join(blockDir, 'config.ts');
    const componentPath = path.join(blockDir, 'Component.tsx');

    return {
      definition,
      files,
      dir: blockDir,
      configPath,
      componentPath,
    };
  }

  private static async validateBlockConfig(
    definition: BlockDefinition,
    blockDir: string
  ): Promise<void> {
    const configPath = path.join(blockDir, 'config.ts');

    if (!fs.existsSync(configPath)) {
      throw new Error('config.ts file was not created');
    }

    // Basic validation - check if it exports a default
    const configContent = fs.readFileSync(configPath, 'utf8');

    // Simple checks - in a real implementation, you'd use ts-morph for proper AST validation
    if (!configContent.includes('export default')) {
      throw new Error('config.ts must export a default block configuration');
    }

    if (!configContent.includes('slug:')) {
      throw new Error('config.ts must define a slug property');
    }

    // Check that the slug matches
    if (!configContent.includes(`slug: '${definition.slug}'`)) {
      console.warn(`Warning: config.ts slug does not match expected "${definition.slug}"`);
    }
  }

  static removeBlock(slug: string): boolean {
    const entry = RegistryManager.getBlock(slug);
    if (!entry) {
      return false;
    }

    // Remove files
    if (fs.existsSync(entry.dir)) {
      fs.rmSync(entry.dir, { recursive: true, force: true });
    }

    // Remove from registry
    return RegistryManager.removeBlock(slug);
  }
}