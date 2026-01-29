# Life RPG Plugin - Development Guide

## 📁 Modular Structure

The plugin is now organized into modular files for better maintainability:

```
LifeGame Plugin/
├── src/
│   ├── constants.js              # All constants & configuration
│   ├── utils/
│   │   └── helpers.js            # Utility functions
│   ├── services/
│   │   ├── AIService.js          # AI provider communication
│   │   ├── SkillService.js       # Skill management & discovery
│   │   ├── EmbeddingService.js   # Journal embeddings
│   │   └── JournalAnalyzer.js    # Journal analysis
│   ├── modals/
│   │   ├── CharacterCreationModal.js
│   │   ├── AIQuestGeneratorModal.js
│   │   ├── AddSkillModal.js
│   │   └── OtherModals.js        # Smaller modals
│   ├── views/
│   │   └── HeroView.js           # Main hero dashboard
│   ├── LifeRPGSettingTab.js      # Settings interface
│   └── LifeRPGPlugin.js          # Main plugin class
├── build.js                       # Build script
├── package.json                   # NPM config
└── main.js                        # Generated output (don't edit!)

```

## 🔨 Build System

### Why?
- **Development**: Edit small, focused files
- **Production**: Obsidian loads a single `main.js`
- **Build script**: Combines all modules into `main.js`

### Build Commands

```bash
# One-time build
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch

# Development mode
npm run dev
```

### First Time Setup

```bash
cd "/Users/buihuyhung/AIProject/LifeGame Plugin"
npm install
npm run build
```

## 📝 Development Workflow

### 1. **Edit Source Files**
Edit files in `src/` directory:
- `src/constants.js` - Add new constants
- `src/services/SkillService.js` - Modify skill logic
- `src/views/HeroView.js` - Update UI

### 2. **Build**
```bash
npm run build
```

### 3. **Test in Obsidian**
1. Reload the plugin in Obsidian
2. Test your changes
3. Check console for errors

### 4. **Watch Mode (Optional)**
Auto-rebuild on file changes:
```bash
npm run watch
```

## 📂 File Responsibilities

### `src/constants.js`
- AI provider configs
- Skill categories
- Default settings
- Game constants

### `src/services/AIService.js`
- Multi-provider AI communication
- Chat & embedding API calls
- Response parsing

### `src/services/SkillService.js`
- Skill discovery from journals
- Skill evolution & merging
- XP & leveling logic

### `src/services/EmbeddingService.js`
- Create embeddings for journal entries
- Semantic search functionality

### `src/services/JournalAnalyzer.js`
- Scan journal entries
- Sentiment analysis
- Domain score calculation

### `src/views/HeroView.js`
- Main dashboard UI
- Tab rendering (Skills, Character, Quests, etc.)
- User interactions

### `src/LifeRPGPlugin.js`
- Plugin initialization
- Settings management
- Core game mechanics (XP, HP, leveling)

## 🎯 Adding New Features

### Example: Add a new skill category

1. **Edit constants.js**:
```javascript
SKILL_CATEGORIES.magic = {
    name: 'Magic Skills',
    icon: '✨',
    examples: ['Spellcasting', 'Potion Making']
};
```

2. **Build**:
```bash
npm run build
```

3. **Test in Obsidian**

## ⚠️ Important Rules

1. **Never edit `main.js` directly** - It's auto-generated
2. **Always run `npm run build`** after changes
3. **Use `module.exports`** in source files for IDE support
4. **Build script strips** module syntax for Obsidian

## 🐛 Troubleshooting

### Build fails
```bash
# Check Node.js is installed
node --version

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Changes not showing
1. Run `npm run build`
2. Reload plugin in Obsidian (Cmd+R)
3. Check browser console for errors

### File not found
Check `BUILD_ORDER` in `build.js` matches your file structure

## 📦 Distribution

For distribution, only include:
- `main.js` (generated)
- `manifest.json`
- `styles.css`

The `src/` directory is for development only.

## 🚀 Quick Reference

```bash
# Build once
npm run build

# Auto-rebuild on changes
npm run watch

# View build output size
npm run build | grep "Output:"
```

## 📊 File Size Reduction

- **Before**: main.js (7,321 lines, ~300KB)
- **After**: Organized in 13 smaller files (~20-200 lines each)
- **Built main.js**: Same functionality, easier to maintain!
