# LifeGame Plugin - Project Context

## Project Status: v3.0.0 COMPLETE - Ready for Testing

## What This Is
An Obsidian plugin that gamifies life using RPG mechanics and 9 GNH (Gross National Happiness) life domains. Includes character creation assessment, AI Life Coach, and smart quest generation via OpenRouter API.

## Source Files
- **Plugin location**: `/Users/buihuyhung/AIProject/.obsidian/plugins/life-rpg/`
- **Project copy**: `/Users/buihuyhung/AIProject/LifeGame Plugin/`
- **Original webapp**: `/Users/buihuyhung/AIProject/Life Game/001-practice-character-creation-session/`

## What Was Completed

### v2.0.0 (Jan 24, 2026) - Character Creation

#### 1. Data Structures
- Replaced 5 skills with 9 GNH domains
- Added `characterProfile` with assessment responses
- Added question bank (37 questions across 9 domains)

### v3.0.0 (Jan 28, 2026) - AI Integration

#### 1. OpenRouter API Integration
- AIService class for API calls
- Support for multiple models (Claude, GPT-4, Gemini, Llama, DeepSeek, Mistral)
- Configurable temperature and max tokens
- Chat history persistence

#### 2. AI Coach Tab
- Full chat interface with message history
- Quick action buttons:
  - "Get Domain Analysis" - Analyzes weakest domains
  - "Suggest Today's Focus" - Daily priority suggestions
  - "Generate Quests" - Opens quest generator modal
  - "Weekly Review" - Progress analysis
- System context includes character profile and domain scores

#### 3. Smart Quest Generator
- AIQuestGeneratorModal class
- Generates 3 quests based on weakest domains
- Each quest includes: name, description, domain, difficulty, XP/gold rewards
- Multi-select interface to add generated quests

#### 4. Settings Tab
- LifeRPGSettingTab class
- OpenRouter API key configuration
- Model selection dropdown (8+ models)
- Temperature slider (0.0-1.0)
- Max tokens setting
- Link to get API key

#### 5. New Achievements
- "AI Explorer" - First AI conversation
- "Quest Crafter" - Generate 10+ AI quests

### v2.0.0 Features (Still Present)

#### 1. Data Structures

### 2. Character Creation Modal
- Welcome screen with name input
- Domain intro screens
- Question display with Likert scale (1-5) buttons
- Progress bar
- Results screen with character card
- Back navigation support

### 3. Character Tab in Hero View
- Empty state with "Create Your Character" button
- Character card display (name, level, title)
- Top 3 strengths / Bottom 3 growth areas
- Collapsible "View All Domains"
- "Retake Assessment" button

### 4. Scoring & Game Logic
- `likertToScore()` - Converts Likert (1-5) to 0-100
- `calculateDomainScores()` - Weighted average per domain
- `calculateLevelFromScores()` - Level = avg / 10 + 1
- Domain XP gain from habits/quests
- Data migration from old skills to new domains

### 5. CSS Styles
- Assessment modal styling
- Likert scale buttons
- Domain grids (3x3 compact display)
- Character card styling
- Progress bars
- Domain bar charts

## Architecture

```
main.js structure:
├── Constants
│   ├── DEFAULT_DOMAINS, QUESTION_BANK, DOMAIN_ORDER
│   ├── OPENROUTER_API_URL, AVAILABLE_MODELS
│   └── DEFAULT_AI_SETTINGS, LIFE_COACH_SYSTEM_PROMPT
├── Scoring Functions (likertToScore, calculateDomainScores, etc.)
├── AIService class
│   ├── chat() - Send messages to AI
│   ├── generateQuests() - Generate quests from AI
│   └── buildContext() - Build character context for prompts
├── CharacterCreationModal class
├── AIQuestGeneratorModal class
├── HeroView class (with 7 tabs including AI Coach)
├── Modal classes (NewHabitModal, NewQuestModal, etc.)
├── LifeRPGSettingTab class (OpenRouter settings)
└── LifeRPG Plugin class (main entry point)
```

## 9 GNH Domains
1. 🧠 Psychological Well-being (4 questions)
2. 💪 Health (5 questions)
3. ⏰ Time Use (4 questions)
4. 📚 Education (4 questions)
5. 🎭 Cultural Resilience (4 questions)
6. ⚖️ Good Governance (5 questions)
7. 🤝 Community Vitality (4 questions)
8. 🌍 Ecological Awareness (4 questions)
9. 💰 Living Standards (4 questions)

## How Domain Scores Influence Game Stats
| Metric | Calculation |
|--------|-------------|
| Level | Average of 9 domain scores / 10 + 1 (range: 1-11) |
| Max HP | 100 + (Level * 10) |
| Starting HP | Max HP |
| Starting Gold | 0 (earned through gameplay) |
| Starting XP | 0 |

## Testing Instructions

### Basic Plugin Test
1. Open Obsidian with AIProject vault
2. Settings → Community Plugins → Reload Life RPG (or enable if disabled)
3. Click sword icon or Cmd+P → "Open Hero Sheet"
4. Go to **Character** tab
5. Click "Create Your Character"
6. Complete 37 questions
7. Verify: domain scores, level, HP calculated correctly

### AI Features Test
1. Go to Settings → Life RPG
2. Enter OpenRouter API key (get from https://openrouter.ai/keys)
3. Select a model (GPT-4o Mini recommended for testing)
4. Click sword icon → Open Hero Sheet
5. Go to **AI Coach** tab
6. Test quick actions:
   - "Get Domain Analysis" - Should analyze your weakest domains
   - "Suggest Today's Focus" - Should recommend priorities
   - "Generate Quests" - Opens modal with AI-generated quests
7. Test chat by typing a message
8. Verify chat history persists after closing/reopening

## Potential Next Steps
- [ ] Test full assessment flow end-to-end
- [ ] Test AI features with OpenRouter API key
- [ ] Add radar chart visualization for domains
- [ ] Add voice input for AI chat
- [ ] Weekly/monthly re-assessment reminders
- [ ] Export character data to markdown
- [ ] Sync domains with daily notes
- [ ] Add more AI-related achievements
- [ ] Implement AI-suggested habit creation
- [ ] Add streak predictions via AI analysis

## Key Files to Read
- `main.js:1-50` - OpenRouter API configuration, available models
- `main.js:51-120` - Life Coach system prompt, question bank start
- `main.js:200-350` - AIService class
- `main.js:400-600` - CharacterCreationModal class
- `main.js:700-900` - AIQuestGeneratorModal class
- `main.js:1000-1200` - HeroView with AI Coach tab
- `main.js:1500-end` - LifeRPGSettingTab class
- `styles.css:467-640` - Character creation styles
- `styles.css:641-end` - AI Coach & settings styles

## Git History
```
197d83b - Add LifeGame Plugin project folder
b75940d - Life RPG v2.0: Character Creation with 9 GNH Domains
```

## Related Plan File
`/Users/buihuyhung/.claude/plans/proud-weaving-pizza.md`
