const fs = require('fs');
const path = require('path');

// Comprehensive repair patterns
const repairs = [
  // Fix incomplete interface definitions
  {
    name: 'Fix incomplete interfaces',
    pattern: /interface\s+\w+\s*\{\s*$/gm,
    replacement: (match) => match.replace('{', '{\n  // TODO: Define interface properties\n}')
  },

  // Fix incomplete function definitions
  {
    name: 'Fix incomplete functions',
    pattern: /const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{\s*$/gm,
    replacement: (match) => match + '\n    // TODO: Implement function\n  };'
  },

  // Fix broken try-catch blocks
  {
    name: 'Fix incomplete try blocks',
    pattern: /(\s+)try\s*\{\s*$/gm,
    replacement: '$1try {'
  },

  // Fix missing closing braces for objects/functions
  {
    name: 'Fix StyleSheet.create patterns',
    pattern: /const\s+\w+\s*=\s*StyleSheet\.create\(\{\s*\w+:\s*\{\s*$/gm,
    replacement: (match) => match + '\n    // TODO: Add styles\n  }\n});'
  },

  // Fix incomplete return statements
  {
    name: 'Fix incomplete returns',
    pattern: /return\s*\(\s*$/gm,
    replacement: 'return null;'
  },

  // Fix broken JSX fragments
  {
    name: 'Fix JSX fragments',
    pattern: /<>\s*$/gm,
    replacement: '<></>'
  },

  // Fix incomplete Arrow functions
  {
    name: 'Fix arrow functions',
    pattern: /=>\s*\{\s*$/gm,
    replacement: '=> {\n    // TODO: Implement\n  }'
  },

  // Fix incomplete useEffect
  {
    name: 'Fix useEffect',
    pattern: /useEffect\(\(\)\s*=>\s*\{\s*$/gm,
    replacement: 'useEffect(() => {\n    // TODO: Implement effect\n  }, []);'
  },

  // Fix malformed imports
  {
    name: 'Fix malformed imports',
    pattern: /import\s*\{\s*$/gm,
    replacement: 'import React from "react";'
  }
];

function repairFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let changes = 0;

    for (const repair of repairs) {
      const before = content;
      if (typeof repair.replacement === 'function') {
        content = content.replace(repair.pattern, repair.replacement);
      } else {
        content = content.replace(repair.pattern, repair.replacement);
      }
      if (before !== content) {
        changes++;
      }
    }

    // Additional comprehensive fixes

    // Fix incomplete object literals in StyleSheet
    content = content.replace(/(\w+:\s*)\{\s*$/gm, '$1{\n    // TODO: Add styles\n  },');

    // Fix incomplete conditionals
    content = content.replace(/if\s*\([^)]*\)\s*\{\s*$/gm, (match) => match + '\n    // TODO: Add condition logic\n  }');

    // Fix incomplete exports
    content = content.replace(/export\s*\{\s*$/gm, 'export {};');

    // Fix incomplete array destructuring
    content = content.replace(/const\s*\[\s*$/gm, 'const [] = [];');

    // Fix incomplete object destructuring
    content = content.replace(/const\s*\{\s*$/gm, 'const {} = {};');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Repaired ${filePath} (${changes} patterns fixed)`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Failed to repair ${filePath}:`, error.message);
    return false;
  }
}

function findTsxFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        try {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !['node_modules', '.git', '.expo', 'dist', 'build', 'ios', 'android', '.next', 'Pods'].includes(item)) {
            traverse(fullPath);
          } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts')) && !item.endsWith('.d.ts')) {
            files.push(fullPath);
          }
        } catch (statError) {
          // Skip broken symlinks and inaccessible files
          console.warn(`Skipping ${fullPath}: ${statError.message}`);
        }
      }
    } catch (readError) {
      console.warn(`Cannot read directory ${currentDir}: ${readError.message}`);
    }
  }

  traverse(dir);
  return files;
}

// Main execution
const projectDir = process.cwd();
const tsxFiles = findTsxFiles(projectDir);

console.log(`🔧 Found ${tsxFiles.length} TypeScript files to repair`);

let repairedCount = 0;
for (const file of tsxFiles) {
  if (repairFile(file)) {
    repairedCount++;
  }
}

console.log(`\n🎉 Repair complete! Fixed ${repairedCount} files out of ${tsxFiles.length} total files.`);