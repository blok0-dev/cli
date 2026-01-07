import { Command } from 'commander';
import { BlockFetcher } from '../blocks/blockFetcher';
import { BlockHydrator } from '../blocks/blockHydrator';
import { ASTManipulator } from '../blocks/astManipulator';
import { RegistryManager } from '../registry/registryManager';
import { SlugUtils } from '../utils/slugUtils';

export function createAddBlockCommand(): Command {
  const addCommand = new Command('add');

  addCommand
    .description('Add resources to your project')
    .addCommand(
      new Command('block')
        .description('Add a block from Blok0 registry')
        .argument('<url>', 'URL of the block definition')
        .option('--dry-run', 'Show what would be done without making changes')
        .action(async (url: string, options: { dryRun?: boolean }) => {
          try {
            console.log(`🔍 Fetching block definition from ${url}...`);

            // Fetch and validate block definition
            const definition = await BlockFetcher.fetchBlockDefinition(url);
            console.log(`✅ Found block: ${definition.name} (${definition.slug})`);

            // Check slug validity
            const { pascalCase, isValid } = SlugUtils.normalizeSlug(definition.slug);
            if (!isValid) {
              throw new Error(`Invalid slug "${definition.slug}" - cannot convert to valid identifier`);
            }

            console.log(`📦 Block will be installed as: ${pascalCase}`);

            // Check for existing block
            if (RegistryManager.hasBlock(definition.slug)) {
              throw new Error(`Block "${definition.slug}" already exists. Use update command instead.`);
            }

            if (options.dryRun) {
              console.log('🔍 Dry run mode - would download and install the following:');
              definition.codeFiles.forEach(file => {
                console.log(`  - ${file.sourceCode.name}`);
              });
              console.log(`  - Install location: src/blocks/${pascalCase}`);
              return;
            }

            console.log('⬇️ Downloading block files...');
            const files = await BlockFetcher.downloadBlockFiles(definition);
            console.log(`✅ Downloaded ${files.length} files`);

            console.log('🏗️ Installing block locally...');
            const hydratedBlock = await BlockHydrator.hydrateBlock(definition, files);
            console.log(`✅ Block installed to ${hydratedBlock.dir}`);

            console.log('🔧 Updating Payload configuration...');
            ASTManipulator.updatePayloadConfig(hydratedBlock);
            ASTManipulator.updateRenderBlocks(hydratedBlock);

            console.log('📝 Registering block...');
            RegistryManager.addBlock({
              slug: definition.slug,
              name: definition.name,
              id: definition.id,
              sourceUrl: url,
              dir: hydratedBlock.dir,
              configPath: hydratedBlock.configPath,
              componentPath: hydratedBlock.componentPath,
              files: files.map(f => f.name),
            });

            console.log('🎉 Block added successfully!');
            console.log(`   Name: ${definition.name}`);
            console.log(`   Slug: ${definition.slug}`);
            console.log(`   Location: ${hydratedBlock.dir}`);

          } catch (error) {
            console.error('❌ Failed to add block:', (error as Error).message);
            process.exit(1);
          }
        })
    );

  return addCommand;
}
