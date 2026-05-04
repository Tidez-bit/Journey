const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');

const replacements = {
  'cyan-400': 'blue-400',
  'cyan-500': 'blue-500',
  'cyan-600': 'blue-600',
  'green-400': 'emerald-400',
  'green-500': 'emerald-500',
  'green-600': 'emerald-600',
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;

      for (const [key, value] of Object.entries(replacements)) {
        content = content.split(key).join(value);
      }

      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcPath);
console.log('Mass theme token replacement completed.');
