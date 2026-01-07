export declare class SlugUtils {
    /**
     * Converts a kebab-case slug to PascalCase
     * Example: "customer-carousel" -> "CustomerCarousel"
     */
    static slugToPascalCase(slug: string): string;
    /**
     * Validates that a string is a valid JavaScript identifier
     */
    static isValidIdentifier(name: string): boolean;
    /**
     * Normalizes a slug and validates it can be converted to a valid identifier
     */
    static normalizeSlug(slug: string): {
        pascalCase: string;
        isValid: boolean;
    };
}
