const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'src', 'data', 'memes.json');
let raw = fs.readFileSync(file, 'utf8');
let data = JSON.parse(raw);
let changed = false;
for (let i = 0; i < data.length; i++) {
  const item = data[i];
  if (item.hasOwnProperty('category') && typeof item.category === 'string') {
    item.category = [item.category];
    changed = true;
  }
}
if (changed) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated categories to arrays in', file);
} else {
  console.log('No changes needed');
}
