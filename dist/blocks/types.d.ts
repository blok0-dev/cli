export interface BlockSourceFile {
    sourceCode: {
        name: string;
        url: string;
    };
}
export interface BlockDefinition {
    id: number;
    name: string;
    slug: string;
    codeFiles: BlockSourceFile[];
    _status: 'published' | 'draft';
}
export interface DownloadedBlockFile {
    name: string;
    content: string;
    url: string;
}
export interface HydratedBlock {
    definition: BlockDefinition;
    files: DownloadedBlockFile[];
    dir: string;
    configPath: string;
    componentPath: string;
}
export interface RegistryEntry {
    slug: string;
    name: string;
    id: number;
    sourceUrl: string;
    dir: string;
    configPath: string;
    componentPath: string;
    files: string[];
    addedAt: string;
    addedBy: string;
}
export interface Blok0Registry {
    version: string;
    blocks: RegistryEntry[];
}
