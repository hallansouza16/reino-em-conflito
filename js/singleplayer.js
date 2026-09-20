import { 
    GAME_CONSTANTS, 
    STATUS_DEFINITIONS, 
    ACHIEVEMENTS, 
    UPGRADES 
} from './shared/constants.js';
import { CHARACTERS } from './shared/characters.js';
import { CARDS } from './shared/cards.js';
import { 
    shuffleArray, 
    playSound, 
    shakeElement, 
    hasStatus, 
    hasUpgrade, 
    addStatus, 
    removeStatus, 
    calculateCost,
    renderCharacterSelection
} from './shared/utils.js';

// Adicione após as outras importações
import CombatSystem from './combat-system.js';

// Usar constantes do módulo
const {
    MINE_COOLDOWN_MAX,
    REBELLION_ARMY_LIMIT,
    INSTABILITY_LIMIT,
    FOOD_UPKEEP_PER_ARMY,
    INFLUENCE_UPKEEP_PER_INSTABILITY,
    RECRUIT_COST_BASE,
    FORTIFY_COST_BASE,
    ACTION_POINTS_MAX,
    MARKET_SLOTS,
    MAX_STAT_DEFAULT,
    MAX_STAT_RESOURCE,
    EVENT_CHANCE,
    WAR_ARMY_BASE_ATTACK
} = GAME_CONSTANTS;

// Variáveis do jogo
let currentPlayer = 1;
let selectedCharacter = null;
let isGameOver = false;
let isGamePaused = false;
let turnCount = 0;
let marketCards = [];
let globalCoins = 10;
let currentSeason = 'Primavera'; // Primavera, Verão, Outono, Inverno
let turnsInSeason = 0;

// Players
const player = {
    coins: 0, army: 0, instability: 0, food: 15, influence: 10, briks: 0, ap: ACTION_POINTS_MAX, 
    mineCooldown: 0, name: 'Jogador 1', charName: '', passives: {}, playerNumber: 1, status: [], 
    winCount: 0, totalCoinsEarned: 0, upgrades: [], buildings: [], ultimateCharge: 0
};

const opponent = {
    coins: 10, army: 10, instability: 0, food: 15, influence: 10, briks: 0, ap: ACTION_POINTS_MAX, 
    mineCooldown: 0, name: 'Oponente (IA)', playerNumber: 2, status: [], buildings: [], ultimateCharge: 0
};

const p1 = player;
const p2 = opponent;

// Adicione esta linha após as variáveis do jogo
const combatSystem = new CombatSystem();

// ⭐ SISTEMA DE IA BALANCEADA - Cada personagem tem atributos e comportamentos únicos
function getRandomAICharacter() {
    const aiCharacters = [
        { 
            name: 'Rei da IA', 
            image: '/images/characters/rei.png',
            initial: { coins: 12, army: 12, instability: 0, food: 18, influence: 12, briks: 0 },
            behavior: 'balanced', // Comportamento equilibrado
            difficulty: 'medium',
            description: 'Lorde equilibrado com bons recursos iniciais'
        },
        { 
            name: 'Rainha da IA', 
            image: '/images/characters/rainha.png',
            initial: { coins: 15, army: 8, instability: 0, food: 15, influence: 15, briks: 0 },
            behavior: 'economic', // Foca em economia
            difficulty: 'hard',
            description: 'Estrategista econômica com alta influência'
        },
        { 
            name: 'Ferreiro da IA', 
            image: '/images/characters/ferreiro.png',
            initial: { coins: 8, army: 18, instability: 1, food: 20, influence: 8, briks: 0 },
            behavior: 'military', // Foca em exército
            difficulty: 'medium',
            description: 'Mestre militar com grande exército inicial'
        },
        { 
            name: 'Ladrão da IA', 
            image: '/images/characters/ladrão.png',
            initial: { coins: 20, army: 6, instability: 2, food: 12, influence: 8, briks: 0 },
            behavior: 'aggressive', // Joga agressivamente
            difficulty: 'hard',
            description: 'Agressivo com muitas moedas mas instável'
        },
        { 
            name: 'Amante da IA', 
            image: '/images/characters/amante.png',
            initial: { coins: 10, army: 10, instability: 0, food: 16, influence: 18, briks: 0 },
            behavior: 'diplomatic', // Foca em influência
            difficulty: 'medium',
            description: 'Diplomata com alta influência e estabilidade'
        },
        { 
            name: 'Soldado da IA', 
            image: '/images/characters/Soldado.png',
            initial: { coins: 6, army: 22, instability: 0, food: 25, influence: 6, briks: 0 },
            behavior: 'military', // Extremamente militar
            difficulty: 'very_hard',
            description: 'General com enorme exército e suprimentos'
        },
        { 
            name: 'Mestre Programador IA', 
            image: '/images/characters/Mestre Programador.png',
            initial: { coins: 9, army: 9, instability: 0, food: 14, influence: 16, briks: 1 },
            behavior: 'strategic', // Joga com cartas e estratégia
            difficulty: 'hard',
            description: 'Estrategista técnico com bônus inicial'
        },
        { 
            name: 'Princesa IA', 
            image: '/images/characters/Princesa Real.png',
            initial: { coins: 14, army: 7, instability: 0, food: 20, influence: 14, briks: 0 },
            behavior: 'economic', // Foca em recursos
            difficulty: 'medium',
            description: 'Nobre com bons recursos e estabilidade'
        },
        { 
            name: 'Bruxa IA', 
            image: '/images/characters/bruxa.png',
            initial: { coins: 7, army: 8, instability: 1, food: 15, influence: 20, briks: 0 },
            behavior: 'unpredictable', // Comportamento imprevisível
            difficulty: 'very_hard',
            description: 'Misteriosa com alta influência e magia'
        }
    ];
    return aiCharacters[Math.floor(Math.random() * aiCharacters.length)];
}

// ⭐ SISTEMA DE COMPORTAMENTO DA IA BASEADO NO PERSONAGEM
function getAIBehavior(aiCharacter) {
    const behaviors = {
        balanced: {
            minePriority: 0.6,
            recruitPriority: 0.7,
            fortifyPriority: 0.5,
            warPriority: 0.8,
            cardPriority: 0.4
        },
        economic: {
            minePriority: 1.0, // Foco total em recurso
            recruitPriority: 0.3,
            fortifyPriority: 0.2,
            warPriority: 0.4,
            cardPriority: 0.8
        },
        military: {
            minePriority: 0.4,
            recruitPriority: 1.0, // Foco total em exército
            fortifyPriority: 0.7,
            warPriority: 1.0,
            cardPriority: 0.2
        },
        aggressive: {
            minePriority: 0.2,
            recruitPriority: 0.9,
            fortifyPriority: 0.1,
            warPriority: 1.0,
            cardPriority: 0.5
        },
        diplomatic: {
            minePriority: 0.5,
            recruitPriority: 0.4,
            fortifyPriority: 1.0, // Foco total em estabilidade
            warPriority: 0.3,
            cardPriority: 0.9
        },
        strategic: {
            minePriority: 0.6,
            recruitPriority: 0.6,
            fortifyPriority: 0.6,
            warPriority: 0.7,
            cardPriority: 1.0 // Foco total em cartas
        },
        unpredictable: {
            minePriority: Math.random(),
            recruitPriority: Math.random(),
            fortifyPriority: Math.random(),
            warPriority: Math.random(),
            cardPriority: Math.random()
        }
    };
    
    return behaviors[aiCharacter.behavior] || behaviors.balanced;
}

// ⭐ FUNÇÕES AUXILIARES PARA CORES DAS CARTAS
function getCardColorByType(cardType) {
    const colorMap = {
        'Self': 'var(--color-army)',
        'Opponent': 'var(--color-instability)',
        'Gamble': 'var(--color-shop)',
        'Status': 'var(--color-influence)'
    };
    return colorMap[cardType] || 'var(--color-gold)';
}

// Eventos de escolha
const CHOICE_EVENTS = [
    { 
        name: "Petição por Redução de Impostos", 
        prompt: "O povo pede redução imediata dos impostos para aliviar a pressão. O que você faz?",
        choiceA: { 
            label: "Aceitar (Aumentar Lealdade)", 
            effect: (p) => { 
                p.coins = Math.max(0, p.coins - 2); 
                p.influence += 3;
                return `-2 Moedas, +3 Influência. (O povo está feliz)`;
            } 
        },
        choiceB: { 
            label: "Ignorar (Manter o Status Quo)", 
            effect: (p) => { 
                p.instability += 1;
                addStatus(p, 'HIGH_TAXES', STATUS_DEFINITIONS);
                return `+1 Instabilidade. Status: Impostos Altos. (Perdeu lealdade)`;
            } 
        }
    },
    { 
        name: "Convocação de Tropas no Interior", 
        prompt: "Precisamos de mais tropas, mas a convocação forçada pode levar a motins. Convocamos mais recrutas ou evitamos o risco?",
        choiceA: { 
            label: "Convocar (Risco de Moral)", 
            effect: (p) => { 
                p.army += 4;
                addStatus(p, 'LOW_MORALE', STATUS_DEFINITIONS);
                return `+4 Exército. Status: Moral Baixa. (Tropas insatisfeitas)`;
            } 
        },
        choiceB: { 
            label: "Evitar o Risco", 
            effect: (p) => { 
                p.food -= 2; 
                p.influence += 1;
                return `-2 Comida, +1 Influência. (Manutenção da paz custa recursos)`;
            } 
        }
    },
    { 
        name: "Inspiração da Princesa Real", 
        prompt: "A Princesa Real organizou um festival para elevar o espírito do povo. Como você deseja apoiar?",
        choiceA: { 
            label: "Patrocinar o Festival", 
            effect: (p) => { 
                p.coins = Math.max(0, p.coins - 5); 
                p.influence += 6;
                p.instability = Math.max(0, p.instability - 2);
                return `-5 Moedas, +6 Influência, -2 Instabilidade. (O reino brilha!)`;
            } 
        },
        choiceB: { 
            label: "Apenas Comparecer", 
            effect: (p) => { 
                p.influence += 2;
                return `+2 Influência. (Presença real notada)`;
            } 
        }
    },
    { 
        name: "Greve no Ferreiro", 
        prompt: "Os ferreiros estão exaustos e pedem melhores condições. Se não atendidos, o recrutamento será prejudicado.",
        choiceA: { 
            label: "Melhorar Oficinas", 
            effect: (p) => { 
                p.coins = Math.max(0, p.coins - 4); 
                addStatus(p, 'ECONOMIC_BOOM', STATUS_DEFINITIONS);
                return `-4 Moedas. Status: Boom Econômico. (Produção otimizada)`;
            } 
        },
        choiceB: { 
            label: "Ignorar Pedidos", 
            effect: (p) => { 
                addStatus(p, 'LOW_MORALE', STATUS_DEFINITIONS);
                return `Status: Moral Baixa. (Ferreiros desmotivados)`;
            } 
        }
    }
];

// Sistema de Log
const log = (message, className = '') => {
    const logDisplay = document.getElementById('log-display');
    const p = document.createElement('p');
    p.className = className;
    
    // Prefixos baseados no personagem ativo
    let prefix = '';
    if (selectedCharacter && currentPlayer === 1) {
        prefix = `<span class="log-event">[${selectedCharacter.name}]</span> `;
    } else if (p2.charName && currentPlayer === 2) {
        prefix = `<span class="log-war">[${p2.charName}]</span> `;
    }
    
    p.innerHTML = prefix + message;
    logDisplay.prepend(p);
    while (logDisplay.children.length > 50) {
        logDisplay.removeChild(logDisplay.lastChild);
    }
};

// Inicialização do jogo
document.addEventListener('DOMContentLoaded', function() {
    renderCharacterSelection('character-grid', selectCharacter);
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('start-game-button').addEventListener('click', initializeGame);
    document.getElementById('end-turn-button').addEventListener('click', endTurn);
    document.getElementById('shop-button').addEventListener('click', showShopModal);
    document.getElementById('shop-close-button').addEventListener('click', closeShopModal);
    document.getElementById('mine-button').addEventListener('click', () => { if (mineAction(p1)) { updateUI(); checkGameOver(); } });
    document.getElementById('recruit-button').addEventListener('click', () => { if (recruitAction(p1)) { updateUI(); checkGameOver(); } });
    document.getElementById('fortify-button').addEventListener('click', () => { if (fortifyAction(p1)) { updateUI(); checkGameOver(); } });
    document.getElementById('war-button').addEventListener('click', () => { if (warAction(p1, p2)) { updateUI(); checkGameOver(); } });
    document.getElementById('special-ability-button').addEventListener('click', () => { 
        if (p1.ultimateCharge >= GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) {
            if (useUltimate(p1, p2)) { updateUI(); checkGameOver(); }
        } else {
            if (specialAbilityAction(p1, p2)) { updateUI(); checkGameOver(); } 
        }
    });
    
    // Listeners para Edificações
    document.querySelectorAll('#p1-buildings .building-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            const buildingId = slot.dataset.building;
            buyBuilding(p1, buildingId);
        });
    });
    document.getElementById('reset-button').addEventListener('click', () => window.location.reload());
}

function selectCharacter(charId) {
    const char = CHARACTERS.find(c => c.id === charId);
    selectedCharacter = char;
    
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`.character-card[data-char-id="${charId}"]`).classList.add('selected');
    
    document.getElementById('start-game-button').disabled = false;
}

function initializeGame() {
    if (!selectedCharacter) return;
    
    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    
    // Use variáveis locais para modificações de personagem
    let recruitCost = RECRUIT_COST_BASE;
    let rebellionLimit = REBELLION_ARMY_LIMIT;
    let actionPointsMax = ACTION_POINTS_MAX;
    let fortifyCost = FORTIFY_COST_BASE;
    
    if (selectedCharacter.setup) {
        const config = selectedCharacter.setup();
        if (config.RECRUIT_COST_BASE) recruitCost = config.RECRUIT_COST_BASE;
        if (config.REBELLION_ARMY_LIMIT) rebellionLimit = config.REBELLION_ARMY_LIMIT;
        if (config.ACTION_POINTS_MAX) actionPointsMax = config.ACTION_POINTS_MAX;
        if (config.FORTIFY_COST_BASE) fortifyCost = config.FORTIFY_COST_BASE;
    }
    
    // Inicializar jogador
    Object.assign(p1, { 
        ...selectedCharacter.initial, 
        charName: selectedCharacter.name, 
        status: [], 
        upgrades: [], 
        ap: actionPointsMax, 
        mineCooldown: 0, 
        winCount: 0, 
        totalCoinsEarned: 0 
    });

    // ⭐ CONFIGURAR IA COM PERSONAGEM BALANCEADO
    const aiCharacter = getRandomAICharacter();
    
    // Inicializar IA com atributos específicos
    Object.assign(p2, { 
        ...aiCharacter.initial,
        status: [], 
        ap: ACTION_POINTS_MAX, 
        mineCooldown: 0, 
        charName: aiCharacter.name,
        aiBehavior: aiCharacter.behavior,
        aiDifficulty: aiCharacter.difficulty
    });

    // Configurar avatar do JOGADOR
    document.getElementById('p1-avatar').style.backgroundImage = `url('${selectedCharacter.image}')`;
    document.getElementById('p1-character-name').textContent = selectedCharacter.name;
    
    // ⭐ CONFIGURAR AVATAR DA IA COM DESCRIÇÃO
    document.getElementById('p2-avatar').style.backgroundImage = `url('${aiCharacter.image}')`;
    document.getElementById('p2-character-name').textContent = `${aiCharacter.name} (${aiCharacter.difficulty.replace('_', ' ').toUpperCase()})`;
    
    // Iniciar jogo
    currentPlayer = 1;
    turnCount = 1;
    isGameOver = false;
    document.getElementById('game-message').textContent = `Turno ${turnCount} - Vez do ${p1.charName}`;
    log(`O jogo começou! ${p1.charName} (P1) vs. <span class="log-war">${aiCharacter.name}</span> - ${aiCharacter.description}.`, 'log-event');
    log(`<span class="log-war">Dificuldade: ${aiCharacter.difficulty.replace('_', ' ').toUpperCase()}</span> - Comportamento: ${aiCharacter.behavior.toUpperCase()}`, 'log-event');
    log(`Seu limite de rebelião de Exército é: ${rebellionLimit}.`);
    
    rollNewMarketCards();
    updateUI();
}

// Ações do jogo
function mineAction(p) {
    if (p.ap < 1 || p.mineCooldown > 0) return false;
    
    const gainCoins = 4;
    let gainFood = 5;
    
    if (p.playerNumber === 1 && hasUpgrade(p, 'agri_tech')) {
        gainFood += 2;
    }

    // Bônus do Moinho
    if (p.buildings && p.buildings.includes('mill')) {
        gainFood += 3;
    }
    
    p.coins += gainCoins;
    p.food += gainFood;
    p.ap -= 1;
    p.mineCooldown = MINE_COOLDOWN_MAX;

    let logMsg = `<span class="log-positive">${p.name}</span> Minerou/Plantou: +${gainCoins} Moedas, +${gainFood} Comida.`;
    
    if (p.playerNumber === 1 && selectedCharacter.mineEffect) {
        const charEffectMsg = selectedCharacter.mineEffect(p);
        if (charEffectMsg) logMsg += ` (${charEffectMsg})`;
    }

    if (hasStatus(p, 'ECONOMIC_BOOM')) {
        p.coins += 2;
        logMsg += ` (+2 Moedas, Boom Econômico)`;
    }
    
    log(logMsg);
    
    // Carregar Ultimate (Minerar dá 1 carga extra)
    p.ultimateCharge = Math.min(GAME_CONSTANTS.ULTIMATE_CHARGE_MAX, p.ultimateCharge + 1);
    
    playSound('gather');
    return true;
}

function recruitAction(p) {
    let baseCost = RECRUIT_COST_BASE;
    if (p.playerNumber === 1 && selectedCharacter && selectedCharacter.setup) {
        const config = selectedCharacter.setup();
        if (config.RECRUIT_COST_BASE) {
            baseCost = config.RECRUIT_COST_BASE;
        }
    }
    
    const cost = calculateCost(baseCost, p, false, null, selectedCharacter);
    const foodCost = 3;
    if (p.ap < 1 || p.coins < cost || p.food < foodCost) return false;
    
    let gainArmy = 3;
    
    if (p.playerNumber === 1 && hasUpgrade(p, 'royal_guard')) {
        gainArmy += 1;
    }

    // Bônus do Quartel
    if (p.buildings && p.buildings.includes('barracks')) {
        gainArmy += 1;
        // Redução de custo já tratada ou pode ser injetada no calculateCost
    }

    if (hasStatus(p, 'LOW_MORALE')) {
        gainArmy = Math.max(1, gainArmy - 1);
    }

    p.coins -= (p.buildings && p.buildings.includes('barracks')) ? Math.max(1, cost - 1) : cost;
    p.food -= foodCost;
    p.army += gainArmy;
    p.ap -= 1;

    log(`<span class="log-positive">${p.name}</span> Recrutou Exército: -${(p.buildings && p.buildings.includes('barracks')) ? Math.max(1, cost - 1) : cost} M, -${foodCost} C, +${gainArmy} Exército.`, 'log-positive');
    playSound('recruit');
    p.ultimateCharge = Math.min(GAME_CONSTANTS.ULTIMATE_CHARGE_MAX, (p.ultimateCharge || 0) + 1);
    return true;
}

function fortifyAction(p) {
    let baseCost = FORTIFY_COST_BASE;
    if (p.playerNumber === 1 && selectedCharacter && selectedCharacter.setup) {
        const config = selectedCharacter.setup();
        if (config.FORTIFY_COST_BASE) {
            baseCost = config.FORTIFY_COST_BASE;
        }
    }
    
    const cost = calculateCost(baseCost, p, false, null, selectedCharacter);
    const influenceCost = 2;
    if (p.ap < 1 || p.coins < cost || p.influence < influenceCost) return false;

    let gainInstability = 1;
    let lossInstability = 3;
    
    if (hasStatus(p, 'LOW_MORALE')) {
        lossInstability = Math.max(1, lossInstability - 1);
    }

    p.coins -= cost;
    p.influence -= influenceCost;
    p.instability = Math.max(0, p.instability - lossInstability);
    p.instability += gainInstability;
    p.ap -= 1;

    log(`<span class="log-positive">${p.name}</span> Fortificou: -${cost} M, -${influenceCost} I, -${lossInstability} Inst. + ${gainInstability} Inst.`, 'log-positive');
    playSound('build');
    p.ultimateCharge = Math.min(GAME_CONSTANTS.ULTIMATE_CHARGE_MAX, (p.ultimateCharge || 0) + 1);
    return true;
}

function warAction(p, p_op) {
    if (p.army < WAR_ARMY_BASE_ATTACK || p.ap < 1) return false;

    p.ap -= 1;
    shakeElement('game-container');

    // Gritos de Guerra e Efeitos de Guerra
    if (window.audioSystem) {
        window.audioSystem.playWar();
        window.audioSystem.playWarCry();
    }
    if (window.visualEffects) {
        window.visualEffects.playWarEffects();
    }

    // Se é o jogador humano, abrir combate tático
    if (p.playerNumber === 1) {
        log(`⚔️ O ${selectedCharacter.name} avança com fúria!`, 'log-war');
        combatSystem.startCombat(p, p_op, (combatResult) => {
            processCombatResults(combatResult, p, p_op);
            updateUI();
            checkGameOver();
        });
    } else {
        // IA: calcular combate automático sem modal
        log(`⚔️ ${p.charName} declara guerra!`, 'log-war');
        const attackPower = p.army + Math.floor(Math.random() * 6);
        const defensePower = p_op.army + Math.floor(Math.random() * 6);
        const playerCasualties = Math.floor(Math.random() * 3) + 1;
        const enemyCasualties = Math.floor(Math.random() * 3) + 1;

        let result;
        if (attackPower > defensePower) {
            result = 'victory';
        } else if (attackPower < defensePower) {
            result = 'defeat';
        } else {
            result = Math.random() < 0.5 ? 'victory' : 'defeat';
        }

        processCombatResults({ result, playerCasualties, enemyCasualties }, p, p_op);
        updateUI();
        checkGameOver();
    }

    return true;
}

function specialAbilityAction(p, p_op) {
    if (p.ap < 1 || !selectedCharacter || !selectedCharacter.specialAbility) return false;
    
    const result = selectedCharacter.specialAbility(p, p_op);
    if (result) {
        log(`<span class="log-event">${p.name}</span> usou habilidade especial: ${result}`, 'log-event');
        playSound('upgrade');
        return true;
    }
    return false;
}

function processCombatResults(combatResult, attacker, defender) {
    const { result, playerCasualties, enemyCasualties } = combatResult;

    const armyLossAttacker = playerCasualties * 3;
    const armyLossDefender = enemyCasualties * 3;

    attacker.army = Math.max(0, attacker.army - armyLossAttacker);
    defender.army = Math.max(0, defender.army - armyLossDefender);

    if (result === 'victory') {
        attacker.instability += 2;
        defender.instability += 4;
        
        const coinsGained = Math.min(defender.coins, 5 + enemyCasualties * 2);
        attacker.coins += coinsGained;
        defender.coins -= coinsGained;
        attacker.briks += 1;

        log(`<span class="log-war">${attacker.name} VENCEU o combate!</span> Ganhou ${coinsGained} moedas e 1 Brik. Perdeu ${armyLossAttacker} exército.`, 'log-positive');
    } else if (result === 'defeat') {
        attacker.instability += 4;
        defender.instability += 2;
        
        const coinsLost = Math.min(attacker.coins, 3 + playerCasualties * 2);
        attacker.coins -= coinsLost;
        defender.coins += coinsLost;

        log(`<span class="log-war">${attacker.name} PERDEU o combate!</span> Perdeu ${coinsLost} moedas e ${armyLossAttacker} exército.`, 'log-negative');
    } else if (result === 'retreat') {
        attacker.instability += 3;
        log(`<span class="log-war">${attacker.name} recuou do combate!</span> Perdeu ${armyLossAttacker} exército.`, 'log-warning');
    }
}

// ⭐ IA MELHORADA COM COMPORTAMENTOS ESPECÍFICOS
function p2AIAction() {
    if (isGameOver || isGamePaused || currentPlayer !== 2) return;

    const p = p2;
    const p_op = p1;
    const behavior = getAIBehavior(p2);
    
    const aiTurn = () => {
        if (p.ap <= 0) {
            endTurn();
            return;
        }

        // ⭐ DECISÕES BASEADAS NO COMPORTAMENTO
        const shouldMine = p.food <= 8 && p.mineCooldown === 0 && Math.random() < behavior.minePriority;
        const shouldRecruit = p.army < 15 && Math.random() < behavior.recruitPriority;
        const shouldFortify = p.instability >= 4 && Math.random() < behavior.fortifyPriority;
        const shouldWar = p.army >= 12 && p_op.instability >= 4 && Math.random() < behavior.warPriority;

        // Prioridade baseada no comportamento
        if (shouldFortify && fortifyAction(p)) {
            setTimeout(aiTurn, 700);
            return;
        }
        if (shouldMine && mineAction(p)) {
            setTimeout(aiTurn, 700);
            return;
        }
        if (shouldRecruit && recruitAction(p)) {
            setTimeout(aiTurn, 700);
            return;
        }
        if (shouldWar && warAction(p, p_op)) {
            setTimeout(aiTurn, 700);
            return;
        }

        // ⭐ COMPRA DE CARTAS INTELIGENTE
        const availableCards = marketCards.map((card, index) => ({ ...card, index, cost: calculateCost(card.cost, p, true, card.type) }))
                                         .filter(card => p.coins >= card.cost && p.ap >= 1);
        
        if (availableCards.length > 0 && Math.random() < behavior.cardPriority) {
            // Prefere cartas baseadas no comportamento
            let bestCard;
            const aiBehavior = p2.aiBehavior || 'balanced';
            if (aiBehavior === 'military' || aiBehavior === 'aggressive') {
                bestCard = availableCards.find(card => card.type === 'Self' && card.name.includes('Recrutamento'))
                        || availableCards.find(card => card.type === 'Opponent');
            } else if (aiBehavior === 'economic' || aiBehavior === 'strategic') {
                bestCard = availableCards.find(card => card.type === 'Self' && card.name.includes('Comércio'))
                        || availableCards.find(card => card.type === 'Self');
            } else if (aiBehavior === 'diplomatic') {
                bestCard = availableCards.find(card => card.type === 'Status')
                        || availableCards.find(card => card.type === 'Self');
            }
            if (!bestCard) {
                bestCard = availableCards[Math.floor(Math.random() * availableCards.length)];
            }
            
            if (bestCard && cardBuyButtonHandler(bestCard.index, bestCard.cost, p, p_op)) {
                setTimeout(aiTurn, 700);
                return;
            }
        }

        // Ações fallback
        if (p.ap >= 1 && p.mineCooldown === 0 && mineAction(p)) {
            setTimeout(aiTurn, 700);
            return;
        }
        
        if (p.army < 10 && recruitAction(p)) {
            setTimeout(aiTurn, 700);
            return;
        }
        
        endTurn();
    };

    aiTurn();
}

function endTurn() {
    if (isGameOver || isGamePaused) return;

    const p = currentPlayer === 1 ? p1 : p2;
    const p_op = currentPlayer === 1 ? p2 : p1;
    const logs = [];

    p.mineCooldown = Math.max(0, p.mineCooldown - 1);
    
    let actionPointsMax = ACTION_POINTS_MAX;
    if (p.playerNumber === 1 && selectedCharacter && selectedCharacter.setup) {
        const config = selectedCharacter.setup();
        if (config.ACTION_POINTS_MAX) {
            actionPointsMax = config.ACTION_POINTS_MAX;
        }
    }
    p.ap = actionPointsMax;

    const foodUpkeep = Math.floor(p.army * FOOD_UPKEEP_PER_ARMY);
    const influenceUpkeep = Math.floor(p.instability * INFLUENCE_UPKEEP_PER_INSTABILITY);
    
    p.food -= foodUpkeep;
    if (p.food < 0) {
        const penalty = Math.abs(p.food);
        p.army = Math.max(0, p.army - penalty);
        logs.push(`<span class="log-negative">FOME:</span> Falha na manutenção de Comida (-${foodUpkeep}). <span class="log-negative">Perdeu ${penalty} Exército!</span>`);
        p.food = 0;
        if(p.playerNumber === 1) shakeElement('p1-avatar');
    } else {
        logs.push(`Manutenção de Comida: -${foodUpkeep} Comida (Exército).`);
    }
    
    p.influence -= influenceUpkeep;
    if (p.influence < 0) {
        const penalty = Math.abs(p.influence);
        p.instability += penalty;
        logs.push(`<span class="log-negative">REVOLTA:</span> Falha na manutenção de Influência (-${influenceUpkeep}). <span class="log-negative">Ganhou ${penalty} Instabilidade!</span>`);
        p.influence = 0;
        if(p.playerNumber === 1) shakeElement('p1-avatar');
    } else {
        logs.push(`Manutenção de Influência: -${influenceUpkeep} Influência (Instabilidade).`);
    }

    if (currentPlayer === 1 && selectedCharacter.effect) {
        const charEffectMsg = selectedCharacter.effect(p);
        if (charEffectMsg) {
            logs.push(`Passivo de ${p.charName}: ${charEffectMsg}`);
            if (window.visualEffects) window.visualEffects.playPassiveFeedback(selectedCharacter.id);
        }
    }
    
    if (p.playerNumber === 1 && hasUpgrade(p, 'influence_boost')) {
        p.influence += 1;
        logs.push(`Upgrade (Impulsionar Influência): +1 Influência.`);
    }
    
    p.status.forEach(statusId => {
        if (statusId === 'INSPIRATION') {
            p.instability = Math.max(0, p.instability - 1);
            logs.push(`Status Inspiração: -1 Instabilidade.`);
        }
    });

    // SISTEMA DE CLIMA (ESTAÇÕES)
    if (currentPlayer === 1) {
        turnsInSeason++;
        if (turnsInSeason >= 5) {
            turnsInSeason = 0;
            const seasons = ['Primavera', 'Verão', 'Outono', 'Inverno'];
            const currentIndex = seasons.indexOf(currentSeason);
            currentSeason = seasons[(currentIndex + 1) % seasons.length];
            log(`🍁 O clima mudou! Agora estamos no **${currentSeason}**.`, 'log-event');
            if (window.visualEffects) window.visualEffects.applyWeather(currentSeason);
        }
    }

    // Efeitos sazonais
    if (currentSeason === 'Inverno') {
        const extraFoodUpkeep = Math.floor(p.army * 0.5);
        p.food -= extraFoodUpkeep;
        logs.push(`<span class="log-negative">INVERNO:</span> Consumo extra de Comida: -${extraFoodUpkeep}.`);
    } else if (currentSeason === 'Verão') {
        if (p.mineCooldown === 0) {
            p.coins += 1;
            logs.push(`<span class="log-positive">VERÃO:</span> Bônus de Mineração: +1 Moeda.`);
        }
    }

    log(`--- Fim da Vez de ${p.name} (Turno ${turnCount}) ---`, 'log-turn');
    logs.reverse().forEach(msg => log(msg));

    currentPlayer = (currentPlayer === 1) ? 2 : 1;
    if (currentPlayer === 1) turnCount++;
    
    document.getElementById('game-message').textContent = `Turno ${turnCount} - Vez do ${currentPlayer === 1 ? p1.charName : p2.charName}`;
    log(`--- Início da Vez de ${currentPlayer === 1 ? p1.name : p2.name} ---`, 'log-turn');

    rollNewMarketCards();
    updateUI();
    
    if (checkGameOver()) return;
    
    if (Math.random() < EVENT_CHANCE) {
        showChoiceEventModal();
        return;
    }

    if (currentPlayer === 2) {
        setTimeout(p2AIAction, 500);
    }
}

// --- FASE 2: NOVAS MECÂNICAS ---

function buyBuilding(p, buildingId) {
    if (p.playerNumber !== currentPlayer) return;
    
    // Importar constante localmente para garantir acesso
    import('./shared/constants.js').then(({ BUILDINGS }) => {
        const building = BUILDINGS.find(b => b.id === buildingId);
        if (!building) return;

        if (p.buildings.includes(buildingId)) {
            log(`Você já possui o ${building.name}.`, 'log-negative');
            return;
        }

        if (p.briks < building.cost) {
            log(`Briks insuficientes para construir ${building.name} (Custo: ${building.cost} Briks).`, 'log-negative');
            return;
        }

        p.briks -= building.cost;
        p.buildings.push(buildingId);
        
        log(`<span class="log-event">${p.name}</span> construiu um **${building.name}**!`, 'log-positive');
        playSound('build');
        
        if (window.visualEffects) {
            window.visualEffects.playUltimateParticles('gold');
            window.visualEffects.showAchievementToast('Nova Construção!', `Você agora possui um ${building.name}.`);
        }
        
        updateUI();
    });
}

function useUltimate(p, p_op) {
    if (p.ultimateCharge < GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) return false;
    
    let resultMsg = "";
    let effectColor = 'rgba(255, 106, 0, 0.4)';

    // Efeitos baseados no personagem
    const charId = selectedCharacter ? selectedCharacter.id : 'rei';
    
    switch(charId) {
        case 'rei':
            p.army += 10;
            p.food += 10;
            resultMsg = "Chamado às Armas: +10 Exército e +10 Comida!";
            effectColor = 'rgba(241, 196, 15, 0.5)';
            break;
        case 'rainha':
            p.instability = 0;
            p.influence += 10;
            resultMsg = "Decreto da Rainha: Instabilidade zerada e +10 Influência!";
            effectColor = 'rgba(142, 68, 173, 0.5)';
            break;
        case 'ferreiro':
            p.army += 8;
            p.briks += 3;
            resultMsg = "Forja Suprema: +8 Exército e +3 Briks!";
            effectColor = 'rgba(230, 126, 34, 0.5)';
            break;
        case 'ladrao': {
            const stolen = Math.floor(p_op.coins * 0.5);
            p_op.coins -= stolen;
            p.coins += stolen;
            resultMsg = "O Grande Assalto: Roubou " + stolen + " moedas do oponente!";
            effectColor = 'rgba(44, 62, 80, 0.7)';
            break;
        }
        case 'amante':
            p_op.instability += 4;
            p.influence += 5;
            resultMsg = "Intriga Real: +4 Instabilidade no inimigo e +5 Influência!";
            effectColor = 'rgba(231, 76, 60, 0.5)';
            break;
        case 'soldado':
            p.army += 15;
            p_op.army = Math.max(0, p_op.army - 5);
            resultMsg = "Marcha Imperial: +15 Exército e inimigo perde 5!";
            effectColor = 'rgba(52, 73, 94, 0.6)';
            break;
        case 'programador':
            p.ap += 3;
            p.coins += 8;
            p.briks += 2;
            resultMsg = "Hack do Sistema: +3 AP, +8 Moedas e +2 Briks!";
            effectColor = 'rgba(46, 204, 113, 0.5)';
            break;
        case 'princesa':
            p.coins += 10;
            p.influence += 8;
            p.instability = Math.max(0, p.instability - 3);
            resultMsg = "Festival Real: +10 Moedas, +8 Influência, -3 Instabilidade!";
            effectColor = 'rgba(241, 196, 15, 0.4)';
            break;
        case 'bruxa':
            p_op.ap = 0;
            if (!p_op.status) p_op.status = [];
            if (!p_op.status.includes('LOW_MORALE')) p_op.status.push('LOW_MORALE');
            resultMsg = "Eclipse Místico: Inimigo perdeu todos os AP e ganhou Moral Baixa!";
            effectColor = 'rgba(155, 89, 182, 0.6)';
            break;
        default:
            p.ap += 2;
            p.coins += 5;
            resultMsg = "Supremacia Real: +2 AP e +5 Moedas!";
    }

    p.ultimateCharge = 0;
    
    log(`🔥 <span class="log-war">ULTIMATE DE ${p.charName} ATIVADA!</span> 🔥`, 'log-war');
    log(resultMsg, 'log-event');
    
    if (window.visualEffects) {
        window.visualEffects.playUltimateFlash(effectColor);
        window.visualEffects.playUltimateParticles(charId === 'bruxa' ? 'magic' : 'fire');
    }
    
    if (window.audioSystem) {
        window.audioSystem.play('victory');
    }

    return true;
}

function rollNewMarketCards() {
    let availableCards = [...CARDS];
    shuffleArray(availableCards);
    marketCards = availableCards.slice(0, MARKET_SLOTS);
}

function updateUI() {
    if (isGameOver || isGamePaused) return;
    
    const updatePlayerUI = (p) => {
        const num = p.playerNumber;
        const maxArmy = MAX_STAT_DEFAULT;
        const maxInstability = INSTABILITY_LIMIT;
        const maxResource = MAX_STAT_RESOURCE;

        document.getElementById(`p${num}-currencies-display`).innerHTML = `
            <span style="display: block;">${p.coins} Moedas</span>
            <span style="color: var(--color-shop);">${p.briks} Briks 🧱</span>
        `;
        
        const stats = [
            { id: 'ap', max: ACTION_POINTS_MAX, fillClass: 'ap-fill' },
            { id: 'army', max: maxArmy, fillClass: 'army-fill' },
            { id: 'instability', max: maxInstability, fillClass: 'instability-fill' },
            { id: 'food', max: maxResource, fillClass: 'food-fill' },
            { id: 'influence', max: maxResource, fillClass: 'influence-fill' },
        ];

        stats.forEach(stat => {
            const percent = Math.min(100, (p[stat.id] / stat.max) * 100);
            document.getElementById(`p${num}-${stat.id}-fill`).style.width = `${percent}%`;
            document.getElementById(`p${num}-${stat.id}-value`).textContent = p[stat.id];
        });

        const cdPercent = 100 - ((p.mineCooldown / MINE_COOLDOWN_MAX) * 100);
        document.getElementById(`p${num}-mine-cooldown-fill`).style.width = `${cdPercent}%`;
        document.getElementById(`p${num}-mine-cooldown-value`).textContent = p.mineCooldown;
        document.getElementById(`p${num}-cooldown-stat`).style.opacity = p.mineCooldown > 0 ? 1 : 0.5;

        const statusEl = document.getElementById(`p${num}-status-display`);
        statusEl.innerHTML = '';
        p.status.forEach(statusId => {
            const def = STATUS_DEFINITIONS[statusId];
            const token = document.createElement('span');
            token.className = `status-token status-${def.type}`;
            token.title = def.desc;
            token.textContent = def.icon + ' ' + def.name;
            statusEl.appendChild(token);
        });
        
        const isActive = num === currentPlayer;
        const indicator = document.getElementById(`p${num}-turn-indicator`);
        if (indicator) {
            indicator.style.display = isActive ? 'block' : 'none';
            indicator.classList.toggle('active-pulse', isActive);
        }

        // Atualizar Edificações Visuais
        const buildContainer = document.getElementById(`p${num}-buildings`);
        if (buildContainer) {
            buildContainer.querySelectorAll('.building-slot').forEach(slot => {
                const bId = slot.dataset.building;
                if (p.buildings.includes(bId)) {
                    slot.classList.add('built');
                } else {
                    slot.classList.remove('built');
                }
            });
        }

        // Atualizar Barra de Ultimate
        const ultFill = document.getElementById(`p${num}-ultimate-fill`);
        if (ultFill) {
            const ultPercent = (p.ultimateCharge / GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) * 100;
            ultFill.style.width = `${ultPercent}%`;
            
            const ultContainer = ultFill.parentElement;
            if (p.ultimateCharge >= GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) {
                ultContainer.classList.add('ultimate-ready');
            } else {
                ultContainer.classList.remove('ultimate-ready');
            }
        }
    };
    
    updatePlayerUI(p1);
    updatePlayerUI(p2);
    checkAchievements();
    
    document.getElementById('global-coins-value').textContent = globalCoins;
    document.getElementById('rebellion-condition').textContent = `Máx. Exército: ${REBELLION_ARMY_LIMIT}. Máx. Instabilidade: ${INSTABILITY_LIMIT}.`;

    const p = currentPlayer === 1 ? p1 : p2;
    
    let baseRecruitCost = RECRUIT_COST_BASE;
    let baseFortifyCost = FORTIFY_COST_BASE;
    if (p.playerNumber === 1 && selectedCharacter && selectedCharacter.setup) {
        const config = selectedCharacter.setup();
        if (config.RECRUIT_COST_BASE) baseRecruitCost = config.RECRUIT_COST_BASE;
        if (config.FORTIFY_COST_BASE) baseFortifyCost = config.FORTIFY_COST_BASE;
    }
    
    const recruitCost = calculateCost(baseRecruitCost, p, false, null, selectedCharacter);
    const fortifyCost = calculateCost(baseFortifyCost, p, false, null, selectedCharacter);

    document.getElementById('mine-button').disabled = p.ap < 1 || p.mineCooldown > 0 || currentPlayer === 2;
    document.getElementById('recruit-button').disabled = p.ap < 1 || p.coins < recruitCost || p.food < 3 || currentPlayer === 2;
    document.getElementById('fortify-button').disabled = p.ap < 1 || p.coins < fortifyCost || p.influence < 2 || currentPlayer === 2;
    document.getElementById('war-button').disabled = p.army < WAR_ARMY_BASE_ATTACK || currentPlayer === 2;
    document.getElementById('special-ability-button').disabled = !selectedCharacter || !selectedCharacter.specialAbility || p.ap < 1 || currentPlayer === 2;
    document.getElementById('end-turn-button').disabled = currentPlayer === 2;
    document.getElementById('shop-button').disabled = currentPlayer === 2;
    
    updateCardMarket();
    
    if (document.getElementById('shop-modal-overlay').style.display === 'flex') {
        renderShop();
    }
}

// ⭐ SISTEMA DE CARTAS COLORIDAS
function updateCardMarket() {
    const marketEl = document.getElementById('card-market');
    marketEl.innerHTML = '';
    const p = currentPlayer === 1 ? p1 : p2;
    
    marketCards.forEach((card, index) => {
        let finalCost = calculateCost(card.cost, p, true, card.type, selectedCharacter);
        
        const isAffordable = p.coins >= finalCost && p.ap >= 1;
        
        // ⭐ DEFINIR CORES BASEADAS NO TIPO DE CARTA
        const cardColor = card.color || getCardColorByType(card.type);
        const borderColor = cardColor;
        const backgroundColor = `${cardColor}20`;
        
        const cardButton = document.createElement('button');
        cardButton.className = 'card-buy-button';
        cardButton.disabled = !isAffordable || currentPlayer === 2;
        cardButton.dataset.index = index;
        cardButton.dataset.type = card.type;
        cardButton.style.cssText = `
            border: 3px solid ${borderColor};
            background: linear-gradient(135deg, ${backgroundColor} 0%, rgba(30, 20, 15, 0.9) 100%);
        `;
        
        cardButton.innerHTML = `
            <div class="card-art-container" style="background-image: url('${card.image}');" data-type="${card.type}"></div>
            <span class="card-title">${card.name}</span>
            <span class="card-type-badge">${card.type}</span>
            <span class="card-description">${card.desc}</span>
            <span class="card-cost">${finalCost} Moedas</span>
        `;
        
        cardButton.onclick = () => cardBuyButtonHandler(index, finalCost, p1, p2);
        marketEl.appendChild(cardButton);
    });
}

function cardBuyButtonHandler(index, cost, self, op) {
    const card = marketCards[index];

    if (self.coins < cost || self.ap < 1) {
        log('Custo insuficiente para comprar a carta.', 'log-negative');
        return false;
    }

    self.coins -= cost;
    self.ap -= 1;

    let logMsg = `<span class="log-positive">${self.name}</span> jogou <span class="log-event" style="color: ${card.color || getCardColorByType(card.type)};">${card.name}</span>:`;
    
    // Aplicar multiplicador de efeito da Bruxa
    let effectMultiplier = 1;
    if (self.playerNumber === 1 && selectedCharacter && selectedCharacter.cardEffectMultiplier) {
        effectMultiplier = selectedCharacter.cardEffectMultiplier();
    }
    
    const effectMsg = card.effect(self, op);
    logMsg += ` ${effectMsg}`;
    
    // Aplicar efeito duplicado se multiplicador > 1
    if (effectMultiplier > 1) {
        logMsg += ` <span class="log-event">(EFEITO DUPLICADO!)</span>`;
        // Executar efeito novamente
        card.effect(self, op);
    }
    
    if (hasStatus(self, 'ECONOMIC_BOOM')) {
        self.coins += 2;
        logMsg += ` (+2 Moedas, Boom Econômico)`;
    }
    
    log(logMsg);
    playSound('card_play');
    
    marketCards.splice(index, 1);
    rollNewMarketCards();
    
    updateUI();
    checkGameOver();
    return true;
}

function checkGameOver() {
    if (isGameOver) return true;
    
    const check = (p, p_op) => {
        if (p_op.army >= REBELLION_ARMY_LIMIT && p.instability >= INSTABILITY_LIMIT) {
            log(`<span class="log-war">${p.name} é destruído! Rebelião militar!</span>`, 'log-event log-lose');
            shakeElement('game-container');
            return { winner: p_op, reason: `${p_op.name} tinha um Exército de ${p_op.army} e ${p.name} atingiu ${INSTABILITY_LIMIT} de Instabilidade.` };
        }
        if (p.instability >= INSTABILITY_LIMIT) {
            log(`<span class="log-war">${p.name} atinge ${INSTABILITY_LIMIT} de Instabilidade! O povo se revolta!</span>`, 'log-event log-lose');
            shakeElement('game-container');
            return { winner: p_op, reason: `A Instabilidade de ${p.name} atingiu o limite de ${INSTABILITY_LIMIT}.` };
        }
        return null;
    };

    let result = check(p1, p2);
    if (!result) result = check(p2, p1);

    if (result) {
        isGameOver = true;
        document.getElementById('game-screen').style.display = 'flex';
        document.getElementById('game-message').textContent = `${result.winner.name} VENCEU!`;
        document.getElementById('game-message').classList.add(result.winner === p1 ? 'game-over-win' : 'game-over-lose');
        document.getElementById('reset-button').style.display = 'block';
        log(`FIM DE JOGO: ${result.winner.name} venceu. Motivo: ${result.reason}`, 'log-event');
        document.getElementById('end-turn-button').disabled = true;
        if (result.winner === p1) {
            p1.winCount++;
            if (window.RankSystem) window.RankSystem.addWin();
            checkAchievements();
        } else {
            if (window.RankSystem) window.RankSystem.addLoss();
        }
        return true;
    }
    return false;
}

function checkAchievements() {
    const p = p1;
    let unlockedCount = 0;
    
    ACHIEVEMENTS.forEach(ach => {
        if (!ach.unlocked && ach.check(p)) {
            ach.unlocked = true;
            log(ach.log, 'log-event log-positive');
            
            // Usar novo sistema de Toast
            if (window.visualEffects) {
                window.visualEffects.showAchievementToast('Conquista Desbloqueada!', ach.name);
            }
            
            unlockedCount++;
        }
    });
    
    const display = document.getElementById('achievements-display');
    const list = ACHIEVEMENTS.map(ach => 
        `<span class="achievement-item ${ach.unlocked ? 'achievement-unlocked' : ''}" title="${ach.log}">${ach.name}</span>`
    ).join('');
    
    display.innerHTML = `<h3>Conquistas do Jogo</h3>${list}`;
}

function showChoiceEventModal() {
    isGamePaused = true;
    const p = currentPlayer === 1 ? p1 : p2;
    
    const event = CHOICE_EVENTS[Math.floor(Math.random() * CHOICE_EVENTS.length)];
    
    document.getElementById('modal-event-title').textContent = event.name;
    document.getElementById('modal-event-prompt').textContent = event.prompt;
    document.getElementById('choice-A-button').textContent = event.choiceA.label;
    document.getElementById('choice-B-button').textContent = event.choiceB.label;
    
    document.getElementById('choice-A-button').onclick = () => handleChoice(event.choiceA, p, event.name);
    document.getElementById('choice-B-button').onclick = () => handleChoice(event.choiceB, p, event.name);

    document.getElementById('choice-modal-overlay').style.display = 'flex';
    
    if (currentPlayer === 2) {
        setTimeout(() => {
            const aiChoice = Math.random() < 0.5 ? event.choiceA : event.choiceB;
            handleChoice(aiChoice, p2, event.name);
        }, 1000);
    }
}

function handleChoice(choice, p, eventName) {
    if (isGameOver) return;
    
    const effectLog = choice.effect(p);
    log(`<span class="log-event">${p.name}</span> (Evento: ${eventName}) escolheu: ${choice.label}. Resultado: ${effectLog}`, 'log-event');
    
    document.getElementById('choice-modal-overlay').style.display = 'none';
    isGamePaused = false;
    
    updateUI();
    if (checkGameOver()) return;

    if (p.playerNumber === 2) {
        setTimeout(p2AIAction, 500);
    }
}

function showShopModal() {
    if (currentPlayer === 2) return;
    isGamePaused = true;
    renderShop();
    document.getElementById('shop-modal-overlay').style.display = 'flex';
}

function closeShopModal() {
    document.getElementById('shop-modal-overlay').style.display = 'none';
    isGamePaused = false;
}

function renderShop() {
    const shopGrid = document.getElementById('upgrade-grid');
    shopGrid.innerHTML = '';
    const p = p1;
    
    UPGRADES.forEach(upgrade => {
        const purchased = hasUpgrade(p, upgrade.id);
        const canAfford = p.briks >= upgrade.cost;
        
        const item = document.createElement('div');
        item.className = 'upgrade-item';
        item.innerHTML = `
            <h4>${upgrade.name}</h4>
            <p>${upgrade.effect}</p>
            <div class="upgrade-cost-button">
                <span class="upgrade-cost">${upgrade.cost} 🧱 Briks</span>
                <button id="buy-${upgrade.id}-button" class="buy-upgrade-button ${purchased ? 'upgrade-purchased' : ''}" data-upgrade-id="${upgrade.id}" ${!canAfford || purchased ? 'disabled' : ''}>
                    ${purchased ? 'COMPRADO' : 'COMPRAR'}
                </button>
            </div>
        `;
        
        const buyButton = item.querySelector('.buy-upgrade-button');
        if (!purchased) {
            buyButton.onclick = () => buyUpgradeHandler(upgrade);
        }
        
        shopGrid.appendChild(item);
    });
}

function buyUpgradeHandler(upgrade) {
    const p = p1;
    
    if (hasUpgrade(p, upgrade.id)) {
        log(`Melhoria '${upgrade.name}' já foi comprada.`, 'log-negative');
        return;
    }
    
    if (p.briks < upgrade.cost) {
        log(`Você precisa de ${upgrade.cost} Briks para comprar '${upgrade.name}'.`, 'log-negative');
        return;
    }
    
    p.briks -= upgrade.cost;
    p.upgrades.push(upgrade.id);
    
    log(`<span class="log-event log-positive">${p.name}</span> comprou a melhoria: <span class="log-event">${upgrade.name}</span>, gastando ${upgrade.cost} Briks.`, 'log-positive');
    playSound('buy_upgrade');

    renderShop();
    updateUI();
}