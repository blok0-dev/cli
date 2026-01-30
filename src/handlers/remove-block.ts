import * as path from 'path';
import { getBlockEntry, removeBlockFromRegistry } from '../registry';
import {
    removeBlockDirectory,
    slugToIdentifier
} from '../blocks';
import {
    removePageCollectionConfig,
    removeRenderBlocksComponent,
    findPagesCollection,
    findRenderBlocksComponent
} from '../ast';

/**
 * Handle remove block command
 */
export async function handleRemoveBlock(blockId: string, options: { dryRun?: boolean } = {}): Promise<void> {
    console.log('🗑️  Removing Blok0 Block');
    console.log('=======================');
    console.log('');

    try {
        // Step 1: Check if block exists in registry
        // The "blockId" from user input could be a slug or an ID.
        // Ideally we support slug as it's more human readable.
        // Let's assume input is slug for now as "add block <url>" produces a slug.
        const slug = blockId;
        const entry = getBlockEntry(slug);

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
        removeBlockDirectory(entry.dir);
        console.log(`✅ Removed directory: ${path.relative(process.cwd(), entry.dir)}`);

        // Step 3: Update Pages collection (AST manipulation)
        const pagesCollectionPath = findPagesCollection();
        if (pagesCollectionPath) {
            console.log('🔧 Updating Pages collection...');
            const blockIdentifier = slugToIdentifier(entry.slug);

            try {
                removePageCollectionConfig(pagesCollectionPath, blockIdentifier);
                console.log(`✅ Removed ${blockIdentifier} from Pages collection`);
            } catch (error) {
                console.warn(`⚠️  Failed to update Pages collection: ${(error as Error).message}`);
            }
        } else {
            console.warn('⚠️  Could not find Pages collection file.');
        }

        // Step 4: Update RenderBlocks component (AST manipulation)
        const renderBlocksPath = findRenderBlocksComponent();
        if (renderBlocksPath) {
            console.log('🔧 Updating RenderBlocks component...');
            try {
                removeRenderBlocksComponent(renderBlocksPath, entry.slug);
                console.log(`✅ Removed ${entry.slug} component from RenderBlocks`);
            } catch (error) {
                console.warn(`⚠️  Failed to update RenderBlocks component: ${(error as Error).message}`);
            }
        } else {
            console.warn('⚠️  Could not find RenderBlocks component.');
        }

        // Step 5: Remove from registry
        console.log('📝 Updating registry...');
        removeBlockFromRegistry(entry.slug);
        console.log('✅ Block unregistered successfully');

        console.log('');
        console.log('🎉 Block removal complete!');

    } catch (error) {
        console.error('❌ Failed to remove block:', (error as Error).message);
        process.exit(1);
    }
}
