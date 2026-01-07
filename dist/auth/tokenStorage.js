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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenStorage = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const keytar_1 = __importDefault(require("keytar"));
const SERVICE_NAME = 'blok0-cli';
const ACCOUNT_NAME = 'auth-tokens';
class TokenStorage {
    static configPath = path.join(os.homedir(), '.blok0', 'config.json');
    static async storeTokens(tokens) {
        try {
            // Try keytar first (secure storage)
            await keytar_1.default.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(tokens));
        }
        catch (error) {
            // Fallback to file storage
            console.warn('Secure storage unavailable, using file storage');
            this.ensureConfigDir();
            fs.writeFileSync(this.configPath, JSON.stringify(tokens, null, 2), {
                mode: 0o600, // Owner read/write only
            });
        }
    }
    static async getTokens() {
        try {
            // Try keytar first
            const stored = await keytar_1.default.getPassword(SERVICE_NAME, ACCOUNT_NAME);
            if (stored) {
                return JSON.parse(stored);
            }
        }
        catch (error) {
            // Fallback to file
            if (fs.existsSync(this.configPath)) {
                try {
                    const data = fs.readFileSync(this.configPath, 'utf8');
                    return JSON.parse(data);
                }
                catch (parseError) {
                    console.warn('Failed to parse stored tokens from file');
                }
            }
        }
        return null;
    }
    static async clearTokens() {
        try {
            await keytar_1.default.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
        }
        catch (error) {
            // Also try to remove file if it exists
            if (fs.existsSync(this.configPath)) {
                fs.unlinkSync(this.configPath);
            }
        }
    }
    static async isTokenExpired(tokens) {
        // Add 5 minute buffer for expiration
        return Date.now() >= (tokens.expiresAt - 5 * 60 * 1000);
    }
    static ensureConfigDir() {
        const configDir = path.dirname(this.configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
        }
    }
}
exports.TokenStorage = TokenStorage;
