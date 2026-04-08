import fs from 'fs';
const content = fs.readFileSync('src/components/OwnerSection.tsx', 'utf8').split('\n');
const replacement = JSON.parse(fs.readFileSync('tmp.json', 'utf8')).replacement;
const startIdx = content.findIndex(l => l.includes('{/* ═══════ ORDERS TAB ═══════ */}'));
let endIdx = -1;
for (let i = startIdx; i < content.length; i++) {
  if (content[i].trim() === '</Tabs>') {
    endIdx = i;
    break;
  }
}
if (startIdx !== -1 && endIdx !== -1) {
  content.splice(startIdx, endIdx - startIdx + 1, replacement);
  fs.writeFileSync('src/components/OwnerSection.tsx', content.join('\n'));
  console.log('Successfully replaced OwnerSection.tsx');
} else {
  console.error(`Indices not found. start: ${startIdx}, end: ${endIdx}`);
}
