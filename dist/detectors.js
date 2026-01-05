"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEmptyDirectory = checkEmptyDirectory;
const fs_1 = require("fs");
const path_1 = require("path");
function checkEmptyDirectory() {
    const cwd = process.cwd();
    const pkgPath = (0, path_1.join)(cwd, 'package.json');
    const configJs = (0, path_1.join)(cwd, 'payload.config.js');
    const configTs = (0, path_1.join)(cwd, 'payload.config.ts');
    if ((0, fs_1.existsSync)(pkgPath)) {
        console.error('Error: package.json already exists. Please run in an empty directory.');
        return false;
    }
    if ((0, fs_1.existsSync)(configJs) || (0, fs_1.existsSync)(configTs)) {
        console.error('Error: Payload config file already exists. Please run in an empty directory.');
        return false;
    }
    return true;
}
