export class SlugUtils {
  /**
   * Converts a kebab-case slug to PascalCase
   * Example: "customer-carousel" -> "CustomerCarousel"
   */
  static slugToPascalCase(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Validates that a string is a valid JavaScript identifier
   */
  static isValidIdentifier(name: string): boolean {
    try {
      new Function(`var ${name}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalizes a slug and validates it can be converted to a valid identifier
   */
  static normalizeSlug(slug: string): { pascalCase: string; isValid: boolean } {
    const pascalCase = this.slugToPascalCase(slug);
    const isValid = this.isValidIdentifier(pascalCase);

    return { pascalCase, isValid };
  }
}