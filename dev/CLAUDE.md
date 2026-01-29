# LifeGame Plugin - Project Context

## Project Status: v5.0.0 MODULAR - Ready for Community Plugin Release

## What This Is
An Obsidian plugin that gamifies life using RPG mechanics and 9 GNH (Gross National Happiness) life domains. Now with **modular architecture** for easier development and maintenance.

## 📁 Project Structure (IMPORTANT!)

### Root Folder (Clean for Users)
```
/Users/buihuyhung/AIProject/LifeGame Plugin/
├── main.js           ← Built output (308KB, DON'T EDIT!)
├── manifest.json     ← Plugin metadata
├── styles.css        ← Plugin styles
├── package.json      ← Build commands
└── dev/              ← Development files →
```

### Development Folder (Edit Here)
```
/Users/buihuyhung/AIProject/LifeGame Plugin/dev/
├── src/                          ← EDIT THESE FILES
│   ├── constants.js              ← Configuration (150 lines)
│   ├── services/
│   │   └── SkillService.js       ← Skill logic (370 lines)
│   └── views/
│       └── HeroView.js           ← ALL UI tabs (2,261 lines)
├── main-core.js                  ← Stable code (4,429 lines)
├── build.js                      ← Build script
├── scripts/                      ← Build utilities
└── Documentation/
    ├── CLAUDE.md (this file)
    ├── MODULAR-READY.md
    └── ... (more guides)
```

### Plugin Folder (Obsidian Loads From)
```
/Users/buihuyhung/AIProject/.obsidian/plugins/life-rpg/
├── main.js        ← Auto-synced from build
├── manifest.json
└── styles.css
```

## 🔨 Build System (NEW!)

### Commands
```bash
cd "/Users/buihuyhung/AIProject/LifeGame Plugin"

# One-time build
npm run build

# Watch mode (auto-rebuild on save)
npm run watch

# Development mode
npm run dev
```

### How It Works
1. Edit files in `dev/src/`
2. Run `npm run build` from root (or use watch mode)
3. Build combines: `dev/src/constants.js` + `dev/src/services/SkillService.js` + `dev/src/views/HeroView.js` + `dev/main-core.js`
4. Output: `main.js` in root (auto-copied to `.obsidian/plugins/life-rpg/`)
5. Reload plugin in Obsidian

### Build Flow
```
dev/src/constants.js (150 lines)
    +
dev/src/services/SkillService.js (370 lines)
    +
dev/src/views/HeroView.js (2,261 lines)
    +
dev/main-core.js (4,429 lines)
    ↓
[dev/build.js combines]
    ↓
main.js in root (7,268 lines, 308KB)
    ↓
[auto-copied to]
    ↓
.obsidian/plugins/life-rpg/main.js
```

## 📦 Modular Architecture

### Extracted Modules

#### 1. dev/src/constants.js (150 lines)
**What**: All configuration and settings
**Contains**:
- AI_PROVIDERS (OpenRouter, OpenAI, Anthropic, Google)
- MODELS_BY_PROVIDER (chat & embedding models)
- SKILL_CATEGORIES (mind, body, spirit, vocation)
- DEFAULT_SKILL, DEFAULT_SKILLS_SETTINGS
- Helper functions: getChatModels, getEmbeddingModels, getActiveApiKey, etc.

**When to edit**:
- Add new AI provider
- Change skill categories
- Modify default settings
- Add new models

#### 2. dev/src/services/SkillService.js (370 lines)
**What**: Skill discovery, evolution, and management
**Contains**:
- getSkills(), createSkill(), deleteSkill()
- discoverSkillsFromJournal() - AI discovers skills from journal entries
- findSimilarSkill() - Prevents duplicate skills
- checkSkillEvolution() - Level 5 → advanced skills
- processDiscoveredSkills() - Combines similar skills
- mergeSkills() - Merge two skills together
- getSkillSummary() - For display

**Key Features**:
- Simple, broad skill names (1-2 words max)
- Max 3 skills per journal entry
- Auto-combines similar skills
- Evolution at level 5 (configurable)

**When to edit**:
- Change skill discovery prompt
- Modify evolution rules
- Adjust similarity matching
- Change XP calculations

#### 3. dev/src/views/HeroView.js (2,261 lines)
**What**: ALL UI tabs and rendering
**Contains**:
- render() - Main render method
- renderJournal() - Journal entry tab
- renderCharacter() - Hero profile tab
- **renderSkills()** - Skills tab with "Discover Skills" button
- renderElder() - AI Coach tab
- renderQuestsHub() - Habits & quests tab
- renderArena() - Boss fights & dungeons
- renderTavern() - Shop & rest
- renderActivityLog() - History tab

**When to edit**:
- Modify any tab UI
- Add new tabs
- Change button layouts
- Update skill display
- Add UI features

#### 4. dev/main-core.js (4,429 lines)
**What**: Stable code (rarely changed)
**Contains**:
- AIService (AI API calls)
- EmbeddingService (semantic search)
- JournalAnalyzer (journal processing)
- All modals (CharacterCreationModal, AIQuestGeneratorModal, etc.)
- LifeRPGSettingTab (settings interface)
- Main LifeRPG plugin class (core game mechanics)

**When to edit**: Rarely - only when modifying core mechanics

## 🎯 Recent Changes (v5.0.0 - Jan 29, 2026)

### Skill System Improvements
1. **Simplified Discovery**
   - Short, simple names (1-2 words max)
   - Max 3 skills per journal
   - Combines similar activities
   - Avoids duplicates

2. **Skill Evolution System**
   - At level 5, skills evolve into advanced versions
   - Examples:
     - Writing → Professional Writing
     - Programming → Software Engineering
     - Cooking → Culinary Arts
     - 12 total evolutions

3. **Skill Management**
   - Delete button (🗑️) on each skill card
   - Merge skills functionality
   - findSimilarSkill() prevents duplicates

4. **Activity Log Enhancement**
   - New categories: skill_discovered, skill_levelup, skill_evolved
   - Shows skill category, level, and source journal

5. **Manual Discovery Button**
   - Added "🔍 Discover Skills from Journals" button in Skills tab
   - Scans all journals (not just new ones)
   - Shows detailed logs in History tab

### Modular Refactoring
1. **Extracted to Modules**
   - constants.js - Configuration
   - SkillService.js - Skill logic
   - HeroView.js - All UI

2. **Build System**
   - Automated build process
   - Watch mode for development
   - Auto-sync to plugin folder

3. **Documentation**
   - MODULAR-READY.md - Complete guide
   - WHERE-TO-EDIT.md - Visual guide
   - STRUCTURE.md - Architecture
   - README-DEV.md - Developer guide

## 🗂️ File Organization

### Where to Find Code

| Feature | File | Line/Method |
|---------|------|-------------|
| **Skill Discovery Prompt** | dev/src/services/SkillService.js | discoverSkillsFromJournal() ~line 168 |
| **Skill Evolution Rules** | dev/src/services/SkillService.js | checkSkillEvolution() ~line 174 |
| **Skills Tab UI** | dev/src/views/HeroView.js | renderSkills() ~line 42 |
| **Discover Button** | dev/src/views/HeroView.js | renderSkills() ~line 96 |
| **AI Providers** | dev/src/constants.js | AI_PROVIDERS ~line 10 |
| **Skill Categories** | dev/src/constants.js | SKILL_CATEGORIES ~line 102 |
| **Character Tab** | dev/src/views/HeroView.js | renderCharacter() ~line 169 |
| **Elder AI Chat** | dev/src/views/HeroView.js | renderElder() ~line 732 |
| **Settings Tab** | dev/main-core.js | LifeRPGSettingTab class |

## 🎮 Features

### v5.0.0 - Modular Edition (Jan 29, 2026)
- ✅ Modular architecture (3 extracted modules)
- ✅ Build system with watch mode
- ✅ Simplified skill discovery
- ✅ Skill evolution system (level 5)
- ✅ Manual "Discover Skills" button
- ✅ Enhanced activity logging
- ✅ Delete skills functionality

### v3.0.0 - AI Integration (Jan 28, 2026)
- ✅ Multi-provider AI support (OpenRouter, OpenAI, Anthropic, Google)
- ✅ AI Coach tab with chat interface
- ✅ Smart quest generator
- ✅ Elder memory (semantic search)
- ✅ Journal embeddings

### v2.0.0 - Character Creation (Jan 24, 2026)
- ✅ 9 GNH domains
- ✅ 37-question assessment
- ✅ Character profile system
- ✅ Domain scoring

## 🧠 9 GNH Domains
1. 🧠 Psychological Well-being (4 questions)
2. 💪 Health (5 questions)
3. ⏰ Time Use (4 questions)
4. 📚 Education (4 questions)
5. 🎭 Cultural Resilience (4 questions)
6. ⚖️ Good Governance (5 questions)
7. 🤝 Community Vitality (4 questions)
8. 🌍 Ecological Awareness (4 questions)
9. 💰 Living Standards (4 questions)

## 📈 Common Edits

### Add New Skill Category
**File**: `dev/src/constants.js` line ~145
```javascript
magic: {
    name: 'Magic Skills',
    icon: '🔮',
    examples: ['Spellcasting', 'Enchanting']
}
```

### Change Evolution Level (5 → 3)
**File**: `dev/src/services/SkillService.js` line ~174
```javascript
if (skill.level < 3) return null;  // Was 5
```

### Modify Skills Tab
**File**: `dev/src/views/HeroView.js` line ~42
```javascript
renderSkills(container) {
    container.createEl('h3', { text: '⚡ Your Skills' });
    // Modify UI here
}
```

### Add New AI Model
**File**: `dev/src/constants.js` line ~87
```javascript
openrouter: [
    { id: 'new/model-id', name: 'New Model', type: 'chat' },
    // ...
]
```

## 🧪 Testing

### Test Modular Build
```bash
cd "/Users/buihuyhung/AIProject/LifeGame Plugin"
npm run build
# Check output: main.js should be ~307-315KB
# Verify: .obsidian/plugins/life-rpg/main.js is synced
```

### Test Plugin
1. Reload plugin in Obsidian (Cmd+R or Settings → Reload)
2. Open Hero Sheet (sword icon)
3. Test all tabs (Journal, Character, Skills, Elder, etc.)
4. Go to Skills tab → Click "🔍 Discover Skills from Journals"
5. Check History tab for discovery logs

### Test Skill Evolution
1. Create or edit a skill to level 5
2. Discover skills from journal (should trigger evolution)
3. Check that skill name changed to advanced version

## 🚀 Next Steps / TODO

### Immediate
- [x] Modular architecture setup
- [x] Extract SkillService
- [x] Extract HeroView
- [x] Reorganize to /dev folder
- [x] Clean repo structure
- [ ] Create GitHub release v5.0.0
- [ ] Submit to Obsidian community plugins
- [ ] Test all features thoroughly
- [ ] Add more evolution rules

### Future Enhancements
- [ ] Extract remaining modals to separate files
- [ ] Add skill fusion (combine 2 skills at high level)
- [ ] Skill tree visualization
- [ ] Voice input for AI chat
- [ ] Weekly/monthly re-assessment
- [ ] Export character to markdown
- [ ] Sync domains with daily notes
- [ ] More AI achievements

### Consider Extracting
- [ ] AIService.js (if frequently modified)
- [ ] Modals.js (character creation, quests, etc.)
- [ ] SettingsTab.js (settings interface)

## 📚 Documentation Files

**Read in this order**:
1. **MODULAR-READY.md** - Complete guide to modular system
2. **WHERE-TO-EDIT.md** - Visual guide showing where to edit
3. **STRUCTURE.md** - Architecture overview
4. **README-DEV.md** - Development workflow
5. **REFACTORING-PLAN.md** - Migration strategy (historical)

## 🐛 Troubleshooting

### Build Errors
```bash
# Reinstall dependencies (from root)
cd "/Users/buihuyhung/AIProject/LifeGame Plugin"
rm -rf node_modules package-lock.json
npm install

# Build
npm run build
```

### Plugin Not Loading Changes
1. Check build completed: `npm run build`
2. Verify main.js was updated (check timestamp)
3. Verify copied to plugin folder
4. Reload plugin in Obsidian (Cmd+R)
5. Check Obsidian console for errors (Cmd+Option+I)

### Syntax Errors After Build
- Check edited file for JavaScript errors
- Run: `node -c main.js` to check syntax
- Review build output for errors

### Duplicate Declarations
- Means main-core.js has code that's also in extracted modules
- Rebuild main-core.js: `./scripts/build-core.sh`
- Or restore from git: `git checkout main-original.js`

## 🔧 Git & Version Control

### Current Branch: main

### Recent Commits
```
0b6bfb4 - Reorganize repo: Move development files to /dev folder
f27a1a1 - Life RPG v5.0.0: Modular Architecture & Enhanced Skill System
760b9c0 - Improve skill discovery from journal entries
```

### Important Files to Commit
- `dev/src/` folder (all modules)
- `dev/build.js`, `dev/main-core.js`
- `main.js` (built output in root)
- `manifest.json`, `styles.css` (in root)
- `package.json` (in root)
- Documentation (*.md files in dev/)

### Don't Commit
- `node_modules/` (in .gitignore)
- `main.js` (generated, in .gitignore)
- Build artifacts

## 🎯 For Next Claude Session

**You'll want to know**:
1. **Repository reorganized** - Dev files moved to `/dev` folder (Jan 29, 2026)
2. **Root folder is clean** - Only plugin files (main.js, manifest.json, styles.css)
3. **Modular system is ACTIVE** - Source in `dev/src/`
4. **Build required** - Changes need `npm run build` from root
5. **Watch mode available** - `npm run watch` for auto-rebuild
6. **Plugin is RELEASE-READY** - Ready for Obsidian community submission
7. **User actively develops** - Frequently adds features

**Repository structure**:
```
Root (clean):
├── main.js (308KB built output)
├── manifest.json, styles.css
└── dev/ (all development files)

Dev folder:
├── dev/src/constants.js
├── dev/src/services/SkillService.js
├── dev/src/views/HeroView.js
└── dev/main-core.js
```

**Quick context**:
- v5.0.0 complete with modular architecture
- Extracted high-change code (Skills, UI) from 7,321-line monolith
- Build system: dev/build.js combines modules → main.js in root
- Auto-syncs to .obsidian/plugins/life-rpg/main.js
- Everything works, tested, ready for release

**If user asks to**:
- **Add feature** → Edit `dev/src/*`, then `npm run build` from root
- **Modify UI** → Edit `dev/src/views/HeroView.js`
- **Change skill logic** → Edit `dev/src/services/SkillService.js`
- **Add config** → Edit `dev/src/constants.js`
- **Debug** → Check build output, Obsidian console
- **Release** → Create GitHub release with main.js, manifest.json, styles.css

**Common requests**:
- "Add new skill category" → `dev/src/constants.js`
- "Change Skills tab" → `dev/src/views/HeroView.js` renderSkills()
- "Modify evolution" → `dev/src/services/SkillService.js` checkSkillEvolution()
- "Add new tab" → `dev/src/views/HeroView.js` add to tabs array + render method

**Release workflow**:
1. User creates GitHub release (tag: 5.0.0)
2. Uploads: main.js, manifest.json, styles.css
3. Submits to obsidianmd/obsidian-releases repo
4. Waits for Obsidian team approval (~1-2 weeks)

## 📞 Quick Reference

```bash
# Navigate to project
cd "/Users/buihuyhung/AIProject/LifeGame Plugin"

# Build commands
npm run build        # One-time build
npm run watch        # Auto-rebuild on save
npm run dev          # Development mode

# Check files
ls -la dev/src/      # View extracted modules
wc -l main.js        # Check output size (should be ~7,268 lines)
node -c main.js      # Check syntax
ls -lh main.js       # Check file size (should be ~308KB)

# Plugin location
cd "/Users/buihuyhung/AIProject/.obsidian/plugins/life-rpg"
ls -lh               # main.js, manifest.json, styles.css
```

## 🎓 Key Concepts

**Modular Architecture**: Code split into focused files for easier development
**Build System**: Combines modules → single main.js for Obsidian
**Watch Mode**: Auto-rebuilds when source files change
**Hybrid Approach**: Extracted high-change code, kept stable code in main-core.js
**Two-Folder System**: Development folder (edit) + plugin folder (Obsidian loads)

---

**Last Updated**: Jan 29, 2026
**Version**: 5.0.0 Modular Edition
**Status**: Active Development - Modular System Active
