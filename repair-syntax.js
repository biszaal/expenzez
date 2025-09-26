#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Patterns to fix the most common broken structures
const repairs = [
  // Fix broken object literals with { flex: 1 } pattern
  {
    name: 'Fix broken flex objects',
    pattern: /\{ flex: 1 \}/g,
    replacement: '{}'
  },

  // Fix broken function calls ending with { flex: 1 }
  {
    name: 'Fix broken function parameters',
    pattern: /\(\{ flex: 1 \}/g,
    replacement: '()'
  },

  // Fix broken array map calls
  {
    name: 'Fix broken map calls',
    pattern: /\.map\(\([^)]*\) => \{ flex: 1 \}/g,
    replacement: '.map((item, index) => item)'
  },

  // Fix broken try-catch blocks
  {
    name: 'Fix try-catch blocks',
    pattern: /try \{ flex: 1 \}/g,
    replacement: 'try {'
  },

  // Fix broken conditional expressions
  {
    name: 'Fix conditional expressions',
    pattern: /if \([^)]*\) \{ flex: 1 \}/g,
    replacement: 'if (true) {'
  },

  // Fix broken StyleSheet patterns
  {
    name: 'Fix StyleSheet.create',
    pattern: /StyleSheet\.create\(\{ flex: 1 \}\}/g,
    replacement: 'StyleSheet.create({ container: { flex: 1 } })'
  },

  // Remove dangling object properties at line start
  {
    name: 'Remove dangling properties',
    pattern: /^\s*\w+:\s*[^,}]*,?\s*$/gm,
    replacement: ''
  },

  // Fix broken console.log removal artifacts
  {
    name: 'Fix console log artifacts',
    pattern: /^\s*[a-zA-Z_][a-zA-Z0-9_]*:\s*[^,}]*,\s*$/gm,
    replacement: ''
  }
];

function repairFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changeCount = 0;

    // Apply all repairs
    repairs.forEach(repair => {
      const before = content;
      content = content.replace(repair.pattern, repair.replacement);
      if (before !== content) {
        changeCount++;
      }
    });

    // Additional cleanup for common broken patterns
    // Fix incomplete return statements
    content = content.replace(/return \{\s*\n\s*\n/gm, 'return {\n');

    // Fix broken function definitions
    content = content.replace(/\(\) => \{\s*\n\s*\n/gm, '() => {\n');

    // Remove empty lines with just braces
    content = content.replace(/^\s*\{\s*$/gm, '');
    content = content.replace(/^\s*\}\s*$/gm, '');

    // Only write if content changed significantly
    if (content !== originalContent && changeCount > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`Repaired: ${filePath} (${changeCount} patterns fixed)`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error repairing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, maxFiles = 50) {
  const files = fs.readdirSync(dir);
  let repairedCount = 0;
  let processedFiles = 0;

  files.forEach(file => {
    if (processedFiles >= maxFiles) return;

    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      const subResult = walkDirectory(filePath, maxFiles - processedFiles);
      repairedCount += subResult.repaired;
      processedFiles += subResult.processed;
    } else if ((file.endsWith('.tsx') || file.endsWith('.ts')) && !file.includes('.d.ts')) {
      if (repairFile(filePath)) {
        repairedCount++;
      }
      processedFiles++;
    }
  });

  return { repaired: repairedCount, processed: processedFiles };
}

console.log('Starting targeted syntax repairs...');
const result = walkDirectory('app');
console.log(`Repaired ${result.repaired} files out of ${result.processed} processed`);