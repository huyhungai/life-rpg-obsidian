# Life RPG Plugin v3.0

An Obsidian plugin that gamifies your life with RPG mechanics, 9 GNH (Gross National Happiness) life domains, and AI Life Coach integration.

## Features

### AI Life Coach (v3.0)
- **Chat Interface** - Full conversation with AI life coach
- **Context-Aware** - AI knows your domain scores, habits, and quests
- **Quick Actions**:
  - Domain Analysis - Identifies weakest areas for improvement
  - Today's Focus - Suggests daily priorities
  - Generate Quests - AI creates personalized quests
  - Weekly Review - Progress analysis and recommendations
- **OpenRouter Integration** - Support for multiple AI models:
  - Claude Sonnet 4, GPT-4o, Gemini 2.0, Llama 3.3, DeepSeek, Mistral

### Character Creation
- 37-question assessment based on GNH framework
- Likert scale (1-5) responses
- Calculates scores for 9 life domains
- Sets initial character level based on assessment results

### 9 Life Domains
| Domain | Icon | Description |
|--------|------|-------------|
| Psychological Well-being | 🧠 | Mental health, life satisfaction, emotional balance |
| Health | 💪 | Physical health, sleep, nutrition, exercise |
| Time Use | ⏰ | Work-life balance, time management |
| Education | 📚 | Learning, skills development |
| Cultural Resilience | 🎭 | Cultural identity, authentic self-expression |
| Good Governance | ⚖️ | Personal agency, decision-making, boundaries |
| Community Vitality | 🤝 | Relationships, social connections |
| Ecological Awareness | 🌍 | Environmental consciousness |
| Living Standards | 💰 | Financial security, material well-being |

### RPG Mechanics
- **HP** - Health points (lose from bad habits, recover daily)
- **XP** - Experience points (gain from habits/quests)
- **Gold** - Currency for rewards shop
- **Level** - Based on domain scores and XP

### Gamification Features
- Daily habits with streak tracking
- Quests with deadlines and difficulty
- Bad habits that cost HP
- Reward shop to spend gold
- Achievements system

## Installation

1. Copy `main.js`, `styles.css`, and `manifest.json` to:
   ```
   <your-vault>/.obsidian/plugins/life-rpg/
   ```
2. Enable the plugin in Obsidian Settings → Community Plugins

## Usage

### Basic Setup
1. Click the sword icon (⚔️) in the left ribbon or use Cmd/Ctrl+P → "Open Hero Sheet"
2. Go to **Character** tab → "Create Your Character"
3. Complete the 37-question assessment
4. Start adding habits and quests linked to your domains

### AI Coach Setup
1. Go to Obsidian Settings → Life RPG
2. Get an API key from [OpenRouter](https://openrouter.ai/keys)
3. Paste API key in settings
4. Select your preferred model (GPT-4o Mini recommended for cost)
5. Go to Hero Sheet → **AI Coach** tab
6. Start chatting or use quick action buttons

## Files

- `main.js` - All plugin logic (~2000 lines)
- `styles.css` - UI styles (~800 lines)
- `manifest.json` - Plugin metadata
- `CLAUDE.md` - AI context for continuation

## Development Notes

### Data Structure
```javascript
settings = {
  level, xp, hp, maxHp, gold,
  domains: [...],  // 9 GNH domains with score, level, xp
  characterProfile: { name, createdAt, assessmentComplete, assessmentResponses },
  habits: [...],
  quests: [...],
  badHabits: [...],
  rewards: [...],
  achievements: [...],
  // AI Settings (v3.0)
  openRouterApiKey: '',
  selectedModel: 'openai/gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
  chatHistory: [...]
}
```

### Key Functions
- `likertToScore()` - Converts 1-5 to 0-100
- `calculateDomainScores()` - Weighted average per domain
- `calculateLevelFromScores()` - Average of domains / 10 + 1

### Domain Score Influence
| Metric | Calculation |
|--------|-------------|
| Level | Average of 9 domain scores / 10 + 1 (range: 1-11) |
| Max HP | 100 + (Level * 10) |
| Starting HP | Max HP |

## Source
Integrated from webapp: `001-practice-character-creation-session/`

## Version History
- **v3.0.0** - AI Life Coach with OpenRouter integration, chat interface, smart quest generation
- **v2.0.0** - Character creation with 9 GNH domains (37 questions)
- **v1.0.0** - Original version with 5 skills
