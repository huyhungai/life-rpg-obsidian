/* SkillService - Skill Discovery, Evolution & Management */

// Helper function - XP required for each skill level (exponential growth)
function getSkillXpRequired(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}

class SkillService {
    constructor(plugin) {
        this.plugin = plugin;
    }

    // Initialize skills settings if not present
    ensureSkillsSettings() {
        if (!this.plugin.settings.skillsSettings) {
            this.plugin.settings.skillsSettings = JSON.parse(JSON.stringify(DEFAULT_SKILLS_SETTINGS));
        }
        if (!this.plugin.settings.skillsSettings.skills) {
            this.plugin.settings.skillsSettings.skills = [];
        }
    }

    // Get all skills
    getSkills() {
        this.ensureSkillsSettings();
        return this.plugin.settings.skillsSettings.skills;
    }

    // Get skill by ID
    getSkill(skillId) {
        return this.getSkills().find(s => s.id === skillId);
    }

    // Get skills by category
    getSkillsByCategory(category) {
        return this.getSkills().filter(s => s.category === category);
    }

    // Create a new skill
    createSkill(name, category, discoveredFrom = 'manual', description = '') {
        this.ensureSkillsSettings();

        // Check if skill already exists
        const existingSkill = this.getSkills().find(s =>
            s.name.toLowerCase() === name.toLowerCase()
        );
        if (existingSkill) {
            return existingSkill;
        }

        const newSkill = {
            ...JSON.parse(JSON.stringify(DEFAULT_SKILL)),
            id: `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            category: category,
            description: description,
            discoveredFrom: discoveredFrom,
            discoveredDate: new Date().toISOString(),
            xpToNextLevel: getSkillXpRequired(1)
        };

        this.plugin.settings.skillsSettings.skills.push(newSkill);
        this.plugin.settings.skillsSettings.totalSkillsDiscovered++;

        return newSkill;
    }

    // Add XP to a skill
    addSkillXp(skillId, xpAmount) {
        const skill = this.getSkill(skillId);
        if (!skill) return null;

        skill.xp += xpAmount;
        skill.lastPracticed = new Date().toISOString();
        skill.totalPracticeCount++;

        // Check for level up
        let levelsGained = 0;
        while (skill.xp >= skill.xpToNextLevel) {
            skill.xp -= skill.xpToNextLevel;
            skill.level++;
            skill.xpToNextLevel = getSkillXpRequired(skill.level);
            levelsGained++;
        }

        return { skill, levelsGained };
    }

    // Level up a skill using skill points
    levelUpSkill(skillId) {
        this.ensureSkillsSettings();
        const ss = this.plugin.settings.skillsSettings;

        if (ss.availableSkillPoints <= 0) {
            return { success: false, message: 'No skill points available' };
        }

        const skill = this.getSkill(skillId);
        if (!skill) {
            return { success: false, message: 'Skill not found' };
        }

        // Use skill point to level up
        ss.availableSkillPoints--;
        skill.level++;
        skill.xp = 0;
        skill.xpToNextLevel = getSkillXpRequired(skill.level);

        return { success: true, skill };
    }

    // Delete a skill
    deleteSkill(skillId) {
        this.ensureSkillsSettings();
        const ss = this.plugin.settings.skillsSettings;
        const index = ss.skills.findIndex(s => s.id === skillId);

        if (index >= 0) {
            ss.skills.splice(index, 1);
            return { success: true };
        }
        return { success: false, message: 'Skill not found' };
    }

    // Merge two skills together
    mergeSkills(sourceSkillId, targetSkillId) {
        this.ensureSkillsSettings();
        const ss = this.plugin.settings.skillsSettings;

        const sourceSkill = this.getSkill(sourceSkillId);
        const targetSkill = this.getSkill(targetSkillId);

        if (!sourceSkill || !targetSkill) {
            return { success: false, message: 'Skills not found' };
        }

        // Transfer XP to target skill
        targetSkill.xp += sourceSkill.xp + (sourceSkill.level * 50);

        // Check for level ups
        while (targetSkill.xp >= targetSkill.xpToNextLevel) {
            targetSkill.xp -= targetSkill.xpToNextLevel;
            targetSkill.level++;
            targetSkill.xpToNextLevel = getSkillXpRequired(targetSkill.level);
        }

        // Update practice count
        targetSkill.totalPracticeCount += sourceSkill.totalPracticeCount;

        // Remove source skill
        const index = ss.skills.findIndex(s => s.id === sourceSkillId);
        if (index >= 0) {
            ss.skills.splice(index, 1);
        }

        return { success: true, mergedSkill: targetSkill };
    }

    // AI discovers skills from journal content
    async discoverSkillsFromJournal(content, fileName) {
        const apiKey = getActiveApiKey(this.plugin.settings);
        if (!apiKey) return [];

        const aiService = new AIService(this.plugin);

        // Get existing skills to avoid duplicates and suggest combinations
        const existingSkills = this.getSkills().map(s => s.name);
        const existingList = existingSkills.length > 0
            ? `\n\nEXISTING SKILLS (don't create duplicates):\n${existingSkills.join(', ')}`
            : '';

        const prompt = `You are a skill discovery AI for an RPG life game. Extract BROAD, GENERAL skills from this journal entry.

RULES:
- Use SHORT, SIMPLE names (1-2 words max): "Writing", "Photography", "Cooking", "Running"
- Create BROAD categories, not specific variants
- Combine similar activities into ONE skill (e.g., "blog writing" + "article writing" = "Writing")
- Look for main activities only, ignore minor mentions
- Maximum 3 skills per journal entry${existingList}

CATEGORIES:
VOCATION: Writing, Design, Photography, Programming, Business, Marketing, Sales
MIND: Learning, Meditation, Planning, Problem-Solving
BODY: Running, Gym, Yoga, Cooking, Sports
SPIRIT: Networking, Teaching, Mentoring, Communication

Journal entry from "${fileName}":
---
${content.substring(0, 2000)}
---

Return ONLY valid JSON array with 0-3 skills:
[{"name": "Skill", "category": "vocation|mind|body|spirit", "xp": 20}]

Empty if nothing: []`;

        let response = '';
        try {
            response = await aiService.callProvider(
                [{ role: 'user', content: prompt }],
                this.plugin.settings.ai?.provider || 'openrouter',
                apiKey,
                getActiveChatModel(this.plugin.settings),
                0.3, // Low temperature for consistent parsing
                800  // More tokens for multiple skills
            );

            console.log('Skill discovery raw response:', response);

            // Parse JSON from response - handle various formats
            let jsonStr = response.trim();

            // Remove markdown code blocks if present
            if (jsonStr.includes('```')) {
                const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (match) jsonStr = match[1].trim();
            }

            // Try to find JSON array in response
            const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            }

            const discoveredSkills = JSON.parse(jsonStr);
            console.log('Skills discovered:', discoveredSkills);
            return Array.isArray(discoveredSkills) ? discoveredSkills : [];
        } catch (error) {
            console.error('Skill discovery error:', error);
            console.error('Raw response was:', response);
            return [];
        }
    }

    // Check if skill name is similar to an existing skill
    findSimilarSkill(newName) {
        const skills = this.getSkills();
        const newLower = newName.toLowerCase();

        // Check for exact match first
        let exact = skills.find(s => s.name.toLowerCase() === newLower);
        if (exact) return { skill: exact, similarity: 'exact' };

        // Check for partial matches
        for (const skill of skills) {
            const skillLower = skill.name.toLowerCase();

            // If one contains the other
            if (newLower.includes(skillLower) || skillLower.includes(newLower)) {
                return { skill, similarity: 'partial' };
            }

            // Check for similar words
            const newWords = newLower.split(/\s+/);
            const skillWords = skillLower.split(/\s+/);
            const commonWords = newWords.filter(w => skillWords.includes(w));
            if (commonWords.length > 0 && (commonWords.length / newWords.length) > 0.5) {
                return { skill, similarity: 'similar' };
            }
        }

        return null;
    }

    // Check if skill can evolve to advanced version
    checkSkillEvolution(skill) {
        if (skill.level < 5) return null; // Need level 5 to evolve

        // Skill evolution rules
        const evolutions = {
            'Writing': { level: 5, evolvedName: 'Professional Writing' },
            'Photography': { level: 5, evolvedName: 'Professional Photography' },
            'Cooking': { level: 5, evolvedName: 'Culinary Arts' },
            'Programming': { level: 5, evolvedName: 'Software Engineering' },
            'Design': { level: 5, evolvedName: 'Creative Design' },
            'Running': { level: 5, evolvedName: 'Athletic Running' },
            'Gym': { level: 5, evolvedName: 'Strength Training' },
            'Business': { level: 5, evolvedName: 'Business Management' },
            'Marketing': { level: 5, evolvedName: 'Digital Marketing' },
            'Teaching': { level: 5, evolvedName: 'Master Teaching' },
            'Meditation': { level: 5, evolvedName: 'Mindfulness Practice' },
            'Learning': { level: 5, evolvedName: 'Fast Learning' }
        };

        const evolution = evolutions[skill.name];
        if (evolution && skill.level >= evolution.level) {
            return evolution.evolvedName;
        }

        return null;
    }

    // Process discovered skills - create or update
    async processDiscoveredSkills(discoveredSkills) {
        const results = [];

        for (const discovered of discoveredSkills) {
            if (!discovered.name || !discovered.category) continue;

            // Check for similar existing skill
            const similar = this.findSimilarSkill(discovered.name);

            if (similar) {
                // Use existing skill instead of creating duplicate
                const skill = similar.skill;
                const result = this.addSkillXp(skill.id, discovered.xp || 20);

                // Check for evolution
                const evolvedName = this.checkSkillEvolution(skill);
                if (evolvedName && skill.name !== evolvedName) {
                    skill.name = evolvedName;
                    results.push({
                        action: 'evolved',
                        skill: skill,
                        oldName: discovered.name,
                        levelsGained: result.levelsGained
                    });
                } else {
                    results.push({
                        action: 'xp_added',
                        skill: result.skill,
                        xpAdded: discovered.xp || 20,
                        levelsGained: result.levelsGained
                    });
                }
            } else {
                // New skill discovered
                const skill = this.createSkill(
                    discovered.name,
                    discovered.category,
                    'journal',
                    discovered.description || ''
                );
                // Add initial XP
                if (discovered.xp > 0) {
                    this.addSkillXp(skill.id, discovered.xp);
                }
                results.push({
                    action: 'discovered',
                    skill: skill,
                    xpAdded: discovered.xp || 0
                });
            }
        }

        return results;
    }

    // Get skill summary for display
    getSkillSummary() {
        const skills = this.getSkills();
        const summary = {
            total: skills.length,
            byCategory: {},
            topSkills: [],
            recentlyPracticed: []
        };

        // Count by category
        Object.keys(SKILL_CATEGORIES).forEach(cat => {
            summary.byCategory[cat] = skills.filter(s => s.category === cat).length;
        });

        // Top skills by level
        summary.topSkills = [...skills]
            .sort((a, b) => b.level - a.level || b.xp - a.xp)
            .slice(0, 5);

        // Recently practiced
        summary.recentlyPracticed = [...skills]
            .filter(s => s.lastPracticed)
            .sort((a, b) => new Date(b.lastPracticed) - new Date(a.lastPracticed))
            .slice(0, 5);

        return summary;
    }
}

module.exports = { SkillService, getSkillXpRequired };
