# Life RPG

An Obsidian plugin that gamifies your life using RPG mechanics, 9 GNH (Gross National Happiness) life domains, and an AI Life Coach.

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22life-rpg%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

## Features

### Character Creation
- **37-question assessment** based on the GNH (Gross National Happiness) framework
- Calculates scores for **9 life domains**
- Sets initial character level based on your assessment results

### 9 Life Domains
| Domain | Description |
|--------|-------------|
| Psychological Well-being | Mental health, life satisfaction, emotional balance |
| Health | Physical health, sleep, nutrition, exercise |
| Time Use | Work-life balance, time management |
| Education | Learning, skills development |
| Cultural Resilience | Cultural identity, authentic self-expression |
| Good Governance | Personal agency, decision-making, boundaries |
| Community Vitality | Relationships, social connections |
| Ecological Awareness | Environmental consciousness |
| Living Standards | Financial security, material well-being |

### RPG Mechanics
- **HP** - Health points (lose from bad habits, recover daily)
- **XP** - Experience points (gain from completing habits/quests)
- **Gold** - Currency for the rewards shop
- **Level** - Based on domain scores and XP

### Gamification
- Daily habits with streak tracking
- Quests with deadlines and difficulty levels
- Bad habits that cost HP
- Reward shop to spend your gold
- Achievements system

### AI Life Coach (Optional)
- Chat with an AI coach that knows your domain scores
- Get personalized advice based on your strengths and growth areas
- Generate AI-powered quests targeting your weakest domains
- Supports 12+ AI models via OpenRouter (Claude, GPT, Gemini, etc.)

## Installation

### From Obsidian Community Plugins
1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Life RPG"
4. Install and enable the plugin

### Manual Installation
1. Download `main.js`, `styles.css`, and `manifest.json` from the [latest release](https://github.com/huyhungai/life-rpg-obsidian/releases)
2. Create a folder: `<your-vault>/.obsidian/plugins/life-rpg/`
3. Place the downloaded files in the folder
4. Reload Obsidian and enable the plugin

## Usage

1. Click the sword icon in the left ribbon or use `Cmd/Ctrl+P` → "Open Hero Sheet"
2. Go to the **Character** tab and click "Create Your Character"
3. Complete the 37-question life assessment
4. Start adding habits and quests linked to your domains
5. (Optional) Configure AI Coach in Settings → Life RPG

## AI Setup (Optional)

The AI features require an OpenRouter API key:

1. Go to [openrouter.ai](https://openrouter.ai) and create an account
2. Generate an API key
3. In Obsidian: Settings → Life RPG → paste your API key
4. Select your preferred AI model

## Screenshots

*Coming soon*

## Support

- [Report issues](https://github.com/huyhungai/life-rpg-obsidian/issues)
- [Feature requests](https://github.com/huyhungai/life-rpg-obsidian/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- Built with the [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- GNH Framework inspired by [Gross National Happiness](https://en.wikipedia.org/wiki/Gross_National_Happiness)
- AI integration powered by [OpenRouter](https://openrouter.ai)
