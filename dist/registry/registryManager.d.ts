import { Blok0Registry, RegistryEntry } from '../blocks/types';
export declare class RegistryManager {
    private static registryPath;
    static loadRegistry(): Blok0Registry;
    static saveRegistry(registry: Blok0Registry): void;
    static addBlock(entry: Omit<RegistryEntry, 'addedAt' | 'addedBy'>): void;
    static removeBlock(slug: string): boolean;
    static getBlock(slug: string): RegistryEntry | undefined;
    static listBlocks(): RegistryEntry[];
    static hasBlock(slug: string): boolean;
    static validateRegistry(): {
        valid: boolean;
        errors: string[];
    };
    private static getCurrentUser;
}
