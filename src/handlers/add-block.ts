import * as path from 'path';
import { isAuthenticated } from '../auth';
import { apiClient } from '../api';
import { isBlockRegistered, addBlockToRegistry, calculateDirectoryChecksums } from '../registry';
import {
  ensureBlocksDirectory,
  createBlockDirectory,
  createBlockEntry,
  slugToIdentifier,
  validateBlockDirectory
} from '../blocks';
import { updatePageCollectionConfig, updateRenderBlocksComponent, findPagesCollection, findRenderBlocksComponent } from '../ast';

/**
 * Handle add block command
 */
export async function handleAddBlock(blockUrl: string, options: { force?: boolean; dryRun?: boolean } = {}): Promise<void> {
  console.log('📦 Adding Blok0 Block');
  console.log('====================');
  console.log('');

  try {
    // Step 1: Authentication check
    console.log('🔐 Checking authentication...');
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      console.error('❌ You are not logged in. Please run `blok0 login` first.');
      process.exit(1);
    }

    // Step 2: Fetch block data from API
    console.log(`📡 Fetching block from: ${blockUrl}`);
    const { metadata, files } = await apiClient.fetchBlockData(blockUrl);
    console.log(`✅ Found block: "${metadata.name}" (${metadata.slug})`);

    // Step 3: Check if block is already registered
    if (isBlockRegistered(metadata.slug)) {
      if (!options.force) {
        console.error(`❌ Block "${metadata.slug}" is already installed. Use --force to reinstall.`);
        process.exit(1);
      }
      console.log('⚠️  Block already exists, reinstalling...');
    }

    if (options.dryRun) {
      console.log('🔍 Dry run mode - would perform the following actions:');
      console.log(`  - Create directory: src/blocks/${metadata.slug}`);
      console.log(`  - Download ${files.length} files`);
      console.log('  - Update Payload config');
      console.log('  - Update RenderBlocks component');
      console.log('  - Register block in blok0-registry.json');
      return;
    }

    // Step 4: Ensure blocks directory exists
    const blocksDir = ensureBlocksDirectory();

    // Step 5: Create block directory and files
    console.log('📁 Creating block directory and files...');
    const { dir, configPath, componentPath } = createBlockDirectory(blocksDir, metadata.slug, files);
    console.log(`✅ Created block directory: ${path.relative(process.cwd(), dir)}`);

    // Step 6: Validate created block
    const validation = validateBlockDirectory(dir);
    if (!validation.valid) {
      console.error('❌ Block validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      // Cleanup on failure
      require('fs').rmSync(dir, { recursive: true, force: true });
      process.exit(1);
    }

    // Step 7: Calculate checksums
    const checksums = calculateDirectoryChecksums(dir);

    // Step 8: Create registry entry
    const blockEntry = createBlockEntry(
      {
        id: metadata.id,
        name: metadata.name,
        slug: metadata.slug,
        sourceUrl: blockUrl
      },
      dir,
      configPath,
      componentPath,
      checksums
    );

    // Step 9: Update Pages collection (AST manipulation)
    const pagesCollectionPath = findPagesCollection();
    if (pagesCollectionPath) {
      console.log('🔧 Updating Pages collection...');
      const blockIdentifier = slugToIdentifier(metadata.slug);
      const relativeConfigPath = `@/blocks/${metadata.slug}/config`;

      updatePageCollectionConfig(pagesCollectionPath, relativeConfigPath, blockIdentifier);
      console.log(`✅ Added ${blockIdentifier} to Pages collection`);
    } else {
      console.warn('⚠️  Could not find Pages collection file. You may need to manually add the block to your collections.');
    }

    // Step 10: Update RenderBlocks component (AST manipulation)
    const renderBlocksPath = findRenderBlocksComponent();
    if (renderBlocksPath) {
      console.log('🔧 Updating RenderBlocks component...');
      const relativeComponentPath = `./${metadata.slug}/Component`;

      updateRenderBlocksComponent(renderBlocksPath, metadata.slug, relativeComponentPath);
      console.log(`✅ Added ${metadata.slug} component to RenderBlocks`);
    } else {
      console.warn('⚠️  Could not find RenderBlocks component. You may need to manually add the block component.');
    }

    // Step 11: Register block in registry
    console.log('📝 Registering block...');
    addBlockToRegistry(blockEntry);
    console.log('✅ Block registered successfully');

    console.log('');
    console.log('🎉 Block installation complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the installed files in src/blocks/' + metadata.slug);
    console.log('2. Test your application to ensure the block works correctly');
    console.log('3. Commit the changes to your repository');

  } catch (error) {
    console.error('❌ Failed to add block:', (error as Error).message);
    process.exit(1);
  }
}