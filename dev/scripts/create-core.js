#!/usr/bin/env node
/**
 * Creates main-core.js from main.js by removing extracted sections
 */

const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'main.js');
const corePath = path.join(__dirname, '..', 'main-core.js');

console.log('🔧 Creating main-core.js...\n');

// Read main.js
const content = fs.readFileSync(mainPath, 'utf8');
const lines = content.split('\n');

// Sections to remove (line ranges)
const sectionsToRemove = [
    // Constants (keep Obsidian require and VIEW_TYPE_HERO only)
    { start: 29, end: 279, name: 'Constants (moved to src/constants.js)' },
    // getSkillXpRequired helper
    { start: 177, end: 180, name: 'getSkillXpRequired function' },
    // SkillService class
    { start: 1712, end: 2085, name: 'SkillService class' }
];

// Mark lines to keep
const linesToKeep = lines.map((line, index) => {
    const lineNum = index + 1;

    for (const section of sectionsToRemove) {
        if (lineNum >= section.start && lineNum <= section.end) {
            return false;
        }
    }

    return true;
});

// Build output
const coreLines = [];
let removedCount = 0;

lines.forEach((line, index) => {
    if (linesToKeep[index]) {
        coreLines.push(line);
    } else {
        removedCount++;
    }
});

// Write output
fs.writeFileSync(corePath, coreLines.join('\n'), 'utf8');

const originalSize = Math.round(content.length / 1024);
const coreSize = Math.round(coreLines.join('\n').length / 1024);
const removed = originalSize - coreSize;

console.log(`✅ Created main-core.js`);
console.log(`📊 Original: ${originalSize}KB`);
console.log(`📊 Core: ${coreSize}KB`);
console.log(`🗑️  Removed: ${removed}KB (${removedCount} lines)`);
console.log(`\nℹ️  Extracted sections are now in:`);
console.log(`   - src/constants.js`);
console.log(`   - src/services/SkillService.js`);
