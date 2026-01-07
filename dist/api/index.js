"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIClient = exports.apiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("../auth");
class APIClient {
    client;
    baseURL;
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.client = axios_1.default.create({
            baseURL,
            timeout: 30000,
            headers: {
                'User-Agent': 'blok0-cli/1.0.0'
            }
        });
        // Add auth header to all requests
        this.client.interceptors.request.use(async (config) => {
            const authHeader = await (0, auth_1.getAuthHeader)();
            if (authHeader) {
                config.headers.Authorization = authHeader;
            }
            return config;
        });
    }
    /**
     * Fetch block metadata from URL
     */
    async fetchBlockMetadata(url) {
        try {
            const response = await this.client.get(url);
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    throw new Error('Authentication required. Please run `blok0 login` first.');
                }
                if (error.response?.status === 404) {
                    throw new Error(`Block not found at URL: ${url}`);
                }
                throw new Error(`API request failed: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    /**
     * Download source code file
     */
    async downloadSourceCode(url) {
        try {
            const response = await this.client.get(url, {
                responseType: 'text'
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to download source code from ${url}: ${error.message}`);
            }
            throw error;
        }
    }
    /**
     * Validate block metadata
     */
    validateBlockMetadata(metadata) {
        if (!metadata.id || typeof metadata.id !== 'number') {
            throw new Error('Invalid block metadata: missing or invalid id');
        }
        if (!metadata.name || typeof metadata.name !== 'string') {
            throw new Error('Invalid block metadata: missing or invalid name');
        }
        if (!metadata.slug || typeof metadata.slug !== 'string') {
            throw new Error('Invalid block metadata: missing or invalid slug');
        }
        // Validate slug format
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(metadata.slug)) {
            throw new Error('Invalid block slug format. Must contain only lowercase letters, numbers, and dashes.');
        }
        if (!metadata.codeFiles || !Array.isArray(metadata.codeFiles)) {
            throw new Error('Invalid block metadata: missing or invalid codeFiles');
        }
        // Filter out malformed codeFiles entries
        const validCodeFiles = metadata.codeFiles.filter(file => file.sourceCode && file.sourceCode.name && file.sourceCode.url);
        if (validCodeFiles.length === 0) {
            throw new Error('Invalid block metadata: no valid code files specified');
        }
        // Check for required files
        const hasConfig = validCodeFiles.some(file => file.sourceCode.name === 'config.ts');
        if (!hasConfig) {
            throw new Error('Invalid block metadata: config.ts file is required');
        }
        if (metadata._status !== 'published') {
            throw new Error('Block is not published and cannot be installed');
        }
    }
    /**
     * Fetch complete block data including source files
     */
    async fetchBlockData(url) {
        const metadata = await this.fetchBlockMetadata(url);
        this.validateBlockMetadata(metadata);
        const files = [];
        // Filter out malformed codeFiles entries (same logic as validation)
        const validCodeFiles = metadata.codeFiles.filter(file => file.sourceCode && file.sourceCode.name && file.sourceCode.url);
        for (const fileInfo of validCodeFiles) {
            const { name, url: fileUrl } = fileInfo.sourceCode;
            // Resolve relative URLs
            const resolvedUrl = fileUrl.startsWith('http') ? fileUrl : `${this.baseURL}${fileUrl}`;
            try {
                const content = await this.downloadSourceCode(resolvedUrl);
                files.push({ name, content });
            }
            catch (error) {
                throw new Error(`Failed to download ${name}: ${error.message}`);
            }
        }
        return { metadata, files };
    }
    /**
     * Test API connectivity and authentication
     */
    async testConnection() {
        try {
            // Try to access a test endpoint or just check auth header
            const authHeader = await (0, auth_1.getAuthHeader)();
            return authHeader !== null;
        }
        catch (error) {
            return false;
        }
    }
}
exports.APIClient = APIClient;
// Export singleton instance
exports.apiClient = new APIClient();
