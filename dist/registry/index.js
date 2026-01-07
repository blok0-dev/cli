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
exports.loadRegistry = loadRegistry;
exports.saveRegistry = saveRegistry;
exports.isBlockRegistered = isBlockRegistered;
exports.getBlockEntry = getBlockEntry;
exports.addBlockToRegistry = addBlockToRegistry;
exports.removeBlockFromRegistry = removeBlockFromRegistry;
exports.updateBlockChecksums = updateBlockChecksums;
exports.calculateChecksum = calculateChecksum;
exports.calculateDirectoryChecksums = calculateDirectoryChecksums;
exports.validateRegistry = validateRegistry;
exports.createEmptyRegistry = createEmptyRegistry;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const REGISTRY_FILE = 'blok0-registry.json';
const REGISTRY_VERSION = '1.0';
/**
 * Get registry file path
 */
function getRegistryPath() {
    return path.join(process.cwd(), REGISTRY_FILE);
}
/**
 * Load registry from file
 */
function loadRegistry() {
    const registryPath = getRegistryPath();
    if (!fs.existsSync(registryPath)) {
        return {
            version: REGISTRY_VERSION,
            blocks: {}
        };
    }
    try {
        const data = fs.readFileSync(registryPath, 'utf-8');
        const registry = JSON.parse(data);
        // Validate registry structure
        if (!registry.version || !registry.blocks) {
            throw new Error('Invalid registry structure');
        }
        return registry;
    }
    catch (error) {
        throw new Error(`Failed to load registry: ${error.message}`);
    }
}
/**
 * Save registry to file
 */
function saveRegistry(registry) {
    const registryPath = getRegistryPath();
    try {
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    }
    catch (error) {
        throw new Error(`Failed to save registry: ${error.message}`);
    }
}
/**
 * Check if block slug already exists in registry
 */
function isBlockRegistered(slug) {
    const registry = loadRegistry();
    return slug in registry.blocks;
}
/**
 * Get block entry by slug
 */
function getBlockEntry(slug) {
    const registry = loadRegistry();
    return registry.blocks[slug] || null;
}
/**
 * Add block to registry
 */
function addBlockToRegistry(entry) {
    const registry = loadRegistry();
    if (entry.slug in registry.blocks) {
        throw new Error(`Block with slug '${entry.slug}' is already registered`);
    }
    registry.blocks[entry.slug] = entry;
    saveRegistry(registry);
}
/**
 * Remove block from registry
 */
function removeBlockFromRegistry(slug) {
    const registry = loadRegistry();
    if (!(slug in registry.blocks)) {
        throw new Error(`Block with slug '${slug}' is not registered`);
    }
    delete registry.blocks[slug];
    saveRegistry(registry);
}
/**
 * Update block checksums
 */
function updateBlockChecksums(slug, checksums) {
    const registry = loadRegistry();
    if (!(slug in registry.blocks)) {
        throw new Error(`Block with slug '${slug}' is not registered`);
    }
    registry.blocks[slug].checksums = checksums;
    saveRegistry(registry);
}
/**
 * Calculate file checksum
 */
function calculateChecksum(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}
/**
 * Calculate checksums for all files in a directory
 */
function calculateDirectoryChecksums(dirPath) {
    const checksums = {};
    function walkDirectory(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                walkDirectory(filePath);
            }
            else {
                const relativePath = path.relative(dirPath, filePath);
                checksums[relativePath] = calculateChecksum(filePath);
            }
        }
    }
    walkDirectory(dirPath);
    return checksums;
}
/**
 * Validate registry integrity
 */
function validateRegistry() {
    const errors = [];
    try {
        const registry = loadRegistry();
        for (const [slug, entry] of Object.entries(registry.blocks)) {
            // Check if block directory exists
            if (!fs.existsSync(entry.dir)) {
                errors.push(`Block '${slug}': directory '${entry.dir}' does not exist`);
                continue;
            }
            // Check if config file exists
            if (!fs.existsSync(entry.configPath)) {
                errors.push(`Block '${slug}': config file '${entry.configPath}' does not exist`);
            }
            // Check if component file exists
            if (!fs.existsSync(entry.componentPath)) {
                errors.push(`Block '${slug}': component file '${entry.componentPath}' does not exist`);
            }
            // Validate checksums if they exist
            if (entry.checksums) {
                for (const [file, expectedChecksum] of Object.entries(entry.checksums)) {
                    const filePath = path.join(entry.dir, file);
                    if (fs.existsSync(filePath)) {
                        const actualChecksum = calculateChecksum(filePath);
                        if (actualChecksum !== expectedChecksum) {
                            errors.push(`Block '${slug}': checksum mismatch for '${file}'`);
                        }
                    }
                    else {
                        errors.push(`Block '${slug}': file '${file}' referenced in checksums does not exist`);
                    }
                }
            }
        }
    }
    catch (error) {
        errors.push(`Registry validation failed: ${error.message}`);
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Create empty registry for new projects
 */
function createEmptyRegistry() {
    const registryPath = getRegistryPath();
    if (fs.existsSync(registryPath)) {
        throw new Error('Registry already exists');
    }
    const emptyRegistry = {
        version: REGISTRY_VERSION,
        blocks: {}
    };
    saveRegistry(emptyRegistry);
}
