export interface BlockSource {
    url: string;
    id: number;
}
export interface BlockEntry {
    id: number;
    name: string;
    slug: string;
    dir: string;
    configPath: string;
    componentPath: string;
    source: BlockSource & {
        fetchedAt: string;
    };
    checksums: {
        [filename: string]: string;
    };
}
export interface RegistryData {
    version: string;
    blocks: {
        [slug: string]: BlockEntry;
    };
}
/**
 * Load registry from file
 */
export declare function loadRegistry(): RegistryData;
/**
 * Save registry to file
 */
export declare function saveRegistry(registry: RegistryData): void;
/**
 * Check if block slug already exists in registry
 */
export declare function isBlockRegistered(slug: string): boolean;
/**
 * Get block entry by slug
 */
export declare function getBlockEntry(slug: string): BlockEntry | null;
/**
 * Add block to registry
 */
export declare function addBlockToRegistry(entry: BlockEntry): void;
/**
 * Remove block from registry
 */
export declare function removeBlockFromRegistry(slug: string): void;
/**
 * Update block checksums
 */
export declare function updateBlockChecksums(slug: string, checksums: {
    [filename: string]: string;
}): void;
/**
 * Calculate file checksum
 */
export declare function calculateChecksum(filePath: string): string;
/**
 * Calculate checksums for all files in a directory
 */
export declare function calculateDirectoryChecksums(dirPath: string): {
    [filename: string]: string;
};
/**
 * Validate registry integrity
 */
export declare function validateRegistry(): {
    valid: boolean;
    errors: string[];
};
/**
 * Create empty registry for new projects
 */
export declare function createEmptyRegistry(): void;
