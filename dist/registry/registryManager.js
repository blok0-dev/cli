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
exports.RegistryManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const REGISTRY_FILE = 'blok0-registry.json';
class RegistryManager {
    static registryPath = path.join(process.cwd(), REGISTRY_FILE);
    static loadRegistry() {
        if (!fs.existsSync(this.registryPath)) {
            return { version: '1.0', blocks: [] };
        }
        try {
            const data = fs.readFileSync(this.registryPath, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            console.warn('Failed to parse registry file, creating new one');
            return { version: '1.0', blocks: [] };
        }
    }
    static saveRegistry(registry) {
        const data = JSON.stringify(registry, null, 2);
        fs.writeFileSync(this.registryPath, data, 'utf8');
    }
    static addBlock(entry) {
        const registry = this.loadRegistry();
        const existingIndex = registry.blocks.findIndex(b => b.slug === entry.slug);
        const newEntry = {
            ...entry,
            addedAt: new Date().toISOString(),
            addedBy: this.getCurrentUser()
        };
        if (existingIndex >= 0) {
            registry.blocks[existingIndex] = newEntry;
        }
        else {
            registry.blocks.push(newEntry);
        }
        this.saveRegistry(registry);
    }
    static removeBlock(slug) {
        const registry = this.loadRegistry();
        const initialLength = registry.blocks.length;
        registry.blocks = registry.blocks.filter(b => b.slug !== slug);
        if (registry.blocks.length < initialLength) {
            this.saveRegistry(registry);
            return true;
        }
        return false;
    }
    static getBlock(slug) {
        const registry = this.loadRegistry();
        return registry.blocks.find(b => b.slug === slug);
    }
    static listBlocks() {
        const registry = this.loadRegistry();
        return registry.blocks;
    }
    static hasBlock(slug) {
        return this.getBlock(slug) !== undefined;
    }
    static validateRegistry() {
        const errors = [];
        const registry = this.loadRegistry();
        // Check for duplicate slugs
        const slugs = new Set();
        for (const block of registry.blocks) {
            if (slugs.has(block.slug)) {
                errors.push(`Duplicate slug found: ${block.slug}`);
            }
            slugs.add(block.slug);
            // Check if files exist
            if (!fs.existsSync(block.configPath)) {
                errors.push(`Config file missing: ${block.configPath}`);
            }
            if (!fs.existsSync(block.componentPath)) {
                errors.push(`Component file missing: ${block.componentPath}`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
    static getCurrentUser() {
        // In a real implementation, this would get the user from auth
        return process.env.USER || process.env.USERNAME || 'unknown';
    }
}
exports.RegistryManager = RegistryManager;
