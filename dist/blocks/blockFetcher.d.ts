import { BlockDefinition, DownloadedBlockFile } from './types';
export declare class BlockFetcher {
    static fetchBlockDefinition(url: string): Promise<BlockDefinition>;
    static downloadBlockFiles(definition: BlockDefinition): Promise<DownloadedBlockFile[]>;
    private static validateBlockDefinition;
    private static resolveUrl;
    private static downloadFile;
}
