"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlugUtils = void 0;
class SlugUtils {
    /**
     * Converts a kebab-case slug to PascalCase
     * Example: "customer-carousel" -> "CustomerCarousel"
     */
    static slugToPascalCase(slug) {
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }
    /**
     * Validates that a string is a valid JavaScript identifier
     */
    static isValidIdentifier(name) {
        try {
            new Function(`var ${name}`);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Normalizes a slug and validates it can be converted to a valid identifier
     */
    static normalizeSlug(slug) {
        const pascalCase = this.slugToPascalCase(slug);
        const isValid = this.isValidIdentifier(pascalCase);
        return { pascalCase, isValid };
    }
}
exports.SlugUtils = SlugUtils;
