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
import { withSpinner, log, showSection, showNextSteps, EMOJIS, ProgressBar } from '../ui';

/**
 * Handle add block command
 */
export async function handleAddBlock(blockUrl: string, options: { force?: boolean; dryRun?: boolean } = {}): Promise<void> {
  showSection('📦 Adding Blok0 Block', EMOJIS.PACKAGE);

  try {
    // Step 1: Authentication check
    const authenticated = await withSpinner(
      'Checking authentication',
      () => isAuthenticated(),
      { emoji: EMOJIS.LOCK }
    );

    if (!authenticated) {
      log.error('You are not logged in. Please run `blok0 login` first.');
      process.exit(1);
    }

    // Step 2: Fetch block data from API
    const { metadata, files } = await withSpinner(
      `Fetching block from ${blockUrl}`,
      () => apiClient.fetchBlockData(blockUrl),
      { emoji: EMOJIS.SEARCH }
    );

    log.success(`Found block: "${metadata.name}" (${metadata.slug})`);

    // Step 3: Check if block is already registered
    if (isBlockRegistered(metadata.slug)) {
      if (!options.force) {
        log.error(`Block "${metadata.slug}" is already installed. Use --force to reinstall.`);
        process.exit(1);
      }
      log.warning('Block already exists, reinstalling...');
    }

    if (options.dryRun) {
      log.info('Dry run mode - would perform the following actions:');
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
    const { dir, configPath, componentPath } = createBlockDirectory(blocksDir, metadata.slug, files);
    log.success(`Created block directory: ${path.relative(process.cwd(), dir)}`);

    // Step 6: Validate created block
    const validation = validateBlockDirectory(dir);
    if (!validation.valid) {
      log.error('Block validation failed:');
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
      await withSpinner(
        'Updating Pages collection',
        async () => {
          const blockIdentifier = slugToIdentifier(metadata.slug);
          const relativeConfigPath = `@/blocks/${metadata.slug}/config`;
          updatePageCollectionConfig(pagesCollectionPath, relativeConfigPath, blockIdentifier);
        },
        { emoji: EMOJIS.GEAR, successText: `Added ${slugToIdentifier(metadata.slug)} to Pages collection` }
      );
    } else {
      log.warning('Could not find Pages collection file. You may need to manually add the block to your collections.');
    }

    // Step 10: Update RenderBlocks component (AST manipulation)
    const renderBlocksPath = findRenderBlocksComponent();
    if (renderBlocksPath) {
      await withSpinner(
        'Updating RenderBlocks component',
        async () => {
          const relativeComponentPath = `./${metadata.slug}/Component`;
          updateRenderBlocksComponent(renderBlocksPath, metadata.slug, relativeComponentPath);
        },
        { emoji: EMOJIS.GEAR, successText: `Added ${metadata.slug} component to RenderBlocks` }
      );
    } else {
      log.warning('Could not find RenderBlocks component. You may need to manually add the block component.');
    }

    // Step 11: Register block in registry
    await withSpinner(
      'Registering block',
      async () => addBlockToRegistry(blockEntry),
      { emoji: EMOJIS.CHECK, successText: 'Block registered successfully' }
    );

    log.success('Block installation complete!');
    showNextSteps([
      `Review the installed files in src/blocks/${metadata.slug}`,
      'Test your application to ensure the block works correctly',
      'Commit the changes to your repository'
    ]);

  } catch (error) {
    console.error('❌ Failed to add block:', (error as Error).message);
    process.exit(1);
  }
}
