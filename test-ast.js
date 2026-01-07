const { updatePageCollectionConfig, findPagesCollection } = require('./dist/ast/index.js');

console.log('Testing findPagesCollection...');
const pagesPath = findPagesCollection();
console.log('Pages collection path:', pagesPath);

if (pagesPath) {
  console.log('Testing updatePageCollectionConfig...');
  try {
    updatePageCollectionConfig(pagesPath, './src/blocks/test-block/config', 'TestBlock');
    console.log('✅ AST update successful!');
  } catch (error) {
    console.log('❌ AST update failed:', error.message);
  }
} else {
  console.log('❌ Could not find Pages collection');
}