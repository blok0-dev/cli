"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePageCollectionConfig = updatePageCollectionConfig;
exports.updateRenderBlocksComponent = updateRenderBlocksComponent;
exports.validateTypeScriptFile = validateTypeScriptFile;
exports.findPayloadConfig = findPayloadConfig;
exports.findRenderBlocksComponent = findRenderBlocksComponent;
exports.findPagesCollection = findPagesCollection;
const ts_morph_1 = require("ts-morph");
/**
 * Update Payload page collection config to include new block
 */
function updatePageCollectionConfig(pagesCollectionPath, blockConfigPath, blockName) {
    const project = new ts_morph_1.Project();
    const sourceFile = project.addSourceFileAtPath(pagesCollectionPath);
    // Find the Pages collection export
    const pagesExport = sourceFile.getVariableDeclaration('Pages');
    if (!pagesExport) {
        throw new Error('Could not find Pages collection export');
    }
    const pagesObject = pagesExport.getInitializer();
    if (!pagesObject || !ts_morph_1.Node.isObjectLiteralExpression(pagesObject)) {
        throw new Error('Could not find Pages collection object');
    }
    // Find the fields array
    const fieldsProperty = pagesObject.getProperty('fields');
    if (!fieldsProperty || !ts_morph_1.Node.isPropertyAssignment(fieldsProperty)) {
        throw new Error('Could not find fields property in Pages collection');
    }
    const fieldsArray = fieldsProperty.getInitializer();
    if (!fieldsArray || !ts_morph_1.Node.isArrayLiteralExpression(fieldsArray)) {
        throw new Error('Could not find fields array in Pages collection');
    }
    // Find the tabs array within fields
    const tabsField = fieldsArray.getElements().find(element => {
        if (ts_morph_1.Node.isObjectLiteralExpression(element)) {
            const typeProperty = element.getProperty('type');
            if (ts_morph_1.Node.isPropertyAssignment(typeProperty)) {
                const initializer = typeProperty.getInitializer();
                return ts_morph_1.Node.isStringLiteral(initializer) && initializer.getLiteralValue() === 'tabs';
            }
        }
        return false;
    });
    if (!tabsField || !ts_morph_1.Node.isObjectLiteralExpression(tabsField)) {
        throw new Error('Could not find tabs field in Pages collection');
    }
    const tabsProperty = tabsField.getProperty('tabs');
    if (!tabsProperty || !ts_morph_1.Node.isPropertyAssignment(tabsProperty)) {
        throw new Error('Could not find tabs property');
    }
    const tabsArray = tabsProperty.getInitializer();
    if (!tabsArray || !ts_morph_1.Node.isArrayLiteralExpression(tabsArray)) {
        throw new Error('Could not find tabs array');
    }
    // Find the "Content" tab (which contains the layout)
    const contentTab = tabsArray.getElements().find(element => {
        if (ts_morph_1.Node.isObjectLiteralExpression(element)) {
            const labelProperty = element.getProperty('label');
            if (ts_morph_1.Node.isPropertyAssignment(labelProperty)) {
                const initializer = labelProperty.getInitializer();
                return ts_morph_1.Node.isStringLiteral(initializer) && initializer.getLiteralValue() === 'Content';
            }
        }
        return false;
    });
    if (!contentTab || !ts_morph_1.Node.isObjectLiteralExpression(contentTab)) {
        throw new Error('Could not find Content tab in Pages collection');
    }
    // Find the layout field within the Content tab
    const contentFields = contentTab.getProperty('fields');
    if (!contentFields || !ts_morph_1.Node.isPropertyAssignment(contentFields)) {
        throw new Error('Could not find fields in Content tab');
    }
    const contentFieldsArray = contentFields.getInitializer();
    if (!contentFieldsArray || !ts_morph_1.Node.isArrayLiteralExpression(contentFieldsArray)) {
        throw new Error('Could not find fields array in Content tab');
    }
    const layoutField = contentFieldsArray.getElements().find(element => {
        if (ts_morph_1.Node.isObjectLiteralExpression(element)) {
            const nameProperty = element.getProperty('name');
            if (ts_morph_1.Node.isPropertyAssignment(nameProperty)) {
                const initializer = nameProperty.getInitializer();
                return ts_morph_1.Node.isStringLiteral(initializer) && initializer.getLiteralValue() === 'layout';
            }
        }
        return false;
    });
    if (!layoutField || !ts_morph_1.Node.isObjectLiteralExpression(layoutField)) {
        throw new Error('Could not find layout field');
    }
    // Find the blocks array
    const blocksProperty = layoutField.getProperty('blocks');
    if (!blocksProperty || !ts_morph_1.Node.isPropertyAssignment(blocksProperty)) {
        throw new Error('Could not find blocks property in layout');
    }
    const blocksArray = blocksProperty.getInitializer();
    if (!blocksArray || !ts_morph_1.Node.isArrayLiteralExpression(blocksArray)) {
        throw new Error('Could not find blocks array in layout');
    }
    // Check if block is already imported
    const importDeclarations = sourceFile.getImportDeclarations();
    const existingImport = importDeclarations.find(imp => imp.getModuleSpecifier().getLiteralValue() === blockConfigPath);
    if (!existingImport) {
        // Add import statement
        const lastImport = importDeclarations[importDeclarations.length - 1];
        const importText = `import { ${blockName} } from '${blockConfigPath}';\n`;
        sourceFile.insertText(lastImport.getEnd(), importText);
    }
    // Check if block is already in array
    const existingElements = blocksArray.getElements();
    const alreadyExists = existingElements.some(element => {
        if (ts_morph_1.Node.isIdentifier(element)) {
            return element.getText() === blockName;
        }
        return false;
    });
    if (!alreadyExists) {
        // Add block to array
        const lastElement = existingElements[existingElements.length - 1];
        if (lastElement) {
            blocksArray.insertElement(existingElements.length, blockName);
        }
        else {
            blocksArray.addElement(blockName);
        }
    }
    sourceFile.saveSync();
}
/**
 * Update RenderBlocks.tsx to include new block component
 */
function updateRenderBlocksComponent(componentPath, blockSlug, blockComponentPath) {
    const project = new ts_morph_1.Project();
    const sourceFile = project.addSourceFileAtPath(componentPath);
    // Find the blockComponents object
    const blockComponents = sourceFile.getVariableDeclaration('blockComponents')?.getInitializer();
    if (!blockComponents || !ts_morph_1.Node.isObjectLiteralExpression(blockComponents)) {
        throw new Error('Could not find blockComponents object in RenderBlocks.tsx');
    }
    // Check if component is already imported
    const importDeclarations = sourceFile.getImportDeclarations();
    const componentName = blockSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
    const existingImport = importDeclarations.find(imp => {
        const namedImports = imp.getNamedImports();
        return namedImports.some(namedImport => namedImport.getName() === componentName);
    });
    if (!existingImport) {
        // Add import statement
        const lastImport = importDeclarations[importDeclarations.length - 1];
        const importText = `import ${componentName} from '${blockComponentPath}';\n`;
        sourceFile.insertText(lastImport.getEnd(), importText);
    }
    // Check if property already exists
    const existingProperties = blockComponents.getProperties();
    const propertyExists = existingProperties.some(prop => {
        if (ts_morph_1.Node.isPropertyAssignment(prop)) {
            const name = prop.getName();
            return name === `'${blockSlug}'` || name === `"${blockSlug}"`;
        }
        return false;
    });
    if (!propertyExists) {
        // Add new property to object
        const lastProperty = existingProperties[existingProperties.length - 1];
        if (lastProperty) {
            const insertPos = lastProperty.getEnd();
            const newPropertyText = `,\n  '${blockSlug}': ${componentName}`;
            sourceFile.insertText(insertPos, newPropertyText);
        }
        else {
            // Object is empty, add first property
            const objectStart = blockComponents.getStart() + 1; // After opening brace
            sourceFile.insertText(objectStart, `\n  '${blockSlug}': ${componentName}\n`);
        }
    }
    sourceFile.saveSync();
}
/**
 * Validate that a file can be parsed as TypeScript
 */
function validateTypeScriptFile(filePath) {
    const errors = [];
    try {
        const project = new ts_morph_1.Project();
        const sourceFile = project.addSourceFileAtPath(filePath);
        // Check for syntax errors
        const diagnostics = sourceFile.getPreEmitDiagnostics();
        for (const diagnostic of diagnostics) {
            errors.push(diagnostic.getMessageText().toString());
        }
    }
    catch (error) {
        errors.push(`Failed to parse TypeScript file: ${error.message}`);
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Find Payload config file in project
 */
function findPayloadConfig() {
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
function findRenderBlocksComponent() {
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
function findPagesCollection() {
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
