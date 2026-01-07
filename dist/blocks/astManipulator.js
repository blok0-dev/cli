"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTManipulator = void 0;
const ts_morph_1 = require("ts-morph");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ASTManipulator {
    static project = new ts_morph_1.Project();
    static updatePayloadConfig(hydratedBlock) {
        const configFiles = ['payload.config.ts', 'payload.config.js'];
        let configPath = null;
        for (const file of configFiles) {
            const fullPath = path.join(process.cwd(), file);
            if (fs.existsSync(fullPath)) {
                configPath = fullPath;
                break;
            }
        }
        if (!configPath) {
            console.warn('Warning: No payload config file found. Skipping Payload config update.');
            return;
        }
        const sourceFile = this.project.addSourceFileAtPath(configPath);
        // Add import
        this.addBlockImport(sourceFile, hydratedBlock);
        // Add to blocks array
        this.addToBlocksArray(sourceFile, hydratedBlock);
        // Save changes
        sourceFile.saveSync();
    }
    static updateRenderBlocks(hydratedBlock) {
        const renderBlocksPath = path.join(process.cwd(), 'src', 'blocks', 'RenderBlocks.tsx');
        if (!fs.existsSync(renderBlocksPath)) {
            console.warn('Warning: RenderBlocks.tsx not found. Skipping RenderBlocks update.');
            return;
        }
        const sourceFile = this.project.addSourceFileAtPath(renderBlocksPath);
        // Add component import
        this.addComponentImport(sourceFile, hydratedBlock);
        // Add to blockComponents map
        this.addToBlockComponentsMap(sourceFile, hydratedBlock);
        // Save changes
        sourceFile.saveSync();
    }
    static addBlockImport(sourceFile, hydratedBlock) {
        const relativePath = path.relative(path.dirname(sourceFile.getFilePath()), hydratedBlock.configPath);
        const importPath = relativePath.replace(/\.ts$/, '');
        // Check if import already exists
        const existingImports = sourceFile.getImportDeclarations();
        const alreadyImported = existingImports.some(imp => imp.getModuleSpecifierValue() === importPath);
        if (alreadyImported) {
            return;
        }
        // Add import at the top
        sourceFile.addImportDeclaration({
            defaultImport: hydratedBlock.definition.slug,
            moduleSpecifier: importPath
        });
    }
    static addToBlocksArray(sourceFile, hydratedBlock) {
        // Find the blocks array in layout.blocks
        const layoutObject = this.findLayoutObject(sourceFile);
        if (!layoutObject) {
            console.warn('Warning: Could not find layout.blocks array in payload config');
            return;
        }
        const blocksProperty = layoutObject.getProperty('blocks');
        if (!blocksProperty) {
            console.warn('Warning: Could not find blocks property in layout');
            return;
        }
        const blocksArray = blocksProperty.getFirstChildByKind(ts_morph_1.SyntaxKind.ArrayLiteralExpression);
        if (!blocksArray) {
            console.warn('Warning: blocks property is not an array');
            return;
        }
        // Check if already added
        const elements = blocksArray.getElements();
        const alreadyAdded = elements.some((el) => el.getText().includes(hydratedBlock.definition.slug));
        if (alreadyAdded) {
            return;
        }
        // Add to array
        blocksArray.addElement(hydratedBlock.definition.slug);
    }
    static addComponentImport(sourceFile, hydratedBlock) {
        const relativePath = path.relative(path.dirname(sourceFile.getFilePath()), hydratedBlock.componentPath);
        const importPath = relativePath.replace(/\.tsx?$/, '');
        // Check if import already exists
        const existingImports = sourceFile.getImportDeclarations();
        const alreadyImported = existingImports.some(imp => imp.getModuleSpecifierValue() === importPath);
        if (alreadyImported) {
            return;
        }
        // Add import
        sourceFile.addImportDeclaration({
            defaultImport: hydratedBlock.definition.slug,
            moduleSpecifier: importPath
        });
    }
    static addToBlockComponentsMap(sourceFile, hydratedBlock) {
        // Find the blockComponents object
        const blockComponentsVar = sourceFile.getVariableDeclaration('blockComponents');
        if (!blockComponentsVar) {
            console.warn('Warning: Could not find blockComponents variable');
            return;
        }
        const initializer = blockComponentsVar.getInitializer();
        if (!initializer || !initializer.isKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression)) {
            console.warn('Warning: blockComponents is not an object literal');
            return;
        }
        // Check if already added
        const properties = initializer.getProperties();
        const alreadyAdded = properties.some(prop => prop.isKind(ts_morph_1.SyntaxKind.PropertyAssignment) &&
            prop.getName() === `'${hydratedBlock.definition.slug}'`);
        if (alreadyAdded) {
            return;
        }
        // Add property
        initializer.addPropertyAssignment({
            name: `'${hydratedBlock.definition.slug}'`,
            initializer: hydratedBlock.definition.slug
        });
    }
    static findLayoutObject(sourceFile) {
        // This is a simplified search - in practice, you'd need more sophisticated AST traversal
        // to find the layout object within the payload config structure
        const defaultExport = sourceFile.getDefaultExportSymbol()?.getValueDeclaration();
        if (!defaultExport)
            return null;
        // Look for layout property
        if (defaultExport.isKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression)) {
            return defaultExport.getProperty('layout')?.getFirstChildByKind(ts_morph_1.SyntaxKind.ObjectLiteralExpression);
        }
        return null;
    }
}
exports.ASTManipulator = ASTManipulator;
