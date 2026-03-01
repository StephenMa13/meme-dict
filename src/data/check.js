const fs = require('fs');

const data = JSON.parse(fs.readFileSync('memes.json', 'utf8'));

// 查找重复的 term
const terms = data.map(item => item.term);
const duplicates = terms.filter((item, index) => terms.indexOf(item) !== index);
const uniqueDuplicates = [...new Set(duplicates)];

if (uniqueDuplicates.length > 0) {
    console.log("⚠️ 发现重复的词条名:", uniqueDuplicates);
} else {
    console.log("✅ 没有发现重复的词条名！总数量:", data.length);
}