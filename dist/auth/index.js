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
exports.loadAuthConfig = loadAuthConfig;
exports.saveAuthConfig = saveAuthConfig;
exports.storeAccessToken = storeAccessToken;
exports.getAccessToken = getAccessToken;
exports.storeRefreshToken = storeRefreshToken;
exports.getRefreshToken = getRefreshToken;
exports.clearCredentials = clearCredentials;
exports.isAuthenticated = isAuthenticated;
exports.isTokenExpired = isTokenExpired;
exports.getAuthHeader = getAuthHeader;
const keytar = __importStar(require("keytar"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const SERVICE_NAME = 'blok0';
const CONFIG_DIR = path.join(os.homedir(), '.blok0');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
/**
 * Ensure config directory exists
 */
function ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}
/**
 * Load auth configuration from file
 */
function loadAuthConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.warn('Failed to load auth config:', error);
    }
    return {};
}
/**
 * Save auth configuration to file
 */
function saveAuthConfig(config) {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
/**
 * Store access token securely
 */
async function storeAccessToken(token) {
    try {
        await keytar.setPassword(SERVICE_NAME, 'access_token', token);
    }
    catch (error) {
        console.error('Failed to store access token:', error);
        throw new Error('Unable to securely store access token');
    }
}
/**
 * Get stored access token
 */
async function getAccessToken() {
    try {
        return await keytar.getPassword(SERVICE_NAME, 'access_token');
    }
    catch (error) {
        console.error('Failed to retrieve access token:', error);
        return null;
    }
}
/**
 * Store refresh token securely
 */
async function storeRefreshToken(token) {
    try {
        await keytar.setPassword(SERVICE_NAME, 'refresh_token', token);
    }
    catch (error) {
        console.error('Failed to store refresh token:', error);
        throw new Error('Unable to securely store refresh token');
    }
}
/**
 * Get stored refresh token
 */
async function getRefreshToken() {
    try {
        return await keytar.getPassword(SERVICE_NAME, 'refresh_token');
    }
    catch (error) {
        console.error('Failed to retrieve refresh token:', error);
        return null;
    }
}
/**
 * Clear all stored credentials
 */
async function clearCredentials() {
    try {
        await keytar.deletePassword(SERVICE_NAME, 'access_token');
        await keytar.deletePassword(SERVICE_NAME, 'refresh_token');
        if (fs.existsSync(CONFIG_FILE)) {
            fs.unlinkSync(CONFIG_FILE);
        }
    }
    catch (error) {
        console.error('Failed to clear credentials:', error);
        throw new Error('Unable to clear stored credentials');
    }
}
/**
 * Check if user is authenticated
 */
async function isAuthenticated() {
    const token = await getAccessToken();
    return token !== null;
}
/**
 * Validate token expiry (basic check)
 */
function isTokenExpired(expiry) {
    if (!expiry)
        return false;
    return Date.now() >= expiry;
}
/**
 * Get authorization header for API requests
 */
async function getAuthHeader() {
    const token = await getAccessToken();
    return token ? `Bearer ${token}` : null;
}
