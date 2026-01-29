# 📍 Where to Edit - Quick Guide

## 🎯 Simple Rule

**Edit in ONE place only**: `/Users/buihuyhung/AIProject/LifeGame Plugin/`

## 📁 Folder Structure Explained

### Development Folder (YOUR WORKSPACE) ⚒️

```
/Users/buihuyhung/AIProject/LifeGame Plugin/
│
├── 📝 src/                    ← ✅ EDIT HERE!
│   │
│   ├── constants.js           ← Config, settings, categories
│   │
│   ├── services/
│   │   └── SkillService.js    ← Skill logic, discovery, evolution
│   │
│   └── views/
│       └── HeroView.js        ← ALL UI tabs (Skills, Character, etc.)
│
├── 🔧 build.js                ← Build script (don't edit)
├── 📦 package.json            ← NPM config (don't edit)
├── main-core.js               ← Stable code (rarely edit)
└── main.js                    ← Generated output (DON'T EDIT!)
```

### Plugin Folder (OBSIDIAN READS FROM) 🔌

```
/Users/buihuyhung/AIProject/.obsidian/plugins/life-rpg/
│
├── main.js        ← Auto-copied from build (DON'T EDIT!)
├── manifest.json  ← Plugin metadata
└── styles.css     ← Plugin styles
```

## 🚀 Your Workflow

### Step 1: Edit Source Files

Open your editor in the **development folder**:

```bash
cd "/Users/buihuyhung/AIProject/LifeGame Plugin"
code .   # or use your preferred editor
```

Edit any file in `src/`:
- `src/constants.js`
- `src/services/SkillService.js`
- `src/views/HeroView.js`

### Step 2: Build

Run build (or use watch mode):

```bash
# One-time build
npm run build

# OR watch mode (auto-builds on save)
npm run watch
```

### Step 3: Magic Happens! ✨

The build script automatically:
1. Combines `src/*` + `main-core.js`
2. Creates `main.js`
3. **Copies to** `.obsidian/plugins/life-rpg/main.js`

You don't need to manually copy anything!

### Step 4: Test

Reload plugin in Obsidian (Cmd+R)

## 📊 Visual Flow

```
YOU EDIT HERE:
┌─────────────────────────────────────────┐
│ LifeGame Plugin/src/                    │
│  ├── constants.js                       │
│  ├── services/SkillService.js           │
│  └── views/HeroView.js                  │
└─────────────────────────────────────────┘
                   ↓
          [npm run build]
                   ↓
┌─────────────────────────────────────────┐
│ LifeGame Plugin/main.js (generated)     │
└─────────────────────────────────────────┘
                   ↓
        [Auto-copied to...]
                   ↓
┌─────────────────────────────────────────┐
│ .obsidian/plugins/life-rpg/main.js      │
│ (Obsidian loads from here)              │
└─────────────────────────────────────────┘
```

## ❓ Common Questions

### Q: Where do I edit UI code?
**A**: `src/views/HeroView.js`

### Q: Where do I change skill logic?
**A**: `src/services/SkillService.js`

### Q: Where do I add new categories?
**A**: `src/constants.js`

### Q: Do I need to manually copy files?
**A**: NO! Build script does it automatically

### Q: Where does Obsidian load the plugin from?
**A**: `.obsidian/plugins/life-rpg/main.js` (auto-synced)

### Q: What if I edit main.js directly?
**A**: ❌ DON'T! It gets overwritten on next build

### Q: Can I edit files in .obsidian/plugins/life-rpg/?
**A**: ❌ NO! Edit in `LifeGame Plugin/src/` instead

## ✅ Quick Test

Try this to verify everything works:

```bash
# 1. Navigate to dev folder
cd "/Users/buihuyhung/AIProject/LifeGame Plugin"

# 2. Edit a file
echo "// Test comment" >> src/constants.js

# 3. Build
npm run build

# 4. Check if synced
ls -lh main.js .obsidian/plugins/life-rpg/main.js

# They should have the same size!
```

## 🎯 Remember

**ONE RULE**: Only edit files in `LifeGame Plugin/src/`

Everything else happens automatically! 🚀

---

## 📍 Quick Reference

| What | Where |
|------|-------|
| **Edit code** | `LifeGame Plugin/src/` |
| **Build** | `npm run build` in `LifeGame Plugin/` |
| **Output** | `LifeGame Plugin/main.js` (auto-generated) |
| **Plugin loads from** | `.obsidian/plugins/life-rpg/main.js` (auto-synced) |
| **Reload** | Cmd+R in Obsidian |

That's it! 🎉
