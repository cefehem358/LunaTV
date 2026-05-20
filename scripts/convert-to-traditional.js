import stc from 'switch-chinese';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const converter = stc();

function toTraditional(text) {
  if (typeof text !== 'string') return text;
  return converter.traditionalized(text);
}

function shouldConvert(text) {
  if (typeof text !== 'string' || !text) return false;
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  if (!hasChinese) return false;
  return true;
}

const replaceTextInFile = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    const original = content;

    content = content.replace(/"([^"]*[\u4e00-\u9fff][^"]*)"/g, (match, p1) => {
      if (shouldConvert(p1)) {
        const traditional = toTraditional(p1);
        if (traditional !== p1) {
          modified = true;
          return `"${traditional}"`;
        }
      }
      return match;
    });

    content = content.replace(/'([^']*[\u4e00-\u9fff][^']*)'/g, (match, p1) => {
      if (shouldConvert(p1)) {
        const traditional = toTraditional(p1);
        if (traditional !== p1) {
          modified = true;
          return `'${traditional}'`;
        }
      }
      return match;
    });

    content = content.replace(/`([^`]*[\u4e00-\u9fff][^`]*)`/g, (match, p1) => {
      if (shouldConvert(p1)) {
        const traditional = toTraditional(p1);
        if (traditional !== p1) {
          modified = true;
          return `\`${traditional}\``;
        }
      }
      return match;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Converted: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
};

const dirs = [
  'src/app',
  'src/components',
  'src/hooks',
];

const processDir = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (/\.(tsx?|jsx?|ts|js)$/.test(file)) {
      replaceTextInFile(fullPath);
    }
  });
};

dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    processDir(dir);
  }
});

console.log('Done!');