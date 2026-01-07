export interface BlockMetadata {
    id: number;
    name: string;
    slug: string;
    codeFiles: Array<{
        sourceCode?: {
            name: string;
            url: string;
        };
    }>;
    _status: 'published' | 'draft';
}
export interface CodeFile {
    name: string;
    content: string;
}
declare class APIClient {
    private client;
    private baseURL;
    constructor(baseURL?: string);
    /**
     * Fetch block metadata from URL
     */
    fetchBlockMetadata(url: string): Promise<BlockMetadata>;
    /**
     * Download source code file
     */
    downloadSourceCode(url: string): Promise<string>;
    /**
     * Validate block metadata
     */
    validateBlockMetadata(metadata: BlockMetadata): void;
    /**
     * Fetch complete block data including source files
     */
    fetchBlockData(url: string): Promise<{
        metadata: BlockMetadata;
        files: CodeFile[];
    }>;
    /**
     * Test API connectivity and authentication
     */
    testConnection(): Promise<boolean>;
}
export declare const apiClient: APIClient;
export { APIClient };
