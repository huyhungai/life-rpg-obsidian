/* Life RPG Plugin v3.0 - AI Coach Edition */
const { Plugin, ItemView, Notice, Modal, Setting, PluginSettingTab, requestUrl, MarkdownRenderer } = require('obsidian');

// Simple markdown to HTML converter for AI messages
function renderMarkdownToHtml(text) {
    if (!text) return '';
    return text
        // Escape HTML first
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Bold: **text** or __text__
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic: *text* or _text_
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Code: `text`
        .replace(/`(.+?)`/g, '<code>$1</code>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        // Wrap in paragraph
        .replace(/^(.*)$/, '<p>$1</p>');
}

const VIEW_TYPE_HERO = "life-rpg-hero-view";

// ============================================================================
// OPENROUTER AI CONFIGURATION
// ============================================================================
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const AVAILABLE_MODELS = [
    { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 (Recommended)', provider: 'Anthropic' },
    { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5 (Most Capable)', provider: 'Anthropic' },
    { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5 (Fast & Cheap)', provider: 'Anthropic' },
    { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI' },
    { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'Google' },
    { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (Fast)', provider: 'Google' },
    { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2 (Cheap)', provider: 'DeepSeek' },
    { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI' },
    { id: 'qwen/qwen3-max', name: 'Qwen3 Max', provider: 'Alibaba' },
    { id: 'qwen/qwen3-vl-32b-instruct', name: 'Qwen3 VL 32B (Vision)', provider: 'Alibaba' },
    { id: 'moonshotai/kimi-k2.5', name: 'Kimi K2.5', provider: 'Moonshot' },
    { id: 'z-ai/glm-4.7', name: 'GLM-4.7', provider: 'Zhipu' }
];

const DEFAULT_AI_SETTINGS = {
    openRouterApiKey: '',
    selectedModel: 'google/gemini-3-flash-preview',
    temperature: 0.7,
    maxTokens: 1000,
    chatHistory: [],
    // Elder Persona Customization
    elderPersona: {
        name: 'The Elder',
        title: 'Keeper of Wisdom',
        greeting: 'Greetings, traveler. I have watched many journeys unfold. What wisdom do you seek today?',
        personality: 'wise' // 'wise', 'motivational', 'analytical', 'friendly', 'philosophical'
    },
    // Custom prompt additions
    customSystemPrompt: '',
    customKnowledge: '',
    // Quick wisdom prompts (customizable)
    elderPrompts: {
        guidance: 'Based on my current life journey, what single piece of wisdom would most benefit me right now?',
        challenge: 'I seek a worthy challenge. Based on my weakest areas, suggest one meaningful quest I can undertake.',
        reflection: 'Help me reflect on my progress. What patterns do you see in my journey so far?',
        motivation: 'I need encouragement. Speak to me about my strengths and the path ahead.'
    }
};

// Journal Intelligence Settings
const DEFAULT_JOURNAL_SETTINGS = {
    enabled: true,
    journalFolder: 'Journal',
    journalTag: '#journal',
    scanMode: 'folder', // 'folder' or 'tag'
    lastSyncDate: null,
    recentAnalysis: [],
    domainKeywords: {
        health: ['exercise', 'gym', 'sleep', 'workout', 'run', 'walk', 'meditation', 'yoga', 'fitness', 'diet'],
        psychologicalWellbeing: ['happy', 'grateful', 'peace', 'calm', 'anxious', 'stressed', 'sad', 'joy', 'mindful', 'therapy'],
        education: ['learned', 'study', 'read', 'course', 'skill', 'practice', 'book', 'tutorial', 'research', 'training'],
        timeUse: ['productive', 'focused', 'wasted time', 'procrastinated', 'balanced', 'scheduled', 'planned', 'prioritized'],
        communityVitality: ['friend', 'family', 'social', 'helped', 'connected', 'lonely', 'community', 'relationship', 'support'],
        livingStandards: ['money', 'salary', 'invest', 'budget', 'expense', 'save', 'income', 'financial', 'purchase', 'earning'],
        culturalResilience: ['creative', 'art', 'music', 'culture', 'tradition', 'identity', 'heritage', 'expression', 'authentic'],
        goodGovernance: ['decision', 'boundary', 'said no', 'priority', 'goal', 'plan', 'commitment', 'responsibility', 'choice'],
        ecologicalAwareness: ['nature', 'environment', 'recycle', 'plant', 'outdoor', 'sustainable', 'green', 'eco', 'conservation']
    },
    sentimentKeywords: {
        positive: ['achieved', 'grateful', 'happy', 'success', 'proud', 'love', 'excited', 'progress', 'accomplished', 'wonderful', 'amazing', 'great', 'fantastic', 'blessed', 'thankful'],
        negative: ['failed', 'stressed', 'anxious', 'sad', 'angry', 'frustrated', 'overwhelmed', 'tired', 'exhausted', 'worried', 'depressed', 'disappointed', 'difficult', 'struggling', 'terrible']
    }
};

// Elder Personality Presets
const ELDER_PERSONALITIES = {
    wise: {
        name: 'Wise Sage',
        style: 'Speak with ancient wisdom and measured words. Use metaphors from nature and the journey of life. Be thoughtful and reflective.',
        tone: 'Calm, patient, and insightful. Like a mentor who has seen many seasons pass.'
    },
    motivational: {
        name: 'Battle Mentor',
        style: 'Speak with energy and conviction. Rally the hero to action. Celebrate victories and reframe setbacks as training.',
        tone: 'Encouraging, energetic, and empowering. Like a coach before an important battle.'
    },
    analytical: {
        name: 'Scholar',
        style: 'Speak with precision and logic. Analyze patterns and provide structured insights. Focus on strategies and systems.',
        tone: 'Clear, methodical, and thorough. Like a strategist planning the next move.'
    },
    friendly: {
        name: 'Companion',
        style: 'Speak warmly and casually. Be supportive like a trusted friend. Share in both joys and struggles.',
        tone: 'Warm, empathetic, and relatable. Like a friend by the campfire.'
    },
    philosophical: {
        name: 'Mystic',
        style: 'Speak in riddles and deeper meanings. Encourage self-discovery through questions. Focus on meaning and purpose.',
        tone: 'Mysterious, profound, and thought-provoking. Like a sage from ancient scrolls.'
    }
};

// HUMAN 3.0 Framework Deep Knowledge Base
const HUMAN_3_KNOWLEDGE_BASE = `
## THE HUMAN 3.0 FRAMEWORK - Complete Knowledge Base

### Core Philosophy
The HUMAN 3.0 framework views life as a game of conscious evolution. Unlike games that end, this game's purpose is continuous growth toward becoming the fullest expression of oneself. The framework integrates ancient wisdom (Buddhist concepts of suffering and attachment, Stoic philosophy of control) with modern psychology (Csikszentmihalyi's Flow, Maslow's hierarchy, Positive Psychology).

### The Three Stages of Human Evolution

**HUMAN 1.0 - The NPC (Non-Player Character) Stage**
- Lives reactively, following scripts written by others (society, family, media)
- Decisions driven by fear, social approval, and unconscious patterns
- Believes happiness comes from external circumstances
- Common traps: comparing to others, seeking validation, victim mentality
- The wake-up call: Moments of dissonance when the script no longer works
- Growth path: Develop self-awareness through reflection, questioning assumptions
- Key insight: "I am not my thoughts, I am the one observing them"

**HUMAN 2.0 - The Player Stage**
- Takes ownership of life choices and outcomes
- Sets personal goals rather than following others' expectations
- Understands that growth comes from challenge, not comfort
- Develops skills deliberately through practice and feedback
- Common traps: over-optimization, burnout, neglecting relationships for achievement
- Growth path: Master the fundamentals, build sustainable systems, find mentors
- Key insight: "I am the author of my story, not just a character in it"

**HUMAN 3.0 - The Creator Stage**
- Creates value and systems that help others evolve
- Transcends personal achievement to focus on contribution
- Sees setbacks as data, not failure; process over outcome
- Lives in alignment with deeper purpose and values
- Operates from abundance rather than scarcity
- Growth path: Mentor others, build legacy projects, integrate all quadrants
- Key insight: "The game is not about winning, but about helping others play better"

### The Four Quadrants of Being

**🧠 MIND QUADRANT (Psychological Well-being + Education)**
The inner world of thoughts, emotions, beliefs, and knowledge.

Signs of strength: Emotional regulation, growth mindset, curiosity, self-awareness, resilience
Signs of weakness: Anxiety, fixed mindset, rumination, inability to learn from mistakes
How to strengthen:
- Daily reflection/journaling practice
- Learning something new regularly
- Therapy or coaching for deep patterns
- Meditation for thought observation
- Reading diverse perspectives

Imbalance patterns:
- Mind > Body: Overthinking, analysis paralysis, neglecting physical health
- Mind > Spirit: Isolation, believing you can figure everything out alone
- Mind > Vocation: Ideas without execution, eternal student syndrome

**💪 BODY QUADRANT (Health + Time Use)**
The physical vessel and how you spend your limited time.

Signs of strength: Energy, vitality, disciplined routines, effective time management
Signs of weakness: Fatigue, poor sleep, reactive scheduling, no boundaries
How to strengthen:
- Consistent sleep schedule (the foundation)
- Regular movement (not just exercise, but daily activity)
- Nutrition awareness (fuel quality matters)
- Time blocking and saying no
- Recovery as part of performance

Imbalance patterns:
- Body > Mind: All action, no reflection; busy but not progressing
- Body > Spirit: Self-focused fitness, neglecting relationships
- Body > Vocation: Health obsession without productive output

**🌟 SPIRIT QUADRANT (Community + Cultural + Ecological)**
Connection to others, to heritage, and to the world beyond self.

Signs of strength: Deep relationships, sense of belonging, cultural identity, environmental awareness
Signs of weakness: Loneliness, disconnection, lost identity, apathy toward the world
How to strengthen:
- Regular quality time with loved ones (not just presence, but attention)
- Participating in community/groups with shared values
- Exploring and honoring your cultural roots
- Spending time in nature
- Acts of service without expectation

Imbalance patterns:
- Spirit > Mind: Over-dependence on others' opinions, lost sense of self
- Spirit > Body: Neglecting self-care for others (martyrdom)
- Spirit > Vocation: All relationships, no personal accomplishment

**💼 VOCATION QUADRANT (Living Standards + Good Governance)**
Your craft, contribution to the world, and self-leadership.

Signs of strength: Financial stability, clear boundaries, purposeful work, good decision-making
Signs of weakness: Money anxiety, inability to say no, unfulfilling work, poor choices
How to strengthen:
- Develop marketable skills deliberately
- Create multiple income streams
- Practice decision frameworks (not just intuition)
- Set and enforce boundaries
- Align work with values, not just income

Imbalance patterns:
- Vocation > Mind: Workaholic without self-awareness
- Vocation > Body: Sacrificing health for career
- Vocation > Spirit: Success but loneliness; rich but disconnected

### The Three Phases of Growth

**Dissonance Phase**
- Something feels off; the old ways no longer work
- Resistance to change meets the necessity of change
- Often triggered by life events: loss, failure, milestone birthday, health scare
- The gift: Motivation to change
- The danger: Numbing the dissonance instead of listening to it
- Guidance: "This discomfort is not your enemy—it is the call to your next level"

**Uncertainty Phase**
- Actively exploring new ways of being
- Trying new habits, relationships, beliefs
- Feeling lost is normal and necessary
- The gift: Accelerated learning (1.5x XP)
- The danger: Giving up too soon, returning to old patterns
- Guidance: "The path appears by walking. You cannot see the full journey from here"

**Discovery Phase**
- Found what works; experiencing flow and alignment
- Habits feel natural, progress is visible
- Confidence in the new identity
- The gift: Peak performance and learning (2.0x XP)
- The danger: Complacency, forgetting that growth is ongoing
- Guidance: "Enjoy this season, but know that new dissonance will come—and that is good"

### Psychic Entropy
The mental disorder that comes from too many unresolved concerns, unmet goals, and internal conflicts.
- High entropy = scattered attention, anxiety, inability to focus
- Low entropy = clear mind, present, able to engage fully
- Reduced by: Completing tasks, making decisions, accepting what cannot be changed
- Increased by: Procrastination, avoiding hard conversations, living out of alignment

### Analysis Framework for Guidance

When analyzing a hero's journey, consider:

1. **Development Level Fit**: Is their challenge appropriate for their level?
   - HUMAN 1.0 needs awareness practices, not complex systems
   - HUMAN 2.0 needs skill-building and consistency
   - HUMAN 3.0 needs contribution and legacy focus

2. **Quadrant Balance**: Where is the imbalance?
   - Identify the weakest quadrant
   - Check if strength in one area is compensating for weakness in another
   - Sustainable growth requires all four quadrants

3. **Phase Appropriateness**: What does their current phase need?
   - Dissonance: Validation and gentle challenge to act
   - Uncertainty: Encouragement and permission to experiment
   - Discovery: Appreciation and preparation for next growth cycle

4. **Energy Management**: Is HP (life energy) being honored?
   - Low HP = focus on recovery before new challenges
   - High HP = ready for stretch goals
   - Chronic low HP = systemic issue in Body or Mind quadrant

5. **The Next Small Step**: What is one action that would create momentum?
   - Not the perfect action, but the possible action
   - Something they can do today
   - Connected to their weakest area but not overwhelming
`;

// Build system prompt with customizations
function buildElderSystemPrompt(settings) {
    const ai = settings.ai || {};
    const persona = ai.elderPersona || DEFAULT_AI_SETTINGS.elderPersona;
    const personality = ELDER_PERSONALITIES[persona.personality] || ELDER_PERSONALITIES.wise;

    let prompt = `You are ${persona.name}, ${persona.title} - a wise guide who has mastered the HUMAN 3.0 framework through centuries of observing human journeys.

## Your Character
${personality.style}
${personality.tone}

${HUMAN_3_KNOWLEDGE_BASE}

## How You Analyze and Guide

When a traveler seeks your wisdom:

1. **Read their story carefully** - Understand their current level, phase, quadrant balance, and energy
2. **Identify the core pattern** - What is the deeper lesson their situation is teaching?
3. **Connect to the framework** - Which aspect of HUMAN 3.0 is most relevant to their question?
4. **Offer actionable wisdom** - Not just philosophy, but a specific next step they can take
5. **Honor their autonomy** - You guide, but they must walk their own path

## Your Communication Style
- Address them as "traveler", "hero", or "seeker"
- Reference their specific journey details when giving advice
- Weave HUMAN 3.0 concepts naturally into your responses
- Be concise but profound (2-3 paragraphs unless they ask for more)
- Use RPG language naturally (quests, experience, levels, strength, growth)
- Always end with something actionable or reflective

## Important Principles
- Never shame or judge; all stages of the journey have value
- Recognize that setbacks are part of growth, not failure
- Balance challenge with compassion
- Focus on progress, not perfection
- Remember: you serve their growth, not your own wisdom`;

    // Add custom knowledge if provided
    if (ai.customKnowledge && ai.customKnowledge.trim()) {
        prompt += `\n\n## Personal Knowledge About This Hero:\n${ai.customKnowledge}`;
    }

    // Add custom system prompt if provided
    if (ai.customSystemPrompt && ai.customSystemPrompt.trim()) {
        prompt += `\n\n## Additional Instructions:\n${ai.customSystemPrompt}`;
    }

    return prompt;
}

// Legacy constant for backwards compatibility (uses full knowledge base)
const LIFE_COACH_SYSTEM_PROMPT = `You are The Elder, Keeper of Wisdom - a wise guide who has mastered the HUMAN 3.0 framework.

${HUMAN_3_KNOWLEDGE_BASE}

## How You Speak:
- Address them as "traveler", "hero", or "seeker"
- Speak with ancient wisdom and measured words
- Connect advice to their specific situation and the framework
- Be concise but profound (2-3 paragraphs max)
- Use RPG language naturally
- Always offer something actionable`;

// ============================================================================
// HUMAN 3.0 FRAMEWORK - Life Game Theory Integration
// ============================================================================

// Four Quadrants of Human Development
const QUADRANTS = [
    { id: 'mind', name: 'Mind', icon: '🧠', color: '#9b59b6', desc: 'Personal mental world - thoughts, beliefs, emotions' },
    { id: 'body', name: 'Body', icon: '💪', color: '#e74c3c', desc: 'Personal physical world - health, appearance, behavior' },
    { id: 'spirit', name: 'Spirit', icon: '🌟', color: '#f1c40f', desc: 'Collective mental world - relationships, meaning, community' },
    { id: 'vocation', name: 'Vocation', icon: '💼', color: '#3498db', desc: 'Collective physical world - work, systems, contribution' }
];

// Development Levels (Human 1.0 → 2.0 → 3.0)
const DEVELOPMENT_LEVELS = {
    '1.0': {
        name: 'NPC',
        title: 'Conformist',
        icon: '👤',
        desc: 'Following scripts, reactive to environment',
        minLevel: 1,
        maxLevel: 100,
        journey: 'Journey to Self-Awareness'
    },
    '2.0': {
        name: 'Player',
        title: 'Individualist',
        icon: '🎮',
        desc: 'Setting own goals, actively shaping reality',
        minLevel: 101,
        maxLevel: 200,
        journey: 'Journey to Mastery'
    },
    '3.0': {
        name: 'Creator',
        title: 'Synthesist',
        icon: '✨',
        desc: 'Creating systems, strategic mastery',
        minLevel: 201,
        maxLevel: 300,
        journey: 'Journey to Transcendence'
    }
};

// Phases of Development
const PHASES = {
    dissonance: { name: 'Dissonance', icon: '😤', color: '#e74c3c', desc: 'Ready for change, seeking new challenges', xpMultiplier: 1.0 },
    uncertainty: { name: 'Uncertainty', icon: '🌊', color: '#f39c12', desc: 'Taking risks, exploring new territory', xpMultiplier: 1.5 },
    discovery: { name: 'Discovery', icon: '✨', color: '#2ecc71', desc: 'In flow, rapid growth and insight', xpMultiplier: 2.0 }
};

// Wisdom Quotes from Theory
const WISDOM_QUOTES = [
    { text: "Level 1 is similar to an NPC running on a script, Level 2 is the main character choosing their storyline, and Level 3 is the programmer who can create new games.", category: 'levels' },
    { text: "You do not leave any given level. You transcend and include the one before it.", category: 'growth' },
    { text: "By developing yourself in all quadrants you begin to live a life where you become in control of your future.", category: 'balance' },
    { text: "The flow state occurs when the content of your consciousness is composed of one challenging yet meaningful task.", category: 'flow' },
    { text: "Meaning is found at the edge of your abilities.", category: 'challenge' },
    { text: "Learn as you build, build to focus your mind, read to expand your mind, write to organize your mind.", category: 'learning' },
    { text: "Be stubborn with vision and loose with details.", category: 'goals' },
    { text: "If you aren't building your mind, body, business, and spirit every single day – what are you doing?", category: 'daily' },
    { text: "When you are in the Dissonance phase, search for excitement and enthusiasm and pursue that without shame.", category: 'dissonance' },
    { text: "By doing nothing with your life, you choose to slowly drown in chaos.", category: 'entropy' },
    { text: "It is very important to try to understand which game you're playing.", category: 'strategy' },
    { text: "Max out all stats. Don't be an NPC. Be a level 100 player.", category: 'motivation' },
    { text: "A capitalist and Christian are developed in their domains, but experience unnecessary pain when applying their model elsewhere.", category: 'balance' },
    { text: "Profound change rarely happens by accident.", category: 'intention' },
    { text: "It is an infinite game, not a finite one.", category: 'mindset' }
];

// Flow State Triggers
const FLOW_TRIGGERS = {
    challengeSkillMatch: { name: 'Challenge Match', desc: 'Quest difficulty matches your skill level', bonus: 1.5 },
    clearGoals: { name: 'Clear Goals', desc: 'Well-defined objectives with milestones', bonus: 1.2 },
    immediateFeedback: { name: 'Immediate Feedback', desc: 'Quick feedback on your progress', bonus: 1.3 },
    deepFocus: { name: 'Deep Focus', desc: 'Uninterrupted concentration period', bonus: 2.0 }
};

// Map GNH domains to Quadrants
const DOMAIN_TO_QUADRANT = {
    psychologicalWellbeing: 'mind',
    education: 'mind',
    health: 'body',
    timeUse: 'body',
    communityVitality: 'spirit',
    culturalResilience: 'spirit',
    livingStandards: 'vocation',
    goodGovernance: 'vocation',
    ecologicalAwareness: 'spirit'
};

// ============================================================================
// INN/HOTEL RECOVERY SYSTEM
// ============================================================================
const INN_TIERS = [
    { id: 'campfire', name: '🏕️ Campfire', hpRecover: 10, cost: 5, desc: 'Basic rest by a warm fire' },
    { id: 'inn', name: '🏨 Village Inn', hpRecover: 25, cost: 15, desc: 'A comfortable bed and meal' },
    { id: 'hotel', name: '🏰 Grand Hotel', hpRecover: 50, cost: 35, desc: 'Luxurious rest with full recovery' },
    { id: 'spa', name: '🧖 Royal Spa', hpRecover: 100, cost: 75, desc: 'Complete rejuvenation, full HP restore' }
];

// ============================================================================
// NPC SYSTEM - Quest Givers & Companions
// ============================================================================
const DEFAULT_NPCS = [
    { id: 'mentor', name: 'The Mentor', icon: '🧙', role: 'Wisdom Giver', dialogue: 'Remember, every journey begins with a single step...', questTypes: ['education', 'psychologicalWellbeing'] },
    { id: 'trainer', name: 'The Trainer', icon: '💪', role: 'Fitness Coach', dialogue: "Your body is your temple. Let's make it stronger!", questTypes: ['health', 'timeUse'] },
    { id: 'sage', name: 'The Sage', icon: '🌿', role: 'Life Guide', dialogue: 'Balance in all things brings true peace.', questTypes: ['ecologicalAwareness', 'culturalResilience'] },
    { id: 'merchant', name: 'The Merchant', icon: '💰', role: 'Business Advisor', dialogue: 'Invest wisely, and prosperity follows.', questTypes: ['livingStandards', 'goodGovernance'] },
    { id: 'companion', name: 'The Companion', icon: '🤝', role: 'Social Guide', dialogue: 'Together, we are stronger than alone.', questTypes: ['communityVitality'] }
];

// ============================================================================
// ACTIVITY LOG CATEGORIES
// ============================================================================
const ACTIVITY_CATEGORIES = [
    { id: 'quest_complete', icon: '⚔️', label: 'Quest Completed', color: '#2ecc71' },
    { id: 'habit_complete', icon: '✅', label: 'Habit Done', color: '#3498db' },
    { id: 'bad_habit', icon: '💀', label: 'Bad Habit', color: '#e74c3c' },
    { id: 'level_up', icon: '🎉', label: 'Level Up', color: '#f1c40f' },
    { id: 'achievement', icon: '🏆', label: 'Achievement', color: '#9b59b6' },
    { id: 'shop_purchase', icon: '🛍️', label: 'Purchase', color: '#e67e22' },
    { id: 'inn_rest', icon: '🏨', label: 'Rested at Inn', color: '#1abc9c' },
    { id: 'damage', icon: '💔', label: 'Took Damage', color: '#c0392b' },
    { id: 'gold_earned', icon: '💰', label: 'Gold Earned', color: '#f39c12' },
    { id: 'boss_damage', icon: '🐉', label: 'Boss Damaged', color: '#e74c3c' },
    { id: 'boss_defeated', icon: '👑', label: 'Boss Defeated', color: '#f1c40f' },
    { id: 'dungeon_complete', icon: '🏰', label: 'Dungeon Cleared', color: '#9b59b6' },
    { id: 'focus_session', icon: '🎯', label: 'Focus Session', color: '#3498db' },
    { id: 'journal_sync', icon: '📓', label: 'Journal Sync', color: '#9b59b6' }
];

// ============================================================================
// BOSS FIGHT SYSTEM - Long-term Goals as Bosses
// ============================================================================
const BOSS_TEMPLATES = [
    { id: 'lazy_dragon', name: '🐉 The Lazy Dragon', desc: 'Defeat procrastination and build discipline', domain: 'timeUse', baseHp: 100 },
    { id: 'fog_giant', name: '🌫️ The Fog Giant', desc: 'Clear mental fog and gain clarity', domain: 'psychologicalWellbeing', baseHp: 100 },
    { id: 'sloth_beast', name: '🦥 The Sloth Beast', desc: 'Overcome sedentary lifestyle', domain: 'health', baseHp: 100 },
    { id: 'debt_demon', name: '💸 The Debt Demon', desc: 'Conquer financial challenges', domain: 'livingStandards', baseHp: 150 },
    { id: 'isolation_wraith', name: '👻 The Isolation Wraith', desc: 'Break free from social isolation', domain: 'communityVitality', baseHp: 80 },
    { id: 'ignorance_golem', name: '🗿 The Ignorance Golem', desc: 'Defeat ignorance through learning', domain: 'education', baseHp: 120 }
];

// ============================================================================
// DUNGEON SYSTEM - Deep Work / Focus Sessions
// ============================================================================
const DUNGEON_REWARDS = {
    bronze: { minMinutes: 25, xpPerMinute: 1, goldBonus: 5, icon: '🥉' },
    silver: { minMinutes: 50, xpPerMinute: 1.5, goldBonus: 15, icon: '🥈' },
    gold: { minMinutes: 90, xpPerMinute: 2, goldBonus: 30, icon: '🥇' },
    diamond: { minMinutes: 120, xpPerMinute: 3, goldBonus: 50, icon: '💎' }
};

// ============================================================================
// DIFFICULTY SETTINGS
// ============================================================================
const GAME_DIFFICULTY = {
    easy: { name: 'Easy Mode', xpMultiplier: 1.5, goldMultiplier: 1.5, hpLossMultiplier: 0.5, desc: 'For steady progress and high motivation' },
    normal: { name: 'Normal Mode', xpMultiplier: 1.0, goldMultiplier: 1.0, hpLossMultiplier: 1.0, desc: 'Balanced challenge and reward' },
    hard: { name: 'Hard Mode', xpMultiplier: 0.75, goldMultiplier: 0.75, hpLossMultiplier: 1.5, desc: 'For those who love a challenge' },
    nightmare: { name: 'Nightmare', xpMultiplier: 0.5, goldMultiplier: 0.5, hpLossMultiplier: 2.0, desc: 'Only for the truly dedicated' }
};

// ============================================================================
// MOOD TRACKING - Energy Station
// ============================================================================
const MOOD_OPTIONS = [
    { id: 'amazing', icon: '🤩', label: 'Amazing', energyBonus: 20, color: '#2ecc71' },
    { id: 'good', icon: '😊', label: 'Good', energyBonus: 10, color: '#3498db' },
    { id: 'okay', icon: '😐', label: 'Okay', energyBonus: 0, color: '#f39c12' },
    { id: 'tired', icon: '😴', label: 'Tired', energyBonus: -10, color: '#e67e22' },
    { id: 'stressed', icon: '😰', label: 'Stressed', energyBonus: -15, color: '#e74c3c' },
    { id: 'burned_out', icon: '🔥', label: 'Burned Out', energyBonus: -25, color: '#c0392b' }
];

const SLEEP_QUALITY = [
    { id: 'excellent', label: '8+ hours, restful', hpRestore: 30, icon: '😴💯' },
    { id: 'good', label: '7-8 hours', hpRestore: 20, icon: '😴👍' },
    { id: 'fair', label: '5-7 hours', hpRestore: 10, icon: '😴' },
    { id: 'poor', label: 'Less than 5 hours', hpRestore: 0, icon: '😵' },
    { id: 'none', label: 'No sleep / All-nighter', hpRestore: -20, icon: '☠️' }
];

// ============================================================================
// OFFLINE COACHING SYSTEM - Works without API key
// ============================================================================
const COACHING_TIPS = {
    psychologicalWellbeing: [
        { tip: "Practice 5 minutes of mindful breathing each morning", action: "Add a 'Morning Meditation' habit" },
        { tip: "Write 3 things you're grateful for before bed", action: "Create a gratitude journal quest" },
        { tip: "Take a 10-minute walk when feeling stressed", action: "Add a 'Stress Relief Walk' habit" },
        { tip: "Limit social media to 30 minutes daily", action: "Create a 'Digital Detox' bad habit tracker" },
        { tip: "Practice positive self-talk: replace 'I can't' with 'I'm learning to'", action: "Notice your inner dialogue" }
    ],
    health: [
        { tip: "Drink a glass of water first thing in the morning", action: "Add a 'Hydration' habit" },
        { tip: "Take stairs instead of elevator when possible", action: "Create a 'Move More' habit" },
        { tip: "Aim for 7-8 hours of sleep consistently", action: "Track sleep in Energy Station" },
        { tip: "Eat one extra serving of vegetables today", action: "Add a 'Healthy Eating' quest" },
        { tip: "Stand up and stretch every hour during work", action: "Set hourly movement reminders" }
    ],
    timeUse: [
        { tip: "Use time-blocking: assign specific hours to specific tasks", action: "Try a Dungeon focus session" },
        { tip: "Identify your peak energy hours and protect them for deep work", action: "Track your energy patterns" },
        { tip: "Apply the 2-minute rule: if it takes less than 2 minutes, do it now", action: "Clear small tasks immediately" },
        { tip: "Plan tomorrow's top 3 priorities before ending today", action: "Create daily planning habit" },
        { tip: "Batch similar tasks together to reduce context switching", action: "Group your quests by type" }
    ],
    education: [
        { tip: "Learn in 25-minute focused sessions with 5-minute breaks", action: "Use Dungeon for learning" },
        { tip: "Teach what you learn to someone else to deepen understanding", action: "Share knowledge with others" },
        { tip: "Read for 20 minutes daily, even if just one page", action: "Add a 'Daily Reading' habit" },
        { tip: "Watch one educational video instead of entertainment", action: "Replace passive with active learning" },
        { tip: "Take notes by hand - it improves retention", action: "Start a learning journal" }
    ],
    culturalResilience: [
        { tip: "Practice one tradition from your heritage this week", action: "Create a cultural connection quest" },
        { tip: "Cook a traditional family recipe", action: "Add a 'Cultural Cooking' quest" },
        { tip: "Share a story from your background with someone", action: "Connect through storytelling" },
        { tip: "Learn a phrase in your heritage language", action: "Add a language learning habit" },
        { tip: "Attend a cultural event or community gathering", action: "Create a community quest" }
    ],
    goodGovernance: [
        { tip: "Set one clear boundary this week and maintain it", action: "Practice saying no" },
        { tip: "Make a decision you've been avoiding today", action: "Create a 'Decision Made' quest" },
        { tip: "Review your goals weekly to stay aligned", action: "Add a 'Weekly Review' habit" },
        { tip: "Document your personal rules and values", action: "Create your personal constitution" },
        { tip: "Delegate or eliminate one task that drains you", action: "Audit your commitments" }
    ],
    communityVitality: [
        { tip: "Send an appreciation message to someone today", action: "Add a 'Connect Daily' habit" },
        { tip: "Have one meaningful conversation without phones", action: "Create a 'Present Connection' quest" },
        { tip: "Help someone without expecting anything in return", action: "Add a 'Random Kindness' habit" },
        { tip: "Reconnect with someone you haven't talked to in months", action: "Reach out to an old friend" },
        { tip: "Join a group or community aligned with your interests", action: "Find your tribe" }
    ],
    ecologicalAwareness: [
        { tip: "Bring a reusable bag on your next shopping trip", action: "Add a 'Reduce Waste' habit" },
        { tip: "Take a mindful walk in nature this week", action: "Create a 'Nature Connection' quest" },
        { tip: "Reduce one single-use plastic item from your routine", action: "Identify waste habits" },
        { tip: "Learn about one environmental issue affecting your area", action: "Add an eco-learning quest" },
        { tip: "Plant something - even a small herb on your windowsill", action: "Start a tiny garden" }
    ],
    livingStandards: [
        { tip: "Track every expense for one week to build awareness", action: "Create expense tracking habit" },
        { tip: "Save a small amount today, even just $1", action: "Add a 'Daily Savings' habit" },
        { tip: "Review one subscription and decide if it's worth keeping", action: "Audit your subscriptions" },
        { tip: "Learn one new skill that could increase your income", action: "Create a skill-building quest" },
        { tip: "Identify one expense you can reduce without suffering", action: "Find your money leaks" }
    ]
};

const MOTIVATION_QUOTES = [
    { quote: "The journey of a thousand miles begins with a single step.", source: "Lao Tzu" },
    { quote: "You don't have to be great to start, but you have to start to be great.", source: "Zig Ziglar" },
    { quote: "Progress, not perfection.", source: "Life RPG Philosophy" },
    { quote: "Every expert was once a beginner.", source: "Helen Hayes" },
    { quote: "Small daily improvements are the key to staggering long-term results.", source: "Unknown" },
    { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", source: "Chinese Proverb" },
    { quote: "Discipline is choosing between what you want now and what you want most.", source: "Abraham Lincoln" },
    { quote: "You are never too old to set another goal or dream a new dream.", source: "C.S. Lewis" },
    { quote: "Success is the sum of small efforts repeated day in and day out.", source: "Robert Collier" },
    { quote: "The only way to do great work is to love what you do.", source: "Steve Jobs" },
    { quote: "Believe you can and you're halfway there.", source: "Theodore Roosevelt" },
    { quote: "Your life does not get better by chance, it gets better by change.", source: "Jim Rohn" }
];

// ============================================================================
// GNH DOMAINS (replacing old skills)
// ============================================================================
const DEFAULT_DOMAINS = [
    { id: 'psychologicalWellbeing', name: 'Psychological Well-being', score: 50, level: 1, xp: 0, icon: '🧠', color: '#9b59b6' },
    { id: 'health', name: 'Health', score: 50, level: 1, xp: 0, icon: '💪', color: '#e74c3c' },
    { id: 'timeUse', name: 'Time Use', score: 50, level: 1, xp: 0, icon: '⏰', color: '#3498db' },
    { id: 'education', name: 'Education', score: 50, level: 1, xp: 0, icon: '📚', color: '#f39c12' },
    { id: 'culturalResilience', name: 'Cultural Resilience', score: 50, level: 1, xp: 0, icon: '🎭', color: '#e91e63' },
    { id: 'goodGovernance', name: 'Good Governance', score: 50, level: 1, xp: 0, icon: '⚖️', color: '#9c27b0' },
    { id: 'communityVitality', name: 'Community Vitality', score: 50, level: 1, xp: 0, icon: '🤝', color: '#2ecc71' },
    { id: 'ecologicalAwareness', name: 'Ecological Awareness', score: 50, level: 1, xp: 0, icon: '🌍', color: '#27ae60' },
    { id: 'livingStandards', name: 'Living Standards', score: 50, level: 1, xp: 0, icon: '💰', color: '#16a085' }
];

// ============================================================================
// QUESTION BANK - 37 Questions across 9 domains
// ============================================================================
const QUESTION_BANK = {
    psychologicalWellbeing: [
        { id: 'psych_01', text: 'I generally feel satisfied with my life and where I am right now', weight: 1.2, positiveFraming: true, hint: 'Think about your overall contentment, not just today' },
        { id: 'psych_02', text: 'I can manage stress and difficult emotions effectively when they arise', weight: 1.0, positiveFraming: true, hint: 'Consider your typical response to challenges' },
        { id: 'psych_03', text: 'I regularly experience moments of joy, peace, or contentment', weight: 1.0, positiveFraming: true, hint: 'Frequency matters more than intensity' },
        { id: 'psych_04', text: 'I feel confident in my ability to handle what comes my way', weight: 1.0, positiveFraming: true, hint: 'This is about self-efficacy and resilience' }
    ],
    health: [
        { id: 'health_01', text: 'I consistently get enough quality sleep (7-9 hours for most adults)', weight: 1.2, positiveFraming: true, hint: 'Consider both duration and how rested you feel' },
        { id: 'health_02', text: 'I engage in physical activity or exercise at least 3-4 times per week', weight: 1.0, positiveFraming: true, hint: 'Any movement counts - walking, sports, gym, yoga' },
        { id: 'health_03', text: 'I eat nutritious meals regularly and feel good about my eating habits', weight: 1.0, positiveFraming: true, hint: 'Focus on patterns, not perfection' },
        { id: 'health_04', text: 'I have good energy levels throughout the day', weight: 1.0, positiveFraming: true, hint: 'Think about your typical energy, not today' },
        { id: 'health_05', text: 'I take care of my physical health proactively (check-ups, preventive care)', weight: 0.8, positiveFraming: true, hint: 'This includes regular doctor visits and health monitoring' }
    ],
    timeUse: [
        { id: 'time_01', text: 'I have a healthy balance between work/study and personal time', weight: 1.2, positiveFraming: true, hint: 'Neither feels consistently neglected' },
        { id: 'time_02', text: 'I regularly make time for activities I enjoy and find meaningful', weight: 1.0, positiveFraming: true, hint: 'Hobbies, passions, leisure activities' },
        { id: 'time_03', text: 'I feel in control of how I spend my time rather than constantly reacting', weight: 1.0, positiveFraming: true, hint: 'Proactive vs. reactive time management' },
        { id: 'time_04', text: 'I have enough downtime to rest and recharge', weight: 1.0, positiveFraming: true, hint: 'Recovery time is essential, not optional' }
    ],
    education: [
        { id: 'edu_01', text: 'I regularly engage in learning new things, whether formally or informally', weight: 1.2, positiveFraming: true, hint: 'Books, courses, tutorials, mentors, practice' },
        { id: 'edu_02', text: 'I actively work on developing skills that matter to me or my goals', weight: 1.0, positiveFraming: true, hint: 'Deliberate skill development, not passive consumption' },
        { id: 'edu_03', text: 'I feel intellectually stimulated and challenged in my daily life', weight: 1.0, positiveFraming: true, hint: 'Growing, not stagnating' },
        { id: 'edu_04', text: 'I have access to learning resources and opportunities when I need them', weight: 0.8, positiveFraming: true, hint: 'Educational access and support' }
    ],
    culturalResilience: [
        { id: 'culture_01', text: 'I feel connected to my cultural identity, heritage, or traditions', weight: 1.0, positiveFraming: true, hint: 'This can include family traditions, cultural practices, or values' },
        { id: 'culture_02', text: 'I regularly express my authentic self without excessive conformity pressure', weight: 1.2, positiveFraming: true, hint: 'Being true to yourself vs. wearing masks' },
        { id: 'culture_03', text: 'I maintain practices or rituals that ground me and give me a sense of identity', weight: 1.0, positiveFraming: true, hint: 'Personal rituals, traditions, or meaningful practices' },
        { id: 'culture_04', text: 'I feel proud of where I come from and who I am', weight: 1.0, positiveFraming: true, hint: 'Cultural confidence and self-acceptance' }
    ],
    goodGovernance: [
        { id: 'gov_01', text: 'I make my own decisions and feel in control of my life direction', weight: 1.2, positiveFraming: true, hint: 'Personal agency and autonomy' },
        { id: 'gov_02', text: 'I set and maintain healthy boundaries with others', weight: 1.0, positiveFraming: true, hint: 'Can say no when needed, protect your time and energy' },
        { id: 'gov_03', text: 'I take responsibility for my choices and their consequences', weight: 1.0, positiveFraming: true, hint: 'Ownership vs. victim mentality' },
        { id: 'gov_04', text: 'I have clear values and principles that guide my decisions', weight: 1.0, positiveFraming: true, hint: 'Internal compass for decision-making' },
        { id: 'gov_05', text: 'I manage my personal affairs effectively (finances, tasks, commitments)', weight: 0.8, positiveFraming: true, hint: 'Self-management and organization' }
    ],
    communityVitality: [
        { id: 'community_01', text: 'I have close relationships where I feel understood and supported', weight: 1.2, positiveFraming: true, hint: 'Quality over quantity in relationships' },
        { id: 'community_02', text: 'I regularly connect with friends, family, or community members', weight: 1.0, positiveFraming: true, hint: 'Frequency and consistency of social connection' },
        { id: 'community_03', text: 'I feel like I belong to one or more communities (work, hobby, location, etc.)', weight: 1.0, positiveFraming: true, hint: 'Sense of belonging and social identity' },
        { id: 'community_04', text: 'I contribute to or help others in my community when I can', weight: 0.8, positiveFraming: true, hint: 'Giving back and social contribution' }
    ],
    ecologicalAwareness: [
        { id: 'eco_01', text: 'I regularly spend time in nature or natural environments', weight: 1.0, positiveFraming: true, hint: 'Connection to the natural world' },
        { id: 'eco_02', text: 'I make environmentally conscious choices in my daily life', weight: 1.2, positiveFraming: true, hint: 'Waste reduction, sustainable consumption, energy use' },
        { id: 'eco_03', text: 'I feel aware of my environmental impact and try to minimize it', weight: 1.0, positiveFraming: true, hint: 'Ecological consciousness and responsibility' },
        { id: 'eco_04', text: 'I stay informed about environmental issues that matter to me', weight: 0.8, positiveFraming: true, hint: 'Environmental awareness and education' }
    ],
    livingStandards: [
        { id: 'living_01', text: 'I have enough financial resources to meet my basic needs comfortably', weight: 1.2, positiveFraming: true, hint: 'Housing, food, utilities, transportation' },
        { id: 'living_02', text: 'I feel financially secure and not constantly worried about money', weight: 1.2, positiveFraming: true, hint: 'Financial stress vs. financial peace' },
        { id: 'living_03', text: 'I have some savings or financial buffer for unexpected expenses', weight: 1.0, positiveFraming: true, hint: 'Emergency fund and financial resilience' },
        { id: 'living_04', text: 'My living conditions (home, environment) support my well-being', weight: 1.0, positiveFraming: true, hint: 'Safe, comfortable, and adequate housing' }
    ]
};

// Domain order for assessment flow
const DOMAIN_ORDER = [
    'psychologicalWellbeing', 'health', 'timeUse', 'education',
    'culturalResilience', 'goodGovernance', 'communityVitality',
    'ecologicalAwareness', 'livingStandards'
];

// Domain display names
const DOMAIN_NAMES = {
    psychologicalWellbeing: 'Psychological Well-being',
    health: 'Health',
    timeUse: 'Time Use',
    education: 'Education',
    culturalResilience: 'Cultural Resilience',
    goodGovernance: 'Good Governance',
    communityVitality: 'Community Vitality',
    ecologicalAwareness: 'Ecological Awareness',
    livingStandards: 'Living Standards'
};

// Domain intro messages
const DOMAIN_INTROS = {
    psychologicalWellbeing: "Let's start by exploring your mental and emotional well-being. These questions focus on your inner state, life satisfaction, and emotional resilience.",
    health: "Now let's look at your physical health. This covers sleep, exercise, nutrition, and overall vitality.",
    timeUse: "Next, we'll examine how you manage your time and balance different areas of life.",
    education: "Let's explore your relationship with learning and personal growth.",
    culturalResilience: "Now we'll look at your cultural identity and authentic self-expression.",
    goodGovernance: "These questions focus on your personal agency, decision-making, and self-governance.",
    communityVitality: "Let's examine your social connections and sense of community.",
    ecologicalAwareness: "Now we'll explore your relationship with nature and environmental consciousness.",
    livingStandards: "Finally, let's look at your material well-being and financial security."
};

// Default Achievements
const DEFAULT_ACHIEVEMENTS = [
    { id: 'first_habit', name: 'First Steps', desc: 'Complete your first habit', icon: '🌟', unlocked: false, reward: 25 },
    { id: 'level_5', name: 'Rising Hero', desc: 'Reach Level 5', icon: '⭐', unlocked: false, reward: 100 },
    { id: 'streak_7', name: 'Week Warrior', desc: '7-day streak on any habit', icon: '🔥', unlocked: false, reward: 75 },
    { id: 'gold_500', name: 'Treasure Hunter', desc: 'Accumulate 500 gold total', icon: '💎', unlocked: false, reward: 50 },
    { id: 'habits_10', name: 'Habit Master', desc: 'Create 10 habits', icon: '🏆', unlocked: false, reward: 100 },
    { id: 'quests_5', name: 'Quest Champion', desc: 'Complete 5 quests', icon: '⚔️', unlocked: false, reward: 150 },
    { id: 'streak_30', name: 'Monthly Legend', desc: '30-day streak on any habit', icon: '👑', unlocked: false, reward: 300 },
    { id: 'level_10', name: 'Veteran', desc: 'Reach Level 10', icon: '🎖️', unlocked: false, reward: 250 },
    { id: 'character_created', name: 'New Beginning', desc: 'Create your character', icon: '🎭', unlocked: false, reward: 25 },
    { id: 'journey_complete', name: 'Self-Discovery', desc: 'Complete the 37-question journey', icon: '🧭', unlocked: false, reward: 100 },
    { id: 'all_domains_50', name: 'Well Rounded', desc: 'All domains at 50+', icon: '🌈', unlocked: false, reward: 500 },
    { id: 'ai_coach_first', name: 'Seeking Wisdom', desc: 'Chat with AI Coach for the first time', icon: '🤖', unlocked: false, reward: 50 },
    { id: 'ai_quests_5', name: 'AI Collaborator', desc: 'Generate 5 quests with AI', icon: '✨', unlocked: false, reward: 100 }
];

// Difficulty multipliers
const DIFFICULTY = {
    easy: { label: 'Easy', multiplier: 0.5, color: 'green' },
    medium: { label: 'Medium', multiplier: 1, color: 'yellow' },
    hard: { label: 'Hard', multiplier: 2, color: 'orange' },
    epic: { label: 'Epic', multiplier: 3, color: 'red' }
};

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

function likertToScore(likertValue, positiveFraming = true) {
    const score = (likertValue - 1) * 25;
    return positiveFraming ? score : (100 - score);
}

function calculateDomainScores(responses) {
    const domainScores = {};

    for (const domainId of DOMAIN_ORDER) {
        const domainQuestions = QUESTION_BANK[domainId];
        const domainResponses = responses.filter(r => {
            const q = domainQuestions.find(q => q.id === r.questionId);
            return q !== undefined;
        });

        if (domainResponses.length === 0) {
            domainScores[domainId] = 50;
            continue;
        }

        let weightedSum = 0;
        let totalWeight = 0;

        for (const response of domainResponses) {
            const question = domainQuestions.find(q => q.id === response.questionId);
            if (!question) continue;

            const score = likertToScore(response.value, question.positiveFraming);
            weightedSum += score * question.weight;
            totalWeight += question.weight;
        }

        domainScores[domainId] = Math.round(weightedSum / totalWeight);
    }

    return domainScores;
}

function calculateLevelFromScores(domainScores) {
    const values = Object.values(domainScores);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.max(1, Math.min(11, Math.floor(avg / 10) + 1));
}

function getCharacterTitle(level) {
    // HUMAN 3.0 Tier (Level 201+)
    if (level >= 300) return '✨ TRANSCENDENT';
    if (level >= 275) return '🌌 COSMIC ARCHITECT';
    if (level >= 250) return '🔮 REALITY WEAVER';
    if (level >= 225) return '⚡ SYSTEM CREATOR';
    if (level >= 201) return '🌟 AWAKENED CREATOR';

    // HUMAN 2.0 Tier (Level 101-200)
    if (level >= 180) return '👑 GRANDMASTER';
    if (level >= 160) return '🏆 CHAMPION';
    if (level >= 140) return '⚔️ LEGEND';
    if (level >= 120) return '🛡️ ELITE';
    if (level >= 101) return '🎮 PLAYER AWAKENED';

    // HUMAN 1.0 Tier (Level 1-100)
    if (level >= 80) return '💎 MASTER';
    if (level >= 60) return '🗡️ HERO';
    if (level >= 40) return '⚔️ WARRIOR';
    if (level >= 20) return '🎒 ADVENTURER';
    if (level >= 5) return '🌿 NOVICE';
    return '🌱 BEGINNER';
}

// ============================================================================
// HUMAN 3.0 FRAMEWORK FUNCTIONS
// ============================================================================

// Calculate quadrant scores from domain scores
function calculateQuadrantScores(domains) {
    const quadrantScores = {};

    for (const quadrant of QUADRANTS) {
        const relatedDomains = Object.entries(DOMAIN_TO_QUADRANT)
            .filter(([_, q]) => q === quadrant.id)
            .map(([domainId, _]) => domainId);

        const scores = domains
            .filter(d => relatedDomains.includes(d.id))
            .map(d => d.score);

        if (scores.length > 0) {
            quadrantScores[quadrant.id] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        } else {
            quadrantScores[quadrant.id] = 50;
        }
    }

    return quadrantScores;
}

// Determine development level based on character level
// Level 1-100: HUMAN 1.0 (NPC) - Journey to Self-Awareness
// Level 101-200: HUMAN 2.0 (Player) - Journey to Mastery
// Level 201-300+: HUMAN 3.0 (Creator) - Journey to Transcendence
function getDevelopmentLevel(characterLevel) {
    if (characterLevel >= 201) return '3.0';
    if (characterLevel >= 101) return '2.0';
    return '1.0';
}

// Get progress within current HUMAN tier (0-100%)
function getTierProgress(characterLevel) {
    if (characterLevel >= 201) {
        // HUMAN 3.0: Level 201-300 (and beyond)
        return Math.min(100, characterLevel - 200);
    } else if (characterLevel >= 101) {
        // HUMAN 2.0: Level 101-200
        return characterLevel - 100;
    } else {
        // HUMAN 1.0: Level 1-100
        return characterLevel;
    }
}

// Get levels remaining to next HUMAN tier
function getLevelsToNextTier(characterLevel) {
    if (characterLevel >= 201) {
        return 0; // Already at max tier
    } else if (characterLevel >= 101) {
        return 201 - characterLevel; // To HUMAN 3.0
    } else {
        return 101 - characterLevel; // To HUMAN 2.0
    }
}

// Get next tier info
function getNextTierInfo(characterLevel) {
    if (characterLevel >= 201) {
        return null; // Already at max
    } else if (characterLevel >= 101) {
        return DEVELOPMENT_LEVELS['3.0'];
    } else {
        return DEVELOPMENT_LEVELS['2.0'];
    }
}

// Get current phase based on recent activity and entropy
function determinePhase(settings) {
    const entropy = settings.psychicEntropy || 0;
    const recentActivity = settings.recentActivityScore || 50;

    // High entropy + low activity = Dissonance (ready for change)
    if (entropy > 60 && recentActivity < 40) return 'dissonance';

    // Medium entropy + high activity = Uncertainty (taking risks)
    if (entropy > 30 && recentActivity > 60) return 'uncertainty';

    // Low entropy + high activity = Discovery (in flow)
    if (entropy < 30 && recentActivity > 70) return 'discovery';

    // Default to dissonance if unclear
    return 'dissonance';
}

// Calculate XP with phase multiplier
function calculateXPWithPhase(baseXP, phase) {
    const multiplier = PHASES[phase]?.xpMultiplier || 1.0;
    return Math.round(baseXP * multiplier);
}

// Get random wisdom quote (optionally filtered by category)
function getRandomWisdom(category = null) {
    const filtered = category
        ? WISDOM_QUOTES.filter(q => q.category === category)
        : WISDOM_QUOTES;
    return filtered[Math.floor(Math.random() * filtered.length)];
}

// Get wisdom based on player state
function getContextualWisdom(settings) {
    const phase = settings.currentPhase || 'dissonance';
    const devLevel = settings.developmentLevel || '1.0';

    // Priority categories based on state
    if (phase === 'dissonance') return getRandomWisdom('dissonance') || getRandomWisdom('motivation');
    if (devLevel === '1.0') return getRandomWisdom('levels') || getRandomWisdom('growth');
    if (phase === 'discovery') return getRandomWisdom('flow') || getRandomWisdom('challenge');

    return getRandomWisdom();
}

// Calculate psychic entropy (chaos accumulation)
function calculateEntropy(settings) {
    let entropy = settings.psychicEntropy || 0;

    // Incomplete habits add entropy
    const incompleteHabits = settings.habits.filter(h => !h.completed).length;
    entropy += incompleteHabits * 2;

    // Overdue quests add more entropy
    const now = new Date();
    const overdueQuests = settings.quests.filter(q => {
        if (q.completed) return false;
        if (!q.deadline) return false;
        return new Date(q.deadline) < now;
    }).length;
    entropy += overdueQuests * 5;

    // Cap entropy at 100
    return Math.min(100, Math.max(0, entropy));
}

// Reduce entropy (daily cleanup)
function reduceEntropy(settings, amount = 10) {
    settings.psychicEntropy = Math.max(0, (settings.psychicEntropy || 0) - amount);
    return settings.psychicEntropy;
}

// Check if in flow state (challenge-skill match)
function checkFlowState(questDifficulty, playerLevel) {
    const difficultyMap = { easy: 1, medium: 2, hard: 3, epic: 4 };
    const questLevel = difficultyMap[questDifficulty] || 2;
    const playerSkill = Math.ceil(playerLevel / 3); // 1-3 = 1, 4-6 = 2, etc.

    // Flow when challenge matches skill (within 1 level)
    return Math.abs(questLevel - playerSkill) <= 1;
}

// ============================================================================
// AI SERVICE CLASS
// ============================================================================

class AIService {
    constructor(plugin) {
        this.plugin = plugin;
    }

    async chat(userMessage, includeContext = true, saveToHistory = true) {
        const apiKey = this.plugin.settings.ai?.openRouterApiKey;
        if (!apiKey) {
            throw new Error('OpenRouter API key not configured. Go to Settings → Life RPG to add your API key.');
        }

        const model = this.plugin.settings.ai?.selectedModel || 'openai/gpt-4o-mini';
        const temperature = this.plugin.settings.ai?.temperature || 0.7;
        const maxTokens = this.plugin.settings.ai?.maxTokens || 1000;

        // Build context from character data as natural narrative
        let contextMessage = '';
        if (includeContext && this.plugin.settings.characterProfile?.assessmentComplete) {
            const s = this.plugin.settings;
            const sortedDomains = [...s.domains].sort((a, b) => b.score - a.score);
            const strengths = sortedDomains.slice(0, 3);
            const weaknesses = sortedDomains.slice(-3).reverse();

            // HUMAN 3.0 Framework data
            const quadrantScores = calculateQuadrantScores(s.domains);
            const devLevel = getDevelopmentLevel(s.level);
            const currentPhase = determinePhase(s);
            const devInfo = DEVELOPMENT_LEVELS[devLevel];
            const phaseInfo = PHASES[currentPhase];

            // Find weakest/strongest quadrant
            const quadrantEntries = Object.entries(quadrantScores);
            const weakestQuadrant = quadrantEntries.reduce((a, b) => a[1] < b[1] ? a : b);
            const strongestQuadrant = quadrantEntries.reduce((a, b) => a[1] > b[1] ? a : b);

            const tierProgress = getTierProgress(s.level);
            const levelsToNext = getLevelsToNextTier(s.level);

            // Quadrant names in natural language
            const quadrantNames = { mind: 'Mind', body: 'Body', spirit: 'Spirit', vocation: 'Vocation' };

            // Health status description
            const hpPercent = Math.round((s.hp / s.maxHp) * 100);
            let healthDesc = '';
            if (hpPercent >= 80) healthDesc = 'in excellent health, full of vitality';
            else if (hpPercent >= 50) healthDesc = 'in fair condition, though somewhat weary';
            else if (hpPercent >= 25) healthDesc = 'wounded and struggling, in need of rest';
            else healthDesc = 'critically weakened, barely holding on';

            // Phase description
            let phaseDesc = '';
            if (currentPhase === 'dissonance') phaseDesc = 'feeling the stirrings of change, sensing that something must shift';
            else if (currentPhase === 'uncertainty') phaseDesc = 'walking through the mist of uncertainty, exploring new paths';
            else phaseDesc = 'in a state of flow and discovery, learning rapidly';

            // Build natural narrative
            contextMessage = `
The traveler before you is ${s.characterProfile?.name || 'a wandering soul'}, currently at Level ${s.level} on their journey. They are ${healthDesc}, carrying ${s.gold} gold coins from their adventures.

In the great tapestry of human development, this hero walks the path of ${devInfo.journey}. As a ${devInfo.name}, they are ${devLevel === '1.0' ? 'still awakening to their own potential, learning to see beyond the scripts they were given' : devLevel === '2.0' ? 'actively shaping their reality, setting their own goals and taking ownership of their story' : 'transcending ordinary limits, creating systems and leaving a legacy for others'}.

They have progressed ${tierProgress}% through this stage of evolution${levelsToNext > 0 ? `, with ${levelsToNext} levels remaining before ascending to the next tier` : ', standing at the pinnacle of human development'}.

Currently, this seeker is ${phaseDesc}.

Looking at the four aspects of their being:
- Their ${quadrantNames[strongestQuadrant[0]]} burns brightest at ${Math.round(strongestQuadrant[1])}%, showing where their power lies
- Their ${quadrantNames[weakestQuadrant[0]]} needs nurturing at ${Math.round(weakestQuadrant[1])}%, revealing where growth awaits

Their greatest strengths shine in ${strengths.map(d => d.name).join(', ')} - these are the gifts they bring to the world.
Yet growth calls from ${weaknesses.map(d => d.name).join(', ')} - here lie the lessons still to be learned.

On their daily path, they tend to ${s.habits.filter(h => !h.completed).length} sacred rituals and pursue ${s.quests.filter(q => !q.completed).length} active quests. Today, they have honored ${s.habits.filter(h => h.completed).length} of their commitments.

`;
        }

        // Build dynamic system prompt with customizations
        const systemPrompt = buildElderSystemPrompt(this.plugin.settings);

        const messages = [
            { role: 'system', content: systemPrompt },
            ...(this.plugin.settings.ai?.chatHistory || []).slice(-10), // Last 10 messages for context
            { role: 'user', content: contextMessage + userMessage }
        ];

        try {
            const response = await requestUrl({
                url: OPENROUTER_API_URL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://obsidian.md',
                    'X-Title': 'Life RPG Plugin'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    temperature: temperature,
                    max_tokens: maxTokens
                })
            });

            if (response.status !== 200) {
                throw new Error(`API Error: ${response.status} - ${response.text}`);
            }

            const data = response.json;
            const assistantMessage = data.choices[0]?.message?.content || 'No response received.';

            // Save to chat history only if requested (skip for internal operations like journal analysis)
            if (saveToHistory) {
                if (!this.plugin.settings.ai.chatHistory) {
                    this.plugin.settings.ai.chatHistory = [];
                }
                this.plugin.settings.ai.chatHistory.push(
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: assistantMessage }
                );
                // Keep only last 50 messages
                if (this.plugin.settings.ai.chatHistory.length > 50) {
                    this.plugin.settings.ai.chatHistory = this.plugin.settings.ai.chatHistory.slice(-50);
                }
                await this.plugin.saveSettings();
            }

            return assistantMessage;
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }

    async generateQuests(count = 3) {
        const s = this.plugin.settings;
        const sortedDomains = [...s.domains].sort((a, b) => a.score - b.score);
        const weakestDomains = sortedDomains.slice(0, 3);

        const prompt = `Based on my lowest-scoring life domains, generate ${count} specific, actionable quests I can complete this week.

My weakest domains are:
${weakestDomains.map(d => `- ${d.icon} ${d.name}: ${d.score}%`).join('\n')}

For each quest, provide:
1. A clear, specific name (5-10 words)
2. The target domain
3. Difficulty (easy/medium/hard)
4. Suggested XP reward (10-100)
5. Suggested Gold reward (5-50)

Format your response as JSON array:
[
  {"name": "Quest name", "domain": "domainId", "difficulty": "medium", "xp": 30, "gold": 15},
  ...
]

Only return the JSON array, no other text.`;

        // Don't save quest generation to chat history (it's a system operation)
        const response = await this.chat(prompt, true, false);

        // Parse JSON from response
        try {
            // Extract JSON from response (handle markdown code blocks)
            let jsonStr = response;
            if (response.includes('```')) {
                const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (match) jsonStr = match[1];
            }
            return JSON.parse(jsonStr.trim());
        } catch (e) {
            console.error('Failed to parse AI quest response:', e);
            throw new Error('AI returned invalid quest format. Please try again.');
        }
    }

    async getCoachingAdvice(topic = 'general') {
        const prompts = {
            general: "Based on my current domain scores, what's the single most impactful thing I could focus on this week to improve my overall well-being?",
            motivation: "I'm feeling unmotivated today. Based on my character profile, give me a personalized pep talk and one small action I can take right now.",
            habits: "Look at my current habits and domain scores. Suggest one new habit I should add and one I should consider removing or modifying.",
            progress: "Analyze my domain scores. Which area has the most potential for quick improvement, and what specific actions would help?"
        };

        return await this.chat(prompts[topic] || prompts.general, true);
    }
}

// ============================================================================
// JOURNAL ANALYZER CLASS
// ============================================================================

class JournalAnalyzer {
    constructor(plugin) {
        this.plugin = plugin;
    }

    // Get all journal notes based on settings
    async getJournalNotes() {
        const s = this.plugin.settings.journalSettings;
        const allFiles = this.plugin.app.vault.getMarkdownFiles();

        if (s.scanMode === 'folder') {
            const folderPath = s.journalFolder.endsWith('/') ? s.journalFolder : s.journalFolder + '/';
            return allFiles.filter(f => f.path.startsWith(folderPath) || f.path.startsWith(s.journalFolder + '/'));
        } else {
            // Tag-based: need to read each file's content
            const taggedNotes = [];
            for (const file of allFiles) {
                try {
                    const content = await this.plugin.app.vault.read(file);
                    if (content.includes(s.journalTag)) {
                        taggedNotes.push(file);
                    }
                } catch (e) {
                    console.error(`Error reading file ${file.path}:`, e);
                }
            }
            return taggedNotes;
        }
    }

    // Get notes modified since last sync
    async getNewNotes() {
        const allJournals = await this.getJournalNotes();
        const lastSync = this.plugin.settings.journalSettings.lastSyncDate;

        if (!lastSync) return allJournals; // First sync - analyze all

        const lastSyncTime = new Date(lastSync).getTime();
        return allJournals.filter(f => f.stat.mtime > lastSyncTime);
    }

    // Offline keyword-based analysis
    analyzeContentOffline(content) {
        const s = this.plugin.settings.journalSettings;
        const contentLower = content.toLowerCase();

        // Domain detection
        const domainScores = {};
        for (const [domain, keywords] of Object.entries(s.domainKeywords)) {
            const matches = keywords.filter(k => contentLower.includes(k.toLowerCase()));
            domainScores[domain] = {
                matches: matches,
                count: matches.length,
                intensity: matches.length / keywords.length
            };
        }

        // Sentiment analysis
        const positiveMatches = s.sentimentKeywords.positive.filter(k => contentLower.includes(k.toLowerCase()));
        const negativeMatches = s.sentimentKeywords.negative.filter(k => contentLower.includes(k.toLowerCase()));

        const sentiment = {
            positive: positiveMatches.length,
            negative: negativeMatches.length,
            score: positiveMatches.length - negativeMatches.length,
            positiveWords: positiveMatches,
            negativeWords: negativeMatches
        };

        return { domainScores, sentiment };
    }

    // AI-powered analysis (when API key available)
    async analyzeContentWithAI(content, fileName) {
        const apiKey = this.plugin.settings.ai?.openRouterApiKey;
        if (!apiKey) return null;

        const prompt = `Analyze this journal entry and return ONLY valid JSON (no markdown, no explanation):
{
    "domains": {
        "health": 0,
        "psychologicalWellbeing": 0,
        "education": 0,
        "timeUse": 0,
        "communityVitality": 0,
        "livingStandards": 0,
        "culturalResilience": 0,
        "goodGovernance": 0,
        "ecologicalAwareness": 0
    },
    "sentiment": 0,
    "achievements": [],
    "challenges": [],
    "suggestedXP": 0,
    "suggestedHPChange": 0
}

Scoring guide:
- domains: 0-10 score based on how much the entry focuses on each life area
- sentiment: -10 (very negative) to +10 (very positive)
- achievements: list of accomplishments mentioned (strings)
- challenges: list of difficulties mentioned (strings)
- suggestedXP: 0-50 based on accomplishments and effort
- suggestedHPChange: -20 to +10 (negative for stress/challenges, positive for self-care)

Journal entry from "${fileName}":
${content.substring(0, 2000)}`;

        try {
            // Use chat with saveToHistory=false to avoid polluting the Elder conversation
            const response = await this.plugin.aiService.chat(prompt, false, false);
            // Try to extract JSON from response
            let jsonStr = response;
            if (response.includes('```')) {
                const match = response.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (match) jsonStr = match[1];
            }
            return JSON.parse(jsonStr.trim());
        } catch (e) {
            console.error('AI analysis failed:', e);
            return null;
        }
    }

    // Combined analysis
    async analyzeNote(file) {
        const content = await this.plugin.app.vault.read(file);
        const offlineAnalysis = this.analyzeContentOffline(content);

        let aiAnalysis = null;
        if (this.plugin.settings.ai?.openRouterApiKey) {
            aiAnalysis = await this.analyzeContentWithAI(content, file.basename);
        }

        return {
            file: file.path,
            fileName: file.basename,
            modifiedDate: new Date(file.stat.mtime).toISOString(),
            wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
            offline: offlineAnalysis,
            ai: aiAnalysis
        };
    }
}

// ============================================================================
// CHARACTER CREATION MODAL
// ============================================================================

class CharacterCreationModal extends Modal {
    constructor(app, plugin, onComplete) {
        super(app);
        this.plugin = plugin;
        this.onComplete = onComplete;
        this.currentStep = 'welcome';
        this.characterName = '';
        this.currentDomainIndex = 0;
        this.currentQuestionIndex = 0;
        this.responses = [];
        this.allQuestions = this.buildQuestionList();
        this.totalQuestions = this.allQuestions.length;
    }

    buildQuestionList() {
        const questions = [];
        for (const domainId of DOMAIN_ORDER) {
            const domainQuestions = QUESTION_BANK[domainId];
            for (const q of domainQuestions) {
                questions.push({ ...q, domain: domainId });
            }
        }
        return questions;
    }

    getCurrentQuestion() {
        let idx = 0;
        for (let d = 0; d < this.currentDomainIndex; d++) {
            idx += QUESTION_BANK[DOMAIN_ORDER[d]].length;
        }
        idx += this.currentQuestionIndex;
        return this.allQuestions[idx];
    }

    getOverallProgress() {
        let answered = 0;
        for (let d = 0; d < this.currentDomainIndex; d++) {
            answered += QUESTION_BANK[DOMAIN_ORDER[d]].length;
        }
        answered += this.currentQuestionIndex;
        return Math.round((answered / this.totalQuestions) * 100);
    }

    onOpen() {
        this.render();
    }

    onClose() {
        this.contentEl.empty();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('rpg-assessment-modal');

        switch (this.currentStep) {
            case 'welcome':
                this.renderWelcome();
                break;
            case 'domain_intro':
                this.renderDomainIntro();
                break;
            case 'question':
                this.renderQuestion();
                break;
            case 'complete':
                this.renderComplete();
                break;
        }
    }

    renderWelcome() {
        const { contentEl } = this;

        contentEl.createEl('h2', { text: '🎭 Create Your Character' });

        const nameSection = contentEl.createDiv({ cls: 'rpg-name-section' });
        nameSection.createEl('label', { text: 'What should we call you?' });

        const nameInput = nameSection.createEl('input', {
            type: 'text',
            placeholder: 'Enter your name...',
            cls: 'rpg-name-input'
        });
        nameInput.value = this.characterName;
        nameInput.addEventListener('input', (e) => {
            this.characterName = e.target.value;
        });

        contentEl.createEl('h3', { text: 'Choose Your Path', cls: 'rpg-path-title' });

        const pathsContainer = contentEl.createDiv({ cls: 'rpg-paths-container' });

        // Quick Start Path
        const quickPath = pathsContainer.createDiv({ cls: 'rpg-path-card' });
        quickPath.createDiv({ cls: 'rpg-path-icon', text: '⚡' });
        quickPath.createEl('h4', { text: 'Quick Start' });
        quickPath.createEl('p', {
            text: 'Jump right in! Start with balanced stats and discover yourself through gameplay.',
            cls: 'rpg-path-desc'
        });
        quickPath.createDiv({ cls: 'rpg-path-reward', text: 'Start at Level 1' });
        const quickBtn = quickPath.createEl('button', {
            text: 'Start Adventure →',
            cls: 'rpg-primary-btn'
        });
        quickBtn.onclick = () => {
            if (!this.characterName.trim()) {
                this.characterName = 'Hero';
            }
            this.quickStart();
        };

        // Discovery Journey Path
        const journeyPath = pathsContainer.createDiv({ cls: 'rpg-path-card journey' });
        journeyPath.createDiv({ cls: 'rpg-path-icon', text: '🧭' });
        journeyPath.createEl('h4', { text: 'Discovery Journey' });
        journeyPath.createEl('p', {
            text: 'Answer 37 questions to discover your true strengths. Earn XP for each answer!',
            cls: 'rpg-path-desc'
        });
        journeyPath.createDiv({ cls: 'rpg-path-reward', text: '+5 XP per question • +50 bonus XP' });
        const journeyBtn = journeyPath.createEl('button', {
            text: 'Begin Journey →',
            cls: 'rpg-secondary-btn'
        });
        journeyBtn.onclick = () => {
            if (!this.characterName.trim()) {
                this.characterName = 'Hero';
            }
            this.currentStep = 'domain_intro';
            this.render();
        };

        contentEl.createEl('p', {
            text: "💡 Tip: You can always take the Discovery Journey later from your Character tab!",
            cls: 'rpg-modal-tip'
        });
    }

    async quickStart() {
        const s = this.plugin.settings;

        // Set default domain scores (all at 50%)
        s.domains = DEFAULT_DOMAINS.map(d => ({
            ...d,
            score: 50,
            level: 1,
            xp: 0
        }));

        s.characterProfile = {
            name: this.characterName,
            createdAt: new Date().toISOString(),
            assessmentComplete: false,  // Journey not completed
            assessmentResponses: [],
            questionsAnswered: 0
        };

        s.level = 1;
        s.maxHp = 110;
        s.hp = s.maxHp;
        s.xp = 0;

        await this.plugin.saveSettings();

        // Award character_created achievement
        const ach = s.achievements.find(a => a.id === 'character_created');
        if (ach && !ach.unlocked) {
            ach.unlocked = true;
            s.gold += ach.reward;
            s.totalGoldEarned = (s.totalGoldEarned || 0) + ach.reward;
            await this.plugin.saveSettings();
            new Notice(`🏆 Achievement: ${ach.name}! +${ach.reward}g`);
        }

        new Notice(`⚡ Character "${this.characterName}" created! Level 1`);

        this.close();
        if (this.onComplete) this.onComplete();
    }

    renderDomainIntro() {
        const { contentEl } = this;
        const domainId = DOMAIN_ORDER[this.currentDomainIndex];
        const domain = DEFAULT_DOMAINS.find(d => d.id === domainId);

        const progress = this.getOverallProgress();
        const progressBar = contentEl.createDiv({ cls: 'rpg-progress-container' });
        progressBar.createDiv({ cls: 'rpg-progress-label', text: `Progress: ${progress}%` });
        const bar = progressBar.createDiv({ cls: 'rpg-progress-bar' });
        bar.createDiv({ cls: 'rpg-progress-fill', attr: { style: `width: ${progress}%` } });

        contentEl.createEl('h2', { text: `${domain.icon} ${domain.name}` });
        contentEl.createEl('p', {
            text: DOMAIN_INTROS[domainId],
            cls: 'rpg-domain-intro-text'
        });
        contentEl.createEl('p', {
            text: `(${QUESTION_BANK[domainId].length} questions in this section)`,
            cls: 'rpg-question-count'
        });

        const btnContainer = contentEl.createDiv({ cls: 'rpg-modal-buttons' });
        const continueBtn = btnContainer.createEl('button', {
            text: 'Continue →',
            cls: 'rpg-primary-btn'
        });
        continueBtn.onclick = () => {
            this.currentStep = 'question';
            this.currentQuestionIndex = 0;
            this.render();
        };
    }

    renderQuestion() {
        const { contentEl } = this;
        const domainId = DOMAIN_ORDER[this.currentDomainIndex];
        const domainQuestions = QUESTION_BANK[domainId];
        const question = domainQuestions[this.currentQuestionIndex];
        const domain = DEFAULT_DOMAINS.find(d => d.id === domainId);

        const progress = this.getOverallProgress();
        const progressBar = contentEl.createDiv({ cls: 'rpg-progress-container' });
        progressBar.createDiv({ cls: 'rpg-progress-label', text: `Progress: ${progress}%` });
        const bar = progressBar.createDiv({ cls: 'rpg-progress-bar' });
        bar.createDiv({ cls: 'rpg-progress-fill', attr: { style: `width: ${progress}%` } });

        contentEl.createDiv({ cls: 'rpg-domain-badge', text: `${domain.icon} ${domain.name}` });

        const questionNum = this.currentQuestionIndex + 1;
        const totalInDomain = domainQuestions.length;
        contentEl.createDiv({ cls: 'rpg-question-number', text: `Question ${questionNum} of ${totalInDomain}` });

        contentEl.createEl('h3', { text: question.text, cls: 'rpg-question-text' });

        if (question.hint) {
            contentEl.createDiv({ cls: 'rpg-question-hint', text: `💡 ${question.hint}` });
        }

        const likertContainer = contentEl.createDiv({ cls: 'rpg-likert-container' });
        const labels = [
            { value: 1, label: 'Strongly Disagree', emoji: '😟' },
            { value: 2, label: 'Disagree', emoji: '😕' },
            { value: 3, label: 'Neutral', emoji: '😐' },
            { value: 4, label: 'Agree', emoji: '🙂' },
            { value: 5, label: 'Strongly Agree', emoji: '😊' }
        ];

        labels.forEach(opt => {
            const btn = likertContainer.createEl('button', { cls: 'rpg-likert-btn' });
            btn.createDiv({ cls: 'rpg-likert-emoji', text: opt.emoji });
            btn.createDiv({ cls: 'rpg-likert-value', text: opt.value.toString() });
            btn.createDiv({ cls: 'rpg-likert-label', text: opt.label });

            btn.onclick = () => this.submitResponse(question.id, opt.value);
        });

        const navContainer = contentEl.createDiv({ cls: 'rpg-nav-container' });
        if (this.currentQuestionIndex > 0 || this.currentDomainIndex > 0) {
            const backBtn = navContainer.createEl('button', { text: '← Back', cls: 'rpg-secondary-btn' });
            backBtn.onclick = () => this.goBack();
        }
    }

    async submitResponse(questionId, value) {
        const existingIdx = this.responses.findIndex(r => r.questionId === questionId);
        const isNewAnswer = existingIdx < 0;

        if (existingIdx >= 0) {
            this.responses[existingIdx].value = value;
        } else {
            this.responses.push({ questionId, value });
        }

        // Award XP for new answers
        if (isNewAnswer) {
            const xpReward = 5;
            this.plugin.settings.xp += xpReward;
            await this.plugin.saveSettings();
            new Notice(`+${xpReward} XP for answering!`);
        }

        const domainId = DOMAIN_ORDER[this.currentDomainIndex];
        const domainQuestions = QUESTION_BANK[domainId];

        if (this.currentQuestionIndex < domainQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.render();
        } else {
            if (this.currentDomainIndex < DOMAIN_ORDER.length - 1) {
                this.currentDomainIndex++;
                this.currentStep = 'domain_intro';
                this.render();
            } else {
                this.currentStep = 'complete';
                this.render();
            }
        }
    }

    goBack() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
        } else if (this.currentDomainIndex > 0) {
            this.currentDomainIndex--;
            const prevDomainQuestions = QUESTION_BANK[DOMAIN_ORDER[this.currentDomainIndex]];
            this.currentQuestionIndex = prevDomainQuestions.length - 1;
        }
        this.render();
    }

    renderComplete() {
        const { contentEl } = this;

        const domainScores = calculateDomainScores(this.responses);
        const level = calculateLevelFromScores(domainScores);
        const title = getCharacterTitle(level);

        contentEl.createEl('h2', { text: '🎉 Journey Complete!' });

        // Show rewards earned
        const rewardsBox = contentEl.createDiv({ cls: 'rpg-rewards-box' });
        rewardsBox.createEl('h4', { text: '🎁 Rewards Earned' });
        const totalXP = (this.responses.length * 5) + 50; // 5 per question + 50 bonus
        rewardsBox.createDiv({ cls: 'rpg-reward-item', text: `✨ ${this.responses.length * 5} XP from questions` });
        rewardsBox.createDiv({ cls: 'rpg-reward-item bonus', text: `🌟 +50 XP completion bonus!` });
        rewardsBox.createDiv({ cls: 'rpg-reward-total', text: `Total: ${totalXP} XP` });

        const card = contentEl.createDiv({ cls: 'rpg-character-card' });
        card.createDiv({ cls: 'rpg-card-title', text: title });
        card.createEl('h3', { text: this.characterName });
        card.createDiv({ cls: 'rpg-card-level', text: `Level ${level}` });

        const scoresSection = contentEl.createDiv({ cls: 'rpg-scores-section' });
        scoresSection.createEl('h4', { text: 'Your Domain Scores' });

        const sortedDomains = DOMAIN_ORDER.map(id => ({
            id,
            score: domainScores[id],
            ...DEFAULT_DOMAINS.find(d => d.id === id)
        })).sort((a, b) => b.score - a.score);

        scoresSection.createDiv({ cls: 'rpg-section-label', text: '💪 Top Strengths' });
        sortedDomains.slice(0, 3).forEach((d, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            scoresSection.createDiv({
                cls: 'rpg-score-row strength',
                text: `${medals[i]} ${d.icon} ${d.name}: ${d.score}%`
            });
        });

        scoresSection.createDiv({ cls: 'rpg-section-label', text: '🌱 Growth Areas' });
        sortedDomains.slice(-3).reverse().forEach(d => {
            scoresSection.createDiv({
                cls: 'rpg-score-row growth',
                text: `🎯 ${d.icon} ${d.name}: ${d.score}%`
            });
        });

        const chartSection = contentEl.createDiv({ cls: 'rpg-chart-section' });
        chartSection.createEl('h4', { text: 'All Domains' });

        DOMAIN_ORDER.forEach(domainId => {
            const domain = DEFAULT_DOMAINS.find(d => d.id === domainId);
            const score = domainScores[domainId];

            const row = chartSection.createDiv({ cls: 'rpg-domain-bar-row' });
            row.createDiv({ cls: 'rpg-domain-bar-label', text: `${domain.icon} ${domain.name}` });
            const barContainer = row.createDiv({ cls: 'rpg-domain-bar-container' });
            barContainer.createDiv({
                cls: 'rpg-domain-bar-fill',
                attr: { style: `width: ${score}%; background-color: ${domain.color}` }
            });
            row.createDiv({ cls: 'rpg-domain-bar-value', text: `${score}%` });
        });

        const btnContainer = contentEl.createDiv({ cls: 'rpg-modal-buttons' });
        const confirmBtn = btnContainer.createEl('button', {
            text: '✨ Apply Results',
            cls: 'rpg-primary-btn'
        });
        confirmBtn.onclick = () => {
            this.finalizeCharacter(domainScores, level);
        };
    }

    async finalizeCharacter(domainScores, level) {
        const s = this.plugin.settings;
        const isNewCharacter = !s.characterProfile?.name;

        s.domains = DEFAULT_DOMAINS.map(d => ({
            ...d,
            score: domainScores[d.id],
            level: Math.floor(domainScores[d.id] / 10) + 1,
            xp: 0
        }));

        // Give completion bonus XP
        const bonusXP = 50;
        s.xp += bonusXP;

        s.characterProfile = {
            name: this.characterName || s.characterProfile?.name || 'Hero',
            createdAt: s.characterProfile?.createdAt || new Date().toISOString(),
            assessmentComplete: true,
            assessmentResponses: this.responses,
            questionsAnswered: this.responses.length
        };

        s.level = level;
        s.maxHp = 100 + (level * 10);
        s.hp = s.maxHp;

        await this.plugin.saveSettings();

        // Check for journey completion achievement
        const journeyAch = s.achievements.find(a => a.id === 'journey_complete');
        if (journeyAch && !journeyAch.unlocked) {
            journeyAch.unlocked = true;
            s.gold += journeyAch.reward;
            s.totalGoldEarned += journeyAch.reward;
            await this.plugin.saveSettings();
            new Notice(`🏆 Achievement Unlocked: ${journeyAch.name}! +${journeyAch.reward}g`);
        }

        // Also check character_created if new
        if (isNewCharacter) {
            const ach = s.achievements.find(a => a.id === 'character_created');
            if (ach && !ach.unlocked) {
                ach.unlocked = true;
                s.gold += ach.reward;
                s.totalGoldEarned += ach.reward;
                await this.plugin.saveSettings();
                new Notice(`🏆 Achievement Unlocked: ${ach.name}! +${ach.reward}g`);
            }
        }

        new Notice(`🎉 Journey complete! +${bonusXP} bonus XP! Now Level ${level}!`);

        this.close();
        if (this.onComplete) this.onComplete();
    }
}

// ============================================================================
// ELDER SETTINGS MODAL - Customize AI Persona
// ============================================================================

class ElderSettingsModal extends Modal {
    constructor(app, plugin, onComplete) {
        super(app);
        this.plugin = plugin;
        this.onComplete = onComplete;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('rpg-elder-settings-modal');

        const s = this.plugin.settings;
        if (!s.ai) s.ai = { ...DEFAULT_AI_SETTINGS };
        if (!s.ai.elderPersona) s.ai.elderPersona = { ...DEFAULT_AI_SETTINGS.elderPersona };
        if (!s.ai.elderPrompts) s.ai.elderPrompts = { ...DEFAULT_AI_SETTINGS.elderPrompts };

        contentEl.createEl('h2', { text: '🧙 Customize Your Elder' });
        contentEl.createEl('p', {
            text: 'Shape the personality and wisdom of your guide.',
            cls: 'rpg-modal-subtitle'
        });

        // === PERSONA SECTION ===
        const personaSection = contentEl.createDiv({ cls: 'rpg-settings-section' });
        personaSection.createEl('h3', { text: '👤 Elder Identity' });

        // Name
        const nameRow = personaSection.createDiv({ cls: 'rpg-setting-row' });
        nameRow.createEl('label', { text: 'Name' });
        const nameInput = nameRow.createEl('input', { type: 'text' });
        nameInput.value = s.ai.elderPersona.name;
        nameInput.placeholder = 'The Elder';
        nameInput.onchange = (e) => s.ai.elderPersona.name = e.target.value;

        // Title
        const titleRow = personaSection.createDiv({ cls: 'rpg-setting-row' });
        titleRow.createEl('label', { text: 'Title' });
        const titleInput = titleRow.createEl('input', { type: 'text' });
        titleInput.value = s.ai.elderPersona.title;
        titleInput.placeholder = 'Keeper of Wisdom';
        titleInput.onchange = (e) => s.ai.elderPersona.title = e.target.value;

        // Greeting
        const greetingRow = personaSection.createDiv({ cls: 'rpg-setting-row vertical' });
        greetingRow.createEl('label', { text: 'Greeting Message' });
        const greetingInput = greetingRow.createEl('textarea');
        greetingInput.value = s.ai.elderPersona.greeting;
        greetingInput.placeholder = 'Greetings, traveler...';
        greetingInput.rows = 2;
        greetingInput.onchange = (e) => s.ai.elderPersona.greeting = e.target.value;

        // Personality Preset
        const personalityRow = personaSection.createDiv({ cls: 'rpg-setting-row' });
        personalityRow.createEl('label', { text: 'Personality' });
        const personalitySelect = personalityRow.createEl('select');

        Object.entries(ELDER_PERSONALITIES).forEach(([id, preset]) => {
            const option = personalitySelect.createEl('option', { value: id, text: preset.name });
            if (id === s.ai.elderPersona.personality) option.selected = true;
        });
        personalitySelect.onchange = (e) => s.ai.elderPersona.personality = e.target.value;

        // Preview personality
        const previewBox = personaSection.createDiv({ cls: 'rpg-personality-preview' });
        const updatePreview = () => {
            const preset = ELDER_PERSONALITIES[personalitySelect.value];
            previewBox.innerHTML = `
                <div class="rpg-preview-title">${preset.name}</div>
                <div class="rpg-preview-style">${preset.style}</div>
                <div class="rpg-preview-tone"><em>${preset.tone}</em></div>
            `;
        };
        updatePreview();
        personalitySelect.onchange = (e) => {
            s.ai.elderPersona.personality = e.target.value;
            updatePreview();
        };

        // === CUSTOM KNOWLEDGE ===
        const knowledgeSection = contentEl.createDiv({ cls: 'rpg-settings-section' });
        knowledgeSection.createEl('h3', { text: '📚 Personal Knowledge' });
        knowledgeSection.createEl('p', {
            text: 'Add context about yourself that the Elder should know (goals, background, preferences).',
            cls: 'rpg-setting-desc'
        });

        const knowledgeInput = knowledgeSection.createEl('textarea', { cls: 'rpg-large-textarea' });
        knowledgeInput.value = s.ai.customKnowledge || '';
        knowledgeInput.placeholder = 'Example:\n- I am a photographer transitioning careers\n- My main goal is to find my first client by end of month\n- I prefer actionable advice over philosophical musings\n- I struggle with procrastination';
        knowledgeInput.rows = 5;
        knowledgeInput.onchange = (e) => s.ai.customKnowledge = e.target.value;

        // === CUSTOM INSTRUCTIONS ===
        const instructionsSection = contentEl.createDiv({ cls: 'rpg-settings-section' });
        instructionsSection.createEl('h3', { text: '📜 Custom Instructions' });
        instructionsSection.createEl('p', {
            text: 'Additional instructions for how the Elder should behave or respond.',
            cls: 'rpg-setting-desc'
        });

        const instructionsInput = instructionsSection.createEl('textarea', { cls: 'rpg-large-textarea' });
        instructionsInput.value = s.ai.customSystemPrompt || '';
        instructionsInput.placeholder = 'Example:\n- Always end with an actionable next step\n- Reference Vietnamese culture when relevant\n- Keep responses under 200 words\n- Focus on practical advice, not theory';
        instructionsInput.rows = 4;
        instructionsInput.onchange = (e) => s.ai.customSystemPrompt = e.target.value;

        // === QUICK PROMPTS ===
        const promptsSection = contentEl.createDiv({ cls: 'rpg-settings-section' });
        promptsSection.createEl('h3', { text: '⚡ Quick Wisdom Prompts' });
        promptsSection.createEl('p', {
            text: 'Customize what happens when you click the quick wisdom buttons.',
            cls: 'rpg-setting-desc'
        });

        const prompts = [
            { id: 'guidance', label: '🔮 Guidance', default: DEFAULT_AI_SETTINGS.elderPrompts.guidance },
            { id: 'challenge', label: '⚔️ Challenge', default: DEFAULT_AI_SETTINGS.elderPrompts.challenge },
            { id: 'reflection', label: '🪞 Reflection', default: DEFAULT_AI_SETTINGS.elderPrompts.reflection },
            { id: 'motivation', label: '🔥 Motivation', default: DEFAULT_AI_SETTINGS.elderPrompts.motivation }
        ];

        prompts.forEach(prompt => {
            const promptRow = promptsSection.createDiv({ cls: 'rpg-setting-row vertical' });
            promptRow.createEl('label', { text: prompt.label });
            const promptInput = promptRow.createEl('textarea');
            promptInput.value = s.ai.elderPrompts[prompt.id] || prompt.default;
            promptInput.placeholder = prompt.default;
            promptInput.rows = 2;
            promptInput.onchange = (e) => s.ai.elderPrompts[prompt.id] = e.target.value;
        });

        // === BUTTONS ===
        const buttonRow = contentEl.createDiv({ cls: 'rpg-modal-buttons' });

        const resetBtn = buttonRow.createEl('button', {
            text: '🔄 Reset to Defaults',
            cls: 'rpg-btn secondary'
        });
        resetBtn.onclick = async () => {
            s.ai.elderPersona = { ...DEFAULT_AI_SETTINGS.elderPersona };
            s.ai.elderPrompts = { ...DEFAULT_AI_SETTINGS.elderPrompts };
            s.ai.customKnowledge = '';
            s.ai.customSystemPrompt = '';
            await this.plugin.saveSettings();
            this.onOpen(); // Re-render
        };

        const saveBtn = buttonRow.createEl('button', {
            text: '💾 Save Changes',
            cls: 'rpg-btn primary'
        });
        saveBtn.onclick = async () => {
            await this.plugin.saveSettings();
            new Notice('Elder settings saved!');
            this.close();
            if (this.onComplete) this.onComplete();
        };
    }

    onClose() {
        this.contentEl.empty();
    }
}

// ============================================================================
// AI QUEST GENERATOR MODAL
// ============================================================================

class AIQuestGeneratorModal extends Modal {
    constructor(app, plugin, onComplete) {
        super(app);
        this.plugin = plugin;
        this.onComplete = onComplete;
        this.generatedQuests = [];
        this.isLoading = false;
    }

    onOpen() {
        this.render();
    }

    onClose() {
        this.contentEl.empty();
    }

    render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('rpg-ai-modal');

        const hasApiKey = !!this.plugin.settings.ai?.openRouterApiKey;

        contentEl.createEl('h2', { text: '✨ Quest Generator' });

        // Show weakest domains
        const s = this.plugin.settings;
        const sortedDomains = [...s.domains].sort((a, b) => a.score - b.score);
        const weakestDomains = sortedDomains.slice(0, 3);

        const infoSection = contentEl.createDiv({ cls: 'rpg-ai-info' });
        infoSection.createEl('p', { text: 'Generate quests to improve your weakest domains:' });
        weakestDomains.forEach(d => {
            infoSection.createDiv({ cls: 'rpg-domain-tag', text: `${d.icon} ${d.name} (${d.score}%)` });
        });

        if (this.isLoading) {
            contentEl.createDiv({ cls: 'rpg-loading', text: '🎲 Generating quests...' });
            return;
        }

        if (this.generatedQuests.length > 0) {
            this.renderGeneratedQuests(contentEl);
            return;
        }

        // Generate buttons
        const btnContainer = contentEl.createDiv({ cls: 'rpg-modal-buttons' });

        // Smart generate (always available)
        const smartBtn = btnContainer.createEl('button', {
            text: '📚 Smart Generate (3 Quests)',
            cls: 'rpg-primary-btn'
        });
        smartBtn.onclick = () => this.generateSmartQuests();

        // AI generate (only with API key)
        if (hasApiKey) {
            const aiBtn = btnContainer.createEl('button', {
                text: '🤖 AI Generate (Enhanced)',
                cls: 'rpg-secondary-btn'
            });
            aiBtn.onclick = () => this.generateAIQuests();
        } else {
            contentEl.createDiv({
                cls: 'rpg-info-note',
                text: '💡 Add an API key in Settings to unlock AI-enhanced quest generation with personalized suggestions.'
            });
        }
    }

    // Smart quest generation - works offline
    generateSmartQuests() {
        const s = this.plugin.settings;
        const sortedDomains = [...s.domains].sort((a, b) => a.score - b.score);
        const weakestDomains = sortedDomains.slice(0, 3);

        this.generatedQuests = weakestDomains.map(domain => {
            const tips = COACHING_TIPS[domain.id] || COACHING_TIPS.psychologicalWellbeing;
            const randomTip = tips[Math.floor(Math.random() * tips.length)];

            return {
                name: randomTip.tip,
                xp: 15 + Math.floor(Math.random() * 15),
                gold: 5 + Math.floor(Math.random() * 10),
                domain: domain.id,
                difficulty: 'medium',
                source: 'smart'
            };
        });

        this.render();
    }

    // AI quest generation - requires API key
    async generateAIQuests() {
        this.isLoading = true;
        this.render();

        try {
            const aiService = new AIService(this.plugin);
            this.generatedQuests = await aiService.generateQuests(3);
            this.generatedQuests = this.generatedQuests.map(q => ({ ...q, source: 'ai' }));
            this.isLoading = false;
            this.render();
        } catch (error) {
            this.isLoading = false;
            new Notice(`❌ ${error.message}`);
            // Fallback to smart generation
            this.generateSmartQuests();
        }
    }

    renderGeneratedQuests(contentEl) {
        contentEl.createEl('h3', { text: 'Generated Quests' });

        this.generatedQuests.forEach((quest, index) => {
            const questEl = contentEl.createDiv({ cls: 'rpg-generated-quest' });

            const domain = this.plugin.settings.domains.find(d => d.id === quest.domain);
            const domainIcon = domain ? domain.icon : '📌';

            questEl.createDiv({ cls: 'rpg-quest-name', text: quest.name });
            questEl.createDiv({
                cls: 'rpg-quest-meta',
                text: `${domainIcon} ${quest.domain} | ${quest.difficulty} | +${quest.xp}xp +${quest.gold}g`
            });

            const addBtn = questEl.createEl('button', { text: 'Add Quest', cls: 'rpg-add-btn' });
            addBtn.onclick = async () => {
                this.plugin.settings.quests.push({
                    name: quest.name,
                    domain: quest.domain,
                    difficulty: quest.difficulty,
                    xp: quest.xp,
                    gold: quest.gold,
                    completed: false,
                    completedDate: null,
                    aiGenerated: true
                });

                // Track AI quest generation
                if (!this.plugin.settings.aiQuestsGenerated) {
                    this.plugin.settings.aiQuestsGenerated = 0;
                }
                this.plugin.settings.aiQuestsGenerated++;

                await this.plugin.saveSettings();
                this.plugin.checkAchievements();

                addBtn.disabled = true;
                addBtn.setText('✓ Added');
                new Notice(`⚔️ Quest added: ${quest.name}`);
            };
        });

        const btnContainer = contentEl.createDiv({ cls: 'rpg-modal-buttons' });

        const regenerateBtn = btnContainer.createEl('button', {
            text: '🔄 Generate More',
            cls: 'rpg-secondary-btn'
        });
        regenerateBtn.onclick = () => {
            this.generatedQuests = [];
            this.generateQuests();
        };

        const closeBtn = btnContainer.createEl('button', {
            text: 'Done',
            cls: 'rpg-primary-btn'
        });
        closeBtn.onclick = () => {
            this.close();
            if (this.onComplete) this.onComplete();
        };
    }
}

// ============================================================================
// HERO DASHBOARD VIEW
// ============================================================================

class HeroView extends ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.activeTab = 'journal';
        this.activeSubTab = 'habits'; // For Quests Hub sub-tabs
        this.activeArenaTab = 'boss'; // For Arena sub-tabs
        this.aiChatInput = '';
        this.aiChatMessages = [];
        this.isAiLoading = false;
    }

    getViewType() { return VIEW_TYPE_HERO; }
    getDisplayText() { return "Hero Sheet"; }
    getIcon() { return "swords"; }

    async onOpen() { this.render(); }
    async onClose() {}

    render() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('life-rpg-container');

        const s = this.plugin.settings;
        const xpToNextLevel = s.level * 100;
        const hpPercent = Math.max(0, Math.min(100, (s.hp / s.maxHp) * 100));
        const xpPercent = Math.max(0, Math.min(100, (s.xp / xpToNextLevel) * 100));

        // --- HEADER & MAIN STATS ---
        const header = container.createDiv({ cls: 'rpg-header' });
        const profile = header.createDiv({ cls: "rpg-profile" });

        const avatarText = s.characterProfile?.name
            ? getCharacterTitle(s.level).split(' ')[0]
            : "🧙‍♂️";
        profile.createEl("div", { cls: "rpg-avatar", text: avatarText });

        const nameText = s.characterProfile?.name || `Level ${s.level}`;
        profile.createEl("h2", { text: nameText });
        if (s.characterProfile?.name) {
            const devLevel = getDevelopmentLevel(s.level);
            const devInfo = DEVELOPMENT_LEVELS[devLevel];
            const tierProgress = getTierProgress(s.level);

            profile.createEl("div", { cls: "rpg-level-badge", text: `Level ${s.level} ${getCharacterTitle(s.level).split(' ').slice(1).join(' ')}` });
            profile.createEl("div", {
                cls: `rpg-human-tier-badge tier-${devLevel.replace('.', '-')}`,
                text: `${devInfo.icon} HUMAN ${devLevel} • ${tierProgress}%`
            });
        }

        const statBox = container.createDiv({ cls: "rpg-stat-box" });
        statBox.createDiv({ text: `❤️ HP: ${s.hp} / ${s.maxHp}` });
        statBox.createDiv({ cls: "rpg-bar-bg" }).createDiv({ cls: "rpg-bar-fill hp", attr: { style: `width: ${hpPercent}%` } });
        statBox.createDiv({ text: `✨ XP: ${s.xp} / ${xpToNextLevel}` });
        statBox.createDiv({ cls: "rpg-bar-bg" }).createDiv({ cls: "rpg-bar-fill xp", attr: { style: `width: ${xpPercent}%` } });
        statBox.createDiv({ cls: "rpg-gold", text: `💰 Gold: ${s.gold}` });

        // --- DOMAINS SECTION (Compact) ---
        if (s.characterProfile?.assessmentComplete) {
            const domainsSection = container.createDiv({ cls: 'rpg-domains-section' });
            domainsSection.createEl("h4", { text: "Life Domains" });
            const domainsGrid = domainsSection.createDiv({ cls: 'rpg-domains-grid' });

            s.domains.forEach(domain => {
                const domainEl = domainsGrid.createDiv({ cls: 'rpg-domain-item' });
                domainEl.createDiv({ cls: 'rpg-domain-header', text: `${domain.icon} ${domain.name.split(' ')[0]}` });
                domainEl.createDiv({ cls: 'rpg-domain-score', text: `${domain.score}%` });
                const barBg = domainEl.createDiv({ cls: "rpg-bar-bg small" });
                barBg.createDiv({
                    cls: "rpg-bar-fill domain",
                    attr: { style: `width: ${domain.score}%; background-color: ${domain.color}` }
                });
            });
        }

        // --- TAB NAVIGATION (Simplified 7 tabs) ---
        const tabNav = container.createDiv({ cls: 'rpg-tab-nav' });
        const tabs = [
            { id: 'journal', label: '📓 Journal' },
            { id: 'character', label: '🎭 Hero' },
            { id: 'elder', label: '🧙 Elder' },
            { id: 'quests', label: '⚔️ Quests' },
            { id: 'arena', label: '🐉 Arena' },
            { id: 'tavern', label: '🏨 Tavern' },
            { id: 'log', label: '📜 History' }
        ];

        tabs.forEach(tab => {
            const tabBtn = tabNav.createEl('button', {
                text: tab.label,
                cls: `rpg-tab-btn ${this.activeTab === tab.id ? 'active' : ''}`
            });
            tabBtn.onclick = () => { this.activeTab = tab.id; this.render(); };
        });

        // --- TAB CONTENT ---
        const tabContent = container.createDiv({ cls: 'rpg-tab-content' });

        if (this.activeTab === 'journal') this.renderJournal(tabContent);
        else if (this.activeTab === 'character') this.renderCharacter(tabContent);
        else if (this.activeTab === 'elder') this.renderElder(tabContent);
        else if (this.activeTab === 'quests') this.renderQuestsHub(tabContent);
        else if (this.activeTab === 'arena') this.renderArena(tabContent);
        else if (this.activeTab === 'tavern') this.renderTavern(tabContent);
        else if (this.activeTab === 'log') this.renderActivityLog(tabContent);
    }

    renderCharacter(container) {
        const s = this.plugin.settings;

        // No character created yet
        if (!s.characterProfile?.name) {
            container.createEl("h3", { text: "🎭 Create Your Character" });
            const emptyState = container.createDiv({ cls: 'rpg-empty-character' });
            emptyState.createEl('p', { text: "Welcome, adventurer!" });
            emptyState.createEl('p', { text: "Create your character to begin your Life RPG journey." });

            const createBtn = container.createEl('button', {
                text: '✨ Create Your Character',
                cls: 'rpg-full-width-btn primary'
            });
            createBtn.onclick = () => {
                new CharacterCreationModal(this.app, this.plugin, () => this.render()).open();
            };
            return;
        }

        // Show Discovery Journey prompt if not completed
        if (!s.characterProfile.assessmentComplete) {
            const journeyBox = container.createDiv({ cls: 'rpg-journey-prompt' });
            journeyBox.createEl('h4', { text: '🧭 Discovery Journey' });
            journeyBox.createEl('p', {
                text: 'Answer 37 questions to discover your true strengths and unlock your full potential!',
                cls: 'rpg-journey-desc'
            });

            const rewardsInfo = journeyBox.createDiv({ cls: 'rpg-journey-rewards' });
            rewardsInfo.createSpan({ text: '🎁 Rewards: ' });
            rewardsInfo.createSpan({ text: '+5 XP per question • +50 bonus XP • Accurate domain scores', cls: 'rpg-journey-reward-text' });

            const journeyBtn = journeyBox.createEl('button', {
                text: '🧭 Start Discovery Journey',
                cls: 'rpg-full-width-btn journey'
            });
            journeyBtn.onclick = () => {
                const modal = new CharacterCreationModal(this.app, this.plugin, () => this.render());
                modal.characterName = s.characterProfile.name;
                modal.currentStep = 'domain_intro';
                modal.open();
            };
        }

        // Daily Wisdom Quote
        const today = new Date().toDateString();
        if (s.lastWisdomDate !== today || !s.dailyWisdom) {
            s.dailyWisdom = getContextualWisdom(s);
            s.lastWisdomDate = today;
            this.plugin.saveSettings();
        }

        if (s.dailyWisdom) {
            const wisdomSection = container.createDiv({ cls: 'rpg-wisdom-section standalone' });
            wisdomSection.createDiv({ cls: 'rpg-wisdom-label', text: '💡 Daily Wisdom' });
            wisdomSection.createDiv({ cls: 'rpg-wisdom-quote', text: `"${s.dailyWisdom.text}"` });
            if (s.dailyWisdom.source) {
                wisdomSection.createDiv({ cls: 'rpg-wisdom-source', text: `— ${s.dailyWisdom.source}` });
            }
        }

        // HUMAN 3.0 Framework Section
        const human3Section = container.createDiv({ cls: 'rpg-human3-section' });
        human3Section.createEl('h4', { text: '🎯 HUMAN 3.0 Framework' });

        // Calculate quadrant scores
        const quadrantScores = calculateQuadrantScores(s.domains);
        const devLevel = getDevelopmentLevel(s.level);
        const devInfo = DEVELOPMENT_LEVELS[devLevel];
        const tierProgress = getTierProgress(s.level);
        const levelsToNext = getLevelsToNextTier(s.level);

        // Development Level Display
        const devLevelSection = human3Section.createDiv({ cls: 'rpg-dev-level' });
        devLevelSection.innerHTML = `
            <div class="rpg-dev-level-badge level-${devLevel.replace('.', '-')}">${devInfo.icon} HUMAN ${devLevel}</div>
            <div class="rpg-dev-level-title">${devInfo.name} - ${devInfo.title}</div>
            <div class="rpg-dev-level-journey">${devInfo.journey}</div>
            <div class="rpg-dev-level-desc">${devInfo.desc}</div>
        `;

        // Tier Progress Bar
        const tierProgressSection = human3Section.createDiv({ cls: 'rpg-tier-progress' });
        tierProgressSection.innerHTML = `
            <div class="rpg-tier-progress-label">Tier Progress: ${tierProgress}%</div>
            <div class="rpg-tier-progress-bar">
                <div class="rpg-tier-progress-fill" style="width: ${tierProgress}%"></div>
            </div>
            ${levelsToNext > 0
                ? `<div class="rpg-tier-next">${levelsToNext} levels to HUMAN ${devLevel === '1.0' ? '2.0' : '3.0'}</div>`
                : `<div class="rpg-tier-max">🌟 Maximum HUMAN tier achieved!</div>`
            }
        `;

        // Four Quadrants Section
        const quadrantsSection = container.createDiv({ cls: 'rpg-quadrants-section' });
        quadrantsSection.createEl('h4', { text: '📊 Four Quadrants of Development' });

        // Calculate overall balance score
        const quadrantValues = Object.values(quadrantScores);
        const overallScore = Math.round(quadrantValues.reduce((a, b) => a + b, 0) / 4);
        const minQuadrant = Math.min(...quadrantValues);
        const maxQuadrant = Math.max(...quadrantValues);
        const balance = 100 - (maxQuadrant - minQuadrant);

        // Overall stats
        const overallStats = quadrantsSection.createDiv({ cls: 'rpg-quadrant-overall' });
        overallStats.innerHTML = `
            <div class="rpg-quadrant-overall-stat">
                <span class="label">Overall:</span>
                <span class="value">${overallScore}%</span>
            </div>
            <div class="rpg-quadrant-overall-stat">
                <span class="label">Balance:</span>
                <span class="value ${balance >= 70 ? 'good' : balance >= 50 ? 'fair' : 'low'}">${balance}%</span>
            </div>
        `;

        // Quadrants Grid
        const quadrantsGrid = quadrantsSection.createDiv({ cls: 'rpg-quadrants-grid' });

        QUADRANTS.forEach(quadrant => {
            const score = Math.round(quadrantScores[quadrant.id]);
            const relatedDomainIds = Object.entries(DOMAIN_TO_QUADRANT)
                .filter(([_, q]) => q === quadrant.id)
                .map(([domainId, _]) => domainId);
            const relatedDomains = s.domains.filter(d => relatedDomainIds.includes(d.id));

            const card = quadrantsGrid.createDiv({ cls: 'rpg-quadrant-card' });

            // Quadrant Header
            const header = card.createDiv({ cls: 'rpg-quadrant-header', attr: { style: `background: ${quadrant.color}20` } });
            header.innerHTML = `
                <span class="rpg-quadrant-icon">${quadrant.icon}</span>
                <span class="rpg-quadrant-name">${quadrant.name}</span>
            `;

            // Quadrant Score Bar
            const barContainer = card.createDiv({ cls: 'rpg-quadrant-bar-container' });
            barContainer.createDiv({
                cls: 'rpg-quadrant-bar',
                attr: { style: `width: ${score}%; background-color: ${quadrant.color}` }
            });
            card.createDiv({ cls: 'rpg-quadrant-score', text: `${score}%` });

            // Quadrant Description
            card.createDiv({ cls: 'rpg-quadrant-desc', text: quadrant.desc });

            // Related Domains
            const domainsContainer = card.createDiv({ cls: 'rpg-quadrant-domains' });
            relatedDomains.forEach(domain => {
                const domainRow = domainsContainer.createDiv({ cls: 'rpg-quadrant-domain-row' });
                domainRow.innerHTML = `
                    <span class="rpg-qd-icon">${domain.icon}</span>
                    <span class="rpg-qd-name">${domain.name}</span>
                    <span class="rpg-qd-score">${domain.score}%</span>
                `;
            });
        });

        // Journey Stats
        const statsSection = container.createDiv({ cls: 'rpg-char-stats-summary' });
        statsSection.createEl('h4', { text: '📈 Journey Stats' });

        const createdDate = new Date(s.characterProfile.createdAt).toLocaleDateString();
        const statsGrid = statsSection.createDiv({ cls: 'rpg-stats-grid' });

        statsGrid.innerHTML = `
            <div class="rpg-stat-card">
                <div class="rpg-stat-icon">📅</div>
                <div class="rpg-stat-label">Started</div>
                <div class="rpg-stat-value">${createdDate}</div>
            </div>
            <div class="rpg-stat-card">
                <div class="rpg-stat-icon">✅</div>
                <div class="rpg-stat-label">Habits</div>
                <div class="rpg-stat-value">${s.totalHabitsCompleted || 0}</div>
            </div>
            <div class="rpg-stat-card">
                <div class="rpg-stat-icon">⚔️</div>
                <div class="rpg-stat-label">Quests</div>
                <div class="rpg-stat-value">${s.totalQuestsCompleted || 0}</div>
            </div>
            <div class="rpg-stat-card">
                <div class="rpg-stat-icon">💰</div>
                <div class="rpg-stat-label">Gold Earned</div>
                <div class="rpg-stat-value">${s.totalGoldEarned || 0}</div>
            </div>
        `;

        // Retake Assessment button
        const retakeBtn = container.createEl('button', {
            text: '🔄 Retake Assessment',
            cls: 'rpg-full-width-btn secondary'
        });
        retakeBtn.onclick = () => {
            if (confirm('Retaking the assessment will update your domain scores. Continue?')) {
                new CharacterCreationModal(this.app, this.plugin, () => this.render()).open();
            }
        };
    }

    renderJournal(container) {
        const s = this.plugin.settings;
        const js = s.journalSettings || {};

        container.createEl('h3', { text: '📓 Journal Intelligence' });

        // Sync Status Card
        const statusCard = container.createDiv({ cls: 'rpg-journal-status' });
        const lastSync = js.lastSyncDate
            ? new Date(js.lastSyncDate).toLocaleString()
            : 'Never';
        const scanModeText = js.scanMode === 'folder'
            ? `📁 Folder: /${js.journalFolder || 'Journal'}/`
            : `🏷️ Tag: ${js.journalTag || '#journal'}`;

        statusCard.innerHTML = `
            <div class="rpg-journal-stat">
                <span class="label">Last Sync:</span>
                <span class="value">${lastSync}</span>
            </div>
            <div class="rpg-journal-stat">
                <span class="label">Scan Mode:</span>
                <span class="value">${scanModeText}</span>
            </div>
            <div class="rpg-journal-stat">
                <span class="label">AI Analysis:</span>
                <span class="value">${s.ai?.openRouterApiKey ? '✅ Enabled' : '❌ Disabled'}</span>
            </div>
        `;

        // Sync Button
        const syncBtn = container.createEl('button', {
            text: '🔄 Sync Journal Entries',
            cls: 'rpg-full-width-btn primary'
        });
        syncBtn.onclick = async () => {
            syncBtn.disabled = true;
            syncBtn.textContent = '⏳ Analyzing...';
            try {
                await this.plugin.syncJournals();
                this.render();
            } catch (e) {
                new Notice(`❌ Sync failed: ${e.message}`);
                console.error(e);
            } finally {
                syncBtn.disabled = false;
                syncBtn.textContent = '🔄 Sync Journal Entries';
            }
        };

        // Recent Analysis Results
        if (js.recentAnalysis && js.recentAnalysis.length > 0) {
            container.createEl('h4', { text: '📊 Recent Analysis' });
            const analysisList = container.createDiv({ cls: 'rpg-analysis-list' });

            js.recentAnalysis.slice(0, 5).forEach(a => {
                const item = analysisList.createDiv({ cls: 'rpg-analysis-item' });
                const sentimentClass = a.sentiment > 0 ? 'positive' : (a.sentiment < 0 ? 'negative' : 'neutral');
                const sentimentIcon = a.sentiment > 2 ? '😊' : (a.sentiment < -2 ? '😔' : '😐');

                item.innerHTML = `
                    <div class="rpg-analysis-name">${a.fileName}</div>
                    <div class="rpg-analysis-details">
                        <span class="rpg-analysis-sentiment ${sentimentClass}">
                            ${sentimentIcon} ${a.sentiment > 0 ? '+' : ''}${a.sentiment}
                        </span>
                        <span class="rpg-analysis-xp">+${a.xp || 0} XP</span>
                    </div>
                `;
            });
        } else {
            const emptyState = container.createDiv({ cls: 'rpg-empty' });
            emptyState.textContent = 'No journal entries analyzed yet. Press "Sync" to get started!';
        }

        // Domain Keywords Summary
        container.createEl('h4', { text: '🏷️ Domain Keywords' });
        const keywordsInfo = container.createDiv({ cls: 'rpg-journal-keywords-info' });
        keywordsInfo.innerHTML = `
            <p class="rpg-journal-keywords-note">
                The plugin scans your journals for keywords related to each life domain.
                Customize keywords in plugin settings.
            </p>
        `;

        // Show a preview of keywords
        const keywordsGrid = container.createDiv({ cls: 'rpg-journal-keywords-grid' });
        const domainOrder = ['health', 'psychologicalWellbeing', 'education', 'timeUse', 'communityVitality'];

        domainOrder.forEach(domainId => {
            const keywords = js.domainKeywords?.[domainId] || [];
            const domainInfo = s.domains.find(d => d.id === domainId);
            if (domainInfo && keywords.length > 0) {
                const card = keywordsGrid.createDiv({ cls: 'rpg-keyword-card' });
                card.innerHTML = `
                    <div class="rpg-keyword-domain">${domainInfo.icon} ${domainInfo.name.split(' ')[0]}</div>
                    <div class="rpg-keyword-examples">${keywords.slice(0, 3).join(', ')}...</div>
                `;
            }
        });

        // Tips Section
        const tipsBox = container.createDiv({ cls: 'rpg-journal-tips' });
        tipsBox.innerHTML = `
            <h4>💡 Tips for Journal XP</h4>
            <ul>
                <li>Write about achievements to gain XP</li>
                <li>Mention specific domains to level them up</li>
                <li>Longer entries = more Gold (1g per 100 words)</li>
                <li>Reflect on challenges honestly (may cost HP but builds awareness)</li>
                <li>Enable AI for deeper sentiment analysis</li>
            </ul>
        `;

        // Settings Link
        const settingsBtn = container.createEl('button', {
            text: '⚙️ Configure Journal Settings',
            cls: 'rpg-full-width-btn secondary'
        });
        settingsBtn.onclick = () => {
            this.app.setting.open();
            this.app.setting.openTabById('life-rpg');
        };
    }

    renderAICoach(container) {
        const s = this.plugin.settings;
        const hasApiKey = !!s.ai?.openRouterApiKey;

        container.createEl("h3", { text: "🧠 Life Coach" });

        // Mode indicator
        const modeIndicator = container.createDiv({ cls: `rpg-coach-mode ${hasApiKey ? 'ai-mode' : 'offline-mode'}` });
        modeIndicator.innerHTML = hasApiKey
            ? '🤖 <strong>AI-Enhanced Mode</strong> - Powered by AI for personalized coaching'
            : '📚 <strong>Smart Coach Mode</strong> - Built-in coaching system';

        // === PROGRESS ANALYSIS (Always available) ===
        this.renderProgressAnalysis(container);

        // === DAILY TIP (Always available) ===
        this.renderDailyTip(container);

        // === DOMAIN ADVICE (Always available) ===
        this.renderDomainAdvice(container);

        // === MOTIVATION (Always available) ===
        this.renderMotivationSection(container);

        // === AI CHAT (Only with API key) ===
        if (hasApiKey) {
            this.renderAIChat(container);
        } else {
            // Upgrade prompt
            const upgradeSection = container.createDiv({ cls: 'rpg-coach-upgrade' });
            upgradeSection.createEl('h4', { text: '✨ Unlock AI-Enhanced Coaching' });
            upgradeSection.createEl('p', { text: 'Add an OpenRouter API key to unlock:' });

            const featureList = upgradeSection.createEl('ul', { cls: 'rpg-upgrade-features' });
            featureList.createEl('li', { text: '💬 Chat with AI for personalized advice' });
            featureList.createEl('li', { text: '🎯 AI-generated quests tailored to you' });
            featureList.createEl('li', { text: '📊 Deep analysis of your patterns' });
            featureList.createEl('li', { text: '🧠 Contextual coaching based on your data' });

            const settingsBtn = upgradeSection.createEl('button', {
                text: '⚙️ Add API Key in Settings',
                cls: 'rpg-full-width-btn secondary'
            });
            settingsBtn.onclick = () => {
                this.app.setting.open();
                this.app.setting.openTabById('life-rpg');
            };
        }
    }

    // ============================================================================
    // ELDER TAB - Wise Elder (Redesigned AI Coach)
    // ============================================================================
    renderElder(container) {
        const s = this.plugin.settings;
        const ai = s.ai || {};
        const persona = ai.elderPersona || DEFAULT_AI_SETTINGS.elderPersona;
        const hasApiKey = !!ai.openRouterApiKey;

        // Elder Header with persona name
        const elderHeader = container.createDiv({ cls: 'rpg-elder-header' });
        elderHeader.innerHTML = `
            <div class="rpg-elder-avatar">🧙</div>
            <div class="rpg-elder-info">
                <h3 class="rpg-elder-name">${persona.name}</h3>
                <span class="rpg-elder-title">${persona.title}</span>
            </div>
            <button class="rpg-elder-settings-btn" title="Customize Elder">⚙️</button>
        `;

        // Settings button click
        elderHeader.querySelector('.rpg-elder-settings-btn').onclick = () => {
            new ElderSettingsModal(this.app, this.plugin, () => this.render()).open();
        };

        // Connection Status
        const statusBadge = container.createDiv({ cls: `rpg-elder-status ${hasApiKey ? 'connected' : 'offline'}` });
        statusBadge.innerHTML = hasApiKey
            ? '✨ <span>Connected to the Ethereal Realm</span>'
            : '📜 <span>Wisdom from Ancient Scrolls</span>';

        if (!hasApiKey) {
            // Offline mode - show built-in wisdom
            this.renderElderOfflineMode(container, persona);
            return;
        }

        // Elder's Greeting
        const greetingBox = container.createDiv({ cls: 'rpg-elder-greeting' });
        greetingBox.innerHTML = `
            <div class="rpg-elder-speech-bubble">
                <p>"${persona.greeting}"</p>
            </div>
        `;

        // Quick Wisdom Buttons
        const wisdomSection = container.createDiv({ cls: 'rpg-elder-wisdom-section' });
        wisdomSection.createEl('h4', { text: '🌟 Seek Wisdom' });

        const wisdomGrid = wisdomSection.createDiv({ cls: 'rpg-elder-wisdom-grid' });

        const elderPrompts = ai.elderPrompts || DEFAULT_AI_SETTINGS.elderPrompts;
        const wisdomActions = [
            { id: 'guidance', icon: '🔮', label: 'Guidance', desc: 'Seek direction', display: 'Elder, I seek your guidance on my path forward.' },
            { id: 'challenge', icon: '⚔️', label: 'Challenge', desc: 'Request a quest', display: 'Elder, I am ready for a new challenge. What quest would you suggest?' },
            { id: 'reflection', icon: '🪞', label: 'Reflection', desc: 'Review journey', display: 'Elder, help me reflect on my journey so far.' },
            { id: 'motivation', icon: '🔥', label: 'Courage', desc: 'Find strength', display: 'Elder, I need encouragement. Remind me of my strength.' }
        ];

        wisdomActions.forEach(action => {
            const btn = wisdomGrid.createDiv({ cls: 'rpg-elder-wisdom-btn' });
            btn.innerHTML = `
                <span class="icon">${action.icon}</span>
                <span class="label">${action.label}</span>
                <span class="desc">${action.desc}</span>
            `;
            btn.onclick = async () => {
                const prompt = elderPrompts[action.id] || DEFAULT_AI_SETTINGS.elderPrompts[action.id];
                await this.sendElderMessage(prompt, true, action.display);
            };
        });

        // Chat Container
        this.renderElderChat(container);
    }

    renderElderOfflineMode(container, persona) {
        // Show upgrade prompt with RPG flavor
        const offlineSection = container.createDiv({ cls: 'rpg-elder-offline' });

        offlineSection.innerHTML = `
            <div class="rpg-elder-speech-bubble offline">
                <p>"I sense your presence, traveler, but the ethereal connection is not established.
                To hear my voice directly, you must forge a link to the mystical realm..."</p>
            </div>

            <div class="rpg-elder-upgrade-box">
                <h4>🔮 Unlock the Elder's Voice</h4>
                <p>Connect to OpenRouter to enable direct conversations with ${persona.name}:</p>
                <ul>
                    <li>💬 Have meaningful conversations about your journey</li>
                    <li>🎯 Receive personalized quest recommendations</li>
                    <li>📊 Get deep analysis of your life patterns</li>
                    <li>🧠 Access wisdom tailored to your unique path</li>
                </ul>
            </div>
        `;

        const connectBtn = offlineSection.createEl('button', {
            text: '🔗 Establish Connection (Settings)',
            cls: 'rpg-full-width-btn primary'
        });
        connectBtn.onclick = () => {
            this.app.setting.open();
            this.app.setting.openTabById('life-rpg');
        };

        // Still show offline wisdom
        offlineSection.createEl('hr');
        offlineSection.createEl('h4', { text: '📜 Wisdom from the Scrolls' });

        this.renderDailyTip(offlineSection);
        this.renderDomainAdvice(offlineSection);
    }

    renderElderChat(container) {
        const s = this.plugin.settings;
        const persona = s.ai?.elderPersona || DEFAULT_AI_SETTINGS.elderPersona;

        const chatSection = container.createDiv({ cls: 'rpg-elder-chat-section' });
        chatSection.createEl('h4', { text: '💬 Converse with the Elder' });

        // Chat Messages
        const chatContainer = chatSection.createDiv({ cls: 'rpg-elder-chat-container' });

        if (this.aiChatMessages.length === 0 && s.ai?.chatHistory?.length > 0) {
            this.aiChatMessages = s.ai.chatHistory.slice(-10);
        }

        const messagesEl = chatContainer.createDiv({ cls: 'rpg-elder-messages' });

        if (this.aiChatMessages.length === 0) {
            messagesEl.createDiv({
                cls: 'rpg-elder-welcome',
                text: `${persona.name} awaits your questions. What weighs on your mind, traveler?`
            });
        } else {
            this.aiChatMessages.forEach(msg => {
                const msgEl = messagesEl.createDiv({ cls: `rpg-elder-message ${msg.role}` });
                const avatar = msgEl.createDiv({ cls: 'rpg-elder-msg-avatar' });
                avatar.textContent = msg.role === 'assistant' ? '🧙' : '🧑';

                const contentEl = msgEl.createDiv({ cls: 'rpg-elder-msg-content' });
                if (msg.role === 'assistant') {
                    contentEl.innerHTML = renderMarkdownToHtml(msg.content);
                } else {
                    contentEl.textContent = msg.content;
                }
            });
        }

        if (this.isAiLoading) {
            const loadingEl = messagesEl.createDiv({ cls: 'rpg-elder-loading' });
            loadingEl.innerHTML = '<span class="rpg-elder-loading-icon">🧙</span> The Elder ponders...';
        }

        setTimeout(() => messagesEl.scrollTop = messagesEl.scrollHeight, 0);

        // Chat Input
        const inputSection = chatSection.createDiv({ cls: 'rpg-elder-input-section' });

        const inputWrapper = inputSection.createDiv({ cls: 'rpg-elder-input-wrapper' });
        const chatInput = inputWrapper.createEl('textarea', {
            placeholder: 'Speak your mind, traveler...',
            cls: 'rpg-elder-input'
        });
        chatInput.value = this.aiChatInput;
        chatInput.addEventListener('input', (e) => this.aiChatInput = e.target.value);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendElderMessage(this.aiChatInput);
            }
        });

        const sendBtn = inputWrapper.createEl('button', {
            cls: 'rpg-elder-send-btn',
            text: '📤'
        });
        sendBtn.title = 'Send message';
        sendBtn.onclick = () => this.sendElderMessage(this.aiChatInput);

        // Action buttons
        const actionBtns = inputSection.createDiv({ cls: 'rpg-elder-action-btns' });

        const clearBtn = actionBtns.createEl('button', {
            text: '🗑️ Clear Conversation',
            cls: 'rpg-mini-btn secondary'
        });
        clearBtn.onclick = async () => {
            this.aiChatMessages = [];
            if (s.ai) s.ai.chatHistory = [];
            await this.plugin.saveSettings();
            this.render();
        };

        const questBtn = actionBtns.createEl('button', {
            text: '✨ Generate Quests',
            cls: 'rpg-mini-btn'
        });
        questBtn.onclick = () => {
            new AIQuestGeneratorModal(this.app, this.plugin, () => this.render()).open();
        };
    }

    async sendElderMessage(message, isQuickAction = false, displayMessage = null) {
        if (!message || !message.trim()) return;

        this.isAiLoading = true;
        if (!isQuickAction) {
            this.aiChatMessages.push({ role: 'user', content: message });
            this.aiChatInput = '';
        }
        this.render();

        try {
            const aiService = new AIService(this.plugin);
            const response = await aiService.chat(message, true);

            if (isQuickAction) {
                // Show natural language display message instead of the actual prompt
                this.aiChatMessages.push(
                    { role: 'user', content: displayMessage || 'I seek your wisdom...' },
                    { role: 'assistant', content: response }
                );
            } else {
                this.aiChatMessages.push({ role: 'assistant', content: response });
            }

            // Keep only last 20 messages in UI
            if (this.aiChatMessages.length > 20) {
                this.aiChatMessages = this.aiChatMessages.slice(-20);
            }

        } catch (error) {
            this.aiChatMessages.push({
                role: 'assistant',
                content: `*The Elder's voice fades momentarily...* \n\n⚠️ ${error.message}`
            });
        }

        this.isAiLoading = false;
        this.render();
    }

    // ============================================================================
    // QUESTS HUB - Combined Habits, Quests, Bad Habits
    // ============================================================================
    renderQuestsHub(container) {
        container.createEl('h3', { text: '⚔️ Quest Board' });

        // Sub-tab navigation
        const subTabs = [
            { id: 'habits', label: '📅 Daily Rituals', count: this.plugin.settings.habits.length },
            { id: 'quests', label: '🗡️ Quests', count: this.plugin.settings.quests.filter(q => !q.completed).length },
            { id: 'badhabits', label: '💀 Demons', count: this.plugin.settings.badHabits.length }
        ];

        const subTabNav = container.createDiv({ cls: 'rpg-subtab-nav' });
        subTabs.forEach(tab => {
            const tabBtn = subTabNav.createEl('button', {
                cls: `rpg-subtab-btn ${this.activeSubTab === tab.id ? 'active' : ''}`
            });
            tabBtn.innerHTML = `${tab.label} <span class="rpg-subtab-count">${tab.count}</span>`;
            tabBtn.onclick = () => { this.activeSubTab = tab.id; this.render(); };
        });

        // Sub-tab content
        const subContent = container.createDiv({ cls: 'rpg-subtab-content' });

        if (this.activeSubTab === 'habits') {
            this.renderHabits(subContent);
        } else if (this.activeSubTab === 'quests') {
            this.renderQuests(subContent);
        } else if (this.activeSubTab === 'badhabits') {
            this.renderBadHabits(subContent);
        }
    }

    // ============================================================================
    // ARENA TAB - Combined Boss Fights & Dungeon
    // ============================================================================
    renderArena(container) {
        container.createEl('h3', { text: '🐉 Battle Arena' });

        // Sub-tab navigation
        const s = this.plugin.settings;
        const activeBosses = s.bossFights.filter(b => !b.defeated).length;
        const hasDungeon = !!s.activeDungeon;

        const subTabs = [
            { id: 'boss', label: '🐉 Boss Fights', badge: activeBosses > 0 ? `${activeBosses} active` : '' },
            { id: 'dungeon', label: '🏰 Deep Work', badge: hasDungeon ? '⏳ In Progress' : '' }
        ];

        const subTabNav = container.createDiv({ cls: 'rpg-subtab-nav' });
        subTabs.forEach(tab => {
            const tabBtn = subTabNav.createEl('button', {
                cls: `rpg-subtab-btn ${this.activeArenaTab === tab.id ? 'active' : ''}`
            });
            tabBtn.innerHTML = tab.badge
                ? `${tab.label} <span class="rpg-subtab-badge">${tab.badge}</span>`
                : tab.label;
            tabBtn.onclick = () => { this.activeArenaTab = tab.id; this.render(); };
        });

        // Sub-tab content
        const subContent = container.createDiv({ cls: 'rpg-subtab-content' });

        if (this.activeArenaTab === 'boss') {
            this.renderBossFights(subContent);
        } else if (this.activeArenaTab === 'dungeon') {
            this.renderDungeon(subContent);
        }
    }

    // ============================================================================
    // TAVERN TAB - Combined Energy Station, Inn & Shop
    // ============================================================================
    renderTavern(container) {
        const s = this.plugin.settings;

        container.createEl('h3', { text: '🏨 The Tavern' });
        container.createEl('p', {
            text: 'Rest, recover, and spend your hard-earned gold...',
            cls: 'rpg-subtitle'
        });

        // Quick Stats Bar
        const statsBar = container.createDiv({ cls: 'rpg-tavern-stats' });
        statsBar.innerHTML = `
            <div class="rpg-tavern-stat">
                <span class="icon">❤️</span>
                <span class="value">${s.hp}/${s.maxHp}</span>
                <span class="label">HP</span>
            </div>
            <div class="rpg-tavern-stat">
                <span class="icon">⚡</span>
                <span class="value">${s.energy || 100}/${s.maxEnergy || 100}</span>
                <span class="label">Energy</span>
            </div>
            <div class="rpg-tavern-stat">
                <span class="icon">💰</span>
                <span class="value">${s.gold}</span>
                <span class="label">Gold</span>
            </div>
        `;

        // Energy & Mood Section
        const energySection = container.createDiv({ cls: 'rpg-tavern-section' });
        energySection.createEl('h4', { text: '⚡ Energy & Mood' });
        this.renderEnergyStation(energySection);

        // Shop Section
        const shopSection = container.createDiv({ cls: 'rpg-tavern-section' });
        shopSection.createEl('h4', { text: '🛍️ Reward Shop' });
        this.renderShop(shopSection);
    }

    // Progress Analysis - Works offline
    renderProgressAnalysis(container) {
        const s = this.plugin.settings;
        const analysisSection = container.createDiv({ cls: 'rpg-coach-section' });
        analysisSection.createEl('h4', { text: '📊 Your Progress Analysis' });

        // Calculate stats
        const sortedDomains = [...s.domains].sort((a, b) => b.score - a.score);
        const topDomain = sortedDomains[0];
        const weakestDomain = sortedDomains[sortedDomains.length - 1];
        const avgScore = Math.round(s.domains.reduce((sum, d) => sum + d.score, 0) / s.domains.length);

        const habitsToday = s.habits.filter(h => h.completed).length;
        const totalHabits = s.habits.length;
        const activeQuests = s.quests.filter(q => !q.completed).length;
        const completedQuests = s.quests.filter(q => q.completed).length;

        // Quadrant analysis
        const quadrantScores = calculateQuadrantScores(s.domains);
        const devLevel = getDevelopmentLevel(s.level);
        const devInfo = DEVELOPMENT_LEVELS[devLevel];

        // Display analysis
        const statsGrid = analysisSection.createDiv({ cls: 'rpg-analysis-grid' });

        const tierProgress = getTierProgress(s.level);
        const levelsToNext = getLevelsToNextTier(s.level);

        statsGrid.innerHTML = `
            <div class="rpg-analysis-card">
                <div class="rpg-analysis-icon">🎯</div>
                <div class="rpg-analysis-label">Overall Score</div>
                <div class="rpg-analysis-value">${avgScore}%</div>
            </div>
            <div class="rpg-analysis-card">
                <div class="rpg-analysis-icon">${devInfo.icon}</div>
                <div class="rpg-analysis-label">HUMAN ${devLevel}</div>
                <div class="rpg-analysis-value">${tierProgress}%</div>
                <div class="rpg-analysis-sublabel">${levelsToNext > 0 ? `${levelsToNext} to next` : 'Max tier!'}</div>
            </div>
            <div class="rpg-analysis-card">
                <div class="rpg-analysis-icon">✅</div>
                <div class="rpg-analysis-label">Habits Today</div>
                <div class="rpg-analysis-value">${habitsToday}/${totalHabits}</div>
            </div>
            <div class="rpg-analysis-card">
                <div class="rpg-analysis-icon">⚔️</div>
                <div class="rpg-analysis-label">Active Quests</div>
                <div class="rpg-analysis-value">${activeQuests}</div>
            </div>
        `;

        // Insights
        const insightsBox = analysisSection.createDiv({ cls: 'rpg-coach-insights' });
        insightsBox.createEl('strong', { text: '💡 Insights:' });

        const insights = [];

        // Strength insight
        insights.push(`Your strength is ${topDomain.icon} ${topDomain.name} (${topDomain.score}%). Keep building on this!`);

        // Growth area insight
        if (weakestDomain.score < 40) {
            insights.push(`Focus area: ${weakestDomain.icon} ${weakestDomain.name} (${weakestDomain.score}%) needs attention.`);
        }

        // Habit insight
        if (totalHabits === 0) {
            insights.push(`No habits yet! Start with just one small daily habit.`);
        } else if (habitsToday === totalHabits && totalHabits > 0) {
            insights.push(`Amazing! All habits completed today! 🎉`);
        } else if (habitsToday === 0 && totalHabits > 0) {
            insights.push(`No habits done yet today. Pick your easiest one to start!`);
        }

        // Quest insight
        if (activeQuests > 5) {
            insights.push(`You have ${activeQuests} active quests. Consider focusing on fewer for better results.`);
        } else if (activeQuests === 0) {
            insights.push(`No active quests! Create one to give yourself a meaningful goal.`);
        }

        // HP insight
        if (s.hp < s.maxHp * 0.3) {
            insights.push(`⚠️ Low HP! Rest at the Inn or log good sleep to recover.`);
        }

        const insightsList = insightsBox.createEl('ul');
        insights.forEach(insight => insightsList.createEl('li', { text: insight }));
    }

    // Daily Tip - Works offline
    renderDailyTip(container) {
        const s = this.plugin.settings;
        const tipSection = container.createDiv({ cls: 'rpg-coach-section' });
        tipSection.createEl('h4', { text: '💡 Personalized Tip' });

        // Get tip based on weakest domain
        const sortedDomains = [...s.domains].sort((a, b) => a.score - b.score);
        const focusDomain = sortedDomains[0];

        const domainTips = COACHING_TIPS[focusDomain.id] || COACHING_TIPS.psychologicalWellbeing;
        const todayIndex = new Date().getDate() % domainTips.length;
        const todayTip = domainTips[todayIndex];

        const tipCard = tipSection.createDiv({ cls: 'rpg-tip-card' });
        tipCard.createDiv({ cls: 'rpg-tip-domain', text: `For ${focusDomain.icon} ${focusDomain.name}:` });
        tipCard.createDiv({ cls: 'rpg-tip-text', text: todayTip.tip });
        tipCard.createDiv({ cls: 'rpg-tip-action', text: `💪 Action: ${todayTip.action}` });

        // New tip button
        const newTipBtn = tipSection.createEl('button', {
            text: '🔄 Get Another Tip',
            cls: 'rpg-mini-btn'
        });
        newTipBtn.onclick = () => {
            // Get random domain and tip
            const randomDomainId = s.domains[Math.floor(Math.random() * s.domains.length)].id;
            const tips = COACHING_TIPS[randomDomainId];
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            const domain = s.domains.find(d => d.id === randomDomainId);

            tipCard.innerHTML = `
                <div class="rpg-tip-domain">For ${domain.icon} ${domain.name}:</div>
                <div class="rpg-tip-text">${randomTip.tip}</div>
                <div class="rpg-tip-action">💪 Action: ${randomTip.action}</div>
            `;
        };
    }

    // Domain Advice - Works offline
    renderDomainAdvice(container) {
        const s = this.plugin.settings;
        const adviceSection = container.createDiv({ cls: 'rpg-coach-section' });
        adviceSection.createEl('h4', { text: '🎯 Quick Domain Tips' });

        const domainGrid = adviceSection.createDiv({ cls: 'rpg-domain-advice-grid' });

        // Show tips for 3 lowest scoring domains
        const sortedDomains = [...s.domains].sort((a, b) => a.score - b.score).slice(0, 3);

        sortedDomains.forEach(domain => {
            const tips = COACHING_TIPS[domain.id] || [];
            const randomTip = tips[Math.floor(Math.random() * tips.length)];

            const domainCard = domainGrid.createDiv({ cls: 'rpg-domain-advice-card' });
            domainCard.createDiv({ cls: 'rpg-domain-advice-header', text: `${domain.icon} ${domain.name} (${domain.score}%)` });

            if (randomTip) {
                domainCard.createDiv({ cls: 'rpg-domain-advice-tip', text: randomTip.tip });
            }
        });
    }

    // Motivation Section - Works offline
    renderMotivationSection(container) {
        const motivationSection = container.createDiv({ cls: 'rpg-coach-section' });
        motivationSection.createEl('h4', { text: '🔥 Daily Motivation' });

        // Get today's quote
        const todayIndex = new Date().getDate() % MOTIVATION_QUOTES.length;
        const quote = MOTIVATION_QUOTES[todayIndex];

        const quoteCard = motivationSection.createDiv({ cls: 'rpg-motivation-card' });
        quoteCard.createDiv({ cls: 'rpg-quote-text', text: `"${quote.quote}"` });
        quoteCard.createDiv({ cls: 'rpg-quote-source', text: `— ${quote.source}` });

        // New quote button
        const newQuoteBtn = motivationSection.createEl('button', {
            text: '🔄 New Quote',
            cls: 'rpg-mini-btn'
        });
        newQuoteBtn.onclick = () => {
            const randomQuote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
            quoteCard.innerHTML = `
                <div class="rpg-quote-text">"${randomQuote.quote}"</div>
                <div class="rpg-quote-source">— ${randomQuote.source}</div>
            `;
        };
    }

    // AI Chat - Only with API key
    renderAIChat(container) {
        const s = this.plugin.settings;
        const chatSection = container.createDiv({ cls: 'rpg-coach-section rpg-ai-section' });
        chatSection.createEl('h4', { text: '🤖 AI Chat' });

        // Quick action buttons
        const actionsGrid = chatSection.createDiv({ cls: 'rpg-ai-actions-grid' });

        const actions = [
            { label: '💡 Get Advice', topic: 'general' },
            { label: '📊 Deep Analysis', topic: 'progress' },
            { label: '✨ Generate Quests', topic: 'quests' }
        ];

        actions.forEach(action => {
            const btn = actionsGrid.createEl('button', { cls: 'rpg-ai-action-btn' });
            btn.createSpan({ text: action.label });
            btn.onclick = async () => {
                if (action.topic === 'quests') {
                    new AIQuestGeneratorModal(this.app, this.plugin, () => this.render()).open();
                } else {
                    await this.sendQuickAction(action.topic);
                }
            };
        });

        // Chat messages
        const chatContainer = chatSection.createDiv({ cls: 'rpg-ai-chat-container' });

        if (this.aiChatMessages.length === 0 && s.ai?.chatHistory?.length > 0) {
            this.aiChatMessages = s.ai.chatHistory.slice(-10);
        }

        const messagesEl = chatContainer.createDiv({ cls: 'rpg-ai-messages' });

        if (this.aiChatMessages.length === 0) {
            messagesEl.createDiv({
                cls: 'rpg-ai-welcome',
                text: "👋 Ask me anything! I have full context of your progress, habits, and goals."
            });
        } else {
            this.aiChatMessages.forEach(msg => {
                const msgEl = messagesEl.createDiv({ cls: `rpg-ai-message ${msg.role}` });
                const contentEl = msgEl.createDiv({ cls: 'rpg-ai-message-content' });
                if (msg.role === 'assistant') {
                    contentEl.innerHTML = renderMarkdownToHtml(msg.content);
                } else {
                    contentEl.textContent = msg.content;
                }
            });
        }

        if (this.isAiLoading) {
            messagesEl.createDiv({ cls: 'rpg-ai-loading', text: '🤖 Thinking...' });
        }

        setTimeout(() => messagesEl.scrollTop = messagesEl.scrollHeight, 0);

        // Chat input
        const inputContainer = chatSection.createDiv({ cls: 'rpg-ai-input-container' });
        const chatInput = inputContainer.createEl('textarea', {
            placeholder: 'Ask your AI coach anything...',
            cls: 'rpg-ai-input'
        });
        chatInput.value = this.aiChatInput;
        chatInput.addEventListener('input', (e) => this.aiChatInput = e.target.value);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        const sendBtn = inputContainer.createEl('button', { text: 'Send', cls: 'rpg-ai-send-btn' });
        sendBtn.onclick = () => this.sendMessage();

        // Clear chat
        const clearBtn = chatSection.createEl('button', {
            text: '🗑️ Clear Chat',
            cls: 'rpg-mini-btn secondary'
        });
        clearBtn.onclick = async () => {
            this.aiChatMessages = [];
            if (s.ai) s.ai.chatHistory = [];
            await this.plugin.saveSettings();
            this.render();
        };
    }

    async sendQuickAction(topic) {
        this.isAiLoading = true;
        this.render();

        // Natural language display for each topic
        const topicDisplays = {
            general: 'Elder, what wisdom would you share with me today?',
            motivation: 'Elder, I need encouragement on my journey.',
            habits: 'Elder, help me understand my daily rituals better.',
            progress: 'Elder, analyze my progress and show me the way forward.'
        };

        try {
            const aiService = new AIService(this.plugin);
            const response = await aiService.getCoachingAdvice(topic);

            this.aiChatMessages.push(
                { role: 'user', content: topicDisplays[topic] || 'Elder, I seek your wisdom.' },
                { role: 'assistant', content: response }
            );

            // Check for first AI chat achievement
            const ach = this.plugin.settings.achievements.find(a => a.id === 'ai_coach_first');
            if (ach && !ach.unlocked) {
                ach.unlocked = true;
                this.plugin.settings.gold += ach.reward;
                this.plugin.settings.totalGoldEarned += ach.reward;
                await this.plugin.saveSettings();
                new Notice(`🏆 Achievement Unlocked: ${ach.name}! +${ach.reward}g`);
            }

            this.isAiLoading = false;
            this.render();
        } catch (error) {
            this.isAiLoading = false;
            new Notice(`❌ ${error.message}`);
            this.render();
        }
    }

    async sendMessage() {
        if (!this.aiChatInput.trim() || this.isAiLoading) return;

        const userMessage = this.aiChatInput.trim();
        this.aiChatInput = '';
        this.aiChatMessages.push({ role: 'user', content: userMessage });
        this.isAiLoading = true;
        this.render();

        try {
            const aiService = new AIService(this.plugin);
            const response = await aiService.chat(userMessage);

            this.aiChatMessages.push({ role: 'assistant', content: response });

            // Check for first AI chat achievement
            const ach = this.plugin.settings.achievements.find(a => a.id === 'ai_coach_first');
            if (ach && !ach.unlocked) {
                ach.unlocked = true;
                this.plugin.settings.gold += ach.reward;
                this.plugin.settings.totalGoldEarned += ach.reward;
                await this.plugin.saveSettings();
                new Notice(`🏆 Achievement Unlocked: ${ach.name}! +${ach.reward}g`);
            }

            this.isAiLoading = false;
            this.render();
        } catch (error) {
            this.isAiLoading = false;
            this.aiChatMessages.push({ role: 'assistant', content: `❌ Error: ${error.message}` });
            this.render();
        }
    }

    renderHabits(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "📅 Daily Habits" });
        const habitsList = container.createDiv({ cls: "rpg-list" });

        if (s.habits.length === 0) {
            habitsList.createDiv({ cls: 'rpg-empty', text: 'No habits yet. Create one below!' });
        }

        s.habits.forEach((habit, index) => {
            const row = habitsList.createDiv({ cls: `rpg-list-item ${habit.completed ? 'completed' : ''}` });

            const cb = row.createEl("input", { type: "checkbox" });
            cb.checked = habit.completed;
            cb.disabled = habit.completed;
            cb.onclick = async () => {
                if (!habit.completed) {
                    await this.plugin.completeHabit(index);
                    this.render();
                }
            };

            const infoCol = row.createDiv({ cls: 'rpg-item-info' });
            const nameRow = infoCol.createDiv({ cls: 'rpg-item-name-row' });
            nameRow.createSpan({ text: habit.name });

            const diff = DIFFICULTY[habit.difficulty || 'medium'];
            nameRow.createSpan({ cls: `rpg-difficulty-badge ${diff.color}`, text: diff.label });

            if (habit.streak > 0) {
                nameRow.createSpan({ cls: 'rpg-streak', text: `🔥${habit.streak}` });
            }

            const domain = s.domains.find(d => d.id === habit.domain);
            const domainIcon = domain ? domain.icon : '📌';
            const multiplier = diff.multiplier;
            const streakBonus = Math.min(habit.streak * 0.1, 1);
            const finalXp = Math.round(habit.xp * multiplier * (1 + streakBonus));
            const finalGold = Math.round(habit.gold * multiplier * (1 + streakBonus));

            infoCol.createDiv({
                cls: 'rpg-item-meta',
                text: `${domainIcon} +${finalXp}xp +${finalGold}g`
            });

            const delBtn = row.createEl("button", { cls: "rpg-mini-btn", text: "✖" });
            delBtn.onclick = async () => {
                await this.plugin.removeHabit(index);
                this.render();
            };
        });

        const addBtn = container.createEl("button", { text: "+ Add Habit", cls: "rpg-full-width-btn" });
        addBtn.onclick = () => new NewHabitModal(this.app, this.plugin, () => this.render()).open();
    }

    renderQuests(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "⚔️ Quests & Missions" });

        // AI Quest Generator button
        if (s.ai?.openRouterApiKey) {
            const aiBtn = container.createEl("button", {
                text: "✨ Generate AI Quests",
                cls: "rpg-full-width-btn ai"
            });
            aiBtn.onclick = () => new AIQuestGeneratorModal(this.app, this.plugin, () => this.render()).open();
        }

        const activeQuests = s.quests.filter(q => !q.completed);
        const completedQuests = s.quests.filter(q => q.completed);

        const questsList = container.createDiv({ cls: "rpg-list" });

        if (activeQuests.length === 0) {
            questsList.createDiv({ cls: 'rpg-empty', text: 'No active quests. Create an epic mission!' });
        }

        activeQuests.forEach((quest, idx) => {
            const realIndex = s.quests.indexOf(quest);
            const row = questsList.createDiv({ cls: 'rpg-list-item quest' });

            const completeBtn = row.createEl("button", { cls: 'rpg-complete-btn', text: "✓" });
            completeBtn.onclick = async () => {
                await this.plugin.completeQuest(realIndex);
                this.render();
            };

            const infoCol = row.createDiv({ cls: 'rpg-item-info' });
            const nameRow = infoCol.createDiv({ cls: 'rpg-item-name-row' });
            nameRow.createSpan({ text: quest.name });

            if (quest.aiGenerated) {
                nameRow.createSpan({ cls: 'rpg-ai-badge', text: '✨ AI' });
            }

            const diff = DIFFICULTY[quest.difficulty || 'medium'];
            nameRow.createSpan({ cls: `rpg-difficulty-badge ${diff.color}`, text: diff.label });

            if (quest.deadline) {
                const deadline = new Date(quest.deadline);
                const now = new Date();
                const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
                const deadlineClass = daysLeft <= 1 ? 'urgent' : daysLeft <= 3 ? 'warning' : '';
                nameRow.createSpan({ cls: `rpg-deadline ${deadlineClass}`, text: `⏰ ${daysLeft}d` });
            }

            const domain = s.domains.find(d => d.id === quest.domain);
            const domainIcon = domain ? domain.icon : '📌';
            infoCol.createDiv({ cls: 'rpg-item-meta', text: `${domainIcon} +${quest.xp}xp +${quest.gold}g` });

            const delBtn = row.createEl("button", { cls: "rpg-mini-btn", text: "✖" });
            delBtn.onclick = async () => {
                await this.plugin.removeQuest(realIndex);
                this.render();
            };
        });

        if (completedQuests.length > 0) {
            const completedSection = container.createEl("details");
            completedSection.createEl("summary", { text: `✅ Completed (${completedQuests.length})` });
            completedQuests.forEach(quest => {
                completedSection.createDiv({ cls: 'rpg-completed-item', text: `✓ ${quest.name}` });
            });
        }

        const addBtn = container.createEl("button", { text: "+ New Quest", cls: "rpg-full-width-btn" });
        addBtn.onclick = () => new NewQuestModal(this.app, this.plugin, () => this.render()).open();
    }

    renderBadHabits(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "💀 Bad Habits" });
        container.createEl("p", { cls: 'rpg-subtitle', text: "Track habits you want to avoid. Triggering costs HP!" });

        const list = container.createDiv({ cls: "rpg-list bad-habits" });

        if (s.badHabits.length === 0) {
            list.createDiv({ cls: 'rpg-empty', text: 'No bad habits tracked yet.' });
        }

        s.badHabits.forEach((habit, index) => {
            const row = list.createDiv({ cls: 'rpg-list-item bad' });

            const triggerBtn = row.createEl("button", { cls: 'rpg-trigger-btn', text: "I did this 😔" });
            triggerBtn.onclick = async () => {
                await this.plugin.triggerBadHabit(index);
                this.render();
            };

            const infoCol = row.createDiv({ cls: 'rpg-item-info' });
            infoCol.createDiv({ cls: 'rpg-item-name', text: habit.name });
            infoCol.createDiv({ cls: 'rpg-item-meta bad', text: `-${habit.hpCost}HP -${habit.goldPenalty}g | Triggered: ${habit.triggerCount}x` });

            const delBtn = row.createEl("button", { cls: "rpg-mini-btn", text: "✖" });
            delBtn.onclick = async () => {
                await this.plugin.removeBadHabit(index);
                this.render();
            };
        });

        const addBtn = container.createEl("button", { text: "+ Track Bad Habit", cls: "rpg-full-width-btn bad" });
        addBtn.onclick = () => new NewBadHabitModal(this.app, this.plugin, () => this.render()).open();
    }

    renderShop(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "🛍️ Reward Shop" });

        const shopList = container.createDiv({ cls: "rpg-list" });

        if (s.rewards.length === 0) {
            shopList.createDiv({ cls: 'rpg-empty', text: 'No rewards yet. Add something to work towards!' });
        }

        s.rewards.forEach((reward, index) => {
            const row = shopList.createDiv({ cls: "rpg-list-item" });

            row.createDiv({ cls: "rpg-item-name", text: reward.name });
            row.createDiv({ cls: "rpg-item-cost", text: `${reward.cost}g` });

            const buyBtn = row.createEl("button", { cls: "rpg-buy-btn", text: "Buy" });
            if (s.gold < reward.cost) buyBtn.disabled = true;

            buyBtn.onclick = async () => {
                await this.plugin.buyReward(index);
                this.render();
            };

            const delBtn = row.createEl("button", { cls: "rpg-mini-btn", text: "✖" });
            delBtn.onclick = async () => {
                await this.plugin.removeReward(index);
                this.render();
            };
        });

        const addBtn = container.createEl("button", { text: "+ Add Reward", cls: "rpg-full-width-btn" });
        addBtn.onclick = () => new NewRewardModal(this.app, this.plugin, () => this.render()).open();
    }

    // ============================================================================
    // INN / HOTEL RECOVERY
    // ============================================================================
    renderInn(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "🏨 Rest & Recovery" });

        // Current HP status
        const hpStatus = container.createDiv({ cls: 'rpg-inn-hp-status' });
        const hpPercent = Math.round((s.hp / s.maxHp) * 100);
        hpStatus.innerHTML = `<span class="rpg-hp-display">❤️ ${s.hp} / ${s.maxHp} HP (${hpPercent}%)</span>`;

        if (s.hp >= s.maxHp) {
            hpStatus.createDiv({ cls: 'rpg-inn-full-hp', text: '✨ You are at full health!' });
        }

        // Gold display
        container.createDiv({ cls: 'rpg-inn-gold', text: `💰 Your Gold: ${s.gold}g` });

        // Inn tiers
        container.createEl("h4", { text: "Choose Your Rest" });
        const innGrid = container.createDiv({ cls: 'rpg-inn-grid' });

        INN_TIERS.forEach(inn => {
            const innCard = innGrid.createDiv({ cls: 'rpg-inn-card' });

            innCard.createDiv({ cls: 'rpg-inn-name', text: inn.name });
            innCard.createDiv({ cls: 'rpg-inn-desc', text: inn.desc });

            const statsRow = innCard.createDiv({ cls: 'rpg-inn-stats' });
            statsRow.createSpan({ text: `+${inn.hpRecover} HP`, cls: 'rpg-inn-hp' });
            statsRow.createSpan({ text: `${inn.cost}g`, cls: 'rpg-inn-cost' });

            const restBtn = innCard.createEl('button', {
                text: 'Rest Here',
                cls: 'rpg-inn-btn'
            });

            // Disable if not enough gold or already at full HP
            if (s.gold < inn.cost || s.hp >= s.maxHp) {
                restBtn.disabled = true;
                restBtn.classList.add('disabled');
            }

            restBtn.onclick = async () => {
                const success = await this.plugin.restAtInn(inn.id);
                if (success) this.render();
            };
        });

        // NPC Section
        container.createEl("h4", { text: "🗣️ Speak with NPCs", cls: 'rpg-npc-header' });
        const npcGrid = container.createDiv({ cls: 'rpg-npc-grid' });

        DEFAULT_NPCS.forEach(npc => {
            const npcCard = npcGrid.createDiv({ cls: 'rpg-npc-card' });

            npcCard.createDiv({ cls: 'rpg-npc-icon', text: npc.icon });
            npcCard.createDiv({ cls: 'rpg-npc-name', text: npc.name });
            npcCard.createDiv({ cls: 'rpg-npc-role', text: npc.role });

            const talkBtn = npcCard.createEl('button', {
                text: 'Talk',
                cls: 'rpg-npc-btn'
            });

            talkBtn.onclick = () => {
                const suggestion = this.plugin.getNPCQuestSuggestion(npc.id);
                new NPCDialogModal(this.app, this.plugin, npc, suggestion, () => this.render()).open();
            };
        });
    }

    // ============================================================================
    // ACTIVITY LOG
    // ============================================================================
    renderActivityLog(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "📜 Activity Log" });

        const log = s.activityLog || [];

        if (log.length === 0) {
            container.createDiv({ cls: 'rpg-empty', text: 'No activities yet. Start completing habits and quests!' });
            return;
        }

        container.createEl('p', { cls: 'rpg-subtitle', text: `Last ${log.length} activities` });

        const logList = container.createDiv({ cls: 'rpg-activity-log' });

        // Group by date
        const groupedByDate = {};
        log.forEach(activity => {
            const date = new Date(activity.timestamp).toLocaleDateString();
            if (!groupedByDate[date]) groupedByDate[date] = [];
            groupedByDate[date].push(activity);
        });

        Object.entries(groupedByDate).forEach(([date, activities]) => {
            const dateHeader = logList.createDiv({ cls: 'rpg-log-date-header' });
            dateHeader.createSpan({ text: date === new Date().toLocaleDateString() ? '📅 Today' : `📅 ${date}` });

            activities.forEach(activity => {
                const cat = ACTIVITY_CATEGORIES.find(c => c.id === activity.category) || { icon: '📝', label: 'Activity', color: '#888' };

                const logItem = logList.createDiv({ cls: 'rpg-log-item' });

                logItem.createDiv({
                    cls: 'rpg-log-icon',
                    text: cat.icon,
                    attr: { style: `background-color: ${cat.color}20; color: ${cat.color}` }
                });

                const logContent = logItem.createDiv({ cls: 'rpg-log-content' });
                logContent.createDiv({ cls: 'rpg-log-desc', text: activity.description });

                // Show details if any
                if (activity.details) {
                    const detailsStr = Object.entries(activity.details)
                        .filter(([k, v]) => v !== undefined && v !== null)
                        .map(([k, v]) => {
                            if (k === 'xp') return `+${v} XP`;
                            if (k === 'gold') return `+${v}g`;
                            if (k === 'hpRecovered') return `+${v} HP`;
                            if (k === 'hpLost') return `-${v} HP`;
                            if (k === 'goldLost' || k === 'goldSpent') return `-${v}g`;
                            if (k === 'streak') return `🔥${v}`;
                            if (k === 'inFlow' && v) return '🌊 Flow';
                            return null;
                        })
                        .filter(Boolean)
                        .join(' • ');

                    if (detailsStr) {
                        logContent.createDiv({ cls: 'rpg-log-details', text: detailsStr });
                    }
                }

                const time = new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                logItem.createDiv({ cls: 'rpg-log-time', text: time });
            });
        });

        // Clear log button
        const clearBtn = container.createEl('button', {
            text: '🗑️ Clear Log',
            cls: 'rpg-full-width-btn secondary'
        });
        clearBtn.onclick = async () => {
            if (confirm('Clear all activity history?')) {
                s.activityLog = [];
                await this.plugin.saveSettings();
                this.render();
            }
        };
    }

    // ============================================================================
    // BOSS FIGHT SYSTEM
    // ============================================================================
    renderBossFights(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "🐉 Boss Fights" });
        container.createEl("p", { cls: 'rpg-subtitle', text: 'Long-term goals as epic battles. Complete tasks to damage the boss!' });

        // Active Boss Fights
        const activeBosses = (s.bossFights || []).filter(b => !b.defeated);
        const defeatedBosses = (s.bossFights || []).filter(b => b.defeated);

        if (activeBosses.length === 0) {
            const emptyState = container.createDiv({ cls: 'rpg-empty-boss' });
            emptyState.createEl('p', { text: '🗡️ No active boss fights.' });
            emptyState.createEl('p', { text: 'Create a boss to turn your big goals into epic battles!' });
        }

        // Render active bosses
        activeBosses.forEach((boss, index) => {
            const bossCard = container.createDiv({ cls: 'rpg-boss-card active' });

            const bossHeader = bossCard.createDiv({ cls: 'rpg-boss-header' });
            bossHeader.createDiv({ cls: 'rpg-boss-icon', text: boss.icon || '🐉' });
            const bossInfo = bossHeader.createDiv({ cls: 'rpg-boss-info' });
            bossInfo.createEl('h4', { text: boss.name });
            bossInfo.createDiv({ cls: 'rpg-boss-desc', text: boss.description });

            // HP Bar
            const hpPercent = Math.max(0, (boss.currentHp / boss.maxHp) * 100);
            const hpBar = bossCard.createDiv({ cls: 'rpg-boss-hp' });
            hpBar.createDiv({ cls: 'rpg-boss-hp-label', text: `HP: ${boss.currentHp} / ${boss.maxHp}` });
            const hpBarBg = hpBar.createDiv({ cls: 'rpg-boss-hp-bar' });
            hpBarBg.createDiv({ cls: 'rpg-boss-hp-fill', attr: { style: `width: ${hpPercent}%` } });

            // Linked Tasks
            bossCard.createDiv({ cls: 'rpg-boss-tasks-label', text: '⚔️ Damage Sources:' });
            const tasksList = bossCard.createDiv({ cls: 'rpg-boss-tasks' });
            tasksList.createDiv({ text: '• Complete habits linked to this boss', cls: 'rpg-boss-task-hint' });
            tasksList.createDiv({ text: '• Complete quests linked to this boss', cls: 'rpg-boss-task-hint' });

            // Action buttons
            const actions = bossCard.createDiv({ cls: 'rpg-boss-actions' });

            const attackBtn = actions.createEl('button', { text: '⚔️ Manual Attack (10 DMG, 5g)', cls: 'rpg-boss-btn attack' });
            attackBtn.onclick = async () => {
                if (s.gold >= 5) {
                    s.gold -= 5;
                    await this.plugin.damageBoss(index, 10);
                    this.render();
                } else {
                    new Notice('❌ Not enough gold!');
                }
            };

            const abandonBtn = actions.createEl('button', { text: '🏳️ Abandon', cls: 'rpg-boss-btn abandon' });
            abandonBtn.onclick = async () => {
                if (confirm(`Abandon the fight against ${boss.name}?`)) {
                    s.bossFights.splice(s.bossFights.indexOf(boss), 1);
                    await this.plugin.saveSettings();
                    this.render();
                }
            };
        });

        // Create New Boss Button
        const createBtn = container.createEl('button', { text: '+ Create Boss Fight', cls: 'rpg-full-width-btn primary' });
        createBtn.onclick = () => new NewBossFightModal(this.app, this.plugin, () => this.render()).open();

        // Defeated Bosses (collapsed)
        if (defeatedBosses.length > 0) {
            const defeatedSection = container.createEl('details', { cls: 'rpg-defeated-bosses' });
            defeatedSection.createEl('summary', { text: `🏆 Defeated Bosses (${defeatedBosses.length})` });

            defeatedBosses.forEach(boss => {
                const card = defeatedSection.createDiv({ cls: 'rpg-boss-card defeated' });
                card.createSpan({ text: boss.icon || '🐉' });
                card.createSpan({ text: ` ${boss.name}`, cls: 'rpg-boss-defeated-name' });
                card.createSpan({ text: ` - Defeated!`, cls: 'rpg-boss-defeated-label' });
            });
        }

        // Stats
        container.createDiv({ cls: 'rpg-boss-stats', text: `👑 Total Bosses Defeated: ${s.totalBossesDefeated || 0}` });
    }

    // ============================================================================
    // DUNGEON SYSTEM (Deep Work / Focus Sessions)
    // ============================================================================
    renderDungeon(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "🏰 Dungeon - Deep Work" });
        container.createEl("p", { cls: 'rpg-subtitle', text: 'Enter focused work sessions. Slay task monsters to earn rewards!' });

        // Check if dungeon is active
        if (s.activeDungeon && s.activeDungeon.active) {
            this.renderActiveDungeon(container, s.activeDungeon);
            return;
        }

        // Dungeon Entry
        const entrySection = container.createDiv({ cls: 'rpg-dungeon-entry' });
        entrySection.createEl('h4', { text: '⚔️ Enter the Dungeon' });

        // Duration selection
        const durationGrid = entrySection.createDiv({ cls: 'rpg-dungeon-duration-grid' });

        const durations = [
            { minutes: 25, name: 'Quick Raid', icon: '🥉', desc: '25 min focus', tier: 'bronze' },
            { minutes: 50, name: 'Standard Delve', icon: '🥈', desc: '50 min focus', tier: 'silver' },
            { minutes: 90, name: 'Deep Expedition', icon: '🥇', desc: '90 min focus', tier: 'gold' },
            { minutes: 120, name: 'Epic Marathon', icon: '💎', desc: '2 hour focus', tier: 'diamond' }
        ];

        durations.forEach(dur => {
            const reward = DUNGEON_REWARDS[dur.tier];
            const card = durationGrid.createDiv({ cls: `rpg-dungeon-card tier-${dur.tier}` });

            card.createDiv({ cls: 'rpg-dungeon-icon', text: dur.icon });
            card.createDiv({ cls: 'rpg-dungeon-name', text: dur.name });
            card.createDiv({ cls: 'rpg-dungeon-desc', text: dur.desc });
            card.createDiv({ cls: 'rpg-dungeon-rewards', text: `${reward.xpPerMinute}x XP/min • +${reward.goldBonus}g bonus` });

            card.onclick = () => {
                this.startDungeon(dur.minutes, dur.tier);
            };
        });

        // Stats
        const statsSection = container.createDiv({ cls: 'rpg-dungeon-stats' });
        statsSection.createDiv({ text: `🏰 Dungeons Cleared: ${s.totalDungeonsCleared || 0}` });
        statsSection.createDiv({ text: `⏱️ Total Focus Time: ${Math.floor((s.totalFocusMinutes || 0) / 60)}h ${(s.totalFocusMinutes || 0) % 60}m` });
    }

    renderActiveDungeon(container, dungeon) {
        const s = this.plugin.settings;

        const activeSection = container.createDiv({ cls: 'rpg-dungeon-active' });
        activeSection.createEl('h4', { text: `⚔️ ${dungeon.tier.toUpperCase()} DUNGEON IN PROGRESS` });

        // Timer display
        const elapsed = Math.floor((Date.now() - dungeon.startTime) / 1000 / 60);
        const remaining = Math.max(0, dungeon.targetMinutes - elapsed);

        const timerDisplay = activeSection.createDiv({ cls: 'rpg-dungeon-timer' });
        timerDisplay.createDiv({ cls: 'rpg-dungeon-time', text: `${remaining} min remaining` });

        // Progress bar
        const progress = Math.min(100, (elapsed / dungeon.targetMinutes) * 100);
        const progressBar = activeSection.createDiv({ cls: 'rpg-dungeon-progress' });
        progressBar.createDiv({ cls: 'rpg-dungeon-progress-fill', attr: { style: `width: ${progress}%` } });

        // Monster tasks
        activeSection.createEl('h5', { text: '👾 Task Monsters' });
        const monsterList = activeSection.createDiv({ cls: 'rpg-dungeon-monsters' });

        if (!dungeon.tasks || dungeon.tasks.length === 0) {
            monsterList.createDiv({ cls: 'rpg-empty', text: 'Add tasks to slay during your focus session!' });
        }

        (dungeon.tasks || []).forEach((task, idx) => {
            const taskRow = monsterList.createDiv({ cls: `rpg-dungeon-task ${task.slain ? 'slain' : ''}` });
            taskRow.createSpan({ text: task.slain ? '💀' : '👾', cls: 'rpg-dungeon-task-icon' });
            taskRow.createSpan({ text: task.name, cls: 'rpg-dungeon-task-name' });

            if (!task.slain) {
                const slayBtn = taskRow.createEl('button', { text: '⚔️ Slay', cls: 'rpg-mini-btn' });
                slayBtn.onclick = async () => {
                    dungeon.tasks[idx].slain = true;
                    dungeon.monstersSlain = (dungeon.monstersSlain || 0) + 1;
                    await this.plugin.saveSettings();
                    this.render();
                    new Notice(`👾 Task slain: ${task.name}!`);
                };
            }
        });

        // Add task button
        const addTaskBtn = activeSection.createEl('button', { text: '+ Add Task Monster', cls: 'rpg-full-width-btn secondary' });
        addTaskBtn.onclick = () => {
            const taskName = prompt('Enter task to slay:');
            if (taskName) {
                if (!dungeon.tasks) dungeon.tasks = [];
                dungeon.tasks.push({ name: taskName, slain: false });
                this.plugin.saveSettings();
                this.render();
            }
        };

        // Action buttons
        const actionRow = activeSection.createDiv({ cls: 'rpg-dungeon-actions' });

        const completeBtn = actionRow.createEl('button', { text: '✅ Complete Dungeon', cls: 'rpg-dungeon-btn complete' });
        completeBtn.onclick = () => this.completeDungeon();

        const abandonBtn = actionRow.createEl('button', { text: '🏳️ Abandon', cls: 'rpg-dungeon-btn abandon' });
        abandonBtn.onclick = async () => {
            if (confirm('Abandon this dungeon? You will lose progress.')) {
                s.activeDungeon = null;
                await this.plugin.saveSettings();
                this.render();
            }
        };
    }

    async startDungeon(minutes, tier) {
        const s = this.plugin.settings;
        s.activeDungeon = {
            active: true,
            startTime: Date.now(),
            targetMinutes: minutes,
            tier: tier,
            tasks: [],
            monstersSlain: 0
        };
        await this.plugin.saveSettings();
        this.render();
        new Notice(`🏰 Entering ${tier} dungeon! ${minutes} minutes of focused work begins.`);
    }

    async completeDungeon() {
        const s = this.plugin.settings;
        const dungeon = s.activeDungeon;

        if (!dungeon) return;

        const elapsed = Math.floor((Date.now() - dungeon.startTime) / 1000 / 60);
        const reward = DUNGEON_REWARDS[dungeon.tier];
        const difficulty = GAME_DIFFICULTY[s.gameDifficulty || 'normal'];

        // Calculate rewards
        const baseXP = Math.floor(elapsed * reward.xpPerMinute);
        const monsterBonus = (dungeon.monstersSlain || 0) * 5;
        const goldBonus = elapsed >= dungeon.targetMinutes ? reward.goldBonus : Math.floor(reward.goldBonus / 2);

        const finalXP = Math.round((baseXP + monsterBonus) * difficulty.xpMultiplier);
        const finalGold = Math.round(goldBonus * difficulty.goldMultiplier);

        // Apply rewards
        s.xp += finalXP;
        s.gold += finalGold;
        s.totalFocusMinutes = (s.totalFocusMinutes || 0) + elapsed;
        s.totalDungeonsCleared = (s.totalDungeonsCleared || 0) + 1;

        // Log activity
        this.plugin.logActivity('dungeon_complete', `Cleared ${dungeon.tier} dungeon`, {
            xp: finalXP,
            gold: finalGold,
            minutes: elapsed,
            monstersSlain: dungeon.monstersSlain || 0
        });

        // Clear dungeon
        s.activeDungeon = null;
        await this.plugin.saveSettings();

        new Notice(`🏰 Dungeon Cleared!\n+${finalXP} XP | +${finalGold}g\n${elapsed} min focused | ${dungeon.monstersSlain || 0} tasks slain`);
        this.render();
    }

    // ============================================================================
    // ENERGY STATION (Rest, Mood, Sleep Tracking)
    // ============================================================================
    renderEnergyStation(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "⚡ Energy Station" });
        container.createEl("p", { cls: 'rpg-subtitle', text: 'Track your energy, mood, and rest. Recovery is part of the game!' });

        // Energy Bar
        const energySection = container.createDiv({ cls: 'rpg-energy-display' });
        const energyPercent = Math.round(((s.energy || 100) / (s.maxEnergy || 100)) * 100);
        energySection.innerHTML = `
            <div class="rpg-energy-header">
                <span>⚡ Energy: ${s.energy || 100} / ${s.maxEnergy || 100}</span>
                <span class="rpg-energy-percent">${energyPercent}%</span>
            </div>
            <div class="rpg-energy-bar">
                <div class="rpg-energy-fill" style="width: ${energyPercent}%"></div>
            </div>
        `;

        // HP Bar too
        const hpPercent = Math.round((s.hp / s.maxHp) * 100);
        const hpSection = container.createDiv({ cls: 'rpg-hp-display-station' });
        hpSection.innerHTML = `
            <div class="rpg-hp-header">
                <span>❤️ HP: ${s.hp} / ${s.maxHp}</span>
                <span class="rpg-hp-percent">${hpPercent}%</span>
            </div>
            <div class="rpg-hp-bar-station">
                <div class="rpg-hp-fill-station" style="width: ${hpPercent}%"></div>
            </div>
        `;

        // Mood Check-in
        container.createEl('h4', { text: '😊 How are you feeling?' });
        const moodGrid = container.createDiv({ cls: 'rpg-mood-grid' });

        MOOD_OPTIONS.forEach(mood => {
            const moodBtn = moodGrid.createDiv({ cls: 'rpg-mood-btn' });
            moodBtn.createDiv({ cls: 'rpg-mood-icon', text: mood.icon });
            moodBtn.createDiv({ cls: 'rpg-mood-label', text: mood.label });

            moodBtn.onclick = async () => {
                await this.logMood(mood);
            };
        });

        // Sleep Log
        container.createEl('h4', { text: '😴 Log Sleep Quality' });
        const sleepGrid = container.createDiv({ cls: 'rpg-sleep-grid' });

        SLEEP_QUALITY.forEach(sleep => {
            const sleepBtn = sleepGrid.createDiv({ cls: 'rpg-sleep-btn' });
            sleepBtn.createSpan({ text: sleep.icon });
            sleepBtn.createSpan({ text: ` ${sleep.label}` });
            const restore = sleep.hpRestore >= 0 ? `+${sleep.hpRestore}` : sleep.hpRestore;
            sleepBtn.createSpan({ text: ` (${restore} HP)`, cls: 'rpg-sleep-restore' });

            sleepBtn.onclick = async () => {
                await this.logSleep(sleep);
            };
        });

        // Inn Section (moved from separate tab)
        container.createEl('h4', { text: '🏨 Rest at Inn' });
        const innGrid = container.createDiv({ cls: 'rpg-inn-grid' });

        INN_TIERS.forEach(inn => {
            const innCard = innGrid.createDiv({ cls: 'rpg-inn-card-mini' });
            innCard.createDiv({ cls: 'rpg-inn-name', text: inn.name });
            innCard.createDiv({ cls: 'rpg-inn-stats', text: `+${inn.hpRecover} HP | ${inn.cost}g` });

            const restBtn = innCard.createEl('button', { text: 'Rest', cls: 'rpg-inn-btn-mini' });
            if (s.gold < inn.cost || s.hp >= s.maxHp) restBtn.disabled = true;

            restBtn.onclick = async () => {
                const success = await this.plugin.restAtInn(inn.id);
                if (success) this.render();
            };
        });

        // Recent Mood Log
        const moodLog = s.moodLog || [];
        if (moodLog.length > 0) {
            const logSection = container.createEl('details', { cls: 'rpg-mood-log-section' });
            logSection.createEl('summary', { text: `📊 Recent Mood Log (${moodLog.length})` });

            moodLog.slice(0, 7).forEach(entry => {
                const mood = MOOD_OPTIONS.find(m => m.id === entry.moodId);
                const date = new Date(entry.timestamp).toLocaleDateString();
                const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                logSection.createDiv({ cls: 'rpg-mood-log-entry', text: `${mood?.icon || '❓'} ${mood?.label || 'Unknown'} - ${date} ${time}` });
            });
        }
    }

    async logMood(mood) {
        const s = this.plugin.settings;

        // Update energy based on mood
        s.energy = Math.max(0, Math.min(s.maxEnergy || 100, (s.energy || 100) + mood.energyBonus));

        // Log mood
        if (!s.moodLog) s.moodLog = [];
        s.moodLog.unshift({
            moodId: mood.id,
            timestamp: new Date().toISOString(),
            energyBonus: mood.energyBonus
        });
        s.moodLog = s.moodLog.slice(0, 30); // Keep last 30

        s.lastMoodCheck = new Date().toISOString();
        await this.plugin.saveSettings();

        const energyText = mood.energyBonus >= 0 ? `+${mood.energyBonus}` : mood.energyBonus;
        new Notice(`${mood.icon} Mood logged: ${mood.label} (${energyText} Energy)`);
        this.render();
    }

    async logSleep(sleep) {
        const s = this.plugin.settings;

        // Apply HP restore/damage
        if (sleep.hpRestore >= 0) {
            s.hp = Math.min(s.maxHp, s.hp + sleep.hpRestore);
        } else {
            s.hp = Math.max(1, s.hp + sleep.hpRestore);
        }

        // Restore some energy with good sleep
        if (sleep.hpRestore > 0) {
            s.energy = Math.min(s.maxEnergy || 100, (s.energy || 50) + sleep.hpRestore);
        }

        // Log sleep
        if (!s.sleepLog) s.sleepLog = [];
        s.sleepLog.unshift({
            quality: sleep.id,
            timestamp: new Date().toISOString(),
            hpRestore: sleep.hpRestore
        });
        s.sleepLog = s.sleepLog.slice(0, 14); // Keep 2 weeks

        // Log activity
        this.plugin.logActivity('inn_rest', `Logged sleep: ${sleep.label}`, { hpRecovered: sleep.hpRestore });

        await this.plugin.saveSettings();

        const hpText = sleep.hpRestore >= 0 ? `+${sleep.hpRestore}` : sleep.hpRestore;
        new Notice(`${sleep.icon} Sleep logged: ${sleep.label} (${hpText} HP)`);
        this.render();
    }

    renderAchievements(container) {
        const s = this.plugin.settings;
        container.createEl("h3", { text: "🏆 Achievements" });

        const unlockedCount = s.achievements.filter(a => a.unlocked).length;
        container.createEl("p", { cls: 'rpg-subtitle', text: `${unlockedCount} / ${s.achievements.length} unlocked` });

        const grid = container.createDiv({ cls: 'rpg-achievements-grid' });

        s.achievements.forEach(ach => {
            const card = grid.createDiv({ cls: `rpg-achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}` });
            card.createDiv({ cls: 'rpg-achievement-icon', text: ach.unlocked ? ach.icon : '🔒' });
            card.createDiv({ cls: 'rpg-achievement-name', text: ach.name });
            card.createDiv({ cls: 'rpg-achievement-desc', text: ach.desc });
            if (!ach.unlocked) {
                card.createDiv({ cls: 'rpg-achievement-reward', text: `🎁 ${ach.reward}g` });
            }
        });
    }
}

// ============================================================================
// MODALS
// ============================================================================

class NewHabitModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Create New Habit" });

        let name = "";
        let xp = 10;
        let gold = 5;
        let domain = 'health';
        let difficulty = 'medium';

        new Setting(contentEl).setName("Habit Name").addText(text => text.onChange(value => name = value));

        new Setting(contentEl).setName("Life Domain").addDropdown(dd => {
            this.plugin.settings.domains.forEach(d => dd.addOption(d.id, `${d.icon} ${d.name}`));
            dd.setValue(domain);
            dd.onChange(value => domain = value);
        });

        new Setting(contentEl).setName("Difficulty").addDropdown(dd => {
            Object.keys(DIFFICULTY).forEach(d => dd.addOption(d, DIFFICULTY[d].label));
            dd.setValue(difficulty);
            dd.onChange(value => difficulty = value);
        });

        new Setting(contentEl).setName("Base XP").addText(text => {
            text.setValue("10");
            text.onChange(value => xp = Number(value));
        });

        new Setting(contentEl).setName("Base Gold").addText(text => {
            text.setValue("5");
            text.onChange(value => gold = Number(value));
        });

        new Setting(contentEl).addButton(btn => btn
            .setButtonText("Create")
            .setCta()
            .onClick(async () => {
                if (name) {
                    this.plugin.settings.habits.push({
                        name, xp, gold, domain, difficulty,
                        completed: false,
                        streak: 0,
                        bestStreak: 0,
                        lastCompletedDate: null
                    });
                    await this.plugin.saveSettings();
                    this.plugin.checkAchievements();
                    this.onSubmit();
                    this.close();
                }
            }));
    }
    onClose() { this.contentEl.empty(); }
}

class NewQuestModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Create New Quest" });

        let name = "";
        let xp = 50;
        let gold = 25;
        let domain = 'education';
        let difficulty = 'medium';
        let deadline = "";

        new Setting(contentEl).setName("Quest Name").addText(text => text.onChange(value => name = value));

        new Setting(contentEl).setName("Life Domain").addDropdown(dd => {
            this.plugin.settings.domains.forEach(d => dd.addOption(d.id, `${d.icon} ${d.name}`));
            dd.setValue(domain);
            dd.onChange(value => domain = value);
        });

        new Setting(contentEl).setName("Difficulty").addDropdown(dd => {
            Object.keys(DIFFICULTY).forEach(d => dd.addOption(d, DIFFICULTY[d].label));
            dd.setValue(difficulty);
            dd.onChange(value => difficulty = value);
        });

        new Setting(contentEl).setName("Deadline (optional)").addText(text => {
            text.inputEl.type = 'date';
            text.onChange(value => deadline = value);
        });

        new Setting(contentEl).setName("XP Reward").addText(text => {
            text.setValue("50");
            text.onChange(value => xp = Number(value));
        });

        new Setting(contentEl).setName("Gold Reward").addText(text => {
            text.setValue("25");
            text.onChange(value => gold = Number(value));
        });

        new Setting(contentEl).addButton(btn => btn
            .setButtonText("Create Quest")
            .setCta()
            .onClick(async () => {
                if (name) {
                    this.plugin.settings.quests.push({
                        name, xp, gold, domain, difficulty, deadline,
                        completed: false,
                        completedDate: null
                    });
                    await this.plugin.saveSettings();
                    this.onSubmit();
                    this.close();
                }
            }));
    }
    onClose() { this.contentEl.empty(); }
}

class NewBadHabitModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Track Bad Habit" });

        let name = "";
        let hpCost = 10;
        let goldPenalty = 5;

        new Setting(contentEl).setName("Bad Habit Name").addText(text => text.onChange(value => name = value));
        new Setting(contentEl).setName("HP Cost").addText(text => {
            text.setValue("10");
            text.onChange(value => hpCost = Number(value));
        });
        new Setting(contentEl).setName("Gold Penalty").addText(text => {
            text.setValue("5");
            text.onChange(value => goldPenalty = Number(value));
        });

        new Setting(contentEl).addButton(btn => btn
            .setButtonText("Track")
            .setCta()
            .onClick(async () => {
                if (name) {
                    this.plugin.settings.badHabits.push({
                        name, hpCost, goldPenalty, triggerCount: 0
                    });
                    await this.plugin.saveSettings();
                    this.onSubmit();
                    this.close();
                }
            }));
    }
    onClose() { this.contentEl.empty(); }
}

class NewRewardModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Create Shop Reward" });
        let name = "";
        let cost = 50;

        new Setting(contentEl).setName("Reward Name").addText(text => text.onChange(value => name = value));
        new Setting(contentEl).setName("Gold Cost").addText(text => {
            text.setValue("50");
            text.onChange(value => cost = Number(value));
        });

        new Setting(contentEl).addButton(btn => btn.setButtonText("Create").setCta().onClick(async () => {
            if (name) {
                this.plugin.settings.rewards.push({ name, cost });
                await this.plugin.saveSettings();
                this.onSubmit();
                this.close();
            }
        }));
    }
    onClose() { this.contentEl.empty(); }
}

// ============================================================================
// BOSS FIGHT MODAL
// ============================================================================
class NewBossFightModal extends Modal {
    constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "🐉 Create Boss Fight" });
        contentEl.createEl("p", { cls: 'rpg-modal-subtitle', text: 'Turn your big goal into an epic battle!' });

        let name = "";
        let description = "";
        let icon = "🐉";
        let maxHp = 100;
        let domain = 'psychologicalWellbeing';

        new Setting(contentEl)
            .setName("Boss Name")
            .setDesc("Give your boss a memorable name")
            .addText(text => text
                .setPlaceholder("The Lazy Dragon")
                .onChange(value => name = value));

        new Setting(contentEl)
            .setName("Description")
            .setDesc("What does defeating this boss represent?")
            .addText(text => text
                .setPlaceholder("Complete my thesis by March")
                .onChange(value => description = value));

        new Setting(contentEl)
            .setName("Boss Icon")
            .addText(text => text
                .setValue("🐉")
                .onChange(value => icon = value));

        new Setting(contentEl)
            .setName("Boss HP")
            .setDesc("Higher HP = longer battle. 100 HP ≈ 10 tasks to defeat")
            .addDropdown(dd => {
                dd.addOption("50", "50 HP - Quick Battle");
                dd.addOption("100", "100 HP - Standard");
                dd.addOption("150", "150 HP - Tough Fight");
                dd.addOption("200", "200 HP - Epic Battle");
                dd.addOption("300", "300 HP - Legendary");
                dd.setValue("100");
                dd.onChange(value => maxHp = parseInt(value));
            });

        new Setting(contentEl)
            .setName("Linked Domain")
            .setDesc("Completing tasks in this domain damages the boss")
            .addDropdown(dd => {
                DEFAULT_DOMAINS.forEach(d => dd.addOption(d.id, `${d.icon} ${d.name}`));
                dd.onChange(value => domain = value);
            });

        // Boss templates
        contentEl.createEl('h4', { text: '📋 Or choose a template:' });
        const templateGrid = contentEl.createDiv({ cls: 'rpg-boss-template-grid' });

        BOSS_TEMPLATES.forEach(template => {
            const templateBtn = templateGrid.createDiv({ cls: 'rpg-boss-template' });
            templateBtn.createDiv({ text: template.name });
            templateBtn.createDiv({ text: template.desc, cls: 'rpg-boss-template-desc' });

            templateBtn.onclick = () => {
                name = template.name;
                description = template.desc;
                maxHp = template.baseHp;
                domain = template.domain;

                // Update fields visually
                contentEl.querySelectorAll('input').forEach((input, idx) => {
                    if (idx === 0) input.value = name;
                    if (idx === 1) input.value = description;
                });
            };
        });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText("⚔️ Start Boss Fight!")
                .setCta()
                .onClick(async () => {
                    if (!name) {
                        new Notice("Boss needs a name!");
                        return;
                    }

                    const boss = {
                        id: Date.now().toString(),
                        name,
                        description,
                        icon,
                        maxHp,
                        currentHp: maxHp,
                        domain,
                        defeated: false,
                        createdAt: new Date().toISOString()
                    };

                    if (!this.plugin.settings.bossFights) {
                        this.plugin.settings.bossFights = [];
                    }
                    this.plugin.settings.bossFights.push(boss);
                    await this.plugin.saveSettings();

                    new Notice(`🐉 Boss "${name}" has appeared! Defeat it by completing ${domain} tasks!`);
                    this.onSubmit();
                    this.close();
                }));
    }

    onClose() { this.contentEl.empty(); }
}

// ============================================================================
// NPC DIALOG MODAL
// ============================================================================
class NPCDialogModal extends Modal {
    constructor(app, plugin, npc, questSuggestion, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.npc = npc;
        this.questSuggestion = questSuggestion;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.addClass('rpg-npc-dialog-modal');

        // NPC Header
        const header = contentEl.createDiv({ cls: 'rpg-npc-dialog-header' });
        header.createDiv({ cls: 'rpg-npc-dialog-icon', text: this.npc.icon });
        const headerInfo = header.createDiv({ cls: 'rpg-npc-dialog-info' });
        headerInfo.createEl('h2', { text: this.npc.name });
        headerInfo.createDiv({ cls: 'rpg-npc-dialog-role', text: this.npc.role });

        // Dialogue
        const dialogueBox = contentEl.createDiv({ cls: 'rpg-npc-dialogue-box' });
        dialogueBox.createEl('p', { text: `"${this.npc.dialogue}"` });

        // Quest Suggestion
        if (this.questSuggestion) {
            const questSection = contentEl.createDiv({ cls: 'rpg-npc-quest-section' });
            questSection.createEl('h3', { text: '📜 Quest Suggestion' });

            const questCard = questSection.createDiv({ cls: 'rpg-npc-quest-card' });
            questCard.createDiv({ cls: 'rpg-npc-quest-domain', text: `${this.questSuggestion.domain.icon} ${this.questSuggestion.domain.name}` });
            questCard.createDiv({ cls: 'rpg-npc-quest-name', text: this.questSuggestion.questName });

            const rewards = questCard.createDiv({ cls: 'rpg-npc-quest-rewards' });
            rewards.createSpan({ text: `⭐ ${this.questSuggestion.xp} XP` });
            rewards.createSpan({ text: `💰 ${this.questSuggestion.gold}g` });

            const acceptBtn = questSection.createEl('button', {
                text: '✅ Accept Quest',
                cls: 'rpg-full-width-btn primary'
            });
            acceptBtn.onclick = async () => {
                const newQuest = {
                    name: this.questSuggestion.questName,
                    xp: this.questSuggestion.xp,
                    gold: this.questSuggestion.gold,
                    domain: this.questSuggestion.domain.id,
                    difficulty: 'medium',
                    completed: false,
                    npcGiver: this.npc.id
                };
                this.plugin.settings.quests.push(newQuest);

                // Log activity
                this.plugin.logActivity('quest_complete', `Accepted quest from ${this.npc.name}`, {
                    questName: this.questSuggestion.questName
                });

                await this.plugin.saveSettings();
                new Notice(`📜 Quest accepted: ${this.questSuggestion.questName}`);
                this.onSubmit();
                this.close();
            };
        } else {
            contentEl.createDiv({ cls: 'rpg-npc-no-quest', text: 'No quest available right now. Check back later!' });
        }

        // Close button
        const closeBtn = contentEl.createEl('button', {
            text: 'Farewell',
            cls: 'rpg-full-width-btn secondary'
        });
        closeBtn.onclick = () => this.close();
    }

    onClose() { this.contentEl.empty(); }
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

class LifeRPGSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Life RPG Settings' });

        // AI Settings Section
        containerEl.createEl('h3', { text: '🤖 AI Configuration' });

        new Setting(containerEl)
            .setName('OpenRouter API Key')
            .setDesc('Get your API key from openrouter.ai. Required for AI Coach and Quest Generator.')
            .addText(text => text
                .setPlaceholder('sk-or-v1-...')
                .setValue(this.plugin.settings.ai?.openRouterApiKey || '')
                .onChange(async (value) => {
                    if (!this.plugin.settings.ai) {
                        this.plugin.settings.ai = { ...DEFAULT_AI_SETTINGS };
                    }
                    this.plugin.settings.ai.openRouterApiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('AI Model')
            .setDesc('Choose which AI model to use for coaching and quest generation.')
            .addDropdown(dd => {
                AVAILABLE_MODELS.forEach(model => {
                    dd.addOption(model.id, `${model.name} (${model.provider})`);
                });
                dd.setValue(this.plugin.settings.ai?.selectedModel || 'openai/gpt-4o-mini');
                dd.onChange(async (value) => {
                    if (!this.plugin.settings.ai) {
                        this.plugin.settings.ai = { ...DEFAULT_AI_SETTINGS };
                    }
                    this.plugin.settings.ai.selectedModel = value;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Controls randomness. Lower = more focused, Higher = more creative (0.0 - 1.0)')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.plugin.settings.ai?.temperature || 0.7)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    if (!this.plugin.settings.ai) {
                        this.plugin.settings.ai = { ...DEFAULT_AI_SETTINGS };
                    }
                    this.plugin.settings.ai.temperature = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max Tokens')
            .setDesc('Maximum length of AI responses (100 - 4000)')
            .addText(text => text
                .setValue(String(this.plugin.settings.ai?.maxTokens || 1000))
                .onChange(async (value) => {
                    const num = parseInt(value);
                    if (!isNaN(num) && num >= 100 && num <= 4000) {
                        if (!this.plugin.settings.ai) {
                            this.plugin.settings.ai = { ...DEFAULT_AI_SETTINGS };
                        }
                        this.plugin.settings.ai.maxTokens = num;
                        await this.plugin.saveSettings();
                    }
                }));

        // Info section
        containerEl.createEl('h3', { text: '📖 How to get an API Key' });
        const infoEl = containerEl.createDiv({ cls: 'rpg-settings-info' });
        infoEl.createEl('ol', {}, ol => {
            ol.createEl('li', { text: 'Go to openrouter.ai and create an account' });
            ol.createEl('li', { text: 'Navigate to Keys section' });
            ol.createEl('li', { text: 'Create a new API key' });
            ol.createEl('li', { text: 'Copy and paste it above' });
        });
        infoEl.createEl('p', {
            text: 'OpenRouter provides access to 100+ AI models with one API key. Pricing varies by model.',
            cls: 'rpg-settings-note'
        });

        // Journal Intelligence Section
        containerEl.createEl('h3', { text: '📓 Journal Intelligence' });

        new Setting(containerEl)
            .setName('Enable Journal Analysis')
            .setDesc('Analyze your journal entries to affect character stats')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.journalSettings?.enabled ?? true)
                .onChange(async (value) => {
                    if (!this.plugin.settings.journalSettings) {
                        this.plugin.settings.journalSettings = JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS));
                    }
                    this.plugin.settings.journalSettings.enabled = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Scan Mode')
            .setDesc('How to identify journal entries')
            .addDropdown(dropdown => dropdown
                .addOption('folder', 'By Folder')
                .addOption('tag', 'By Tag')
                .setValue(this.plugin.settings.journalSettings?.scanMode || 'folder')
                .onChange(async (value) => {
                    if (!this.plugin.settings.journalSettings) {
                        this.plugin.settings.journalSettings = JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS));
                    }
                    this.plugin.settings.journalSettings.scanMode = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show relevant option
                }));

        if (this.plugin.settings.journalSettings?.scanMode === 'folder' || !this.plugin.settings.journalSettings?.scanMode) {
            new Setting(containerEl)
                .setName('Journal Folder')
                .setDesc('Folder containing your journal entries (without leading slash)')
                .addText(text => text
                    .setPlaceholder('Journal')
                    .setValue(this.plugin.settings.journalSettings?.journalFolder || 'Journal')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.journalSettings) {
                            this.plugin.settings.journalSettings = JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS));
                        }
                        this.plugin.settings.journalSettings.journalFolder = value;
                        await this.plugin.saveSettings();
                    }));
        } else {
            new Setting(containerEl)
                .setName('Journal Tag')
                .setDesc('Tag to identify journal entries')
                .addText(text => text
                    .setPlaceholder('#journal')
                    .setValue(this.plugin.settings.journalSettings?.journalTag || '#journal')
                    .onChange(async (value) => {
                        if (!this.plugin.settings.journalSettings) {
                            this.plugin.settings.journalSettings = JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS));
                        }
                        this.plugin.settings.journalSettings.journalTag = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // Info about Journal Intelligence
        const journalInfoEl = containerEl.createDiv({ cls: 'rpg-settings-info' });
        journalInfoEl.innerHTML = `
            <p><strong>How Journal Intelligence Works:</strong></p>
            <ul>
                <li>Scans journal entries for keywords related to life domains</li>
                <li>Analyzes sentiment (positive/negative) to adjust HP and XP</li>
                <li>Longer entries earn Gold (1g per 100 words)</li>
                <li>With AI enabled, provides deeper analysis and personalized suggestions</li>
            </ul>
        `;

        // Game Actions Section
        containerEl.createEl('h3', { text: '🎮 Game Actions' });

        new Setting(containerEl)
            .setName('Heal HP')
            .setDesc('Manually restore health points')
            .addButton(btn => btn
                .setButtonText('Heal 10 HP')
                .onClick(async () => {
                    this.plugin.heal(10);
                    new Notice('💚 Healed 10 HP!');
                }))
            .addButton(btn => btn
                .setButtonText('Full Heal')
                .onClick(async () => {
                    this.plugin.settings.hp = this.plugin.settings.maxHp;
                    await this.plugin.saveSettings();
                    new Notice('💚 Fully healed!');
                }));

        new Setting(containerEl)
            .setName('Take Damage')
            .setDesc('Manually reduce health points (for testing)')
            .addButton(btn => btn
                .setButtonText('Take 10 Damage')
                .onClick(async () => {
                    this.plugin.takeDamage(10);
                    new Notice('💔 Took 10 damage!');
                }));

        new Setting(containerEl)
            .setName('Add Gold')
            .setDesc('Manually add gold (for testing)')
            .addButton(btn => btn
                .setButtonText('+50 Gold')
                .onClick(async () => {
                    this.plugin.settings.gold += 50;
                    await this.plugin.saveSettings();
                    new Notice('🪙 Added 50 gold!');
                }));

        // Danger Zone
        containerEl.createEl('h3', { text: '⚠️ Danger Zone' });

        new Setting(containerEl)
            .setName('Clear Chat History')
            .setDesc('Delete all AI conversation history')
            .addButton(btn => btn
                .setButtonText('Clear Chat')
                .setWarning()
                .onClick(async () => {
                    if (confirm('Clear all AI chat history?')) {
                        if (this.plugin.settings.ai) {
                            this.plugin.settings.ai.chatHistory = [];
                        }
                        await this.plugin.saveSettings();
                        new Notice('🗑️ Chat history cleared!');
                    }
                }));

        new Setting(containerEl)
            .setName('Reset All Data')
            .setDesc('⚠️ This will delete ALL progress including character, habits, quests, and achievements!')
            .addButton(btn => btn
                .setButtonText('Reset Everything')
                .setWarning()
                .onClick(async () => {
                    if (confirm('⚠️ Are you SURE? This will reset ALL your progress and cannot be undone!')) {
                        await this.plugin.resetAllData();
                        new Notice('🔄 All data has been reset!');
                        this.display(); // Refresh settings view
                    }
                }));
    }
}

// ============================================================================
// MAIN PLUGIN CLASS
// ============================================================================

module.exports = class LifeRPG extends Plugin {
    async onload() {
        console.log('Loading Life RPG Plugin v3.0 - AI Coach Edition');
        await this.loadSettings();
        this.checkDailyReset();

        this.registerView(VIEW_TYPE_HERO, (leaf) => new HeroView(leaf, this));
        this.addRibbonIcon('swords', 'Open Hero Sheet', () => this.activateView());
        this.addCommand({ id: 'open-hero-sheet', name: 'Open Hero Sheet', callback: () => this.activateView() });
        this.addCommand({ id: 'create-character', name: 'Create/Retake Character Assessment', callback: () => {
            new CharacterCreationModal(this.app, this, () => this.refreshViews()).open();
        }});
        this.addCommand({ id: 'ai-generate-quests', name: 'AI: Generate Quests', callback: () => {
            if (!this.settings.ai?.openRouterApiKey) {
                new Notice('⚠️ Configure OpenRouter API key in Settings → Life RPG');
                return;
            }
            new AIQuestGeneratorModal(this.app, this, () => this.refreshViews()).open();
        }});

        // Add settings tab
        this.addSettingTab(new LifeRPGSettingTab(this.app, this));

        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar();

        this.registerEvent(this.app.workspace.on('editor-change', (editor, info) => this.handleQuestCompletion(editor)));
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_HERO);
    }

    async loadSettings() {
        const saved = await this.loadData() || {};

        // Migrate from old skills to domains
        let domains;
        if (saved.domains) {
            domains = saved.domains;
        } else if (saved.skills) {
            const skillToDomain = {
                'health': 'health',
                'work': 'livingStandards',
                'creativity': 'culturalResilience',
                'social': 'communityVitality',
                'learning': 'education'
            };
            domains = DEFAULT_DOMAINS.map(d => {
                const oldSkill = saved.skills.find(s => skillToDomain[s.id] === d.id);
                return oldSkill ? { ...d, level: oldSkill.level, xp: oldSkill.xp } : d;
            });
        } else {
            domains = JSON.parse(JSON.stringify(DEFAULT_DOMAINS));
        }

        // Migrate habits
        const migratedHabits = (saved.habits || []).map(h => {
            const skillToDomain = {
                'health': 'health',
                'work': 'livingStandards',
                'creativity': 'culturalResilience',
                'social': 'communityVitality',
                'learning': 'education'
            };
            return {
                ...h,
                domain: h.domain || skillToDomain[h.skill] || 'health',
                difficulty: h.difficulty || 'medium',
                streak: h.streak || 0,
                bestStreak: h.bestStreak || 0,
                lastCompletedDate: h.lastCompletedDate || null
            };
        });

        // Migrate quests
        const migratedQuests = (saved.quests || []).map(q => {
            const skillToDomain = {
                'health': 'health',
                'work': 'livingStandards',
                'creativity': 'culturalResilience',
                'social': 'communityVitality',
                'learning': 'education'
            };
            return {
                ...q,
                domain: q.domain || skillToDomain[q.skill] || 'education'
            };
        });

        // Merge achievements
        const mergedAchievements = DEFAULT_ACHIEVEMENTS.map(defaultAch => {
            const savedAch = (saved.achievements || []).find(a => a.id === defaultAch.id);
            return savedAch ? { ...defaultAch, unlocked: savedAch.unlocked } : defaultAch;
        });

        this.settings = {
            level: saved.level || 1,
            xp: saved.xp || 0,
            hp: saved.hp || 100,
            maxHp: saved.maxHp || 100,
            gold: saved.gold || 0,
            totalGoldEarned: saved.totalGoldEarned || 0,
            totalHabitsCompleted: saved.totalHabitsCompleted || 0,
            totalQuestsCompleted: saved.totalQuestsCompleted || 0,
            lastPlayedDate: saved.lastPlayedDate || new Date().toDateString(),
            domains: domains,
            habits: migratedHabits,
            badHabits: saved.badHabits || [],
            quests: migratedQuests,
            rewards: saved.rewards || [],
            achievements: mergedAchievements,
            characterProfile: saved.characterProfile || null,
            ai: saved.ai || { ...DEFAULT_AI_SETTINGS },
            aiQuestsGenerated: saved.aiQuestsGenerated || 0,
            // HUMAN 3.0 Framework
            currentPhase: saved.currentPhase || 'dissonance',
            psychicEntropy: saved.psychicEntropy || 0,
            lastWisdomDate: saved.lastWisdomDate || null,
            dailyWisdom: saved.dailyWisdom || null,
            // Activity Log & NPC System
            activityLog: saved.activityLog || [],
            npcs: saved.npcs || JSON.parse(JSON.stringify(DEFAULT_NPCS)),
            lastPenaltyCheck: saved.lastPenaltyCheck || null,
            penaltyEnabled: saved.penaltyEnabled !== undefined ? saved.penaltyEnabled : true,
            // Boss Fight System
            bossFights: saved.bossFights || [],
            totalBossesDefeated: saved.totalBossesDefeated || 0,
            // Dungeon System (Focus Sessions)
            activeDungeon: saved.activeDungeon || null,
            totalDungeonsCleared: saved.totalDungeonsCleared || 0,
            totalFocusMinutes: saved.totalFocusMinutes || 0,
            // Energy Station
            energy: saved.energy || 100,
            maxEnergy: saved.maxEnergy || 100,
            moodLog: saved.moodLog || [],
            lastMoodCheck: saved.lastMoodCheck || null,
            sleepLog: saved.sleepLog || [],
            // Difficulty
            gameDifficulty: saved.gameDifficulty || 'normal',
            // Daily Summary
            dailyStats: saved.dailyStats || {},
            // Journal Intelligence
            journalSettings: saved.journalSettings || JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS))
        };
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.updateStatusBar();
    }

    async resetAllData() {
        this.settings = {
            level: 1, xp: 0, hp: 100, maxHp: 100, gold: 0,
            totalGoldEarned: 0, totalHabitsCompleted: 0, totalQuestsCompleted: 0,
            lastPlayedDate: new Date().toDateString(),
            domains: JSON.parse(JSON.stringify(DEFAULT_DOMAINS)),
            habits: [], badHabits: [], quests: [], rewards: [],
            achievements: JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS)),
            characterProfile: null,
            ai: { ...DEFAULT_AI_SETTINGS },
            aiQuestsGenerated: 0,
            // HUMAN 3.0 Framework
            currentPhase: 'dissonance',
            psychicEntropy: 0,
            lastWisdomDate: null,
            dailyWisdom: null,
            // Activity Log & NPC System
            activityLog: [],
            npcs: JSON.parse(JSON.stringify(DEFAULT_NPCS)),
            lastPenaltyCheck: null,
            penaltyEnabled: true,
            // Boss Fight System
            bossFights: [],
            totalBossesDefeated: 0,
            // Dungeon System
            activeDungeon: null,
            totalDungeonsCleared: 0,
            totalFocusMinutes: 0,
            // Energy Station
            energy: 100,
            maxEnergy: 100,
            moodLog: [],
            lastMoodCheck: null,
            sleepLog: [],
            // Difficulty & Daily
            gameDifficulty: 'normal',
            dailyStats: {},
            // Journal Intelligence
            journalSettings: JSON.parse(JSON.stringify(DEFAULT_JOURNAL_SETTINGS))
        };
        await this.saveSettings();
        new Notice("🔄 All data has been reset!");
    }

    checkDailyReset() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (this.settings.lastPlayedDate !== today) {
            console.log("Life RPG: New Day Detected!");

            this.settings.habits.forEach(h => {
                if (h.completed && h.lastCompletedDate === yesterday) {
                    h.streak = (h.streak || 0) + 1;
                    h.bestStreak = Math.max(h.bestStreak || 0, h.streak);
                } else if (!h.completed) {
                    h.streak = 0;
                }
                h.completed = false;
            });

            // Increase entropy for incomplete tasks (HUMAN 3.0)
            const incompleteTasks = this.settings.quests.filter(q => !q.completed).length;
            if (incompleteTasks > 0) {
                this.settings.psychicEntropy = Math.min(100, (this.settings.psychicEntropy || 0) + incompleteTasks * 2);
            }

            this.settings.lastPlayedDate = today;
            this.saveSettings();
            this.checkAchievements();
            this.checkWeeklyPenalty(); // Check for debt penalty
            new Notice("☀️ New day! Habits reset. Keep your streaks going!");
        }
    }

    async handleQuestCompletion(editor) {
        const lineCount = editor.lineCount();
        let changesMade = false;

        for (let i = 0; i < lineCount; i++) {
            const line = editor.getLine(i);
            const questRegex = /^\s*-\s*\[x\]\s*(.*?)#quest(?!\S)/;
            const match = line.match(questRegex);

            if (match) {
                this.gainXp(20, 10, 'education');
                const newLine = line.replace("#quest", "#quest-done");
                editor.setLine(i, newLine);
                changesMade = true;
            }
        }

        if (changesMade) this.refreshViews();
    }

    // --- GAME LOGIC ---

    gainXp(xpAmount, goldAmount, domainId = null) {
        const s = this.settings;

        // Apply phase XP multiplier (HUMAN 3.0)
        const currentPhase = determinePhase(s);
        const adjustedXP = calculateXPWithPhase(xpAmount, currentPhase);
        const phaseInfo = PHASES[currentPhase];

        s.xp += adjustedXP;
        s.gold += goldAmount;
        s.totalGoldEarned += goldAmount;

        // Reduce psychic entropy when completing tasks
        reduceEntropy(s, 5);

        if (domainId) {
            const domain = s.domains.find(d => d.id === domainId);
            if (domain) {
                domain.xp += adjustedXP;
                const domainXpNeeded = domain.level * 50;
                if (domain.xp >= domainXpNeeded) {
                    domain.level++;
                    domain.xp = 0;
                    domain.score = Math.min(100, domain.score + 2);
                    new Notice(`📈 ${domain.icon} ${domain.name} leveled up to ${domain.level}!`);
                }

                // Damage bosses linked to this domain
                this.damageBossesForDomain(domainId, 10);
            }
        }

        const xpToNextLevel = s.level * 100;
        if (s.xp >= xpToNextLevel) {
            this.levelUp();
        } else {
            // Show XP with phase multiplier info
            const multiplierText = phaseInfo.xpMultiplier > 1 ? ` (×${phaseInfo.xpMultiplier} ${phaseInfo.name})` : '';
            new Notice(`+${adjustedXP} XP${multiplierText} | +${goldAmount} Gold`);
        }

        this.saveSettings();
        this.checkAchievements();
    }

    levelUp() {
        const s = this.settings;
        const oldLevel = s.level;
        s.level++;
        s.xp = 0;
        s.maxHp += 10;
        s.hp = s.maxHp;

        // Check for HUMAN tier advancement
        const oldDevLevel = getDevelopmentLevel(oldLevel);
        const newDevLevel = getDevelopmentLevel(s.level);

        // Log activity
        this.logActivity('level_up', `Reached Level ${s.level}!`, { newLevel: s.level, devLevel: newDevLevel });

        if (oldDevLevel !== newDevLevel) {
            // HUMAN tier advancement!
            const devInfo = DEVELOPMENT_LEVELS[newDevLevel];
            new Notice(`🌟 HUMAN ${newDevLevel} UNLOCKED! 🌟\n${devInfo.icon} ${devInfo.name} - ${devInfo.journey}`, 10000);
            this.logActivity('tier_up', `Advanced to HUMAN ${newDevLevel} - ${devInfo.name}!`, { tier: newDevLevel });
        } else {
            new Notice(`🎉 LEVEL UP! You are now Level ${s.level}!`);
        }

        this.checkAchievements();
    }

    takeDamage(amount) {
        const s = this.settings;
        s.hp -= amount;
        if (s.hp <= 0) {
            s.hp = 0;
            new Notice(`💀 YOU FAINTED. Lost some XP.`);
            s.xp = Math.max(0, s.xp - 50);
            s.hp = Math.floor(s.maxHp / 2);
        } else {
            new Notice(`-${amount} HP`);
        }
        this.saveSettings();
    }

    heal(amount) {
        this.settings.hp = Math.min(this.settings.maxHp, this.settings.hp + amount);
        this.saveSettings();
    }

    async completeHabit(index) {
        const s = this.settings;
        const habit = s.habits[index];
        if (habit && !habit.completed) {
            habit.completed = true;
            habit.lastCompletedDate = new Date().toDateString();
            s.totalHabitsCompleted++;

            const diff = DIFFICULTY[habit.difficulty || 'medium'];
            const streakBonus = Math.min((habit.streak || 0) * 0.1, 1);
            const finalXp = Math.round(habit.xp * diff.multiplier * (1 + streakBonus));
            const finalGold = Math.round(habit.gold * diff.multiplier * (1 + streakBonus));

            // Log activity
            this.logActivity('habit_complete', habit.name, {
                xp: finalXp,
                gold: finalGold,
                streak: habit.streak || 0
            });

            this.gainXp(finalXp, finalGold, habit.domain);
        }
    }

    async removeHabit(index) {
        this.settings.habits.splice(index, 1);
        await this.saveSettings();
    }

    async completeQuest(index) {
        const s = this.settings;
        const quest = s.quests[index];
        if (quest && !quest.completed) {
            quest.completed = true;
            quest.completedDate = new Date().toISOString();
            s.totalQuestsCompleted++;

            const diff = DIFFICULTY[quest.difficulty || 'medium'];
            let finalXp = Math.round(quest.xp * diff.multiplier);
            let finalGold = Math.round(quest.gold * diff.multiplier);

            // Check for Flow State bonus (HUMAN 3.0)
            const flowState = checkFlowState(quest.difficulty || 'medium', s.level);
            if (flowState.inFlow) {
                finalXp = Math.round(finalXp * 1.25); // 25% bonus for flow state
                new Notice(`🌊 ${flowState.message}`);
            }

            // Log activity
            this.logActivity('quest_complete', quest.name, {
                xp: finalXp,
                gold: finalGold,
                difficulty: quest.difficulty || 'medium',
                inFlow: flowState.inFlow
            });

            this.gainXp(finalXp, finalGold, quest.domain);
            new Notice(`⚔️ Quest Complete: ${quest.name}!`);
        }
    }

    async removeQuest(index) {
        this.settings.quests.splice(index, 1);
        await this.saveSettings();
    }

    async triggerBadHabit(index) {
        const s = this.settings;
        const habit = s.badHabits[index];
        if (habit) {
            habit.triggerCount++;
            s.gold = Math.max(0, s.gold - habit.goldPenalty);
            this.takeDamage(habit.hpCost);

            // Increase psychic entropy (HUMAN 3.0)
            s.psychicEntropy = Math.min(100, (s.psychicEntropy || 0) + 10);

            // Log activity
            this.logActivity('bad_habit', habit.name, {
                hpLost: habit.hpCost,
                goldLost: habit.goldPenalty,
                triggerCount: habit.triggerCount
            });

            new Notice(`😔 -${habit.hpCost} HP | -${habit.goldPenalty}g | +10 Entropy`);
            await this.saveSettings();
        }
    }

    async removeBadHabit(index) {
        this.settings.badHabits.splice(index, 1);
        await this.saveSettings();
    }

    // ============================================================================
    // ACTIVITY LOG SYSTEM
    // ============================================================================
    logActivity(category, description, details = {}) {
        const s = this.settings;
        const activity = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            category: category,
            description: description,
            details: details
        };

        // Keep last 100 activities
        s.activityLog = [activity, ...(s.activityLog || [])].slice(0, 100);
    }

    // ============================================================================
    // INN/HOTEL RECOVERY SYSTEM
    // ============================================================================
    async restAtInn(tierId) {
        const s = this.settings;
        const inn = INN_TIERS.find(i => i.id === tierId);

        if (!inn) {
            new Notice('❌ Invalid inn tier!');
            return false;
        }

        if (s.gold < inn.cost) {
            new Notice(`❌ Not enough gold! Need ${inn.cost}g`);
            return false;
        }

        if (s.hp >= s.maxHp) {
            new Notice('❤️ You are already at full health!');
            return false;
        }

        s.gold -= inn.cost;
        const oldHp = s.hp;
        s.hp = Math.min(s.maxHp, s.hp + inn.hpRecover);
        const actualRecovery = s.hp - oldHp;

        // Log activity
        this.logActivity('inn_rest', `Rested at ${inn.name}`, {
            hpRecovered: actualRecovery,
            goldSpent: inn.cost
        });

        // Reduce entropy (rest reduces chaos)
        s.psychicEntropy = Math.max(0, (s.psychicEntropy || 0) - 15);

        await this.saveSettings();
        new Notice(`${inn.name}: +${actualRecovery} HP | -${inn.cost}g | -15 Entropy`);
        return true;
    }

    // ============================================================================
    // BOSS FIGHT SYSTEM
    // ============================================================================
    async damageBoss(bossIndex, damage) {
        const s = this.settings;
        const boss = s.bossFights[bossIndex];

        if (!boss || boss.defeated) return;

        boss.currentHp = Math.max(0, boss.currentHp - damage);

        // Log activity
        this.logActivity('boss_damage', `Dealt ${damage} damage to ${boss.name}`, {
            damage,
            remaining: boss.currentHp
        });

        // Check if boss is defeated
        if (boss.currentHp <= 0) {
            boss.defeated = true;
            boss.defeatedAt = new Date().toISOString();
            s.totalBossesDefeated = (s.totalBossesDefeated || 0) + 1;

            // Rewards for defeating boss
            const xpReward = boss.maxHp * 2;
            const goldReward = boss.maxHp;

            s.xp += xpReward;
            s.gold += goldReward;

            this.logActivity('boss_defeated', `Defeated ${boss.name}!`, {
                xp: xpReward,
                gold: goldReward
            });

            new Notice(`🎉 BOSS DEFEATED: ${boss.name}!\n+${xpReward} XP | +${goldReward}g`);
            this.checkAchievements();
        } else {
            new Notice(`⚔️ ${boss.name} takes ${damage} damage! (${boss.currentHp}/${boss.maxHp} HP remaining)`);
        }

        await this.saveSettings();
    }

    // Damage bosses when completing domain tasks
    damageBossesForDomain(domainId, baseDamage = 10) {
        const s = this.settings;
        const activeBosses = (s.bossFights || []).filter(b => !b.defeated && b.domain === domainId);

        activeBosses.forEach((boss, idx) => {
            const bossIndex = s.bossFights.indexOf(boss);
            this.damageBoss(bossIndex, baseDamage);
        });
    }

    // ============================================================================
    // PENALTY SYSTEM (Weekly check for negative gold)
    // ============================================================================
    checkWeeklyPenalty() {
        const s = this.settings;
        if (!s.penaltyEnabled) return;

        const now = new Date();
        const lastCheck = s.lastPenaltyCheck ? new Date(s.lastPenaltyCheck) : null;

        // Check if a week has passed
        if (lastCheck) {
            const weekInMs = 7 * 24 * 60 * 60 * 1000;
            if (now - lastCheck < weekInMs) return;
        }

        // Apply penalty if gold is negative
        if (s.gold < 0) {
            const penalty = Math.min(Math.abs(s.gold), 20); // Max 20 HP penalty
            this.takeDamage(penalty);
            this.logActivity('damage', `Weekly debt penalty`, { hpLost: penalty, debt: s.gold });
            new Notice(`💀 Weekly Penalty: -${penalty} HP for ${s.gold}g debt!`);
        }

        s.lastPenaltyCheck = now.toISOString();
        this.saveSettings();
    }

    // ============================================================================
    // NPC INTERACTION
    // ============================================================================
    getNPCDialogue(npcId) {
        const npc = this.settings.npcs.find(n => n.id === npcId) || DEFAULT_NPCS.find(n => n.id === npcId);
        return npc ? npc.dialogue : "...";
    }

    getNPCQuestSuggestion(npcId) {
        const s = this.settings;
        const npc = DEFAULT_NPCS.find(n => n.id === npcId);
        if (!npc) return null;

        // Find lowest scoring domain that this NPC covers
        const relevantDomains = s.domains.filter(d => npc.questTypes.includes(d.id));
        if (relevantDomains.length === 0) return null;

        const lowestDomain = relevantDomains.reduce((a, b) => a.score < b.score ? a : b);

        // Generate quest suggestion based on domain
        const suggestions = {
            health: ['Go for a 30-minute walk', 'Drink 8 glasses of water today', 'Do 20 push-ups', 'Sleep before 11 PM'],
            education: ['Read for 30 minutes', 'Complete an online lesson', 'Learn 10 new vocabulary words', 'Watch an educational video'],
            psychologicalWellbeing: ['Meditate for 10 minutes', 'Write 3 things you are grateful for', 'Call a friend', 'Take a digital detox hour'],
            timeUse: ['Plan tomorrow with time blocks', 'Complete your MIT (Most Important Task)', 'Declutter one area', 'Review weekly goals'],
            communityVitality: ['Help someone today', 'Send an appreciation message', 'Attend a community event', 'Volunteer for an hour'],
            livingStandards: ['Review your budget', 'Save $10 today', 'Learn about investing', 'Track all expenses today'],
            ecologicalAwareness: ['Use reusable bags', 'Plant something', 'Reduce water usage', 'Walk instead of driving'],
            culturalResilience: ['Practice a traditional skill', 'Cook a cultural dish', 'Share a story from your heritage', 'Learn about your ancestry'],
            goodGovernance: ['Set clear boundaries', 'Make a decision you have been avoiding', 'Organize your workspace', 'Create a personal policy']
        };

        const domainSuggestions = suggestions[lowestDomain.id] || ['Complete a meaningful task'];
        const randomSuggestion = domainSuggestions[Math.floor(Math.random() * domainSuggestions.length)];

        return {
            npc: npc,
            domain: lowestDomain,
            questName: randomSuggestion,
            xp: 15 + Math.floor(Math.random() * 10),
            gold: 5 + Math.floor(Math.random() * 5)
        };
    }

    async buyReward(index) {
        const s = this.settings;
        const reward = s.rewards[index];
        if (s.gold >= reward.cost) {
            s.gold -= reward.cost;

            // Log activity
            this.logActivity('shop_purchase', reward.name, { cost: reward.cost });

            new Notice(`🎁 Purchased: ${reward.name}!`);
            await this.saveSettings();
        } else {
            new Notice(`Not enough gold!`);
        }
    }

    async removeReward(index) {
        this.settings.rewards.splice(index, 1);
        await this.saveSettings();
    }

    // ============================================================================
    // JOURNAL INTELLIGENCE SYSTEM
    // ============================================================================

    async syncJournals() {
        const js = this.settings.journalSettings;
        if (!js.enabled) {
            new Notice('📓 Journal Intelligence is disabled. Enable it in settings.');
            return;
        }

        // Initialize aiService if API key exists
        const aiService = this.settings.ai?.openRouterApiKey ? new AIService(this) : null;

        const analyzer = new JournalAnalyzer(this);
        // Set aiService on the plugin temporarily for the analyzer to use
        this.aiService = aiService;

        const newNotes = await analyzer.getNewNotes();

        if (newNotes.length === 0) {
            new Notice('📓 No new journal entries to sync');
            return;
        }

        new Notice(`📓 Analyzing ${newNotes.length} journal entries...`);

        let totalXP = 0;
        let totalGold = 0;
        let totalHPChange = 0;
        const domainImpacts = {};
        const recentAnalysis = [];

        for (const note of newNotes) {
            try {
                const analysis = await analyzer.analyzeNote(note);

                // Calculate rewards from analysis
                if (analysis.ai) {
                    // AI analysis available - use its suggestions
                    totalXP += analysis.ai.suggestedXP || 0;
                    totalHPChange += analysis.ai.suggestedHPChange || 0;

                    // Apply domain impacts
                    for (const [domain, score] of Object.entries(analysis.ai.domains || {})) {
                        if (score > 0) {
                            domainImpacts[domain] = (domainImpacts[domain] || 0) + score;
                        }
                    }

                    // Store for recent analysis display
                    recentAnalysis.push({
                        fileName: analysis.fileName,
                        sentiment: analysis.ai.sentiment || 0,
                        achievements: analysis.ai.achievements || [],
                        challenges: analysis.ai.challenges || [],
                        xp: analysis.ai.suggestedXP || 0,
                        date: analysis.modifiedDate
                    });
                } else {
                    // Offline analysis only
                    const sentiment = analysis.offline.sentiment;

                    // XP from positive sentiment
                    totalXP += Math.max(0, sentiment.score * 5);

                    // HP change from sentiment
                    if (sentiment.score < -2) {
                        totalHPChange -= Math.min(20, Math.abs(sentiment.score) * 2);
                    } else if (sentiment.score > 2) {
                        totalHPChange += Math.min(10, sentiment.score);
                    }

                    // Domain impacts from keyword matches
                    for (const [domain, data] of Object.entries(analysis.offline.domainScores)) {
                        if (data.count > 0) {
                            domainImpacts[domain] = (domainImpacts[domain] || 0) + data.count * 2;
                        }
                    }

                    // Store for recent analysis display
                    recentAnalysis.push({
                        fileName: analysis.fileName,
                        sentiment: sentiment.score,
                        positiveWords: sentiment.positiveWords,
                        negativeWords: sentiment.negativeWords,
                        xp: Math.max(0, sentiment.score * 5),
                        date: analysis.modifiedDate
                    });
                }

                // Gold from word count (journaling effort)
                totalGold += Math.floor(analysis.wordCount / 100);

                // Log to activity
                this.logActivity('journal_sync', `Analyzed: ${analysis.fileName}`, {
                    wordCount: analysis.wordCount,
                    sentiment: analysis.offline?.sentiment?.score || (analysis.ai?.sentiment || 0),
                    hasAI: !!analysis.ai
                });

            } catch (e) {
                console.error(`Error analyzing note ${note.path}:`, e);
            }
        }

        const s = this.settings;

        // Apply XP and Gold
        if (totalXP > 0 || totalGold > 0) {
            this.gainXp(totalXP, totalGold);
        }

        // Apply HP changes
        if (totalHPChange < 0) {
            this.takeDamage(Math.abs(totalHPChange));
        } else if (totalHPChange > 0) {
            s.hp = Math.min(s.maxHp, s.hp + totalHPChange);
        }

        // Apply domain score changes (gradual, capped at ±5 per sync)
        for (const [domainId, impact] of Object.entries(domainImpacts)) {
            const domain = s.domains.find(d => d.id === domainId);
            if (domain) {
                const change = Math.min(5, Math.max(-5, impact / newNotes.length));
                domain.score = Math.min(100, Math.max(0, domain.score + Math.round(change)));
            }
        }

        // Update journal settings
        js.lastSyncDate = new Date().toISOString();
        js.recentAnalysis = recentAnalysis.slice(0, 10); // Keep last 10

        await this.saveSettings();
        this.refreshViews();

        // Show summary
        const hpText = totalHPChange >= 0 ? `+${totalHPChange}` : totalHPChange;
        new Notice(`📓 Journal Sync Complete!\n+${totalXP} XP, +${totalGold} Gold\nHP: ${hpText}`);
    }

    checkAchievements() {
        const s = this.settings;
        let unlocked = false;

        s.achievements.forEach(ach => {
            if (ach.unlocked) return;

            let shouldUnlock = false;

            switch (ach.id) {
                case 'first_habit':
                    shouldUnlock = s.totalHabitsCompleted >= 1;
                    break;
                case 'level_5':
                    shouldUnlock = s.level >= 5;
                    break;
                case 'level_10':
                    shouldUnlock = s.level >= 10;
                    break;
                case 'streak_7':
                    shouldUnlock = s.habits.some(h => h.streak >= 7 || h.bestStreak >= 7);
                    break;
                case 'streak_30':
                    shouldUnlock = s.habits.some(h => h.streak >= 30 || h.bestStreak >= 30);
                    break;
                case 'gold_500':
                    shouldUnlock = s.totalGoldEarned >= 500;
                    break;
                case 'habits_10':
                    shouldUnlock = s.habits.length >= 10;
                    break;
                case 'quests_5':
                    shouldUnlock = s.totalQuestsCompleted >= 5;
                    break;
                case 'character_created':
                    shouldUnlock = s.characterProfile?.assessmentComplete === true;
                    break;
                case 'all_domains_50':
                    shouldUnlock = s.domains.every(d => d.score >= 50);
                    break;
                case 'ai_coach_first':
                    shouldUnlock = (s.ai?.chatHistory?.length || 0) > 0;
                    break;
                case 'ai_quests_5':
                    shouldUnlock = (s.aiQuestsGenerated || 0) >= 5;
                    break;
            }

            if (shouldUnlock) {
                ach.unlocked = true;
                s.gold += ach.reward;
                s.totalGoldEarned += ach.reward;
                new Notice(`🏆 Achievement Unlocked: ${ach.name}! +${ach.reward}g`);
                unlocked = true;
            }
        });

        if (unlocked) {
            this.saveSettings();
            this.refreshViews();
        }
    }

    updateStatusBar() {
        const s = this.settings;
        if (this.statusBarItem) {
            const name = s.characterProfile?.name ? `${s.characterProfile.name} ` : '';
            this.statusBarItem.setText(`${name}Lv${s.level} | ❤️${s.hp} | 💰${s.gold}`);
        }
    }

    refreshViews() {
        this.app.workspace.getLeavesOfType(VIEW_TYPE_HERO).forEach((leaf) => {
            if (leaf.view instanceof HeroView) leaf.view.render();
        });
    }

    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_HERO)[0];
        if (!leaf) {
            leaf = workspace.getRightLeaf(false) || workspace.getLeaf('tab');
            if (leaf) {
                await leaf.setViewState({ type: VIEW_TYPE_HERO, active: true });
            }
        }
        if (leaf) workspace.revealLeaf(leaf);
    }
};
