#!/bin/bash
# Creates main-core.js from main.js with extracted sections removed

echo "🔧 Creating clean main-core.js..."

# Start with original main.js
cp main.js main-core-temp.js

# Remove lines: 
# - Keep lines 1-33 (Obsidian require, VIEW_TYPE_HERO, renderMarkdownToHtml)
# - Remove lines 34-279 (Constants - now in src/constants.js)
# - Keep lines 280-1715 
# - Remove lines 1716-2085 (SkillService - now in src/services/)
# - Keep lines 2086-3049
# - Remove lines 3050-5310 (HeroView - now in src/views/)
# - Keep rest

# Build the file
{
  sed -n '1,33p' main.js
  echo ""
  echo "// Constants, SkillService, and HeroView extracted to src/"
  echo "// This file contains everything else"
  echo ""
  sed -n '280,1715p' main.js
  sed -n '2086,3049p' main.js  
  sed -n '5311,$p' main.js
} > main-core.js

LINES=$(wc -l < main-core.js)
echo "✅ Created main-core.js ($LINES lines)"
echo "📊 Removed: Constants (~250 lines), SkillService (~370 lines), HeroView (~2260 lines)"
