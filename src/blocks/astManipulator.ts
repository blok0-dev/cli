import { Project, SyntaxKind, SourceFile, ImportDeclaration, ArrayLiteralExpression } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';
import { HydratedBlock } from './types';

export class ASTManipulator {
  private static project = new Project();

  static updatePayloadConfig(hydratedBlock: HydratedBlock): void {
    const configFiles = ['payload.config.ts', 'payload.config.js'];
    let configPath: string | null = null;

    for (const file of configFiles) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        configPath = fullPath;
        break;
      }
    }

    if (!configPath) {
      console.warn('Warning: No payload config file found. Skipping Payload config update.');
      return;
    }

    const sourceFile = this.project.addSourceFileAtPath(configPath);

    // Add import
    this.addBlockImport(sourceFile, hydratedBlock);

    // Add to blocks array
    this.addToBlocksArray(sourceFile, hydratedBlock);

    // Save changes
    sourceFile.saveSync();
  }

  static updateRenderBlocks(hydratedBlock: HydratedBlock): void {
    const renderBlocksPath = path.join(process.cwd(), 'src', 'blocks', 'RenderBlocks.tsx');

    if (!fs.existsSync(renderBlocksPath)) {
      console.warn('Warning: RenderBlocks.tsx not found. Skipping RenderBlocks update.');
      return;
    }

    const sourceFile = this.project.addSourceFileAtPath(renderBlocksPath);

    // Add component import
    this.addComponentImport(sourceFile, hydratedBlock);

    // Add to blockComponents map
    this.addToBlockComponentsMap(sourceFile, hydratedBlock);

    // Save changes
    sourceFile.saveSync();
  }

  private static addBlockImport(sourceFile: SourceFile, hydratedBlock: HydratedBlock): void {
    const relativePath = path.relative(path.dirname(sourceFile.getFilePath()), hydratedBlock.configPath);
    const importPath = relativePath.replace(/\.ts$/, '');

    // Check if import already exists
    const existingImports = sourceFile.getImportDeclarations();
    const alreadyImported = existingImports.some(imp =>
      imp.getModuleSpecifierValue() === importPath
    );

    if (alreadyImported) {
      return;
    }

    // Add import at the top
    sourceFile.addImportDeclaration({
      defaultImport: hydratedBlock.definition.slug,
      moduleSpecifier: importPath
    });
  }

  private static addToBlocksArray(sourceFile: SourceFile, hydratedBlock: HydratedBlock): void {
    // Find the blocks array in layout.blocks
    const layoutObject = this.findLayoutObject(sourceFile);
    if (!layoutObject) {
      console.warn('Warning: Could not find layout.blocks array in payload config');
      return;
    }

    const blocksProperty = layoutObject.getProperty('blocks');
    if (!blocksProperty) {
      console.warn('Warning: Could not find blocks property in layout');
      return;
    }

    const blocksArray = blocksProperty.getFirstChildByKind(SyntaxKind.ArrayLiteralExpression);
    if (!blocksArray) {
      console.warn('Warning: blocks property is not an array');
      return;
    }

    // Check if already added
    const elements = blocksArray.getElements();
    const alreadyAdded = elements.some((el: any) =>
      el.getText().includes(hydratedBlock.definition.slug)
    );

    if (alreadyAdded) {
      return;
    }

    // Add to array
    blocksArray.addElement(hydratedBlock.definition.slug);
  }

  private static addComponentImport(sourceFile: SourceFile, hydratedBlock: HydratedBlock): void {
    const relativePath = path.relative(path.dirname(sourceFile.getFilePath()), hydratedBlock.componentPath);
    const importPath = relativePath.replace(/\.tsx?$/, '');

    // Check if import already exists
    const existingImports = sourceFile.getImportDeclarations();
    const alreadyImported = existingImports.some(imp =>
      imp.getModuleSpecifierValue() === importPath
    );

    if (alreadyImported) {
      return;
    }

    // Add import
    sourceFile.addImportDeclaration({
      defaultImport: hydratedBlock.definition.slug,
      moduleSpecifier: importPath
    });
  }

  private static addToBlockComponentsMap(sourceFile: SourceFile, hydratedBlock: HydratedBlock): void {
    // Find the blockComponents object
    const blockComponentsVar = sourceFile.getVariableDeclaration('blockComponents');
    if (!blockComponentsVar) {
      console.warn('Warning: Could not find blockComponents variable');
      return;
    }

    const initializer = blockComponentsVar.getInitializer();
    if (!initializer || !initializer.isKind(SyntaxKind.ObjectLiteralExpression)) {
      console.warn('Warning: blockComponents is not an object literal');
      return;
    }

    // Check if already added
    const properties = initializer.getProperties();
    const alreadyAdded = properties.some(prop =>
      prop.isKind(SyntaxKind.PropertyAssignment) &&
      prop.getName() === `'${hydratedBlock.definition.slug}'`
    );

    if (alreadyAdded) {
      return;
    }

    // Add property
    initializer.addPropertyAssignment({
      name: `'${hydratedBlock.definition.slug}'`,
      initializer: hydratedBlock.definition.slug
    });
  }

  private static findLayoutObject(sourceFile: SourceFile): any {
    // This is a simplified search - in practice, you'd need more sophisticated AST traversal
    // to find the layout object within the payload config structure
    const defaultExport = sourceFile.getDefaultExportSymbol()?.getValueDeclaration();
    if (!defaultExport) return null;

    // Look for layout property
    if (defaultExport.isKind(SyntaxKind.ObjectLiteralExpression)) {
      return defaultExport.getProperty('layout')?.getFirstChildByKind(SyntaxKind.ObjectLiteralExpression);
    }

    return null;
  }
}