/* Life RPG Constants - Extracted from main.js */

// Note: VIEW_TYPE_HERO is already defined in main-core.js
// This file provides config that's referenced by multiple modules

// ============================================================================
// MULTI-PROVIDER AI CONFIGURATION
// ============================================================================

const AI_PROVIDERS = {
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        description: 'Access 100+ models with one API key',
        chatEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
        embeddingEndpoint: 'https://openrouter.ai/api/v1/embeddings',
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        extraHeaders: {
            'HTTP-Referer': 'https://obsidian.md',
            'X-Title': 'Life RPG Plugin'
        },
        supportsEmbeddings: true
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT models directly from OpenAI',
        chatEndpoint: 'https://api.openai.com/v1/chat/completions',
        embeddingEndpoint: 'https://api.openai.com/v1/embeddings',
        authHeader: 'Authorization',
        authPrefix: 'Bearer ',
        extraHeaders: {},
        supportsEmbeddings: true
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude models directly from Anthropic',
        chatEndpoint: 'https://api.anthropic.com/v1/messages',
        embeddingEndpoint: null,
        authHeader: 'x-api-key',
        authPrefix: '',
        extraHeaders: {
            'anthropic-version': '2023-06-01'
        },
        supportsEmbeddings: false
    },
    google: {
        id: 'google',
        name: 'Google AI',
        description: 'Gemini models from Google AI Studio',
        chatEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        embeddingEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent',
        authHeader: null,
        authPrefix: '',
        extraHeaders: {},
        supportsEmbeddings: true
    }
};

const MODELS_BY_PROVIDER = {
    openrouter: [
        { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5 (Recommended)', type: 'chat' },
        { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5 (Most Capable)', type: 'chat' },
        { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5 (Fast & Cheap)', type: 'chat' },
        { id: 'openai/gpt-5.2', name: 'GPT-5.2', type: 'chat' },
        { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', type: 'chat' },
        { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano (Fast & Cheap)', type: 'chat' },
        { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', type: 'chat' },
        { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (Fast)', type: 'chat' },
        { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2 (Cheap)', type: 'chat' },
        { id: 'x-ai/grok-4', name: 'Grok 4', type: 'chat' },
        { id: 'qwen/qwen3-max', name: 'Qwen3 Max', type: 'chat' },
        { id: 'qwen/qwen3-vl-32b-instruct', name: 'Qwen3 VL 32B (Vision)', type: 'chat' },
        { id: 'moonshotai/kimi-k2.5', name: 'Kimi K2.5', type: 'chat' },
        { id: 'zhipu/glm-4.7', name: 'GLM-4.7', type: 'chat' },
        { id: 'openai/text-embedding-3-small', name: 'Text Embedding 3 Small', type: 'embedding', dimensions: 1536 },
        { id: 'openai/text-embedding-3-large', name: 'Text Embedding 3 Large', type: 'embedding', dimensions: 3072 }
    ],
    openai: [
        { id: 'gpt-5.2-2025-12-11', name: 'GPT-5.2 (Recommended)', type: 'chat' },
        { id: 'gpt-5-mini-2025-08-07', name: 'GPT-5 Mini', type: 'chat' },
        { id: 'gpt-5-nano-2025-08-07', name: 'GPT-5 Nano (Fast & Cheap)', type: 'chat' },
        { id: 'text-embedding-3-small', name: 'Text Embedding 3 Small', type: 'embedding', dimensions: 1536 },
        { id: 'text-embedding-3-large', name: 'Text Embedding 3 Large', type: 'embedding', dimensions: 3072 }
    ],
    anthropic: [
        { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5 (Recommended)', type: 'chat' },
        { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5 (Most Capable)', type: 'chat' },
        { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5 (Fast)', type: 'chat' }
    ],
    google: [
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview (Recommended)', type: 'chat' },
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (Fast)', type: 'chat' },
        { id: 'text-embedding-004', name: 'Text Embedding 004', type: 'embedding', dimensions: 768 }
    ]
};

// ============================================================================
// SKILL SYSTEM
// ============================================================================

const SKILL_CATEGORIES = {
    mind: {
        name: 'Mind Skills',
        icon: '🧠',
        examples: ['Meditation', 'Critical Thinking', 'Emotional Intelligence', 'Memory', 'Focus', 'Problem Solving', 'Creativity', 'Self-Awareness']
    },
    body: {
        name: 'Body Skills',
        icon: '💪',
        examples: ['Running', 'Strength Training', 'Yoga', 'Swimming', 'Martial Arts', 'Dancing', 'Cooking', 'Sleep Optimization']
    },
    spirit: {
        name: 'Spirit Skills',
        icon: '✨',
        examples: ['Communication', 'Empathy', 'Leadership', 'Networking', 'Teaching', 'Volunteering', 'Environmental Awareness', 'Cultural Appreciation']
    },
    vocation: {
        name: 'Vocation Skills',
        icon: '⚔️',
        examples: ['Programming', 'Writing', 'Design', 'Photography', 'Marketing', 'Finance', 'Project Management', 'Public Speaking']
    }
};

const DEFAULT_SKILL = {
    id: '',
    name: '',
    category: 'vocation',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    description: '',
    discoveredFrom: '',
    discoveredDate: null,
    lastPracticed: null,
    totalPracticeCount: 0
};

const DEFAULT_SKILLS_SETTINGS = {
    skills: [],
    autoDiscovery: true,
    skillPointsPerLevel: 1,
    availableSkillPoints: 0,
    totalSkillsDiscovered: 0
};

// Helper to get chat models for a provider
function getChatModels(providerId) {
    return (MODELS_BY_PROVIDER[providerId] || []).filter(m => m.type === 'chat');
}

// Helper to get embedding models for a provider
function getEmbeddingModels(providerId) {
    return (MODELS_BY_PROVIDER[providerId] || []).filter(m => m.type === 'embedding');
}

// Helper to get current API key
function getActiveApiKey(settings) {
    const provider = settings.ai?.provider || 'openrouter';
    return settings.ai?.apiKeys?.[provider] || settings.ai?.openRouterApiKey || '';
}

// Helper to get current chat model
function getActiveChatModel(settings) {
    const provider = settings.ai?.provider || 'openrouter';
    return settings.ai?.selectedModels?.[provider] || settings.ai?.selectedModel || 'gpt-4o-mini';
}

// Helper to get current embedding model
function getActiveEmbeddingModel(settings) {
    const provider = settings.ai?.embeddingProvider || settings.ai?.provider || 'openrouter';
    return settings.ai?.selectedEmbeddingModels?.[provider] || settings.ai?.embeddingModel || 'text-embedding-3-small';
}

// Note: These become global in the built main.js
// No need for module.exports in final build, but kept for IDE support
module.exports = {
    AI_PROVIDERS,
    MODELS_BY_PROVIDER,
    SKILL_CATEGORIES,
    DEFAULT_SKILL,
    DEFAULT_SKILLS_SETTINGS,
    getChatModels,
    getEmbeddingModels,
    getActiveApiKey,
    getActiveChatModel,
    getActiveEmbeddingModel
};
