const fs = require('fs');
const path = require('path');

// Patterns to clean up from the repair script damage
const cleanupPatterns = [
  // Remove standalone TODO comments that break syntax
  {
    pattern: /^\s*\/\/ TODO: Implement\s*$/gm,
    replacement: ''
  },
  {
    pattern: /^\s*\/\/ TODO: Implement function\s*$/gm,
    replacement: ''
  },
  {
    pattern: /^\s*\/\/ TODO: Implement effect\s*$/gm,
    replacement: ''
  },
  {
    pattern: /^\s*\/\/ TODO: Add condition logic\s*$/gm,
    replacement: ''
  },
  {
    pattern: /^\s*\/\/ TODO: Add styles\s*$/gm,
    replacement: ''
  },
  {
    pattern: /^\s*\/\/ TODO: Define interface properties\s*$/gm,
    replacement: ''
  },

  // Fix broken function patterns
  {
    pattern: /(\w+\s*=\s*\([^)]*\)\s*=>\s*\{)\s*\/\/ TODO: Implement\s*\}\s*([^}]+)/gm,
    replacement: '$1\n    $2\n  };'
  },

  // Fix broken condition patterns
  {
    pattern: /(\s*if\s*\([^)]*\)\s*\{)\s*\/\/ TODO: Add condition logic\s*\}\s*([^}]+)/gm,
    replacement: '$1\n    $2\n  }'
  },

  // Fix broken useEffect patterns
  {
    pattern: /(useEffect\(\(\)\s*=>\s*\{)\s*\/\/ TODO: Implement effect\s*\}\s*,\s*\[\]\);\s*([^}]+)/gm,
    replacement: '$1\n    $2\n  }, []);'
  },

  // Fix broken StyleSheet patterns
  {
    pattern: /(\w+:\s*\{)\s*\/\/ TODO: Add styles\s*\}\s*,?\s*([^}]+)/gm,
    replacement: '$1\n    $2\n  },'
  },

  // Fix broken interface patterns
  {
    pattern: /(interface\s+\w+\s*\{)\s*\/\/ TODO: Define interface properties\s*\}\s*([^}]+)/gm,
    replacement: '$1\n  $2\n}'
  },

  // Remove duplicate return null; statements
  {
    pattern: /return null;\s*return null;/gm,
    replacement: 'return null;'
  },

  // Fix duplicate React imports
  {
    pattern: /import React from "react";\s*import React from "react";/gm,
    replacement: 'import React from "react";'
  },

  // Remove empty TODO blocks
  {
    pattern: /\{\s*\/\/ TODO: [^}]*\}\s*(?=\w)/gm,
    replacement: ''
  }
];

function cleanupFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let changes = 0;

    for (const cleanup of cleanupPatterns) {
      const before = content;
      content = content.replace(cleanup.pattern, cleanup.replacement);
      if (before !== content) {
        changes++;
      }
    }

    // Additional manual cleanup for common issues

    // Fix malformed object property patterns
    content = content.replace(/(\w+:\s*)\{\s*\/\/ TODO:[^}]*\}\s*,?\s*(\w+:)/gm, '$1{\n    flex: 1\n  },\n  $2');

    // Clean up empty lines and formatting
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.replace(/^\s*\}\s*([^}])/gm, '  }\n$1');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned up ${filePath} (${changes} patterns fixed)`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Failed to cleanup ${filePath}:`, error.message);
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

          if (stat.isDirectory() && !['node_modules', '.git', '.expo', 'dist', 'build', 'ios', 'android'].includes(item)) {
            traverse(fullPath);
          } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts')) && !item.endsWith('.d.ts')) {
            files.push(fullPath);
          }
        } catch (statError) {
          // Skip broken symlinks
        }
      }
    } catch (readError) {
      // Skip unreadable directories
    }
  }

  traverse(dir);
  return files;
}

// Focus on the most critical files first
const criticalFiles = [
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/bills.tsx',
  'app/(tabs)/progress.tsx',
  'app/(tabs)/account.tsx',
  'app/auth/AuthContext.tsx',
  'contexts/ThemeContext.tsx'
];

console.log('🧹 Starting cleanup of damaged files...');

const projectDir = process.cwd();
let cleanedCount = 0;

// First clean critical files
for (const criticalFile of criticalFiles) {
  const fullPath = path.join(projectDir, criticalFile);
  if (fs.existsSync(fullPath)) {
    if (cleanupFile(fullPath)) {
      cleanedCount++;
    }
  }
}

console.log(`\n🎉 Cleanup complete! Fixed ${cleanedCount} critical files.`);