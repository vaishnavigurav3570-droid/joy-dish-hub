import fs from 'fs';
const content = fs.readFileSync('src/components/UserSection.tsx', 'utf8').split('\n');
const replacement = JSON.parse(fs.readFileSync('tmp_user.json', 'utf8')).replacement;

// Insert new imports after 'import GoogleReviewButton...'
const importIdx = content.findIndex(l => l.includes('import GoogleReviewButton from \'./GoogleReviewButton\';'));
if (importIdx !== -1) {
  content.splice(importIdx + 1, 0, `import { UserHero } from './user/UserHero';\nimport { UserMenuViewer } from './user/UserMenuViewer';\nimport { UserCart } from './user/UserCart';\nimport { UserPreOrderSuccess, UserActiveOrder } from './user/UserActiveOrder';`);
}

const startIdx = content.findIndex(l => l.includes('{/* AR Viewer Modal */}'));
const endIdx = content.findIndex(l => l.includes('{/* Footer */}'));

if (startIdx !== -1 && endIdx !== -1) {
  // Replace everything between AR Viewer Modal and Footer
  content.splice(startIdx, endIdx - startIdx, replacement);
  fs.writeFileSync('src/components/UserSection.tsx', content.join('\n'));
  console.log('Successfully replaced UserSection.tsx');
} else {
  console.error(`Indices not found. start: ${startIdx}, end: ${endIdx}`);
}
