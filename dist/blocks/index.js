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
exports.slugToIdentifier = slugToIdentifier;
exports.slugToFolderName = slugToFolderName;
exports.validateBlockDirectory = validateBlockDirectory;
exports.createBlockDirectory = createBlockDirectory;
exports.removeBlockDirectory = removeBlockDirectory;
exports.createBlockEntry = createBlockEntry;
exports.getBlockDirectories = getBlockDirectories;
exports.discoverBlocksFromFilesystem = discoverBlocksFromFilesystem;
exports.ensureBlocksDirectory = ensureBlocksDirectory;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Convert slug to PascalCase identifier
 */
function slugToIdentifier(slug) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}
/**
 * Convert slug to folder name (direct mapping)
 */
function slugToFolderName(slug) {
    return slug;
}
/**
 * Validate that a directory contains a valid block
 */
function validateBlockDirectory(dirPath) {
    const errors = [];
    if (!fs.existsSync(dirPath)) {
        errors.push('Block directory does not exist');
        return { valid: false, errors };
    }
    const configPath = path.join(dirPath, 'config.ts');
    if (!fs.existsSync(configPath)) {
        errors.push('config.ts file is missing');
    }
    // Check if config.ts exports a valid block configuration
    if (fs.existsSync(configPath)) {
        try {
            const configContent = fs.readFileSync(configPath, 'utf-8');
            // Basic validation - check for required exports
            if (!configContent.includes('export') || !configContent.includes('Block')) {
                errors.push('config.ts does not appear to export a valid block configuration');
            }
        }
        catch (error) {
            errors.push(`Failed to read config.ts: ${error.message}`);
        }
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Create block directory structure and write files
 */
function createBlockDirectory(baseDir, slug, files) {
    const blockDir = path.join(baseDir, slugToFolderName(slug));
    // Check if directory already exists
    if (fs.existsSync(blockDir)) {
        throw new Error(`Block directory already exists: ${blockDir}`);
    }
    // Create directory
    fs.mkdirSync(blockDir, { recursive: true });
    let configPath = '';
    let componentPath = '';
    // Write files
    for (const file of files) {
        const filePath = path.join(blockDir, file.name);
        fs.writeFileSync(filePath, file.content);
        if (file.name === 'config.ts') {
            configPath = filePath;
        }
        else if (file.name === 'Component.tsx') {
            componentPath = filePath;
        }
    }
    if (!configPath) {
        throw new Error('config.ts file was not found in downloaded files');
    }
    if (!componentPath) {
        throw new Error('Component.tsx file was not found in downloaded files');
    }
    return { dir: blockDir, configPath, componentPath };
}
/**
 * Remove block directory
 */
function removeBlockDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
}
/**
 * Create block entry from metadata and file paths
 */
function createBlockEntry(metadata, dir, configPath, componentPath, checksums) {
    return {
        id: metadata.id,
        name: metadata.name,
        slug: metadata.slug,
        dir,
        configPath,
        componentPath,
        source: {
            url: metadata.sourceUrl,
            id: metadata.id,
            fetchedAt: new Date().toISOString()
        },
        checksums
    };
}
/**
 * Get all block directories in src/blocks
 */
function getBlockDirectories(blocksDir = 'src/blocks') {
    const fullBlocksDir = path.join(process.cwd(), blocksDir);
    if (!fs.existsSync(fullBlocksDir)) {
        return [];
    }
    const entries = fs.readdirSync(fullBlocksDir, { withFileTypes: true });
    return entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(fullBlocksDir, entry.name));
}
/**
 * Find blocks by scanning filesystem (fallback when registry is unavailable)
 */
function discoverBlocksFromFilesystem() {
    const blocksDir = path.join(process.cwd(), 'src/blocks');
    if (!fs.existsSync(blocksDir)) {
        return [];
    }
    const blockDirs = getBlockDirectories();
    const blocks = [];
    for (const dir of blockDirs) {
        const slug = path.basename(dir);
        const configPath = path.join(dir, 'config.ts');
        const hasConfig = fs.existsSync(configPath);
        blocks.push({ slug, dir, hasConfig });
    }
    return blocks;
}
/**
 * Ensure src/blocks directory exists
 */
function ensureBlocksDirectory() {
    const blocksDir = path.join(process.cwd(), 'src/blocks');
    if (!fs.existsSync(blocksDir)) {
        fs.mkdirSync(blocksDir, { recursive: true });
    }
    return blocksDir;
}
