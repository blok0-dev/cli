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
exports.handleRemoveBlock = handleRemoveBlock;
const path = __importStar(require("path"));
const registry_1 = require("../registry");
const blocks_1 = require("../blocks");
const ast_1 = require("../ast");
/**
 * Handle remove block command
 */
async function handleRemoveBlock(blockId, options = {}) {
    console.log('🗑️  Removing Blok0 Block');
    console.log('=======================');
    console.log('');
    try {
        // Step 1: Check if block exists in registry
        // The "blockId" from user input could be a slug or an ID.
        // Ideally we support slug as it's more human readable.
        // Let's assume input is slug for now as "add block <url>" produces a slug.
        const slug = blockId;
        const entry = (0, registry_1.getBlockEntry)(slug);
        if (!entry) {
            console.error(`❌ Block "${slug}" is not found in the registry.`);
            console.log('   Run `cat blok0-registry.json` to see installed blocks.');
            process.exit(1);
        }
        console.log(`🔍 Found block: "${entry.name}" (${entry.slug})`);
        if (options.dryRun) {
            console.log('🔍 Dry run mode - would perform the following actions:');
            console.log(`  - Remove directory: ${entry.dir}`);
            console.log('  - Remove from Pages collection config');
            console.log('  - Remove from RenderBlocks component');
            console.log('  - Unregister from blok0-registry.json');
            return;
        }
        // Step 2: Remove block directory
        console.log('deleted Block directory...');
        (0, blocks_1.removeBlockDirectory)(entry.dir);
        console.log(`✅ Removed directory: ${path.relative(process.cwd(), entry.dir)}`);
        // Step 3: Update Pages collection (AST manipulation)
        const pagesCollectionPath = (0, ast_1.findPagesCollection)();
        if (pagesCollectionPath) {
            console.log('🔧 Updating Pages collection...');
            const blockIdentifier = (0, blocks_1.slugToIdentifier)(entry.slug);
            try {
                (0, ast_1.removePageCollectionConfig)(pagesCollectionPath, blockIdentifier);
                console.log(`✅ Removed ${blockIdentifier} from Pages collection`);
            }
            catch (error) {
                console.warn(`⚠️  Failed to update Pages collection: ${error.message}`);
            }
        }
        else {
            console.warn('⚠️  Could not find Pages collection file.');
        }
        // Step 4: Update RenderBlocks component (AST manipulation)
        const renderBlocksPath = (0, ast_1.findRenderBlocksComponent)();
        if (renderBlocksPath) {
            console.log('🔧 Updating RenderBlocks component...');
            try {
                (0, ast_1.removeRenderBlocksComponent)(renderBlocksPath, entry.slug);
                console.log(`✅ Removed ${entry.slug} component from RenderBlocks`);
            }
            catch (error) {
                console.warn(`⚠️  Failed to update RenderBlocks component: ${error.message}`);
            }
        }
        else {
            console.warn('⚠️  Could not find RenderBlocks component.');
        }
        // Step 5: Remove from registry
        console.log('📝 Updating registry...');
        (0, registry_1.removeBlockFromRegistry)(entry.slug);
        console.log('✅ Block unregistered successfully');
        console.log('');
        console.log('🎉 Block removal complete!');
    }
    catch (error) {
        console.error('❌ Failed to remove block:', error.message);
        process.exit(1);
    }
}
