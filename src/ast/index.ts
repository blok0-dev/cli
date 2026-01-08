import { Project, SyntaxKind, Node, ImportDeclaration, ObjectLiteralExpression, PropertyAssignment, ArrayLiteralExpression, StringLiteral, Identifier } from 'ts-morph';

/**
 * Update Payload page collection config to include new block
 */
export function updatePageCollectionConfig(pagesCollectionPath: string, blockConfigPath: string, blockName: string): void {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(pagesCollectionPath);

  // Check if block is already imported (do this first before any modifications)
  const importDeclarations = sourceFile.getImportDeclarations();
  const existingImport = importDeclarations.find(imp =>
    imp.getModuleSpecifier().getLiteralValue() === blockConfigPath
  );

  let needsImport = !existingImport;
  if (needsImport) {
    // Add import statement
    const lastImport = importDeclarations[importDeclarations.length - 1];
    const importText = `\nimport { ${blockName} } from '${blockConfigPath}';\n`;
    sourceFile.insertText(lastImport.getEnd(), importText);
    sourceFile.saveSync(); // Save the import addition
  }

  // Re-load the source file after modification to get fresh AST
  const updatedProject = new Project();
  const updatedSourceFile = updatedProject.addSourceFileAtPath(pagesCollectionPath);

  // Find the Pages collection export (fresh references)
  const pagesExport = updatedSourceFile.getVariableDeclaration('Pages');
  if (!pagesExport) {
    throw new Error('Could not find Pages collection export');
  }

  const pagesObject = pagesExport.getInitializer();
  if (!pagesObject || !Node.isObjectLiteralExpression(pagesObject)) {
    throw new Error('Could not find Pages collection object');
  }

  // Find the fields array
  const fieldsProperty = pagesObject.getProperty('fields');
  if (!fieldsProperty || !Node.isPropertyAssignment(fieldsProperty)) {
    throw new Error('Could not find fields property in Pages collection');
  }

  const fieldsArray = fieldsProperty.getInitializer();
  if (!fieldsArray || !Node.isArrayLiteralExpression(fieldsArray)) {
    throw new Error('Could not find fields array in Pages collection');
  }

  // Find the tabs array within fields
  const tabsField = fieldsArray.getElements().find(element => {
    if (Node.isObjectLiteralExpression(element)) {
      const typeProperty = element.getProperty('type');
      if (Node.isPropertyAssignment(typeProperty)) {
        const initializer = typeProperty.getInitializer();
        return Node.isStringLiteral(initializer) && initializer.getLiteralValue() === 'tabs';
      }
    }
    return false;
  });

  if (!tabsField || !Node.isObjectLiteralExpression(tabsField)) {
    throw new Error('Could not find tabs field in Pages collection');
  }

  const tabsProperty = tabsField.getProperty('tabs');
  if (!tabsProperty || !Node.isPropertyAssignment(tabsProperty)) {
    throw new Error('Could not find tabs property');
  }

  const tabsArray = tabsProperty.getInitializer();
  if (!tabsArray || !Node.isArrayLiteralExpression(tabsArray)) {
    throw new Error('Could not find tabs array');
  }

  // Find the "Content" tab (which contains the layout)
  const contentTab = tabsArray.getElements().find(element => {
    if (Node.isObjectLiteralExpression(element)) {
      const labelProperty = element.getProperty('label');
      if (Node.isPropertyAssignment(labelProperty)) {
        const initializer = labelProperty.getInitializer();
        return Node.isStringLiteral(initializer) && initializer.getLiteralValue() === 'Content';
      }
    }
    return false;
  });

  if (!contentTab || !Node.isObjectLiteralExpression(contentTab)) {
    throw new Error('Could not find Content tab in Pages collection');
  }

  // Find the layout field within the Content tab
  const contentFields = contentTab.getProperty('fields');
  if (!contentFields || !Node.isPropertyAssignment(contentFields)) {
    throw new Error('Could not find fields in Content tab');
  }

  const contentFieldsArray = contentFields.getInitializer();
  if (!contentFieldsArray || !Node.isArrayLiteralExpression(contentFieldsArray)) {
    throw new Error('Could not find fields array in Content tab');
  }

  // Find the layout field
  const layoutField = contentFieldsArray.getElements().find(element => {
    if (Node.isObjectLiteralExpression(element)) {
      const nameProperty = element.getProperty('name');
      if (Node.isPropertyAssignment(nameProperty)) {
        const initializer = nameProperty.getInitializer();
        return Node.isStringLiteral(initializer) && initializer.getLiteralValue() === 'layout';
      }
    }
    return false;
  });

  if (!layoutField || !Node.isObjectLiteralExpression(layoutField)) {
    throw new Error('Could not find layout field');
  }

  // Find the blocks array
  const blocksProperty = layoutField.getProperty('blocks');
  if (!blocksProperty || !Node.isPropertyAssignment(blocksProperty)) {
    throw new Error('Could not find blocks property in layout');
  }

  const blocksArray = blocksProperty.getInitializer();
  if (!blocksArray || !Node.isArrayLiteralExpression(blocksArray)) {
    throw new Error('Could not find blocks array in layout');
  }

  // Check if block is already in array
  const existingElements = blocksArray.getElements();
  const alreadyExists = existingElements.some(element => {
    if (Node.isIdentifier(element)) {
      return element.getText() === blockName;
    }
    return false;
  });

  if (!alreadyExists) {
    // Add block to array
    const lastElement = existingElements[existingElements.length - 1];
    if (lastElement) {
      blocksArray.insertElement(existingElements.length, blockName);
    } else {
      blocksArray.addElement(blockName);
    }
  }

  updatedSourceFile.saveSync();
}

/**
 * Update RenderBlocks.tsx to include new block component
 */
export function updateRenderBlocksComponent(componentPath: string, blockSlug: string, blockComponentPath: string): void {
  // Extract the actual component name from the Component.tsx file
  const fullComponentPath = require('path').resolve(blockComponentPath.replace('./', 'src/blocks/') + '.tsx');
  const componentName = extractComponentName(fullComponentPath);

  if (!componentName) {
    throw new Error(`Could not extract component name from ${fullComponentPath}`);
  }

  // Convert slug to blockType key (camelCase)
  const blockTypeKey = blockSlug.split('-').map((word, index) =>
    index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
  ).join('');

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(componentPath);

  // Find the blockComponents object
  const blockComponents = sourceFile.getVariableDeclaration('blockComponents')?.getInitializer();
  if (!blockComponents || !Node.isObjectLiteralExpression(blockComponents)) {
    throw new Error('Could not find blockComponents object in RenderBlocks.tsx');
  }

  // Check if component is already imported (check both default and named imports)
  const importDeclarations = sourceFile.getImportDeclarations();
  const existingImport = importDeclarations.find(imp => {
    // Check default import
    const defaultImport = imp.getDefaultImport();
    if (defaultImport && defaultImport.getText() === componentName) {
      return true;
    }

    // Check named imports
    const namedImports = imp.getNamedImports();
    return namedImports.some(namedImport => namedImport.getName() === componentName);
  });

  let needsImport = !existingImport;
  if (needsImport) {
    // Add import statement (named import)
    const lastImport = importDeclarations[importDeclarations.length - 1];
    const importText = `\nimport { ${componentName} } from '${blockComponentPath}';\n`;
    sourceFile.insertText(lastImport.getEnd(), importText);
    sourceFile.saveSync(); // Save the import addition
  }

  // Re-load the source file after modification to get fresh AST
  const updatedProject = new Project();
  const updatedSourceFile = updatedProject.addSourceFileAtPath(componentPath);
  const updatedBlockComponents = updatedSourceFile.getVariableDeclaration('blockComponents')?.getInitializer();
  if (!updatedBlockComponents || !Node.isObjectLiteralExpression(updatedBlockComponents)) {
    throw new Error('Could not find blockComponents object in RenderBlocks.tsx after reload');
  }

  // Check if property already exists
  const existingProperties = updatedBlockComponents.getProperties();
  const propertyExists = existingProperties.some(prop => {
    if (Node.isPropertyAssignment(prop)) {
      const name = prop.getName();
      return name === `'${blockTypeKey}'` || name === `"${blockTypeKey}"`;
    }
    return false;
  });

  if (!propertyExists) {
    // Add new property to object
    const lastProperty = existingProperties[existingProperties.length - 1];
    if (lastProperty) {
      const insertPos = lastProperty.getEnd();
      const newPropertyText = `,\n  '${blockTypeKey}': ${componentName}`;
      updatedSourceFile.insertText(insertPos, newPropertyText);
    } else {
      // Object is empty, add first property
      const objectStart = updatedBlockComponents.getStart() + 1; // After opening brace
      updatedSourceFile.insertText(objectStart, `\n  '${blockTypeKey}': ${componentName}\n`);
    }
  }

  updatedSourceFile.saveSync();
}

/**
 * Validate that a file can be parsed as TypeScript
 */
export function validateTypeScriptFile(filePath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);

    // Check for syntax errors
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    for (const diagnostic of diagnostics) {
      errors.push(diagnostic.getMessageText().toString());
    }
  } catch (error) {
    errors.push(`Failed to parse TypeScript file: ${(error as Error).message}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Find Payload config file in project
 */
export function findPayloadConfig(): string | null {
  const possiblePaths = [
    'payload.config.ts',
    'payload.config.js',
    'src/payload.config.ts',
    'src/payload.config.js'
  ];

  for (const path of possiblePaths) {
    if (require('fs').existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Find RenderBlocks component file
 */
export function findRenderBlocksComponent(): string | null {
  const possiblePaths = [
    'src/blocks/RenderBlocks.tsx',
    'src/blocks/RenderBlocks.ts',
    'src/components/RenderBlocks.tsx',
    'src/components/RenderBlocks.ts'
  ];

  for (const path of possiblePaths) {
    if (require('fs').existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Find Pages collection file in project
 */
export function findPagesCollection(): string | null {
  const possiblePaths = [
    'src/collections/Pages/index.ts',
    'src/collections/Pages.ts',
    'src/collections/pages/index.ts',
    'src/collections/pages.ts'
  ];

  for (const path of possiblePaths) {
    if (require('fs').existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Extract the component name from a Component.tsx file
 */
export function extractComponentName(componentPath: string): string | null {
  try {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(componentPath);

    // Look for named exports like "export const ComponentName"
    const variableDeclarations = sourceFile.getVariableDeclarations();
    for (const declaration of variableDeclarations) {
      if (declaration.isExported()) {
        const name = declaration.getName();
        // Check if it's a React component (function or const with JSX)
        const initializer = declaration.getInitializer();
        if (initializer) {
          // Look for React.FC or function patterns
          const type = declaration.getType();
          const typeText = type.getText();
          if (typeText.includes('React.FC') || typeText.includes('FC<') ||
              initializer.getText().includes('React.FC') || initializer.getText().includes('FC<')) {
            return name;
          }
        }
      }
    }

    // Look for export default statements
    const defaultExport = sourceFile.getDefaultExportSymbol();
    if (defaultExport) {
      return defaultExport.getName();
    }

    // Look for export default expressions
    const exportAssignments = sourceFile.getExportAssignments();
    for (const assignment of exportAssignments) {
      if (assignment.isExportEquals() === false) { // export default
        const expression = assignment.getExpression();
        if (expression) {
          return expression.getText();
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting component name:', error);
    return null;
  }
}
