#!/usr/bin/env node
/**
 * Build script for Life RPG Plugin
 * Combines modular source files into a single main.js for Obsidian
 */

const fs = require('fs');
const path = require('path');

// HYBRID APPROACH BUILD ORDER
// Extracted modules are built separately, then combined with main-core.js
const BUILD_ORDER = [
    'src/constants.js',           // Configuration (150 lines)
    'src/services/SkillService.js', // Skill logic (370 lines)
    'src/views/HeroView.js',        // UI code (2261 lines)
    'main-core.js'                  // Everything else
];

function stripModuleExports(content) {
    // Remove module.exports and require() calls
    return content
        .replace(/module\.exports\s*=\s*\{[\s\S]*?\};?/g, '')
        .replace(/const\s+\{[^}]+\}\s*=\s*require\([^)]+\);?/g, '')
        .replace(/const\s+\w+\s*=\s*require\([^)]+\);?/g, '')
        .trim();
}

function build() {
    console.log('🔨 Building Life RPG Plugin...\n');

    // Read Obsidian API require
    const header = `/* Life RPG Plugin v5.0 - Modular Edition */
const { Plugin, ItemView, Notice, Modal, Setting, PluginSettingTab, requestUrl, MarkdownRenderer } = require('obsidian');

`;

    let combined = header;
    let filesProcessed = 0;

    for (const file of BUILD_ORDER) {
        const filePath = path.join(__dirname, file);

        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Skipping missing file: ${file}`);
            continue;
        }

        console.log(`📦 Adding: ${file}`);
        const content = fs.readFileSync(filePath, 'utf8');
        const cleaned = stripModuleExports(content);

        combined += `\n// ============================================================================\n`;
        combined += `// ${file.toUpperCase()}\n`;
        combined += `// ============================================================================\n\n`;
        combined += cleaned + '\n';

        filesProcessed++;
    }

    // Write output
    const outputPath = path.join(__dirname, 'main.js');
    fs.writeFileSync(outputPath, combined, 'utf8');

    console.log(`\n✅ Build complete! Processed ${filesProcessed} files`);
    console.log(`📄 Output: main.js (${Math.round(combined.length / 1024)}KB)`);

    // Copy to plugin directory
    const pluginDir = '/Users/buihuyhung/AIProject/.obsidian/plugins/life-rpg';
    if (fs.existsSync(pluginDir)) {
        fs.copyFileSync(outputPath, path.join(pluginDir, 'main.js'));
        console.log(`📋 Copied to: ${pluginDir}/main.js`);
    }
}

// Run build
try {
    build();
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
