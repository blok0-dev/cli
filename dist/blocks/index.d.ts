import { BlockEntry } from '../registry';
import { CodeFile } from '../api';
/**
 * Convert slug to PascalCase identifier
 */
export declare function slugToIdentifier(slug: string): string;
/**
 * Convert slug to folder name (direct mapping)
 */
export declare function slugToFolderName(slug: string): string;
/**
 * Validate that a directory contains a valid block
 */
export declare function validateBlockDirectory(dirPath: string): {
    valid: boolean;
    errors: string[];
};
/**
 * Create block directory structure and write files
 */
export declare function createBlockDirectory(baseDir: string, slug: string, files: CodeFile[]): {
    dir: string;
    configPath: string;
    componentPath: string;
};
/**
 * Remove block directory
 */
export declare function removeBlockDirectory(dirPath: string): void;
/**
 * Create block entry from metadata and file paths
 */
export declare function createBlockEntry(metadata: {
    id: number;
    name: string;
    slug: string;
    sourceUrl: string;
}, dir: string, configPath: string, componentPath: string, checksums: {
    [filename: string]: string;
}): BlockEntry;
/**
 * Get all block directories in src/blocks
 */
export declare function getBlockDirectories(blocksDir?: string): string[];
/**
 * Find blocks by scanning filesystem (fallback when registry is unavailable)
 */
export declare function discoverBlocksFromFilesystem(): Array<{
    slug: string;
    dir: string;
    hasConfig: boolean;
}>;
/**
 * Ensure src/blocks directory exists
 */
export declare function ensureBlocksDirectory(): string;
