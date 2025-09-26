#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common broken patterns from console.log cleanup
const fixes = [
  // Fix broken object literals at end of blocks
  {
    pattern: /^(\s*)\w+:\s*[^,}]*,\s*$/gm,
    replacement: ''
  },
  // Fix broken console.log object patterns
  {
    pattern: /^(\s*)(\w+):\s*([^,}]*),\s*$/gm,
    replacement: ''
  },
  // Fix broken try blocks
  {
    pattern: /^(\s*)}\s*catch\s*\(\s*error/gm,
    replacement: '$1} catch (error'
  },
  // Fix broken StyleSheet.create patterns
  {
    pattern: /StyleSheet\.create\(\{\s*$/,
    replacement: 'StyleSheet.create({\n  container: { flex: 1 },\n});'
  },
  // Fix broken empty objects
  {
    pattern: /\{\s*\n\s*$/gm,
    replacement: '{ flex: 1 }'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Apply all fixes
    fixes.forEach(fix => {
      content = content.replace(fix.pattern, fix.replacement);
    });

    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      fixedCount += walkDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

console.log('Starting syntax error fixes...');
const fixedCount = walkDirectory('.');
console.log(`Fixed ${fixedCount} files`);