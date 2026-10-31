// Remove duplicate reciter entries from constants.ts
const fs = require('fs');
const path = '/home/z/my-project/src/lib/noorcraft/constants.ts';
let content = fs.readFileSync(path, 'utf-8');

function extractList(name) {
  const regex = new RegExp(`(const ${name}: string\\[\\] = \\[)([\\s\\S]*?)(\\];)`);
  const match = content.match(regex);
  if (!match) return { match: null, items: [] };
  const items = match[2]
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('"'))
    .map(l => ({
      raw: l,
      name: l.match(/"([^"]+)"/)?.[1],
      indent: l.match(/^(\s*)/)?.[1] || '  ',
    }))
    .filter(i => i.name);
  return { match, items };
}

function dedupeList(name) {
  const { match, items } = extractList(name);
  if (!match) return;
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (!seen.has(item.name)) {
      seen.add(item.name);
      unique.push(item);
    }
  }
  const newListBody = unique.map(i => i.raw).join('\n');
  content = content.replace(match[0], `${match[1]}\n${newListBody}\n${match[3]}`);
  console.log(`${name}: ${items.length} -> ${unique.length} (removed ${items.length - unique.length} duplicates)`);
}

dedupeList('FOREIGN_TAHQIQ_RECITERS');

fs.writeFileSync(path, content, 'utf-8');
console.log('File updated.');
