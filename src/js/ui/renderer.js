// ========================================
// UI RENDERER - Reino em Conflito Remaster
// Connects game engine to DOM
// ========================================

import { floatingNumber, shakeElement, instabilityWarning, applySeason, showAIThinking, removeAIThinking } from './effects.js';

export default class Renderer {
    constructor() {
        this.elements = {};
        this.prevStats = { p1: {}, p2: {} };
    }

    cacheElements() {
        const ids = [
            'p1-avatar', 'p1-name', 'p1-coins', 'p1-coins-fill', 'p1-army', 'p1-army-fill',
            'p1-food', 'p1-food-fill', 'p1-influence', 'p1-influence-fill',
            'p1-instability', 'p1-instability-fill', 'p1-briks', 'p1-ap',
            'p1-cooldown', 'p1-ult-fill', 'p1-status', 'p1-buildings',
            'p2-avatar', 'p2-name', 'p2-coins', 'p2-coins-fill', 'p2-army', 'p2-army-fill',
            'p2-food', 'p2-food-fill', 'p2-influence', 'p2-influence-fill',
            'p2-instability', 'p2-instability-fill', 'p2-briks', 'p2-ap',
            'p2-ult-fill', 'p2-status',
            'season-badge', 'turn-counter', 'turn-indicator',
            'market-cards', 'log-messages',
            'btn-mine', 'btn-recruit', 'btn-fortify', 'btn-war',
            'btn-special', 'btn-endturn', 'btn-ultimate',
            'panel-p1', 'panel-p2',
            'event-overlay', 'event-title', 'event-desc',
            'btn-choice-a', 'btn-choice-b',
            'gameover-overlay', 'gameover-title', 'gameover-reason', 'gameover-stats',
            'character-grid', 'char-preview',
        ];
        ids.forEach(id => { this.elements[id] = document.getElementById(id); });
    }

    el(id) { return this.elements[id] || document.getElementById(id); }

    // ===== SCREEN MANAGEMENT =====
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
    }

    // ===== CHARACTER SELECTION =====
    renderCharacterSelect(characters, onSelect) {
        const grid = this.el('character-grid');
        if (!grid) return;
        grid.innerHTML = '';
        characters.forEach(char => {
            const card = document.createElement('div');
            card.className = 'char-card';
            card.dataset.charId = char.id;
            card.innerHTML = `
                <div class="char-avatar" style="background-image:url('${char.image}')"></div>
                <div class="char-name">${char.name}</div>
                <div class="char-stats-mini">
                    <span>&#x1FA99;${char.initial.coins}</span>
                    <span>&#9876;${char.initial.army}</span>
                </div>
                <div class="char-passive">${char.passive || ''}</div>
            `;
            card.addEventListener('click', () => {
                grid.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                onSelect(char);
            });
            grid.appendChild(card);
        });
    }

    showCharPreview(char) {
        const preview = this.el('char-preview');
        if (!preview || !char) return;
        preview.innerHTML = `
            <strong>${char.name}</strong> — ${char.passive || 'Sem passiva'}
            <br><small>Moedas: ${char.initial.coins} | Exercito: ${char.initial.army} | Comida: ${char.initial.food} | Influencia: ${char.initial.influence}</small>
        `;
    }

    // ===== GAME STATE RENDERING =====
    updatePlayer(playerNum, player, constants) {
        const p = `p${playerNum}`;
        const maxArmy = 20;
        const maxResource = 30;
        const maxInstability = constants.INSTABILITY_LIMIT;

        // Stats with bars
        const stats = [
            { key: 'coins', max: maxResource, color: '#f1c40f' },
            { key: 'army', max: maxArmy, color: '#27ae60' },
            { key: 'food', max: maxResource, color: '#e67e22' },
            { key: 'influence', max: maxResource, color: '#3498db' },
            { key: 'instability', max: maxInstability, color: '#e74c3c' },
        ];

        stats.forEach(stat => {
            const val = player[stat.key] || 0;
            const prev = this.prevStats[p][stat.key];
            const fill = this.el(`${p}-${stat.key}-fill`);
            const valEl = this.el(`${p}-${stat.key}`);

            if (fill) fill.style.width = `${Math.min(100, (val / stat.max) * 100)}%`;
            if (valEl) valEl.textContent = Math.floor(val);

            // Floating number on change
            if (prev !== undefined && prev !== val && valEl) {
                const diff = val - prev;
                floatingNumber(valEl, diff > 0 ? `+${diff}` : diff, diff > 0 ? stat.color : '#e74c3c');
            }
            this.prevStats[p][stat.key] = val;
        });

        // Extras
        const briks = this.el(`${p}-briks`);
        if (briks) briks.textContent = player.briks || 0;
        const ap = this.el(`${p}-ap`);
        if (ap) ap.textContent = player.ap || 0;
        const cd = this.el(`${p}-cooldown`);
        if (cd) cd.textContent = player.mineCooldown || 0;

        // Ultimate
        const ultFill = this.el(`${p}-ult-fill`);
        if (ultFill) {
            const pct = ((player.ultimateCharge || 0) / constants.ULTIMATE_CHARGE_MAX) * 100;
            ultFill.style.width = `${pct}%`;
            const bar = ultFill.parentElement;
            if (pct >= 100) bar.classList.add('ready');
            else bar.classList.remove('ready');
        }

        // Status tokens
        const statusEl = this.el(`${p}-status`);
        if (statusEl && player.status) {
            statusEl.innerHTML = '';
            player.status.forEach(s => {
                const def = constants.STATUS_DEFINITIONS ? constants.STATUS_DEFINITIONS[s] : null;
                if (!def) return;
                const token = document.createElement('span');
                token.className = `status-token status-${def.type}`;
                token.title = def.desc;
                token.textContent = `${def.icon} ${def.name}`;
                statusEl.appendChild(token);
            });
        }

        // Instability warning
        const panel = this.el(`panel-${p}`);
        instabilityWarning(panel, player.instability || 0);
    }

    updateTurnIndicator(currentPlayer, turnCount, p1Name, p2Name) {
        const indicator = this.el('turn-indicator');
        const counter = this.el('turn-counter');
        if (indicator) {
            indicator.textContent = currentPlayer === 1 ? 'Sua vez' : 'Vez da IA';
            indicator.style.color = currentPlayer === 1 ? '#f1c40f' : '#e74c3c';
        }
        if (counter) counter.textContent = `Turno ${turnCount}`;

        // Active panel highlight
        const p1 = this.el('panel-p1');
        const p2 = this.el('panel-p2');
        if (p1) p1.classList.toggle('active-turn', currentPlayer === 1);
        if (p2) p2.classList.toggle('active-turn', currentPlayer === 2);
    }

    updateSeason(season) {
        const badge = this.el('season-badge');
        if (badge) badge.textContent = season;
        applySeason(season);
    }

    // ===== ACTION BUTTONS =====
    updateButtons(state) {
        const p = state.currentPlayer === 1 ? state.player : state.opponent;
        const isP1 = state.currentPlayer === 1;
        const constants = state.constants;

        this.el('btn-mine').disabled = !isP1 || p.ap < 1 || p.mineCooldown > 0;
        this.el('btn-recruit').disabled = !isP1 || p.ap < 1 || p.coins < (state.recruitCost || 3) || p.food < 3;
        this.el('btn-fortify').disabled = !isP1 || p.ap < 1 || p.coins < (state.fortifyCost || 4) || p.influence < 2;
        this.el('btn-war').disabled = !isP1 || p.ap < 1 || p.army < constants.WAR_ARMY_BASE_ATTACK;
        this.el('btn-special').disabled = !isP1 || p.ap < 1 || !state.hasSpecialAbility;
        this.el('btn-endturn').disabled = !isP1;

        const ultBtn = this.el('btn-ultimate');
        if (ultBtn) {
            ultBtn.disabled = !isP1 || (p.ultimateCharge || 0) < constants.ULTIMATE_CHARGE_MAX;
        }
    }

    // ===== MARKET =====
    renderMarket(cards, player, calculateCostFn, onBuy) {
        const container = this.el('market-cards');
        if (!container) return;
        container.innerHTML = '';

        cards.forEach((card, index) => {
            const cost = calculateCostFn ? calculateCostFn(card) : card.cost;
            const canAfford = player.coins >= cost && player.ap >= 1;

            const el = document.createElement('div');
            el.className = `market-card ${!canAfford ? 'card-disabled' : ''}`;
            el.style.borderColor = card.color || '';
            el.innerHTML = `
                <div class="card-art" style="background-image:url('${card.image}')"></div>
                <div class="card-name">${card.name}</div>
                <div class="card-type card-type-${card.type}">${card.type}</div>
                <div class="card-desc">${card.desc}</div>
                <div class="card-cost">&#x1FA99; ${cost}</div>
            `;
            if (canAfford) {
                el.addEventListener('click', () => onBuy(index, cost));
            }
            container.appendChild(el);
        });
    }

    // ===== LOG =====
    log(message, className = '') {
        const container = this.el('log-messages');
        if (!container) return;
        const p = document.createElement('p');
        if (className) p.className = className;
        p.innerHTML = message;
        container.prepend(p);
        while (container.children.length > 50) container.removeChild(container.lastChild);
    }

    // ===== EVENTS =====
    showEvent(event, onChoose) {
        const overlay = this.el('event-overlay');
        if (!overlay) return;
        this.el('event-title').textContent = event.name;
        this.el('event-desc').textContent = event.prompt;
        this.el('btn-choice-a').textContent = event.choiceA.label;
        this.el('btn-choice-b').textContent = event.choiceB.label;
        this.el('btn-choice-a').onclick = () => { overlay.style.display = 'none'; onChoose('A'); };
        this.el('btn-choice-b').onclick = () => { overlay.style.display = 'none'; onChoose('B'); };
        overlay.style.display = 'flex';
    }

    hideEvent() {
        const overlay = this.el('event-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    // ===== GAME OVER =====
    showGameOver(winner, reason, isPlayerWin) {
        const overlay = this.el('gameover-overlay');
        if (!overlay) return;
        const title = this.el('gameover-title');
        title.textContent = isPlayerWin ? 'VITORIA!' : 'DERROTA';
        title.className = `gameover-title ${isPlayerWin ? 'win' : 'lose'}`;
        this.el('gameover-reason').textContent = reason;
        overlay.style.display = 'flex';
    }

    hideGameOver() {
        const overlay = this.el('gameover-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    // ===== SETUP PLAYER VISUALS =====
    setupPlayer(playerNum, name, image) {
        const p = `p${playerNum}`;
        const avatar = this.el(`${p}-avatar`);
        if (avatar) avatar.style.backgroundImage = `url('${image}')`;
        const nameEl = this.el(`${p}-name`);
        if (nameEl) nameEl.textContent = name;
    }

    // ===== AI =====
    showAIAction(text) {
        const center = document.querySelector('.game-center');
        if (center) showAIThinking(center, text);
    }

    hideAIAction() { removeAIThinking(); }

    // ===== BUILDINGS =====
    renderBuildings(playerNum, buildings, allBuildings) {
        const container = this.el(`p${playerNum}-buildings`);
        if (!container) return;
        container.innerHTML = '';
        allBuildings.forEach(b => {
            const badge = document.createElement('span');
            badge.className = `building-badge ${buildings.includes(b.id) ? 'built' : ''}`;
            badge.textContent = b.icon;
            badge.title = `${b.name}: ${b.effect}`;
            container.appendChild(badge);
        });
    }

    // ===== RANKS =====
    renderRanks(currentMMR) {
        const container = document.getElementById('ranks-display');
        if (!container) return;
        const ranks = [
            { name: 'Recruta', icon: '&#x1FAB5;', min: 0, max: 99 },
            { name: 'Bronze', icon: '&#x1F949;', min: 100, max: 299 },
            { name: 'Prata', icon: '&#x1F948;', min: 300, max: 499 },
            { name: 'Ouro', icon: '&#x1F947;', min: 500, max: 799 },
            { name: 'Mestre do Reino', icon: '&#x1F451;', min: 800, max: 9999 },
        ];
        container.innerHTML = '';
        ranks.forEach(r => {
            const isCurrent = currentMMR >= r.min && currentMMR <= r.max;
            container.innerHTML += `
                <div class="rank-card ${isCurrent ? 'current' : ''}">
                    <span class="rank-icon">${r.icon}</span>
                    <div class="rank-info">
                        <div class="rank-name">${r.name}</div>
                        <div class="rank-range">${r.min} — ${r.max === 9999 ? '...' : r.max} pts</div>
                    </div>
                    ${isCurrent ? `<span class="rank-mmr">${currentMMR}</span>` : ''}
                </div>
            `;
        });
    }
}
