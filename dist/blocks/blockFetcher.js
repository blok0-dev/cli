"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const url_1 = require("url");
const authService_1 = require("../auth/authService");
class BlockFetcher {
    static async fetchBlockDefinition(url) {
        const tokens = await authService_1.AuthService.ensureValidTokens();
        if (!tokens) {
            throw new Error('You are not logged in. Run `blok0 login` first.');
        }
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    Authorization: `Bearer ${tokens.accessToken}`,
                },
                timeout: 30000,
            });
            const definition = response.data;
            // Validate the response
            this.validateBlockDefinition(definition);
            return definition;
        }
        catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Authentication failed. Please run `blok0 login` again.');
            }
            throw new Error(`Failed to fetch block definition: ${error.message}`);
        }
    }
    static async downloadBlockFiles(definition) {
        const tokens = await authService_1.AuthService.ensureValidTokens();
        if (!tokens) {
            throw new Error('You are not logged in. Run `blok0 login` first.');
        }
        const files = [];
        // Download files in parallel
        const downloadPromises = definition.codeFiles.map(async (file) => {
            const absoluteUrl = this.resolveUrl(file.sourceCode.url, definition);
            const content = await this.downloadFile(absoluteUrl, tokens.accessToken);
            return {
                name: file.sourceCode.name,
                content,
                url: absoluteUrl,
            };
        });
        try {
            const results = await Promise.all(downloadPromises);
            files.push(...results);
        }
        catch (error) {
            throw new Error(`Failed to download block files: ${error.message}`);
        }
        return files;
    }
    static validateBlockDefinition(definition) {
        if (!definition.id || typeof definition.id !== 'number') {
            throw new Error('Block definition missing valid id');
        }
        if (!definition.name || typeof definition.name !== 'string') {
            throw new Error('Block definition missing valid name');
        }
        if (!definition.slug || typeof definition.slug !== 'string') {
            throw new Error('Block definition missing valid slug');
        }
        if (!definition.codeFiles || !Array.isArray(definition.codeFiles)) {
            throw new Error('Block definition missing codeFiles array');
        }
        if (definition.codeFiles.length === 0) {
            throw new Error('Block definition has no code files');
        }
        if (definition._status !== 'published') {
            throw new Error('Block is not published');
        }
        // Validate slug format (kebab-case)
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(definition.slug)) {
            throw new Error(`Invalid slug format: ${definition.slug}. Must be kebab-case.`);
        }
        // Validate that required files exist
        const fileNames = definition.codeFiles.map(f => f.sourceCode.name);
        if (!fileNames.includes('config.ts')) {
            throw new Error('Block must include a config.ts file');
        }
        if (!fileNames.includes('Component.tsx')) {
            throw new Error('Block must include a Component.tsx file');
        }
    }
    static resolveUrl(relativeUrl, definition) {
        // If it's already absolute, return as-is
        try {
            new url_1.URL(relativeUrl);
            return relativeUrl;
        }
        catch {
            // It's relative, resolve against the API base
            const baseUrl = process.env.BLOK0_API_URL || 'https://www.blok0.xyz';
            return new url_1.URL(relativeUrl, baseUrl).toString();
        }
    }
    static async downloadFile(url, token) {
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                timeout: 30000,
            });
            return response.data;
        }
        catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Authentication failed while downloading file');
            }
            throw new Error(`Failed to download ${url}: ${error.message}`);
        }
    }
}
exports.BlockFetcher = BlockFetcher;
