import { HydratedBlock } from './types';
export declare class ASTManipulator {
    private static project;
    static updatePayloadConfig(hydratedBlock: HydratedBlock): void;
    static updateRenderBlocks(hydratedBlock: HydratedBlock): void;
    private static addBlockImport;
    private static addToBlocksArray;
    private static addComponentImport;
    private static addToBlockComponentsMap;
    private static findLayoutObject;
}
