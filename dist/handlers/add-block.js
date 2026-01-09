"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAddBlock = handleAddBlock;
const path = __importStar(require("path"));
const auth_1 = require("../auth");
const api_1 = require("../api");
const registry_1 = require("../registry");
const blocks_1 = require("../blocks");
const ast_1 = require("../ast");
const ui_1 = require("../ui");
/**
 * Handle add block command
 */
async function handleAddBlock(blockUrl, options = {}) {
    (0, ui_1.showSection)('📦 Adding Blok0 Block', ui_1.EMOJIS.PACKAGE);
    try {
        // Step 1: Authentication check
        const authenticated = await (0, ui_1.withSpinner)('Checking authentication', () => (0, auth_1.isAuthenticated)(), { emoji: ui_1.EMOJIS.LOCK });
        if (!authenticated) {
            ui_1.log.error('You are not logged in. Please run `blok0 login` first.');
            process.exit(1);
        }
        // Step 2: Fetch block data from API
        const { metadata, files } = await (0, ui_1.withSpinner)(`Fetching block from ${blockUrl}`, () => api_1.apiClient.fetchBlockData(blockUrl), { emoji: ui_1.EMOJIS.SEARCH });
        ui_1.log.success(`Found block: "${metadata.name}" (${metadata.slug})`);
        // Step 3: Check if block is already registered
        if ((0, registry_1.isBlockRegistered)(metadata.slug)) {
            if (!options.force) {
                ui_1.log.error(`Block "${metadata.slug}" is already installed. Use --force to reinstall.`);
                process.exit(1);
            }
            ui_1.log.warning('Block already exists, reinstalling...');
        }
        if (options.dryRun) {
            ui_1.log.info('Dry run mode - would perform the following actions:');
            console.log(`  - Create directory: src/blocks/${metadata.slug}`);
            console.log(`  - Download ${files.length} files`);
            console.log('  - Update Payload config');
            console.log('  - Update RenderBlocks component');
            console.log('  - Register block in blok0-registry.json');
            return;
        }
        // Step 4: Ensure blocks directory exists
        const blocksDir = (0, blocks_1.ensureBlocksDirectory)();
        // Step 5: Create block directory and files
        const { dir, configPath, componentPath } = (0, blocks_1.createBlockDirectory)(blocksDir, metadata.slug, files);
        ui_1.log.success(`Created block directory: ${path.relative(process.cwd(), dir)}`);
        // Step 6: Validate created block
        const validation = (0, blocks_1.validateBlockDirectory)(dir);
        if (!validation.valid) {
            ui_1.log.error('Block validation failed:');
            validation.errors.forEach(error => console.error(`  - ${error}`));
            // Cleanup on failure
            require('fs').rmSync(dir, { recursive: true, force: true });
            process.exit(1);
        }
        // Step 7: Calculate checksums
        const checksums = (0, registry_1.calculateDirectoryChecksums)(dir);
        // Step 8: Create registry entry
        const blockEntry = (0, blocks_1.createBlockEntry)({
            id: metadata.id,
            name: metadata.name,
            slug: metadata.slug,
            sourceUrl: blockUrl
        }, dir, configPath, componentPath, checksums);
        // Step 9: Update Pages collection (AST manipulation)
        const pagesCollectionPath = (0, ast_1.findPagesCollection)();
        if (pagesCollectionPath) {
            await (0, ui_1.withSpinner)('Updating Pages collection', async () => {
                const blockIdentifier = (0, blocks_1.slugToIdentifier)(metadata.slug);
                const relativeConfigPath = `@/blocks/${metadata.slug}/config`;
                (0, ast_1.updatePageCollectionConfig)(pagesCollectionPath, relativeConfigPath, blockIdentifier);
            }, { emoji: ui_1.EMOJIS.GEAR, successText: `Added ${(0, blocks_1.slugToIdentifier)(metadata.slug)} to Pages collection` });
        }
        else {
            ui_1.log.warning('Could not find Pages collection file. You may need to manually add the block to your collections.');
        }
        // Step 10: Update RenderBlocks component (AST manipulation)
        const renderBlocksPath = (0, ast_1.findRenderBlocksComponent)();
        if (renderBlocksPath) {
            await (0, ui_1.withSpinner)('Updating RenderBlocks component', async () => {
                const relativeComponentPath = `./${metadata.slug}/Component`;
                (0, ast_1.updateRenderBlocksComponent)(renderBlocksPath, metadata.slug, relativeComponentPath);
            }, { emoji: ui_1.EMOJIS.GEAR, successText: `Added ${metadata.slug} component to RenderBlocks` });
        }
        else {
            ui_1.log.warning('Could not find RenderBlocks component. You may need to manually add the block component.');
        }
        // Step 11: Register block in registry
        await (0, ui_1.withSpinner)('Registering block', async () => (0, registry_1.addBlockToRegistry)(blockEntry), { emoji: ui_1.EMOJIS.CHECK, successText: 'Block registered successfully' });
        ui_1.log.success('Block installation complete!');
        (0, ui_1.showNextSteps)([
            `Review the installed files in src/blocks/${metadata.slug}`,
            'Test your application to ensure the block works correctly',
            'Commit the changes to your repository'
        ]);
    }
    catch (error) {
        console.error('❌ Failed to add block:', error.message);
        process.exit(1);
    }
}
