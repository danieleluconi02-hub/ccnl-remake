// La Gara dei Numeri - Main Game Engine
// Original game: "The Number Race" by A. Wilson, S. Dehaene, P. Pinel, D. Dubois
// Published under GPL license by INSERM-CEA Cognitive Neuroimaging Unit
// Web adaptation for CCNL - Computational Cognitive Neuroscience Lab, University of Padova
class GaraEngine {
    constructor(container) {
        this.container = container;
        this.sound = new GaraSoundManager();
        this.algo = new GaraAlgorithm();
        this.state = 'loading';
        this.theme = null;
        this.themeData = null;
        this.playerChar = null;
        this.enemyChar = null;
        this.playerPos = 0;
        this.enemyPos = 0;
        this.turnNum = 0;
        this.currentTurn = null;
        this.rewardsCollected = [];
        this.animFrame = 0;
        this.images = {};
        this.hazardSquares = new Set();
        this.gameActive = false;
        this.level = 1;
        this.responded = false;
        this.timerInterval = null;
        this._keyHandler = null;
        // Auth / score callback
        this.user = null;
        this.onGameOver = null;
    }

    async init(opts = {}) {
        this.user = opts.user || null;
        this.onGameOver = opts.onGameOver || null;
        this.buildUI();
        await this.sound.preloadAll();
        this.showTitleScreen();
    }

    // Shorthand for translations
    t(key) { return GARA_I18N.t(key); }

    // ======== TOKEN HELPERS ========

    _tokenStore() {
        // Auth users: persist across sessions; guests: session-only
        return this.user ? localStorage : sessionStorage;
    }

    getTokens() {
        try {
            const all = JSON.parse(this._tokenStore().getItem('gara_tokens')) || {};
            const key = this.user ? this.user.username : '__guest__';
            return all[key] || 0;
        } catch { return 0; }
    }

    addTokens(count) {
        try {
            const store = this._tokenStore();
            const all = JSON.parse(store.getItem('gara_tokens')) || {};
            const key = this.user ? this.user.username : '__guest__';
            all[key] = (all[key] || 0) + count;
            store.setItem('gara_tokens', JSON.stringify(all));
            return all[key];
        } catch { return 0; }
    }

    buildUI() {
        this.container.innerHTML = `
        <div id="gara-game" class="gara-game">
            <div id="gara-screen" class="gara-screen">
                <canvas id="gara-canvas" width="800" height="600"></canvas>
                <div id="gara-overlay" class="gara-overlay"></div>
            </div>
            <div class="gara-controls">
                <button id="gara-mute"   class="gara-btn-ctrl" title="${this.t('toggleSound')}">🔊</button>
                <button id="gara-music"  class="gara-btn-ctrl" title="${this.t('toggleMusic')}">🎵</button>
                <button id="gara-help"   class="gara-btn-ctrl" title="${this.t('howToPlay')}">❓</button>
                <button id="gara-lang"   class="gara-btn-ctrl" title="Language">
                    ${GARA_I18N.currentLang === 'it' ? '🇮🇹' : '🇬🇧'}
                </button>
                <button id="gara-fs"     class="gara-btn-ctrl" title="${this.t('fullscreen')}">⛶</button>
            </div>
        </div>`;

        this.canvas  = document.getElementById('gara-canvas');
        this.ctx     = this.canvas.getContext('2d');
        this.overlay = document.getElementById('gara-overlay');

        document.getElementById('gara-mute').onclick = () => {
            const m = this.sound.toggleMute();
            document.getElementById('gara-mute').textContent = m ? '🔇' : '🔊';
        };
        document.getElementById('gara-music').onclick = () => {
            const m = this.sound.toggleMusic();
            document.getElementById('gara-music').textContent = m ? '🔕' : '🎵';
        };
        document.getElementById('gara-help').onclick = () => this.showInstructions();
        document.getElementById('gara-lang').onclick = () => {
            const next = GARA_I18N.currentLang === 'it' ? 'en' : 'it';
            GARA_I18N.setLang(next);
            document.getElementById('gara-lang').textContent = next === 'it' ? '🇮🇹' : '🇬🇧';
            // Re-render current screen in new language
            if (this.state === 'title')       this.showTitleScreen();
            else if (this.state === 'themeChoice') this.showThemeChoice();
            else if (this.state === 'characChoice') this.showCharacterChoice();
        };
        document.getElementById('gara-fs').onclick = () => {
            const el = document.getElementById('gara-game');
            if (document.fullscreenElement) document.exitFullscreen();
            else el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
        };
    }

    loadImage(src) {
        return new Promise((resolve) => {
            if (this.images[src]) { resolve(this.images[src]); return; }
            const img = new Image();
            img.onload  = () => { this.images[src] = img; resolve(img); };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }

    async preloadThemeImages(themeKey) {
        const t = GARA_CONFIG.THEMES[themeKey];
        const paths = [t.bg, t.gameOver, t.instrucs, t.characBg, t.rewardBg];
        t.characters.forEach(c => {
            c.imgs.forEach(i => paths.push(t.gameBase + i));
            paths.push(t.characBase + c.icon, t.characBase + c.iconSel);
        });
        t.enemies.forEach(e => e.imgs.forEach(i => paths.push(t.gameBase + i)));
        paths.push(t.gameBase + t.chestClosed.left, t.gameBase + t.chestClosed.right);
        paths.push(t.gameBase + t.chestOpen.left,   t.gameBase + t.chestOpen.right);
        paths.push(t.gameBase + t.startMarker, t.gameBase + t.finishMarker);
        GARA_CONFIG.TITLE_PAGES.forEach(p => paths.push(p));
        await Promise.allSettled(paths.map(p => this.loadImage(p)));
    }

    // ======== CLEANUP HELPERS ========

    _cleanupTurn() {
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.responded = false;
    }

    // =================== SCREENS ===================

    showTitleScreen() {
        this._cleanupTurn();
        this.state = 'title';
        this.sound.playMusic('music.intro');
        const titleImg = GARA_CONFIG.TITLE_PAGES[0];
        const lang = GARA_I18N.currentLang;
        this.overlay.innerHTML = `
        <div class="gara-title-screen">
            <div class="gara-title-bg">
                <img src="${titleImg}" alt="${this.t('gameTitle')}" class="gara-title-img"/>
            </div>
            <div class="gara-title-content">
                <h2 class="gara-title-text">${this.t('gameTitle')}</h2>
                <p class="gara-title-sub">${this.t('gameSubtitle')}</p>
                <p class="gara-title-desc">${this.t('gameDesc')}</p>
                <div class="gara-title-actions">
                    <button id="gara-play-btn"     class="gara-btn-primary gara-pulse">${this.t('playBtn')}</button>
                    <button id="gara-tutorial-btn" class="gara-btn-secondary">${this.t('tutorialBtn')}</button>
                </div>
                <div class="gara-level-select">
                    <label>${this.t('levelLabel')}</label>
                    <button class="gara-lvl-btn ${this.level === 1 ? 'active' : ''}" data-level="1">${this.t('levelBase')}</button>
                    <button class="gara-lvl-btn ${this.level >= 7 ? 'active' : ''}" data-level="7">${this.t('levelAdvanced')}</button>
                </div>
                <div class="gara-credits-line">
                    <p>${this.t('creditsLine')}</p>
                </div>
            </div>
        </div>`;
        document.getElementById('gara-play-btn').onclick     = () => this.showThemeChoice();
        document.getElementById('gara-tutorial-btn').onclick = () => this.showInstructions();
        this.overlay.querySelectorAll('.gara-lvl-btn').forEach(btn => {
            btn.onclick = () => {
                this.overlay.querySelectorAll('.gara-lvl-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.level = parseInt(btn.dataset.level);
                this.algo.setLevel(this.level);
            };
        });
    }

    showThemeChoice() {
        this._cleanupTurn();
        this.state = 'themeChoice';
        this.sound.play('help.chooseSide');
        const uw = GARA_CONFIG.THEMES.underwater;
        const jg = GARA_CONFIG.THEMES.jungle;
        const lang = GARA_I18N.currentLang;
        this.overlay.innerHTML = `
        <div class="gara-theme-choice">
            <h2 class="gara-screen-title">${this.t('chooseWorld')}</h2>
            <p class="gara-screen-sub">${this.t('chooseWorldSub')}</p>
            <div class="gara-theme-cards">
                <div class="gara-theme-card" data-theme="underwater">
                    <img src="Assets/Playground_media/gara_dei_numeri/web_assets/images/common/titlePages/underwater300wide.gif" alt="${this.t('underwaterWorld')}"/>
                    <div class="gara-theme-label">
                        <span class="gara-theme-icon">🌊</span>
                        <h3>${lang === 'it' ? uw.nameIt : uw.name}</h3>
                    </div>
                </div>
                <div class="gara-theme-card" data-theme="jungle">
                    <img src="Assets/Playground_media/gara_dei_numeri/web_assets/images/common/titlePages/jungle300wide.gif" alt="${this.t('jungleWorld')}"/>
                    <div class="gara-theme-label">
                        <span class="gara-theme-icon">🌴</span>
                        <h3>${lang === 'it' ? jg.nameIt : jg.name}</h3>
                    </div>
                </div>
            </div>
        </div>`;
        this.overlay.querySelectorAll('.gara-theme-card').forEach(card => {
            card.onclick = async () => {
                this.theme     = card.dataset.theme;
                this.themeData = GARA_CONFIG.THEMES[this.theme];
                card.classList.add('selected');
                this.sound.play('effects.iconClick');
                await this.preloadThemeImages(this.theme);
                setTimeout(() => this.showCharacterChoice(), 400);
            };
        });
    }

    showCharacterChoice() {
        this.state = 'characChoice';
        const t = this.themeData;
        const lang = GARA_I18N.currentLang;
        const tokens = this.getTokens();
        const unlockCosts = GARA_CONFIG.CHAR_UNLOCK;

        let cardsHTML = t.characters.map((c, i) => {
            const needed = unlockCosts[i] || 0;
            const isLocked = tokens < needed;
            return `
            <div class="gara-char-card ${isLocked ? 'gara-char-locked' : ''}" data-idx="${i}" data-locked="${isLocked}">
                <div class="gara-char-img-wrap">
                    <img src="${t.characBase + c.icon}" alt="${c.name}" class="gara-char-img"/>
                    ${isLocked ? `<div class="gara-lock-badge">🔒<span class="gara-lock-cost">${needed}🪙</span></div>` : ''}
                </div>
                <p class="gara-char-name">${lang === 'it' ? (c.nameIt || c.name) : c.name}</p>
            </div>`;
        }).join('');

        const tokenLabel = lang === 'it' ? 'Gettoni' : 'Tokens';
        this.overlay.innerHTML = `
        <div class="gara-char-choice" style="background-image:url('${t.characBg}')">
            <h2 class="gara-screen-title">${this.t('chooseChar')}</h2>
            <p class="gara-screen-sub">${this.t('chooseCharSub')}</p>
            <div class="gara-token-bar"><span class="gara-token-icon">🪙</span>${tokens} ${tokenLabel}</div>
            <div class="gara-char-grid">${cardsHTML}</div>
        </div>`;

        this.overlay.querySelectorAll('.gara-char-card').forEach(card => {
            card.onclick = () => {
                if (card.dataset.locked === 'true') {
                    card.classList.add('gara-char-shake');
                    setTimeout(() => card.classList.remove('gara-char-shake'), 400);
                    return;
                }
                const idx = parseInt(card.dataset.idx);
                this.playerChar = t.characters[idx];
                this.enemyChar  = t.enemies[Math.floor(Math.random() * t.enemies.length)];
                this.sound.play('effects.iconClick');
                card.classList.add('selected');
                this.overlay.querySelectorAll('.gara-char-card').forEach(c => {
                    if (c !== card) c.classList.add('dimmed');
                });
                setTimeout(() => this.startGame(), 600);
            };
        });
    }

    startGame() {
        this._cleanupTurn();
        this.state  = 'playing';
        this.playerPos = 0;
        this.enemyPos  = 0;
        this.turnNum   = 0;
        this.rewardsCollected = [];
        this.gameActive = true;
        this.algo = new GaraAlgorithm();
        this.algo.setLevel(this.level);
        this.generateHazards();
        this.sound.stopMusic();
        this.sound.playMusic('music.bg');
        this.showChoiceScreen();
    }

    generateHazards() {
        this.hazardSquares = new Set();
        const count = 3 + Math.floor(Math.random() * 4);
        while (this.hazardSquares.size < count) {
            const sq = 3 + Math.floor(Math.random() * (GARA_CONFIG.BOARD_SQUARES - 6));
            this.hazardSquares.add(sq);
        }
    }

    showChoiceScreen() {
        this._cleanupTurn();

        if (!this.gameActive) return;
        this.turnNum++;

        if (this.turnNum > GARA_CONFIG.TURNS_PER_GAME ||
            this.playerPos >= GARA_CONFIG.BOARD_SQUARES ||
            this.enemyPos  >= GARA_CONFIG.BOARD_SQUARES) {
            this.showGameOver();
            return;
        }

        this.currentTurn = this.algo.generateTurn();
        const turn = this.currentTurn;
        const t    = this.themeData;

        const renderStimulus = (stim, side) => {
            if (stim.type === 'sum') {
                return `<div class="gara-stim gara-stim-sum">
                    <div class="gara-chest-wrapper">
                        <img src="${t.gameBase + t.chestClosed[side]}" class="gara-chest-img" alt="chest"/>
                        <div class="gara-sum-display">${stim.a} + ${stim.b}</div>
                    </div>
                </div>`;
            }
            if (stim.type === 'arabic' || stim.type === 'digits') {
                return `<div class="gara-stim gara-stim-num">
                    <div class="gara-chest-wrapper">
                        <img src="${t.gameBase + t.chestClosed[side]}" class="gara-chest-img" alt="chest"/>
                        <div class="gara-num-display">${stim.value}</div>
                    </div>
                    ${stim.type === 'digits' && stim.dots ? `<div class="gara-dots-mini">${stim.dots.map(d =>
                        `<div class="gara-dot" style="left:${d.x}px;top:${d.y}px;width:${d.size}px;height:${d.size}px;background:${d.color}"></div>`
                    ).join('')}</div>` : ''}
                </div>`;
            }
            return `<div class="gara-stim gara-stim-dots">
                <div class="gara-chest-wrapper">
                    <img src="${t.gameBase + t.chestClosed[side]}" class="gara-chest-img" alt="chest"/>
                    <div class="gara-dots-area">${(stim.dots || []).map(d =>
                        `<div class="gara-dot" style="left:${d.x}px;top:${d.y}px;width:${d.size}px;height:${d.size}px;background:${d.color}"></div>`
                    ).join('')}</div>
                </div>
            </div>`;
        };

        this.animFrame++;
        const playerImg = t.gameBase + this.playerChar.imgs[this.animFrame % 2];
        const enemyImg  = t.gameBase + this.enemyChar.imgs[this.animFrame % 2];
        const sq = this.t('squareAbbr');
        const tn = this.t('turnLabel');

        this.overlay.innerHTML = `
        <div class="gara-choice-screen" style="background-image:url('${t.bg}')">
            <div class="gara-hud">
                <div class="gara-hud-player">
                    <img src="${playerImg}" class="gara-hud-sprite"/>
                    <span>${sq} ${this.playerPos}/${GARA_CONFIG.BOARD_SQUARES}</span>
                </div>
                <div class="gara-hud-turn">${tn} ${this.turnNum}/${GARA_CONFIG.TURNS_PER_GAME}</div>
                <div class="gara-hud-enemy">
                    <img src="${enemyImg}" class="gara-hud-sprite"/>
                    <span>${sq} ${this.enemyPos}/${GARA_CONFIG.BOARD_SQUARES}</span>
                </div>
            </div>
            <div class="gara-prompt">
                <p>${this.t('promptMore')}</p>
            </div>
            <div class="gara-choices">
                <div class="gara-choice-side" data-side="left"  id="gara-left-choice">
                    ${renderStimulus(turn.left,  'left')}
                </div>
                <div class="gara-vs">${this.t('vsLabel')}</div>
                <div class="gara-choice-side" data-side="right" id="gara-right-choice">
                    ${renderStimulus(turn.right, 'right')}
                </div>
            </div>
            <div class="gara-timer-bar"><div class="gara-timer-fill" id="gara-timer"></div></div>
            <div class="gara-board-peek" id="gara-board-peek">
                <button class="gara-btn-small" id="gara-show-board">${this.t('boardBtn')}</button>
            </div>
        </div>`;

        const respond = (side) => {
            if (this.responded) return;
            this.responded = true;
            if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
            if (this._keyHandler)   { document.removeEventListener('keydown', this._keyHandler); this._keyHandler = null; }
            this.processAnswer(side === turn.correctSide, side);
        };

        document.getElementById('gara-left-choice').onclick  = () => respond('left');
        document.getElementById('gara-right-choice').onclick = () => respond('right');
        document.getElementById('gara-show-board').onclick   = () => {
            if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
            this._boardPauseTime = Date.now();
            this.showBoardScreen();
        };

        this._keyHandler = (e) => {
            if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') respond('left');
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') respond('right');
        };
        document.addEventListener('keydown', this._keyHandler);

        const timerEl = document.getElementById('gara-timer');
        const deadline = turn.deadline;
        const start    = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - start;
            const pct     = Math.min(100, (elapsed / deadline) * 100);
            if (timerEl) {
                timerEl.style.width = pct + '%';
                if (pct > 80)      timerEl.style.background = '#e74c3c';
                else if (pct > 50) timerEl.style.background = '#f39c12';
                else               timerEl.style.background = '#2ecc71';
            }
            if (elapsed >= deadline && !this.responded) {
                respond(turn.correctSide === 'left' ? 'right' : 'left');
            }
        }, 50);
    }

    processAnswer(correct, side) {
        const turn     = this.currentTurn;
        const movement = this.algo.processResponse(correct, turn);
        const chosenEl = document.getElementById(side === 'left' ? 'gara-left-choice' : 'gara-right-choice');

        if (correct) {
            chosenEl.classList.add('gara-correct');
            this.sound.play('effects.right');
            this.playerPos = Math.min(GARA_CONFIG.BOARD_SQUARES, this.playerPos + movement.playerMove);
            this.enemyPos  = Math.min(GARA_CONFIG.BOARD_SQUARES, this.enemyPos  + movement.enemyMove);
        } else {
            chosenEl.classList.add('gara-wrong');
            this.sound.play('effects.wrong1');
            this.enemyPos = Math.min(GARA_CONFIG.BOARD_SQUARES, this.enemyPos + movement.enemyMove);
        }

        const t = this.themeData;
        const correctSideEl = document.getElementById(turn.correctSide === 'left' ? 'gara-left-choice' : 'gara-right-choice');
        const chestImg = correctSideEl?.querySelector('.gara-chest-img');
        if (chestImg) chestImg.src = t.gameBase + t.chestOpen[turn.correctSide];
        this.sound.play('effects.chestOpen');

        const feedbackEl = document.createElement('div');
        feedbackEl.className = `gara-feedback ${correct ? 'gara-fb-correct' : 'gara-fb-wrong'}`;
        feedbackEl.innerHTML = correct
            ? this.t('correctSquares').replace('{n}', movement.playerMove)
            : this.t('tryAgain');
        this.overlay.querySelector('.gara-choice-screen')?.appendChild(feedbackEl);

        if (this.hazardSquares.has(this.playerPos)) {
            this.playerPos = Math.max(0, this.playerPos - 2);
            setTimeout(() => this.sound.play('effects.wrong2'), 300);
        }

        if (correct && this.playerPos > 0 && this.playerPos % 7 === 0 && this.rewardsCollected.length < 7) {
            setTimeout(() => this.showRewardScreen(), 1100);
            return;
        }

        setTimeout(() => this.showChoiceScreen(), 1200);
    }

    showBoardScreen() {
        const t       = this.themeData;
        const totalSq = GARA_CONFIG.BOARD_SQUARES;
        const cols = 10, rows = Math.ceil(totalSq / cols);
        let boardHTML = '';
        for (let r = 0; r < rows; r++) {
            let rowHTML = '';
            for (let c = 0; c < cols; c++) {
                const sq = r * cols + c;
                if (sq >= totalSq) break;
                let cls = 'gara-sq';
                if (sq === 0)          cls += ' gara-sq-start';
                if (sq === totalSq -1) cls += ' gara-sq-finish';
                if (this.hazardSquares.has(sq)) cls += ' gara-sq-hazard';
                let content = '';
                if (sq === this.playerPos) content += '<div class="gara-sq-player">🟢</div>';
                if (sq === this.enemyPos)  content += '<div class="gara-sq-enemy">🔴</div>';
                rowHTML += `<div class="${cls}" title="${this.t('squareAbbr')} ${sq}">${sq}${content}</div>`;
            }
            boardHTML += `<div class="gara-board-row">${rowHTML}</div>`;
        }
        this.overlay.innerHTML = `
        <div class="gara-board-screen" style="background:${t.boardColor}">
            <h2 class="gara-screen-title" style="color:white">${this.t('boardTitle')}</h2>
            <div class="gara-board-grid">${boardHTML}</div>
            <div class="gara-board-legend">
                <span>🟢 ${this.t('youLabel')} (${this.t('squareAbbr')} ${this.playerPos})</span>
                <span>🔴 ${this.t('opponentLabel')} (${this.t('squareAbbr')} ${this.enemyPos})</span>
                <span class="gara-legend-hazard">${this.t('trapLabel')}</span>
            </div>
            <button class="gara-btn-primary" id="gara-back-choice">${this.t('backToRace')}</button>
        </div>`;
        document.getElementById('gara-back-choice').onclick = () => {
            this.turnNum--;
            this.algo.turnCount--;
            this.showChoiceScreen();
        };
    }

    showRewardScreen() {
        this._cleanupTurn();
        const t        = this.themeData;
        const rewardIdx = this.rewardsCollected.length;
        if (rewardIdx >= t.rewards.length) { this.showChoiceScreen(); return; }
        const reward = t.rewards[rewardIdx];
        this.rewardsCollected.push(reward);
        this.sound.stopMusic();
        this.sound.playMusic('music.rewardMusic');
        this.sound.play('effects.cheer');
        this.overlay.innerHTML = `
        <div class="gara-reward-screen" style="background-image:url('${t.rewardBg}')">
            <h2 class="gara-screen-title gara-reward-title">${this.t('rescuedAnimal')}</h2>
            <div class="gara-reward-animal">
                <img src="${t.rewardBase + reward.left}" class="gara-reward-img gara-bounce" alt="reward"/>
            </div>
            <p class="gara-reward-count">${this.t('animalsRescued')} ${this.rewardsCollected.length}/7</p>
            <div class="gara-reward-collection">${this.rewardsCollected.map(r =>
                `<img src="${t.rewardBase + r.left}" class="gara-reward-mini"/>`
            ).join('')}</div>
            <button class="gara-btn-primary" id="gara-continue">${this.t('continueRacing')}</button>
        </div>`;
        document.getElementById('gara-continue').onclick = () => {
            this.sound.stopMusic();
            this.sound.playMusic('music.bg');
            this.showChoiceScreen();
        };
    }

    showGameOver() {
        this._cleanupTurn();
        this.gameActive = false;
        this.sound.stopMusic();
        const won = this.playerPos >= this.enemyPos;
        const t   = this.themeData;
        if (won) { this.sound.play('gameOver.youWin'); this.sound.play('effects.cheer'); }
        else       this.sound.play('gameOver.noLuck');
        const pct = Math.round(this.algo.meanSuccess * 100);

        // Award Gold Tokens: 1 base + 2 for win + 1 for accuracy >= 70% + 1 per 2 animals rescued
        const tokensEarned = 1 + (won ? 2 : 0) + (pct >= 70 ? 1 : 0) + Math.floor(this.rewardsCollected.length / 2);
        const newTokenTotal = this.addTokens(tokensEarned);
        const lang = GARA_I18N.currentLang;
        const tokenLabel = lang === 'it'
            ? `+${tokensEarned} gettoni guadagnati 🪙 (totale: ${newTokenTotal})`
            : `+${tokensEarned} tokens earned 🪙 (total: ${newTokenTotal})`;

        // Fire score callback for authenticated users
        if (typeof this.onGameOver === 'function') {
            this.onGameOver({
                won,
                playerPos: this.playerPos,
                enemyPos:  this.enemyPos,
                accuracy:  pct,
                rescued:   this.rewardsCollected.length,
                tokens:    tokensEarned,
                level:     this.level,
                lang:      GARA_I18N.currentLang,
                timestamp: Date.now()
            });
        }

        this.overlay.innerHTML = `
        <div class="gara-gameover" style="background-image:url('${t.gameOver}')">
            <div class="gara-gameover-content">
                <h2 class="gara-gameover-title">${this.t(won ? 'youWin' : 'gameOver')}</h2>
                <div class="gara-gameover-stats">
                    <div class="gara-stat"><span class="gara-stat-val">${this.playerPos}</span><span class="gara-stat-lbl">${this.t('yourPosition')}</span></div>
                    <div class="gara-stat"><span class="gara-stat-val">${this.enemyPos}</span><span class="gara-stat-lbl">${this.t('opponent')}</span></div>
                    <div class="gara-stat"><span class="gara-stat-val">${pct}%</span><span class="gara-stat-lbl">${this.t('accuracy')}</span></div>
                    <div class="gara-stat"><span class="gara-stat-val">${this.rewardsCollected.length}</span><span class="gara-stat-lbl">${this.t('rescued')}</span></div>
                </div>
                ${this.rewardsCollected.length > 0 ? `<div class="gara-reward-collection">${this.rewardsCollected.map(r =>
                    `<img src="${t.rewardBase + r.left}" class="gara-reward-mini"/>`
                ).join('')}</div>` : ''}
                <div class="gara-tokens-earned">🪙 ${tokenLabel}</div>
                <div class="gara-gameover-actions">
                    <button class="gara-btn-primary"   id="gara-replay">${this.t('playAgain')}</button>
                    <button class="gara-btn-secondary" id="gara-menu">${this.t('mainMenu')}</button>
                </div>
                <div class="gara-credits-footer">
                    <p>${this.t('creditsFooter')}<br>${this.t('creditsFooter2')}</p>
                </div>
            </div>
        </div>`;
        document.getElementById('gara-replay').onclick = () => this.startGame();
        document.getElementById('gara-menu').onclick   = () => this.showTitleScreen();
    }

    showInstructions() {
        this._cleanupTurn();
        const prevState = this.state;
        const steps = [
            { icon: '🎯', title: this.t('instrGoalTitle'),    text: this.t('instrGoalText') },
            { icon: '👆', title: this.t('instrChooseTitle'),  text: this.t('instrChooseText') },
            { icon: '🏃', title: this.t('instrMoveTitle'),    text: this.t('instrMoveText') },
            { icon: '⚠️', title: this.t('instrTrapTitle'),    text: this.t('instrTrapText') },
            { icon: '🦋', title: this.t('instrRescueTitle'),  text: this.t('instrRescueText') },
            { icon: '🧠', title: this.t('instrAdaptTitle'),   text: this.t('instrAdaptText') },
        ];
        const stepsHTML = steps.map((s, i) => `
            <div class="gara-instr-step ${i === 0 ? 'active' : ''}" data-step="${i}">
                <div class="gara-instr-icon">${s.icon}</div>
                <h3>${s.title}</h3>
                <p>${s.text}</p>
            </div>`).join('');
        this.overlay.innerHTML = `
        <div class="gara-instructions">
            <div class="gara-instr-modal">
                <button class="gara-instr-close" id="gara-instr-close">✕</button>
                <div class="gara-instr-steps">${stepsHTML}</div>
                <div class="gara-instr-nav">
                    <button class="gara-btn-small" id="gara-instr-prev" disabled>${this.t('instrPrev')}</button>
                    <div class="gara-instr-dots" id="gara-instr-dots"></div>
                    <button class="gara-btn-small" id="gara-instr-next">${this.t('instrNext')}</button>
                </div>
            </div>
        </div>`;
        let currentStep = 0;
        const totalSteps = steps.length;
        const updateStep = () => {
            this.overlay.querySelectorAll('.gara-instr-step').forEach((s, i) =>
                s.classList.toggle('active', i === currentStep));
            document.getElementById('gara-instr-prev').disabled = currentStep === 0;
            document.getElementById('gara-instr-next').textContent =
                currentStep === totalSteps - 1 ? this.t('instrDone') : this.t('instrNext');
            document.getElementById('gara-instr-dots').innerHTML =
                Array.from({length: totalSteps}, (_, i) =>
                    `<span class="gara-dot-nav ${i === currentStep ? 'active' : ''}"></span>`).join('');
        };
        updateStep();
        document.getElementById('gara-instr-prev').onclick = () => {
            if (currentStep > 0) { currentStep--; updateStep(); }
        };
        document.getElementById('gara-instr-next').onclick = () => {
            if (currentStep < totalSteps - 1) { currentStep++; updateStep(); }
            else this.closeInstructions(prevState);
        };
        document.getElementById('gara-instr-close').onclick = () => this.closeInstructions(prevState);
    }

    closeInstructions(prevState) {
        if (prevState === 'playing') {
            this.turnNum--;
            this.algo.turnCount--;
            this.showChoiceScreen();
        } else {
            this.showTitleScreen();
        }
    }
}
