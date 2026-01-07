"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAddBlockCommand = createAddBlockCommand;
const commander_1 = require("commander");
const blockFetcher_1 = require("../blocks/blockFetcher");
const blockHydrator_1 = require("../blocks/blockHydrator");
const astManipulator_1 = require("../blocks/astManipulator");
const registryManager_1 = require("../registry/registryManager");
const slugUtils_1 = require("../utils/slugUtils");
function createAddBlockCommand() {
    const addCommand = new commander_1.Command('add');
    addCommand
        .description('Add resources to your project')
        .addCommand(new commander_1.Command('block')
        .description('Add a block from Blok0 registry')
        .argument('<url>', 'URL of the block definition')
        .option('--dry-run', 'Show what would be done without making changes')
        .action(async (url, options) => {
        try {
            console.log(`🔍 Fetching block definition from ${url}...`);
            // Fetch and validate block definition
            const definition = await blockFetcher_1.BlockFetcher.fetchBlockDefinition(url);
            console.log(`✅ Found block: ${definition.name} (${definition.slug})`);
            // Check slug validity
            const { pascalCase, isValid } = slugUtils_1.SlugUtils.normalizeSlug(definition.slug);
            if (!isValid) {
                throw new Error(`Invalid slug "${definition.slug}" - cannot convert to valid identifier`);
            }
            console.log(`📦 Block will be installed as: ${pascalCase}`);
            // Check for existing block
            if (registryManager_1.RegistryManager.hasBlock(definition.slug)) {
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
            const files = await blockFetcher_1.BlockFetcher.downloadBlockFiles(definition);
            console.log(`✅ Downloaded ${files.length} files`);
            console.log('🏗️ Installing block locally...');
            const hydratedBlock = await blockHydrator_1.BlockHydrator.hydrateBlock(definition, files);
            console.log(`✅ Block installed to ${hydratedBlock.dir}`);
            console.log('🔧 Updating Payload configuration...');
            astManipulator_1.ASTManipulator.updatePayloadConfig(hydratedBlock);
            astManipulator_1.ASTManipulator.updateRenderBlocks(hydratedBlock);
            console.log('📝 Registering block...');
            registryManager_1.RegistryManager.addBlock({
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
        }
        catch (error) {
            console.error('❌ Failed to add block:', error.message);
            process.exit(1);
        }
    }));
    return addCommand;
}
