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
            { id: 'skills', label: '🎯 Skills' },
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
        else if (this.activeTab === 'skills') this.renderSkills(tabContent);
        else if (this.activeTab === 'elder') this.renderElder(tabContent);
        else if (this.activeTab === 'quests') this.renderQuestsHub(tabContent);
        else if (this.activeTab === 'arena') this.renderArena(tabContent);
        else if (this.activeTab === 'tavern') this.renderTavern(tabContent);
        else if (this.activeTab === 'log') this.renderActivityLog(tabContent);
    }

    // ============================================================================
    // SKILLS TAB - Character Skills & Abilities
    // ============================================================================
    renderSkills(container) {
        const s = this.plugin.settings;
        const skillService = new SkillService(this.plugin);
        const skills = skillService.getSkills();
        const ss = s.skillsSettings || {};

        container.createEl('h3', { text: '🎯 Character Skills' });

        // Skill Points Banner
        const skillPointsBanner = container.createDiv({ cls: 'rpg-skill-points-banner' });
        skillPointsBanner.innerHTML = `
            <div class="rpg-skill-points-icon">⭐</div>
            <div class="rpg-skill-points-info">
                <div class="rpg-skill-points-count">${ss.availableSkillPoints || 0}</div>
                <div class="rpg-skill-points-label">Skill Points Available</div>
            </div>
            <div class="rpg-skill-points-hint">Level up to earn more points</div>
        `;

        // Skills Summary
        const summary = skillService.getSkillSummary();
        const summaryCard = container.createDiv({ cls: 'rpg-skills-summary' });
        summaryCard.innerHTML = `
            <div class="rpg-skills-stat">
                <span class="rpg-skills-stat-value">${summary.total}</span>
                <span class="rpg-skills-stat-label">Total Skills</span>
            </div>
            <div class="rpg-skills-stat">
                <span class="rpg-skills-stat-value">${summary.byCategory.mind || 0}</span>
                <span class="rpg-skills-stat-label">🧠 Mind</span>
            </div>
            <div class="rpg-skills-stat">
                <span class="rpg-skills-stat-value">${summary.byCategory.body || 0}</span>
                <span class="rpg-skills-stat-label">💪 Body</span>
            </div>
            <div class="rpg-skills-stat">
                <span class="rpg-skills-stat-value">${summary.byCategory.spirit || 0}</span>
                <span class="rpg-skills-stat-label">✨ Spirit</span>
            </div>
            <div class="rpg-skills-stat">
                <span class="rpg-skills-stat-value">${summary.byCategory.vocation || 0}</span>
                <span class="rpg-skills-stat-label">⚔️ Vocation</span>
            </div>
        `;

        // Add Skill Button
        const addSkillBtn = container.createEl('button', {
            text: '➕ Add New Skill',
            cls: 'rpg-full-width-btn secondary'
        });
        addSkillBtn.onclick = () => {
            new AddSkillModal(this.app, this.plugin, () => this.render()).open();
        };

        // Discover Skills Button
        const apiKey = getActiveApiKey(s);
        if (apiKey) {
            const discoverSkillsBtn = container.createEl('button', {
                text: '🔍 Discover Skills from Journals',
                cls: 'rpg-full-width-btn primary'
            });
            discoverSkillsBtn.onclick = async () => {
                discoverSkillsBtn.disabled = true;
                discoverSkillsBtn.textContent = '🔍 Discovering skills...';
                await this.plugin.manualDiscoverSkills();
                this.render();
            };
        } else {
            const noApiWarning = container.createDiv({ cls: 'rpg-skill-warning' });
            noApiWarning.innerHTML = '⚠️ Configure an AI provider in Settings to enable skill discovery from journals';
        }

        // Skills by Category
        Object.entries(SKILL_CATEGORIES).forEach(([catId, catInfo]) => {
            const categorySkills = skills.filter(s => s.category === catId);

            const categorySection = container.createDiv({ cls: 'rpg-skill-category' });
            const categoryHeader = categorySection.createDiv({ cls: 'rpg-skill-category-header' });
            categoryHeader.innerHTML = `
                <span class="rpg-skill-category-icon">${catInfo.icon}</span>
                <span class="rpg-skill-category-name">${catInfo.name}</span>
                <span class="rpg-skill-category-count">${categorySkills.length}</span>
            `;

            if (categorySkills.length === 0) {
                const emptyMsg = categorySection.createDiv({ cls: 'rpg-skill-empty' });
                emptyMsg.textContent = `No ${catInfo.name.toLowerCase()} discovered yet`;
                const examplesMsg = categorySection.createDiv({ cls: 'rpg-skill-examples' });
                examplesMsg.textContent = `Examples: ${catInfo.examples.slice(0, 4).join(', ')}...`;
            } else {
                const skillsList = categorySection.createDiv({ cls: 'rpg-skills-list' });

                categorySkills.forEach(skill => {
                    const skillCard = skillsList.createDiv({ cls: 'rpg-skill-card' });

                    const xpPercent = Math.round((skill.xp / skill.xpToNextLevel) * 100);

                    skillCard.innerHTML = `
                        <div class="rpg-skill-header">
                            <span class="rpg-skill-name">${skill.name}</span>
                            <span class="rpg-skill-level">Lv. ${skill.level}</span>
                        </div>
                        <div class="rpg-skill-bar">
                            <div class="rpg-skill-bar-fill" style="width: ${xpPercent}%"></div>
                        </div>
                        <div class="rpg-skill-meta">
                            <span class="rpg-skill-xp">${skill.xp}/${skill.xpToNextLevel} XP</span>
                            ${skill.discoveredFrom === 'journal' ? '<span class="rpg-skill-badge">📓 Journal</span>' : ''}
                        </div>
                    `;

                    // Buttons container
                    const btnContainer = skillCard.createDiv({ cls: 'rpg-skill-buttons' });

                    // Add level up button if skill points available
                    if ((ss.availableSkillPoints || 0) > 0) {
                        const levelUpBtn = btnContainer.createEl('button', {
                            text: '⬆️ Level Up',
                            cls: 'rpg-skill-levelup-btn'
                        });
                        levelUpBtn.onclick = async () => {
                            const result = skillService.levelUpSkill(skill.id);
                            if (result.success) {
                                new Notice(`🎯 ${skill.name} leveled up to ${result.skill.level}!`);
                                await this.plugin.saveSettings();
                                this.render();
                            } else {
                                new Notice(result.message);
                            }
                        };
                    }

                    // Delete button
                    const deleteBtn = btnContainer.createEl('button', {
                        text: '🗑️',
                        cls: 'rpg-skill-delete-btn'
                    });
                    deleteBtn.onclick = async () => {
                        if (confirm(`Delete skill: ${skill.name}?`)) {
                            const result = skillService.deleteSkill(skill.id);
                            if (result.success) {
                                new Notice(`Deleted: ${skill.name}`);
                                await this.plugin.saveSettings();
                                this.render();
                            }
                        }
                    };
                });
            }
        });

        // Tips Section
        const tipsBox = container.createDiv({ cls: 'rpg-skill-tips' });
        tipsBox.innerHTML = `
            <h4>💡 How Skills Work</h4>
            <ul>
                <li><strong>Discover skills</strong> by writing about activities in your journal</li>
                <li><strong>Simple names</strong> - Similar skills are combined automatically</li>
                <li><strong>Skill evolution</strong> - At level 5, skills evolve into advanced versions</li>
                <li><strong>Level up</strong> - Use Skill Points or gain XP from journaling</li>
                <li><strong>Manage skills</strong> - Delete unwanted skills with the 🗑️ button</li>
            </ul>
        `;
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

        // Semantic Search Section (if embeddings enabled and available)
        const embeddingsCount = js.embeddings?.length || 0;
        if (s.ai?.embeddingEnabled && s.ai?.openRouterApiKey && embeddingsCount > 0) {
            container.createEl('h4', { text: '🔍 Semantic Search' });
            const searchSection = container.createDiv({ cls: 'rpg-journal-search' });

            const searchInfo = searchSection.createDiv({ cls: 'rpg-search-info' });
            searchInfo.textContent = `${embeddingsCount} journal entries indexed for semantic search`;

            const searchInputRow = searchSection.createDiv({ cls: 'rpg-search-row' });
            const searchInput = searchInputRow.createEl('input', {
                type: 'text',
                placeholder: 'Search by meaning... e.g., "times I felt grateful"',
                cls: 'rpg-search-input'
            });

            const searchBtn = searchInputRow.createEl('button', {
                text: '🔎',
                cls: 'rpg-search-btn'
            });

            const searchResults = searchSection.createDiv({ cls: 'rpg-search-results' });

            const performSearch = async () => {
                const query = searchInput.value.trim();
                if (!query) return;

                searchBtn.textContent = '⏳';
                searchBtn.disabled = true;
                searchResults.empty();

                try {
                    const embeddingService = new EmbeddingService(this.plugin);
                    const results = await embeddingService.findSimilarEntries(query, 5);

                    if (results.length === 0) {
                        searchResults.innerHTML = '<div class="rpg-search-empty">No matching entries found</div>';
                    } else {
                        results.forEach(result => {
                            const resultItem = searchResults.createDiv({ cls: 'rpg-search-result-item' });
                            const similarity = Math.round(result.similarity * 100);
                            resultItem.innerHTML = `
                                <div class="rpg-search-result-header">
                                    <span class="rpg-search-result-name">${result.fileName}</span>
                                    <span class="rpg-search-result-score">${similarity}% match</span>
                                </div>
                                <div class="rpg-search-result-summary">${result.summary?.substring(0, 150) || ''}...</div>
                                <div class="rpg-search-result-date">${result.date?.split('T')[0] || ''}</div>
                            `;

                            // Click to open the note
                            resultItem.onclick = async () => {
                                const file = this.app.vault.getAbstractFileByPath(result.filePath);
                                if (file) {
                                    await this.app.workspace.openLinkText(file.path, '', false);
                                }
                            };
                        });
                    }
                } catch (e) {
                    searchResults.innerHTML = `<div class="rpg-search-error">Search failed: ${e.message}</div>`;
                }

                searchBtn.textContent = '🔎';
                searchBtn.disabled = false;
            };

            searchBtn.onclick = performSearch;
            searchInput.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
        } else if (s.ai?.openRouterApiKey && embeddingsCount === 0) {
            // Show message to sync for embeddings
            const embedMsg = container.createDiv({ cls: 'rpg-journal-embed-notice' });
            embedMsg.innerHTML = `
                <span class="rpg-embed-icon">💡</span>
                <span>Sync your journals to enable semantic search</span>
            `;
        }

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

            // Enhance message with relevant memories if enabled
            let enhancedMessage = message;
            if (this.plugin.settings.ai?.elderMemoryEnabled &&
                this.plugin.settings.ai?.embeddingEnabled &&
                this.plugin.settings.ai?.openRouterApiKey &&
                this.plugin.settings.journalSettings?.embeddings?.length > 0) {
                try {
                    const embeddingService = new EmbeddingService(this.plugin);
                    const memoryCount = this.plugin.settings.ai?.elderMemoryCount || 3;
                    const memories = await embeddingService.getRelevantMemories(message, memoryCount);

                    if (memories.length > 0) {
                        const memoryContext = memories.map(m =>
                            `- From "${m.fileName}" (${m.date?.split('T')[0] || 'unknown date'}): ${m.summary}`
                        ).join('\n');

                        enhancedMessage = `${message}\n\n[The Elder recalls relevant memories from your journal...]\n${memoryContext}`;
                    }
                } catch (memErr) {
                    console.log('Memory retrieval skipped:', memErr.message);
                }
            }

            const response = await aiService.chat(enhancedMessage, true);

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
                            if (k === 'category') {
                                const catInfo = SKILL_CATEGORIES[v];
                                return catInfo ? `${catInfo.icon} ${catInfo.name}` : v;
                            }
                            if (k === 'newLevel') return `Lv. ${v}`;
                            if (k === 'source') return `📓 ${v}`;
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

module.exports = { HeroView };
