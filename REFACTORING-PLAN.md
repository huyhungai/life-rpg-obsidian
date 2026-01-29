# 🏗️ Life RPG Plugin - Modular Refactoring Plan

## ✅ What's Been Done

### 1. Infrastructure Created
- ✅ Directory structure (`src/services/`, `src/modals/`, `src/views/`)
- ✅ Build system (`build.js`, `package.json`)
- ✅ Constants extracted (`src/constants.js`)
- ✅ Documentation (README-DEV.md, STRUCTURE.md)
- ✅ Git ignore configuration

### 2. Build System Setup
```bash
npm install          # Install dependencies
npm run build        # Build main.js from src/
npm run watch        # Auto-rebuild on changes
```

## 🎯 Current Status

**Before Refactoring**:
```
main.js - 7,321 lines (monolithic)
```

**After Refactoring** (Target):
```
src/
├── constants.js (✅ Done - 150 lines)
├── utils/helpers.js (⏳ To do)
├── services/ (⏳ To do)
│   ├── AIService.js
│   ├── SkillService.js
│   ├── EmbeddingService.js
│   └── JournalAnalyzer.js
├── modals/ (⏳ To do)
│   ├── CharacterCreationModal.js
│   ├── AIQuestGeneratorModal.js
│   ├── AddSkillModal.js
│   └── OtherModals.js
├── views/ (⏳ To do)
│   └── HeroView.js
├── LifeRPGSettingTab.js (⏳ To do)
└── LifeRPGPlugin.js (⏳ To do)
```

## 🚀 Next Steps

### Option A: Manual Extraction (Safer, Slower)
Carefully extract each section into modules while testing:

1. **Extract helpers** (Day 1)
   - Copy utility functions to `src/utils/helpers.js`
   - Test build & plugin functionality

2. **Extract services** (Day 2-3)
   - AIService.js
   - SkillService.js
   - EmbeddingService.js
   - JournalAnalyzer.js
   - Test after each extraction

3. **Extract UI components** (Day 4-5)
   - Modals
   - HeroView
   - SettingTab
   - Test thoroughly

4. **Extract main plugin** (Day 6)
   - LifeRPGPlugin.js
   - Final integration testing

### Option B: Keep Current Structure (Simpler)
Continue with monolithic `main.js` but:
- Use the documentation as a mental map
- Add section comments for organization
- Consider refactoring later when adding major features

### Option C: Hybrid Approach (Recommended)
Extract only high-change areas:

1. **Extract frequently modified**:
   - SkillService.js (skill discovery changes often)
   - Constants.js (already done!)
   - HeroView.js (UI changes)

2. **Keep stable sections** in main.js:
   - Old modals
   - Settings tab (rarely changes)
   - Core game mechanics

3. **Build process**:
   ```
   src/constants.js
   + src/services/SkillService.js
   + src/views/HeroView.js
   + main-core.js (remaining code)
   = main.js (final output)
   ```

## 📋 Extraction Checklist

For each module extraction:

- [ ] Create new file in `src/`
- [ ] Copy relevant code
- [ ] Add `module.exports = { ... }`
- [ ] Update `build.js` BUILD_ORDER
- [ ] Run `npm run build`
- [ ] Test in Obsidian
- [ ] Verify all features work
- [ ] Commit changes

## 🎓 Learning Resources

### Understanding the Build Process

**Source file** (`src/services/SkillService.js`):
```javascript
class SkillService {
    // ... code ...
}

module.exports = { SkillService };
```

**Build script** (`build.js`):
```javascript
// Strips module.exports, combines files
```

**Output** (`main.js`):
```javascript
class SkillService {
    // ... code ...
}
// No module.exports - works in Obsidian!
```

## 💡 Development Workflow Examples

### Example 1: Fix Skill Discovery Bug

**Monolithic way**:
1. Open main.js (7,321 lines)
2. Search for skill discovery
3. Find line 1820 (hard to find)
4. Fix bug
5. Reload plugin

**Modular way**:
1. Open `src/services/SkillService.js` (400 lines)
2. Find `discoverSkillsFromJournal` method easily
3. Fix bug
4. Run `npm run build`
5. Reload plugin

### Example 2: Add New UI Feature

**Monolithic way**:
1. Open main.js
2. Scroll to line ~3000 for HeroView
3. Find the right tab render method
4. Edit carefully (risk breaking other code)
5. Test

**Modular way**:
1. Open `src/views/HeroView.js` (2,000 lines, focused)
2. Find tab method quickly
3. Edit with confidence (isolated code)
4. Build & test
5. Other modules unaffected

## ⚠️ Important Warnings

### Don't Break the Plugin!
- Always test after extraction
- Keep backup of working main.js
- Extract one module at a time
- Verify in Obsidian before continuing

### Build System Gotchas
- Run `npm run build` after ANY change
- Watch for module syntax errors
- Check browser console for issues
- Build output goes to project root AND plugin folder

## 🏆 Success Criteria

You'll know the refactoring is successful when:

1. ✅ Plugin works identically to before
2. ✅ All features functional
3. ✅ Build completes without errors
4. ✅ Finding code is faster
5. ✅ Making changes is easier
6. ✅ Merge conflicts are reduced

## 🤔 Decision Time

### For Now (Quick Win)
Use the **Hybrid Approach**:
- Keep existing main.js
- Use build system for NEW features only
- Gradually extract as you modify code

### For Future (Full Refactor)
When you have time:
- Follow **Manual Extraction** plan
- Extract all modules systematically
- Enjoy fully modular codebase

## 📞 Need Help?

The infrastructure is ready! You can:

1. **Start using it now**: Add new features as modules
2. **Refactor gradually**: Extract during bug fixes
3. **Keep monolithic**: Use docs as reference

The choice is yours! The build system is ready whenever you want to use it. 🚀

---

**Bottom line**: You now have the OPTION to work modularly, but you're not FORCED to migrate everything immediately. Start small, test often, and enjoy better code organization! 🎯
