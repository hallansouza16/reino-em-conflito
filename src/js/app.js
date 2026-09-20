// ========================================
// APP.JS - Reino em Conflito Remaster
// Main entry: wires engine + renderer + audio
// ========================================

import { GAME_CONSTANTS, CHARACTERS, CARDS, BUILDINGS, STATUS_DEFINITIONS } from './engine/constants.js';
import { GameState } from './engine/state.js';
import { AI_CHARACTERS, aiTurn } from './engine/ai.js';
import { resolveAutoCombat } from './engine/combat.js';
import Renderer from './ui/renderer.js';
import AudioSystem from './ui/audio.js';
import RankSystem from './ui/ranks.js';
import { shakeElement } from './ui/effects.js';

// ===== GLOBALS =====
const game = new GameState();
const renderer = new Renderer();
const audio = new AudioSystem();
const ranks = new RankSystem();

let selectedCharacter = null;
let isMuted = false;
let settingsOpen = false;
let pendingEvent = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    renderer.cacheElements();
    setupMenuListeners();
    setupGameListeners();
    setupEngineListeners();
    setupSettingsListeners();
    renderer.showScreen('screen-menu');
});

// ===== MENU =====
function setupMenuListeners() {
    document.getElementById('btn-play').addEventListener('click', () => {
        renderer.showScreen('screen-select');
        renderer.renderCharacterSelect(CHARACTERS, onCharacterSelect);
        audio.playClick();
    });

    document.getElementById('btn-tutorial').addEventListener('click', () => {
        renderer.showScreen('screen-tutorial');
        audio.playClick();
    });

    document.getElementById('btn-ranks').addEventListener('click', () => {
        renderer.showScreen('screen-ranks');
        renderer.renderRanks(ranks.getMMR());
        audio.playClick();
    });

    document.getElementById('btn-back-menu').addEventListener('click', () => {
        renderer.showScreen('screen-menu');
        audio.playClick();
    });
    document.getElementById('btn-back-tutorial').addEventListener('click', () => {
        renderer.showScreen('screen-menu');
        audio.playClick();
    });
    document.getElementById('btn-back-ranks').addEventListener('click', () => {
        renderer.showScreen('screen-menu');
        audio.playClick();
    });
}

function onCharacterSelect(char) {
    selectedCharacter = char;
    renderer.showCharPreview(char);
    document.getElementById('btn-start').disabled = false;
    audio.playClick();
}

// ===== GAME LISTENERS =====
function setupGameListeners() {
    document.getElementById('btn-start').addEventListener('click', startGame);

    document.getElementById('btn-mine').addEventListener('click', () => {
        const result = game.mineAction(game.getPlayer());
        if (result && result.success) { audio.playMine(); refreshUI(); }
    });

    document.getElementById('btn-recruit').addEventListener('click', () => {
        const result = game.recruitAction(game.getPlayer());
        if (result && result.success) { audio.playRecruit(); refreshUI(); }
    });

    document.getElementById('btn-fortify').addEventListener('click', () => {
        const result = game.fortifyAction(game.getPlayer());
        if (result && result.success) { audio.playFortify(); refreshUI(); }
    });

    document.getElementById('btn-war').addEventListener('click', () => {
        const result = game.warAction(0); // playerIndex 0
        if (result && result.needsCombat) {
            audio.playWar();
            audio.playWarCry();
            shakeElement('panel-p1');
            shakeElement('panel-p2');
            // Auto-resolve combat for now
            const combatResult = resolveAutoCombat(game.getPlayer(), game.getOpponent());
            game.processCombatResults(combatResult, game.getPlayer(), game.getOpponent());
            refreshUI();
        } else if (result && result.success) {
            audio.playWar();
            refreshUI();
        }
    });

    document.getElementById('btn-special').addEventListener('click', () => {
        const player = game.getPlayer();
        if (player.char && player.char.specialAbility) {
            const msg = player.char.specialAbility(player, game.getOpponent());
            if (msg) {
                audio.playCardPlay();
                renderer.log(`Habilidade especial: ${msg}`, 'log-event');
                refreshUI();
            }
        }
    });

    document.getElementById('btn-ultimate').addEventListener('click', () => {
        const result = game.useUltimate(game.getPlayer(), game.getOpponent());
        if (result && result.success) {
            audio.playUltimate();
            shakeElement('panel-p2');
            refreshUI();
        }
    });

    document.getElementById('btn-endturn').addEventListener('click', () => {
        audio.playTurnEnd();

        // Check for event before ending turn
        const event = game.triggerChoiceEvent(game.getPlayer());
        if (event) {
            pendingEvent = event;
            renderer.showEvent(event, (choice) => {
                const choiceKey = choice === 'A' ? 'choiceA' : 'choiceB';
                game.applyEventChoice(game.getPlayer(), event, choiceKey);
                pendingEvent = null;
                doEndTurn();
            });
        } else {
            doEndTurn();
        }
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
        renderer.hideGameOver();
        audio.stopMusic();
        renderer.showScreen('screen-select');
        renderer.renderCharacterSelect(CHARACTERS, onCharacterSelect);
        selectedCharacter = null;
        document.getElementById('btn-start').disabled = true;
    });

    document.getElementById('btn-back-to-menu').addEventListener('click', () => {
        renderer.hideGameOver();
        audio.stopMusic();
        renderer.showScreen('screen-menu');
    });
}

function doEndTurn() {
    game.endTurn();
    refreshUI();

    // If it's now AI's turn
    if (game.turn === 1 && !game.gameOver) {
        runAI();
    }
}

// ===== ENGINE EVENT LISTENERS =====
function setupEngineListeners() {
    game.on('log', (msg) => {
        renderer.log(msg, '');
    });

    game.on('gameOver', (data) => {
        const isPlayerWin = data.winner && data.winner.name === game.getPlayer().name;
        if (isPlayerWin) {
            audio.playVictory();
            ranks.addWin();
        } else {
            audio.playDefeat();
            ranks.addLoss();
        }
        audio.stopMusic();
        setTimeout(() => {
            renderer.showGameOver(
                data.winner ? data.winner.name : 'Ninguem',
                data.reason || '',
                isPlayerWin
            );
        }, 800);
    });

    game.on('achievementUnlocked', (ach) => {
        audio.playAchievement();
        renderer.log(`Conquista desbloqueada: ${ach.name}!`, 'log-event');
    });

    game.on('seasonChanged', (data) => {
        audio.playSeasonChange();
        const season = data.season || data;
        renderer.updateSeason(season);
    });
}

// ===== SETTINGS =====
function setupSettingsListeners() {
    const settingsPanel = document.getElementById('settings-panel');

    document.getElementById('btn-settings').addEventListener('click', () => {
        settingsOpen = !settingsOpen;
        settingsPanel.classList.toggle('open', settingsOpen);
    });

    document.getElementById('btn-close-settings').addEventListener('click', () => {
        settingsOpen = false;
        settingsPanel.classList.remove('open');
    });

    document.getElementById('btn-mute').addEventListener('click', () => {
        isMuted = !isMuted;
        audio.toggleMute();
        document.getElementById('btn-mute').innerHTML = isMuted ? '&#128263;' : '&#9834;';
        if (isMuted) audio.stopMusic();
    });

    document.getElementById('vol-master').addEventListener('input', (e) => {
        audio.setMasterVolume(e.target.value / 100);
    });
    document.getElementById('vol-music').addEventListener('input', (e) => {
        audio.setMusicVolume(e.target.value / 100);
    });
    document.getElementById('vol-sfx').addEventListener('input', (e) => {
        audio.setSfxVolume(e.target.value / 100);
    });
}

// ===== START GAME =====
function startGame() {
    if (!selectedCharacter) return;
    audio.playClick();

    game.initGame(selectedCharacter.id, AI_CHARACTERS);

    const p1 = game.getPlayer();
    const p2 = game.getOpponent();

    renderer.setupPlayer(1, p1.name, selectedCharacter.image);
    renderer.setupPlayer(2, p2.name, p2.char ? p2.char.image : 'assets/images/characters/rei.png');

    renderer.showScreen('screen-game');
    renderer.updateSeason(game.season || 'Primavera');

    if (!isMuted) audio.startMenuMusic();

    renderer.log(`Batalha iniciada! ${p1.name} vs ${p2.name}`, 'log-event');
    refreshUI();
}

// ===== AI TURN =====
function runAI() {
    if (game.gameOver) return;

    renderer.showAIAction('IA pensando...');

    // Simple AI: execute actions with delays
    const p2 = game.getOpponent();
    const p1 = game.getPlayer();
    const actions = [];

    // AI logic: prioritize based on state
    if (p2.instability >= 6 && p2.coins >= 4 && p2.influence >= 2) {
        actions.push({ fn: () => game.fortifyAction(p2), sfx: 'fortify', label: 'IA fortificou' });
    }
    if (p2.mineCooldown === 0 && (p2.food < 10 || p2.coins < 5)) {
        actions.push({ fn: () => game.mineAction(p2), sfx: 'mine', label: 'IA minerou' });
    }
    if (p2.coins >= 3 && p2.food >= 3 && p2.army < 12) {
        actions.push({ fn: () => game.recruitAction(p2), sfx: 'recruit', label: 'IA recrutou' });
    }

    // Try to buy a card
    if (game.market && game.market.length > 0 && p2.coins >= 3) {
        const affordable = game.market
            .map((c, i) => ({ card: c, index: i, cost: game.calculateCost(c.cost, p2, true, c.type) }))
            .filter(c => p2.coins >= c.cost);
        if (affordable.length > 0) {
            const pick = affordable[Math.floor(Math.random() * affordable.length)];
            actions.push({ fn: () => game.buyCard(pick.index, p2), sfx: 'cardBuy', label: 'IA comprou carta' });
        }
    }

    // Limit to 2 actions max (AP)
    const toExecute = actions.slice(0, 2);
    let delay = 600;

    if (toExecute.length === 0) {
        // Nothing to do, just end turn
        setTimeout(() => {
            renderer.hideAIAction();
            doAIEndTurn();
        }, 800);
        return;
    }

    toExecute.forEach((action, i) => {
        setTimeout(() => {
            if (game.gameOver) return;
            const result = action.fn();
            if (result && result.success) {
                if (action.sfx === 'mine') audio.playMine();
                else if (action.sfx === 'recruit') audio.playRecruit();
                else if (action.sfx === 'fortify') audio.playFortify();
                else if (action.sfx === 'cardBuy') audio.playCardBuy();
                renderer.showAIAction(action.label);
            }
            refreshUI();

            if (i === toExecute.length - 1) {
                setTimeout(() => {
                    renderer.hideAIAction();
                    doAIEndTurn();
                }, 600);
            }
        }, delay);
        delay += 700;
    });
}

function doAIEndTurn() {
    if (game.gameOver) return;

    // AI event resolution
    const event = game.triggerChoiceEvent(game.getOpponent());
    if (event) {
        const choiceKey = Math.random() < 0.5 ? 'choiceA' : 'choiceB';
        game.applyEventChoice(game.getOpponent(), event, choiceKey);
    }

    game.endTurn();
    refreshUI();
}

// ===== REFRESH UI =====
function refreshUI() {
    const p1 = game.getPlayer();
    const p2 = game.getOpponent();
    if (!p1 || !p2) return;

    const constants = {
        ...GAME_CONSTANTS,
        STATUS_DEFINITIONS,
        ULTIMATE_CHARGE_MAX: GAME_CONSTANTS.ULTIMATE_CHARGE_MAX
    };

    // Map AP from game.actionPoints to players for display
    const displayP1 = { ...p1, ap: game.turn === 0 ? game.actionPoints : 0 };
    const displayP2 = { ...p2, ap: game.turn === 1 ? game.actionPoints : 0 };

    renderer.updatePlayer(1, displayP1, constants);
    renderer.updatePlayer(2, displayP2, constants);
    renderer.updateTurnIndicator(game.turn === 0 ? 1 : 2, game.round, p1.name, p2.name);

    // Buttons
    const isMyTurn = game.turn === 0;
    const recruitCost = game.calculateCost(GAME_CONSTANTS.RECRUIT_COST_BASE, p1, false, 'recruit');
    const fortifyCost = game.calculateCost(GAME_CONSTANTS.FORTIFY_COST_BASE, p1, false, 'fortify');

    renderer.updateButtons({
        currentPlayer: isMyTurn ? 1 : 2,
        player: { ...p1, ap: game.actionPoints },
        opponent: p2,
        constants: GAME_CONSTANTS,
        recruitCost,
        fortifyCost,
        hasSpecialAbility: selectedCharacter && selectedCharacter.specialAbility
    });

    // Market
    renderer.renderMarket(
        game.market || [],
        { ...p1, ap: game.actionPoints },
        (card) => game.calculateCost(card.cost, p1, true, card.type),
        (index, cost) => {
            const result = game.buyCard(index, p1);
            if (result && result.success) {
                audio.playCardPlay();
                refreshUI();
            }
        }
    );

    // Buildings
    renderer.renderBuildings(1, p1.buildings || [], BUILDINGS);

    // Season
    renderer.updateSeason(game.season);
}
