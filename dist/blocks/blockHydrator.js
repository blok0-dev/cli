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
exports.BlockHydrator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const slugUtils_1 = require("../utils/slugUtils");
const registryManager_1 = require("../registry/registryManager");
class BlockHydrator {
    static async hydrateBlock(definition, files) {
        const { pascalCase, isValid } = slugUtils_1.SlugUtils.normalizeSlug(definition.slug);
        if (!isValid) {
            throw new Error(`Invalid slug "${definition.slug}" - cannot convert to valid identifier`);
        }
        // Check for conflicts
        if (registryManager_1.RegistryManager.hasBlock(definition.slug)) {
            throw new Error(`Block "${definition.slug}" already exists. Use update command instead.`);
        }
        const blockDir = path.join(process.cwd(), 'src', 'blocks', pascalCase);
        // Create directory
        fs.mkdirSync(blockDir, { recursive: true });
        // Write files
        for (const file of files) {
            const filePath = path.join(blockDir, file.name);
            fs.writeFileSync(filePath, file.content, 'utf8');
        }
        // Validate the config file
        await this.validateBlockConfig(definition, blockDir);
        const configPath = path.join(blockDir, 'config.ts');
        const componentPath = path.join(blockDir, 'Component.tsx');
        return {
            definition,
            files,
            dir: blockDir,
            configPath,
            componentPath,
        };
    }
    static async validateBlockConfig(definition, blockDir) {
        const configPath = path.join(blockDir, 'config.ts');
        if (!fs.existsSync(configPath)) {
            throw new Error('config.ts file was not created');
        }
        // Basic validation - check if it exports a default
        const configContent = fs.readFileSync(configPath, 'utf8');
        // Simple checks - in a real implementation, you'd use ts-morph for proper AST validation
        if (!configContent.includes('export default')) {
            throw new Error('config.ts must export a default block configuration');
        }
        if (!configContent.includes('slug:')) {
            throw new Error('config.ts must define a slug property');
        }
        // Check that the slug matches
        if (!configContent.includes(`slug: '${definition.slug}'`)) {
            console.warn(`Warning: config.ts slug does not match expected "${definition.slug}"`);
        }
    }
    static removeBlock(slug) {
        const entry = registryManager_1.RegistryManager.getBlock(slug);
        if (!entry) {
            return false;
        }
        // Remove files
        if (fs.existsSync(entry.dir)) {
            fs.rmSync(entry.dir, { recursive: true, force: true });
        }
        // Remove from registry
        return registryManager_1.RegistryManager.removeBlock(slug);
    }
}
exports.BlockHydrator = BlockHydrator;
