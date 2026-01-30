/**
 * Update Payload page collection config to include new block
 */
export declare function updatePageCollectionConfig(pagesCollectionPath: string, blockConfigPath: string, blockName: string): void;
/**
 * Update RenderBlocks.tsx to include new block component
 */
export declare function updateRenderBlocksComponent(componentPath: string, blockSlug: string, blockComponentPath: string): void;
/**
 * Validate that a file can be parsed as TypeScript
 */
export declare function validateTypeScriptFile(filePath: string): {
    valid: boolean;
    errors: string[];
};
/**
 * Find Payload config file in project
 */
export declare function findPayloadConfig(): string | null;
/**
 * Find RenderBlocks component file
 */
export declare function findRenderBlocksComponent(): string | null;
/**
 * Find Pages collection file in project
 */
export declare function findPagesCollection(): string | null;
/**
 * Extract the component name from a Component.tsx file
 */
export declare function extractComponentName(componentPath: string): string | null;
/**
 * Remove block from Pages collection config
 */
export declare function removePageCollectionConfig(pagesCollectionPath: string, blockName: string): void;
/**
 * Remove block component from RenderBlocks.tsx
 */
export declare function removeRenderBlocksComponent(componentPath: string, blockSlug: string): void;
