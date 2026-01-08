const { updatePageCollectionConfig, updateRenderBlocksComponent, findPagesCollection, extractComponentName } = require('./dist/ast/index.js');
const { slugToIdentifier } = require('./dist/blocks/index.js');
const fs = require('fs');

// Test case: Add editorial--carousel block
// Simulates: blok0 add-block https://www.blok0.xyz/api/cli/sections/editorial--carousel

console.log('🧪 Testing Editorial Carousel Block Addition');
console.log('==========================================');
console.log('');

// Change to Payload project directory
const payloadProjectPath = '../newcms';
console.log(`📁 Changing to Payload project directory: ${payloadProjectPath}`);
try {
  process.chdir(payloadProjectPath);
  console.log('✅ Successfully changed directory');
} catch (error) {
  console.log('❌ Failed to change directory:', error.message);
  process.exit(1);
}

console.log('');
console.log('🔍 Finding Pages collection...');
const pagesPath = findPagesCollection();
console.log('Pages collection path:', pagesPath);

if (pagesPath) {
  console.log('');
  console.log('🧪 Testing AST update for editorial--carousel block...');

  const blockSlug = 'editorial--carousel';
  const blockIdentifier = slugToIdentifier(blockSlug);
  const blockConfigPath = `@/blocks/${blockSlug}/config`;

  console.log(`Block slug: ${blockSlug}`);
  console.log(`Block identifier: ${blockIdentifier}`);
  console.log(`Config path: ${blockConfigPath}`);
  console.log('');

  // Read file before modification
  const originalContent = fs.readFileSync(pagesPath, 'utf-8');
  const hasOriginalImport = originalContent.includes(`import { ${blockIdentifier} } from '${blockConfigPath}'`);
  const hasOriginalBlock = originalContent.includes(blockIdentifier);

  console.log('📋 Before modification:');
  console.log(`  - Import present: ${hasOriginalImport}`);
  console.log(`  - Block in array: ${hasOriginalBlock}`);
  console.log('');

  try {
    updatePageCollectionConfig(pagesPath, blockConfigPath, blockIdentifier);

    // Read file after modification
    const updatedContent = fs.readFileSync(pagesPath, 'utf-8');
    const hasUpdatedImport = updatedContent.includes(`import { ${blockIdentifier} } from '${blockConfigPath}'`);
    const hasUpdatedBlock = updatedContent.includes(blockIdentifier);

    console.log('📋 After Pages modification:');
    console.log(`  - Import present: ${hasUpdatedImport}`);
    console.log(`  - Block in array: ${hasUpdatedBlock}`);
    console.log('');

    if (hasUpdatedImport && hasUpdatedBlock) {
      console.log('✅ Pages collection update successful!');
    } else {
      console.log('⚠️  Pages collection update issues:');
      if (!hasUpdatedImport) console.log('  - ❌ Import was not added');
      if (!hasUpdatedBlock) console.log('  - ❌ Block was not added to array');
      process.exit(1);
    }

    // Now test RenderBlocks update
    console.log('🧪 Testing RenderBlocks component update...');

    const renderBlocksPath = '../newcms/src/blocks/RenderBlocks.tsx';
    const componentPath = `./${blockSlug}/Component`;

    // Check if the component file exists (it won't for editorial-carousel in test)
    const fullComponentPath = require('path').resolve(componentPath.replace('./', 'src/blocks/') + '.tsx');
    const componentExists = fs.existsSync(fullComponentPath);

    if (componentExists) {
      console.log('📄 Component file exists, testing full RenderBlocks update...');

      // Extract the actual component name
      const actualComponentName = extractComponentName(fullComponentPath);
      const blockTypeKey = 'editorialCarousel';

      console.log(`Extracted component name: ${actualComponentName}`);
      console.log(`Block type key: ${blockTypeKey}`);

      // Read RenderBlocks before modification
      const originalRenderBlocksContent = fs.readFileSync(renderBlocksPath, 'utf-8');
      const hasOriginalComponentImport = originalRenderBlocksContent.includes(`import { ${actualComponentName} } from '${componentPath}'`);
      const hasOriginalBlockComponent = originalRenderBlocksContent.includes(`'${blockTypeKey}': ${actualComponentName}`);

      console.log('📋 RenderBlocks before modification:');
      console.log(`  - Component import present: ${hasOriginalComponentImport}`);
      console.log(`  - Block component mapping present: ${hasOriginalBlockComponent}`);
      console.log('');

      updateRenderBlocksComponent(renderBlocksPath, blockSlug, componentPath);

      // Read RenderBlocks after modification
      const updatedRenderBlocksContent = fs.readFileSync(renderBlocksPath, 'utf-8');
      const hasUpdatedComponentImport = updatedRenderBlocksContent.includes(`import { ${actualComponentName} } from '${componentPath}'`);
      const hasUpdatedBlockComponent = updatedRenderBlocksContent.includes(`'${blockTypeKey}': ${actualComponentName}`);

      console.log('📋 RenderBlocks after modification:');
      console.log(`  - Component import present: ${hasUpdatedComponentImport}`);
      console.log(`  - Block component mapping present: ${hasUpdatedBlockComponent}`);
      console.log('');

      if (hasUpdatedComponentImport && hasUpdatedBlockComponent) {
        console.log('✅ RenderBlocks update successful! Component and mapping added.');
        console.log('');
        console.log('🎉 Complete test passed! Pages collection and RenderBlocks updates work correctly.');
      } else {
        console.log('⚠️  RenderBlocks update issues:');
        if (!hasUpdatedComponentImport) console.log('  - ❌ Component import was not added');
        if (!hasUpdatedBlockComponent) console.log('  - ❌ Block component mapping was not added');
        console.log('');
        console.log('💥 Test failed! RenderBlocks implementation has issues.');
        process.exit(1);
      }
    } else {
      console.log('📄 Component file does not exist (expected for test), testing error handling...');

      try {
        updateRenderBlocksComponent(renderBlocksPath, blockSlug, componentPath);
        console.log('❌ Expected error but function succeeded unexpectedly');
        process.exit(1);
      } catch (error) {
        console.log('✅ Function correctly failed with error:', error.message);
        console.log('');
        console.log('🎉 Test passed! Function properly handles missing component files.');
      }
    }
  } catch (error) {
    console.log('❌ AST update failed:', error.message);
    console.log('');
    console.log('💥 Test failed! The bug may not be fully fixed.');
    process.exit(1);
  }
} else {
  console.log('❌ Could not find Pages collection in Payload project');
  console.log('Make sure you are running this from a valid Payload CMS project directory.');
  process.exit(1);
}
