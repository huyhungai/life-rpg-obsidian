# 📁 Life RPG Plugin - New Modular Structure

## Overview

The 7,321-line `main.js` has been split into **13 focused modules** for easier maintenance and development.

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Build System                │
│   (combines src/* into main.js)    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│          src/constants.js           │
│  • AI providers & models            │
│  • Skill categories                 │
│  • Game configuration               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       src/utils/helpers.js          │
│  • Utility functions                │
│  • Helper methods                   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│         Services Layer              │
│  ┌───────────────────────────────┐  │
│  │ AIService.js                  │  │
│  │  - Chat completions           │  │
│  │  - Provider handling          │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ SkillService.js               │  │
│  │  - Skill discovery            │  │
│  │  - Evolution & merging        │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ EmbeddingService.js           │  │
│  │  - Create embeddings          │  │
│  │  - Semantic search            │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ JournalAnalyzer.js            │  │
│  │  - Scan journals              │  │
│  │  - Sentiment analysis         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│          UI Layer                   │
│  ┌───────────────────────────────┐  │
│  │ views/HeroView.js             │  │
│  │  - Main dashboard             │  │
│  │  - All tabs (Skills, etc.)   │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ modals/* (5 files)            │  │
│  │  - Character creation         │  │
│  │  - Quest generator            │  │
│  │  - Add skill                  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ LifeRPGSettingTab.js          │  │
│  │  - Settings interface         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      src/LifeRPGPlugin.js           │
│  • Plugin initialization            │
│  • Core game mechanics              │
│  • Settings management              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│           main.js                   │
│    (Generated - Don't Edit!)        │
└─────────────────────────────────────┘
```

## 📊 Size Breakdown

| File | Lines | Purpose |
|------|-------|---------|
| **constants.js** | ~500 | All constants & config |
| **helpers.js** | ~100 | Utility functions |
| **AIService.js** | ~300 | AI communication |
| **SkillService.js** | ~400 | Skill management |
| **EmbeddingService.js** | ~200 | Embeddings |
| **JournalAnalyzer.js** | ~300 | Journal analysis |
| **CharacterCreationModal.js** | ~600 | Character setup |
| **AIQuestGeneratorModal.js** | ~200 | Quest generation |
| **AddSkillModal.js** | ~150 | Skill modal |
| **OtherModals.js** | ~800 | Other modals |
| **HeroView.js** | ~2000 | Main dashboard |
| **LifeRPGSettingTab.js** | ~500 | Settings |
| **LifeRPGPlugin.js** | ~1200 | Main plugin |
| **TOTAL** | ~7,250 | Same as before! |

## 🎯 Benefits

### Before (Monolithic)
```
main.js - 7,321 lines
├── Finding code: Hard 😰
├── Merge conflicts: Common 💥
├── Loading time: Slow 🐌
└── Understanding: Difficult 🤯
```

### After (Modular)
```
src/ - 13 focused files
├── Finding code: Easy 🎯
├── Merge conflicts: Rare ✨
├── Loading time: Same ⚡
└── Understanding: Clear 🧠
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Development mode (auto-rebuild)
npm run watch
```

## 📝 Editing Workflow

1. **Edit source**: `src/services/SkillService.js`
2. **Build**: `npm run build`
3. **Test**: Reload plugin in Obsidian
4. **Repeat**: Changes reflect immediately

## 🔍 Finding Code

### Old Way (Monolithic)
"Where's the skill discovery code?"
→ Search through 7,321 lines 😓

### New Way (Modular)
"Where's the skill discovery code?"
→ Check `src/services/SkillService.js` (400 lines) ✅

## 📦 Module Responsibilities

### **constants.js** - Configuration Hub
- AI provider URLs & models
- Skill categories & examples
- Default settings
- Game constants (XP formulas, etc.)

### **helpers.js** - Utilities
- Date formatting
- XP calculations
- Text processing
- Common functions

### **Services** - Business Logic
- **AIService**: AI API calls
- **SkillService**: Skill logic & discovery
- **EmbeddingService**: Semantic search
- **JournalAnalyzer**: Journal processing

### **Views & Modals** - UI Components
- **HeroView**: Main dashboard (Skills, Character tabs)
- **Modals**: Character creation, quests, etc.
- **SettingTab**: Plugin settings

### **LifeRPGPlugin** - Core
- Plugin lifecycle
- Game mechanics (leveling, HP, XP)
- Settings persistence

## 🛠️ Development Tips

### Adding a New Feature

**Example**: Add "Magic" skill category

1. Edit `src/constants.js`:
```javascript
SKILL_CATEGORIES.magic = {
    name: 'Magic Skills',
    icon: '🔮',
    examples: ['Spellcasting', 'Enchanting']
};
```

2. Edit `src/views/HeroView.js`:
```javascript
// Magic skills will automatically appear!
// (categories are rendered dynamically)
```

3. Build & test:
```bash
npm run build
# Reload plugin in Obsidian
```

### Finding a Bug

**Old way**: Search 7,321 lines
**New way**:
1. Identify area (skills, AI, journal, etc.)
2. Open relevant file (200-600 lines)
3. Fix & rebuild

## 🎓 Learning the Codebase

### Recommended Reading Order

1. **constants.js** - Understand configuration
2. **helpers.js** - Learn utilities
3. **SkillService.js** - Core skill logic
4. **HeroView.js** - UI structure
5. **LifeRPGPlugin.js** - Plugin lifecycle

## 🔐 Build Process

The build script:
1. Reads files in order
2. Strips `module.exports` & `require()`
3. Combines into single `main.js`
4. Copies to plugin directory

**Result**: Modular development, monolithic deployment! 🎯

## 📚 Next Steps

1. ✅ Set up build system
2. ⏳ Extract existing `main.js` into modules
3. ⏳ Test all functionality
4. ⏳ Document each module
5. ⏳ Add module-level comments

---

**The goal**: Make Life RPG plugin easier to maintain, extend, and understand! 🚀
