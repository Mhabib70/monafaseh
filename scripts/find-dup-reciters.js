// Find duplicate reciter names in constants.ts
const fs = require('fs');
const content = fs.readFileSync('/home/z/my-project/src/lib/noorcraft/constants.ts', 'utf-8');

function extractList(name) {
  const regex = new RegExp(`const ${name}: string\\[\\] = \\[([\\s\\S]*?)\\];`);
  const match = content.match(regex);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('"'))
    .map(l => l.match(/"([^"]+)"/)?.[1])
    .filter(Boolean);
}

const lists = {
  IRANIAN_TAHQIQ_RECITERS: extractList('IRANIAN_TAHQIQ_RECITERS'),
  FOREIGN_TAHQIQ_RECITERS: extractList('FOREIGN_TAHQIQ_RECITERS'),
  IRANIAN_TARTIL_RECITERS: extractList('IRANIAN_TARTIL_RECITERS'),
  FOREIGN_TARTIL_RECITERS: extractList('FOREIGN_TARTIL_RECITERS'),
};

for (const [name, list] of Object.entries(lists)) {
  console.log(`\n=== ${name} (${list.length} total) ===`);
  const seen = new Map();
  const dups = [];
  for (const item of list) {
    seen.set(item, (seen.get(item) || 0) + 1);
    if (seen.get(item) === 2) dups.push(item);
  }
  if (dups.length > 0) {
    console.log(`Duplicates (${dups.length}):`);
    dups.forEach(d => console.log(`  - ${d}`));
  } else {
    console.log('No duplicates');
  }
}
