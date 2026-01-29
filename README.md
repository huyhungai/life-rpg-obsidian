# Life RPG

Turn your life into an RPG! An Obsidian plugin that gamifies personal development using the **HUMAN 3.0 framework**, 9 GNH life domains, Journal Intelligence, and an AI Life Coach (Elder).

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22life-rpg%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)
![Version](https://img.shields.io/badge/version-5.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## What's New in v5.0.0

- **Skill System** - AI discovers your skills from journal entries and levels them up
- **Multi-Provider AI** - Choose from OpenRouter, OpenAI, Anthropic, or Google AI
- **Journal Intelligence** - Analyze your journal entries to automatically affect character stats
- **Semantic Search** - Search journals by meaning using AI embeddings
- **Elder Memory** - The Elder recalls relevant past journal entries during conversations
- **Elder Tab Redesign** - RPG-themed AI coach with customizable persona
- **HUMAN 3.0 Framework** - Deep integration with development levels and quadrants
- **Tab Reorganization** - 8 intuitive tabs including new Skills tab

## Features

### HUMAN 3.0 Framework

Your character evolves through three stages of human development:

| Level | Stage | Description |
|-------|-------|-------------|
| 1-100 | **HUMAN 1.0 (NPC)** | Awakening - Learning to see beyond societal scripts |
| 101-200 | **HUMAN 2.0 (Player)** | Mastery - Taking ownership and authoring your story |
| 201-300 | **HUMAN 3.0 (Creator)** | Transcendence - Creating systems that help others grow |

### Four Quadrants of Being

Your 9 life domains are organized into four quadrants:

| Quadrant | Domains | Focus |
|----------|---------|-------|
| **Mind** | Psychological Well-being, Education | Inner knowledge & emotional wisdom |
| **Body** | Health, Time Use | Physical vessel & life's rhythm |
| **Spirit** | Community, Cultural, Ecological | Connection to others & the world |
| **Vocation** | Living Standards, Governance | Craft & contribution |

### Journal Intelligence

Analyze your journal entries to shape your character:

- **Automatic stat changes** based on journal content
- **Keyword detection** for each life domain
- **Sentiment analysis** - positive entries gain XP, challenges may cost HP
- **AI-enhanced analysis** (with OpenRouter API)
- **Semantic search** - Search journals by meaning, not just keywords
- Configure journal folder or tag to scan

### Skill System

Develop skills as you progress through life:

- **AI Skill Discovery** - AI reads your journal entries and discovers skills you're practicing
- **Four Skill Categories**:
  - 🧠 **Mind Skills**: Meditation, Critical Thinking, Emotional Intelligence, Memory
  - 💪 **Body Skills**: Running, Strength Training, Yoga, Martial Arts
  - ✨ **Spirit Skills**: Communication, Empathy, Leadership, Teaching
  - ⚔️ **Vocation Skills**: Programming, Writing, Design, Finance
- **Automatic Leveling** - Skills gain XP each time you mention practicing them
- **Skill Points** - Earn skill points on character level up to manually boost skills
- **Manual Addition** - Add skills manually if AI doesn't discover them

### Semantic Search & Elder Memory

Powered by AI embeddings for deeper understanding:

- **Search by meaning** - Find entries about "times I felt grateful" even without those exact words
- **Elder Memory** - The Elder recalls relevant past journal entries during conversations
- **Configurable memory** - Choose how many past entries to include in Elder context
- **Embedding models**: OpenAI Text Embedding 3 (Small/Large), Google Text Embedding 004

### The Elder (AI Life Coach)

A wise guide with deep knowledge of the HUMAN 3.0 framework:

- **Customizable persona** - Name, title, greeting, personality
- **5 personality presets**: Wise Sage, Battle Mentor, Scholar, Companion, Mystic
- **Custom knowledge base** - Add personal context about yourself
- **Quick wisdom buttons** - Guidance, Challenge, Reflection, Courage
- **Natural conversations** - No code or JSON visible
- **Semantic memory** - Recalls relevant past journal entries when chatting

### 9 Life Domains (GNH Framework)

| Domain | Icon | Description |
|--------|------|-------------|
| Psychological Well-being | 🧠 | Mental health, emotions, life satisfaction |
| Health | 💪 | Physical wellness, exercise, sleep, nutrition |
| Time Use | ⏰ | Work-life balance, time management |
| Education | 📚 | Learning, skills development, growth |
| Cultural Resilience | 🎭 | Identity, self-expression, authenticity |
| Good Governance | ⚖️ | Decision-making, boundaries, personal agency |
| Community Vitality | 🤝 | Relationships, social connections |
| Ecological Awareness | 🌍 | Environmental consciousness |
| Living Standards | 💰 | Financial security, material well-being |

### RPG Mechanics

- **HP** - Health points (affected by habits, journal sentiment)
- **XP** - Experience points (gain from habits, quests, journal)
- **Gold** - Currency for the rewards shop
- **Level** - Progress through HUMAN 1.0 → 2.0 → 3.0
- **Phases** - Dissonance, Uncertainty, Discovery (affect XP multiplier)

### Gamification Features

| Feature | Description |
|---------|-------------|
| **Daily Rituals** | Habits with streak tracking |
| **Quests** | Goals with deadlines and difficulty |
| **Demons** | Bad habits that cost HP |
| **Boss Fights** | Major life challenges to overcome |
| **Dungeons** | Deep work focus sessions |
| **Tavern** | Energy tracking and reward shop |
| **Achievements** | Unlock badges for milestones |

## Tabs Overview

| Tab | Purpose |
|-----|---------|
| 📓 **Journal** | Sync and analyze journal entries |
| 🎭 **Hero** | Character stats, domains, quadrants |
| 🎯 **Skills** | Skill discovery and leveling |
| 🧙 **Elder** | AI coach conversations |
| ⚔️ **Quests** | Habits, quests, bad habits |
| 🐉 **Arena** | Boss fights, dungeons |
| 🏨 **Tavern** | Energy, shop |
| 📜 **History** | Activity log |

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

## Quick Start

1. Click the sword icon in the left ribbon or use `Cmd/Ctrl+P` → "Open Hero Sheet"
2. Go to **Hero** tab → "Create Your Character"
3. Complete the 37-question life assessment
4. Start adding habits and quests in the **Quests** tab
5. Set up your journal folder in settings for Journal Intelligence
6. (Optional) Add OpenRouter API key for AI features

## AI Setup (Optional)

The Elder, Journal Intelligence, and semantic search features support multiple AI providers. Choose the one that works best for you.

### Supported Providers

| Provider | Chat | Embeddings | Notes |
|----------|------|------------|-------|
| **OpenRouter** | ✅ | ✅ | 100+ models with one API key (Recommended) |
| **OpenAI** | ✅ | ✅ | GPT models directly from OpenAI |
| **Anthropic** | ✅ | ❌ | Claude models (no embedding support) |
| **Google AI** | ✅ | ✅ | Gemini models with free tier |

### Quick Setup

1. In Obsidian: Settings → Life RPG
2. Choose your **AI Provider**
3. Enter your **API Key** for that provider
4. Select your preferred **Chat Model**
5. (Optional) Choose a different provider for **Embeddings**
6. Customize your Elder's persona in the Elder tab (⚙️ button)

### Getting API Keys

| Provider | Where to get key |
|----------|------------------|
| OpenRouter | [openrouter.ai](https://openrouter.ai) → Keys |
| OpenAI | [platform.openai.com](https://platform.openai.com) → API Keys |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| Google AI | [makersuite.google.com](https://makersuite.google.com) → Get API Key |

### Available Models

#### Chat Models (via OpenRouter)
| Provider | Model | Notes |
|----------|-------|-------|
| Anthropic | Claude Sonnet 4 | Recommended |
| Anthropic | Claude Opus 4 | Most Capable |
| OpenAI | GPT-4o | Latest GPT |
| OpenAI | GPT-4o Mini | Fast & Cheap |
| Google | Gemini 2.0 Flash | Fast |
| Google | Gemini 1.5 Pro | High quality |
| DeepSeek | DeepSeek Chat | Budget-friendly |
| xAI | Grok 2 | Latest Grok |

#### Embedding Models
| Provider | Model | Dimensions |
|----------|-------|------------|
| OpenAI | Text Embedding 3 Small | 1536 |
| OpenAI | Text Embedding 3 Large | 3072 |
| Google | Text Embedding 004 | 768 |

You can use different providers for chat and embeddings. For example, use Anthropic for the Elder chat and OpenAI for embeddings.

## Screenshots

### Hero Tab - Character Overview
![Hero Tab](Screenshot/hero-tab.png)

### Elder Tab - AI Coach
![Elder Tab](Screenshot/elder-tab.png)

### Journal Intelligence
![Journal Tab](Screenshot/journal-tab.png)

## Configuration

### Journal Intelligence Settings
- **Journal Folder**: Path to your journal notes (default: `Journal`)
- **Scan Mode**: By folder or by tag (`#journal`)
- **Domain Keywords**: Customizable keywords for each life domain

### Elder Customization
- **Name & Title**: Personalize your Elder's identity
- **Personality**: Choose from 5 presets
- **Custom Knowledge**: Add context about yourself
- **Custom Instructions**: Modify AI behavior
- **Quick Prompts**: Customize wisdom button actions

## Support

- [Report Issues](https://github.com/huyhungai/life-rpg-obsidian/issues)
- [Feature Requests](https://github.com/huyhungai/life-rpg-obsidian/issues)
- [Discussions](https://github.com/huyhungai/life-rpg-obsidian/discussions)

## Changelog

### v5.0.0
- Journal Intelligence with AI-enhanced analysis
- Semantic search using AI embeddings (search by meaning)
- Elder Memory - recalls relevant past journal entries
- Elder Tab redesign with customizable persona
- HUMAN 3.0 framework deep integration
- Tab reorganization (11 → 7 tabs)
- Natural language context for AI (no code visible)

### v2.0.0
- Character creation with 37-question assessment
- 9 GNH domains integration
- Boss fights and dungeon system
- Energy tracking

### v1.0.0
- Initial release
- Basic habits and quests
- AI Life Coach

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- Built with the [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- GNH Framework inspired by [Gross National Happiness](https://en.wikipedia.org/wiki/Gross_National_Happiness)
- HUMAN 3.0 Framework for personal development
- AI integration powered by [OpenRouter](https://openrouter.ai)

---

**Made with ❤️ for the Obsidian community**
