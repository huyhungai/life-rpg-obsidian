# Development Folder

This folder contains all **development files** for the Life RPG plugin.

**For end users**: You don't need anything in this folder! Just download the plugin files from [Releases](https://github.com/huyhungai/life-rpg-obsidian/releases).

**For developers**: This is where you edit the source code.

## 📁 Structure

```
dev/
├── src/                      ← Source code (edit here!)
│   ├── constants.js          ← Configuration & settings
│   ├── services/
│   │   └── SkillService.js   ← Skill logic
│   └── views/
│       └── HeroView.js       ← UI code
│
├── main-core.js              ← Stable core code
├── build.js                  ← Build script
├── package.json              ← Dev dependencies
├── scripts/                  ← Build utilities
│
└── Documentation/
    ├── CLAUDE.md             ← Complete project context
    ├── MODULAR-READY.md      ← Modular system guide
    ├── WHERE-TO-EDIT.md      ← Development workflow
    └── ... (more guides)
```

## 🔨 Development Workflow

### Setup (One-time)
```bash
cd "/Users/buihuyhung/AIProject/LifeGame Plugin"
npm install
```

### Development
```bash
# Start watch mode (auto-rebuild on save)
npm run watch

# Or build manually
npm run build
```

### Edit Code
1. Edit files in `dev/src/`
2. Save (Cmd+S)
3. Build runs automatically (if watch mode)
4. Output: `main.js` in root folder
5. Auto-copied to `.obsidian/plugins/life-rpg/main.js`
6. Reload plugin in Obsidian (Cmd+R)

## 📚 Documentation

**Start here**: [CLAUDE.md](CLAUDE.md) - Complete project context and architecture

**Key guides**:
- [MODULAR-READY.md](MODULAR-READY.md) - Modular system overview
- [WHERE-TO-EDIT.md](WHERE-TO-EDIT.md) - Visual workflow guide
- [STRUCTURE.md](STRUCTURE.md) - Architecture details

## 🎯 Common Tasks

### Add new feature
1. Find the right file in `dev/src/`
2. Make your changes
3. Run `npm run build`
4. Test in Obsidian

### Modify UI
→ Edit `dev/src/views/HeroView.js`

### Change skill logic
→ Edit `dev/src/services/SkillService.js`

### Add AI model or category
→ Edit `dev/src/constants.js`

## 📦 Build Output

Build combines 4 modules into `main.js`:
- `dev/src/constants.js` (150 lines)
- `dev/src/services/SkillService.js` (370 lines)
- `dev/src/views/HeroView.js` (2,261 lines)
- `dev/main-core.js` (4,429 lines)

Total: ~7,210 lines → `main.js` (307KB)

---

**For complete development documentation, see [CLAUDE.md](CLAUDE.md)**
