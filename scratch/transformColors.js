const fs = require('fs');
const path = require('path');

const dir = 'c:\\projects\\logic-arena\\apps\\client\\src\\app\\(dashboard)\\docs\\components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // We look for patterns like `${colorCode}aa` inside strings
  // Usually they are inside backticks: `${colorCode}aa`
  // We want to replace it with `color-mix(in srgb, ${colorCode} 66%, transparent)`
  
  const regex = /\$\{([a-zA-Z0-9_.]+)\}([0-9a-fA-F]{2})\b/g;
  
  content = content.replace(regex, (match, varName, hex) => {
    changed = true;
    const percent = Math.round((parseInt(hex, 16) / 255) * 100);
    return `color-mix(in srgb, \$\{${varName}\} ${percent}%, transparent)`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
