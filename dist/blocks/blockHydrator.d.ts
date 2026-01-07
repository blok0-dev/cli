import { BlockDefinition, DownloadedBlockFile, HydratedBlock } from './types';
export declare class BlockHydrator {
    static hydrateBlock(definition: BlockDefinition, files: DownloadedBlockFile[]): Promise<HydratedBlock>;
    private static validateBlockConfig;
    static removeBlock(slug: string): boolean;
}
