import {
    GAME_CONSTANTS,
    STATUS_DEFINITIONS,
    ACHIEVEMENTS,
    UPGRADES
} from './shared/constants.js';
import { CHARACTERS } from './shared/characters.js';
import { CARDS } from './shared/cards.js';
import {
    playSound,
    shakeElement,
    hasStatus,
    hasUpgrade,
    addStatus,
    calculateCost,
    renderCharacterSelection
} from './shared/utils.js';

const socket = io(window.location.origin);

// Usar constantes do módulo
const {
    ACTION_POINTS_MAX,
    INSTABILITY_LIMIT,
    REBELLION_ARMY_LIMIT,
    MAX_STAT_DEFAULT,
    MAX_STAT_RESOURCE,
    MINE_COOLDOWN_MAX
} = GAME_CONSTANTS;

// Elementos da UI
const gameContainer = document.getElementById('game-container');
const selectionScreen = document.getElementById('selection-screen');
const lobbyScreen = document.getElementById('lobby-screen');
const waitingScreen = document.getElementById('waiting-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');

const continueToLobbyBtn = document.getElementById('continue-to-lobby-btn');
const createRoomBtn = document.getElementById('create-room-btn');
const roomListEl = document.getElementById('room-list');
const roomIdDisplay = document.getElementById('room-id-display');
const waitingOverlay = document.getElementById('waiting-turn-overlay');

// Estado do jogo
let myPlayerNum = null;
let selfId = null;
let currentRoomId = null;
let selectedCharacter = null;
let currentServerState = null;

// Sistema de Log
const log = (message, className = '') => {
    const logDisplay = document.getElementById('log-display');
    if (!logDisplay) return;

    const p = document.createElement('p');
    p.className = className;
    
    // Prefixos baseados no personagem ativo
    let prefix = '';
    if (selectedCharacter && (className.includes('log-positive') || className.includes('log-event') || !className)) {
        prefix = `<span class="log-event">[${selectedCharacter.name}]</span> `;
    }
    
    p.innerHTML = prefix + message;
    logDisplay.prepend(p);
    while (logDisplay.children.length > 50) {
        logDisplay.removeChild(logDisplay.lastChild);
    }
};

// Função auxiliar para cores das cartas
function getCardColorByType(cardType) {
    const colorMap = {
        'Self': 'var(--color-army)',
        'Opponent': 'var(--color-instability)',
        'Gamble': 'var(--color-shop)',
        'Status': 'var(--color-influence)'
    };
    return colorMap[cardType] || 'var(--color-gold)';
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    renderCharacterSelection('character-grid', selectCharacter);
    setupEventListeners();
    showScreen('selection'); // Começar na tela de seleção
});

function setupEventListeners() {
    // Botão para continuar da seleção para o lobby
    continueToLobbyBtn.addEventListener('click', () => {
        if (!selectedCharacter) {
            alert('Por favor, selecione um personagem primeiro!');
            return;
        }
        showScreen('lobby');
        socket.emit('getRoomList'); // Solicitar lista de salas ao conectar
    });

    createRoomBtn.addEventListener('click', () => {
        if (!selectedCharacter) {
            alert('Por favor, selecione um personagem primeiro!');
            return;
        }
        socket.emit('createRoom', selectedCharacter.id);
    });

    document.getElementById('back-to-lobby-btn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    // Ações do jogo
    document.getElementById('mine-button').addEventListener('click', () => {
        const token = sessionStorage.getItem('reconnectToken');
        const roomId = sessionStorage.getItem('roomId');
        socket.emit('makeChoice', { roomId, choice: 'mine', token });
        
        if (window.visualEffects) window.visualEffects.playMineEffects();
        if (selectedCharacter) {
            if (selectedCharacter.id === 'ladrão') {
                if (window.visualEffects) window.visualEffects.playPassiveFeedback('ladrão');
            }
        }
    });

    document.getElementById('recruit-button').addEventListener('click', () => {
        const token = sessionStorage.getItem('reconnectToken');
        const roomId = sessionStorage.getItem('roomId');
        socket.emit('makeChoice', { roomId, choice: 'recruit', token });
        
        if (window.visualEffects) window.visualEffects.playRecruitEffects();
    });

    document.getElementById('fortify-button').addEventListener('click', () => {
        const token = sessionStorage.getItem('reconnectToken');
        const roomId = sessionStorage.getItem('roomId');
        socket.emit('makeChoice', { roomId, choice: 'fortify', token });
    });

    document.getElementById('war-button').addEventListener('click', () => {
        const token = sessionStorage.getItem('reconnectToken');
        const roomId = sessionStorage.getItem('roomId');
        socket.emit('makeChoice', { roomId, choice: 'war', token });
        
        if (window.visualEffects) window.visualEffects.playWarEffects();
        if (window.audioSystem) window.audioSystem.playWarCry();
        log(`⚔️ Você avança com fúria!`, 'log-war');
    });

    const specialAbilityBtn = document.getElementById('special-ability-button');
    if (specialAbilityBtn) {
        specialAbilityBtn.addEventListener('click', () => {
            const token = sessionStorage.getItem('reconnectToken');
            const roomId = sessionStorage.getItem('roomId');
            const charge = currentServerState?.playerStats?.[selfId]?.ultimateCharge || 0;
            
            if (charge >= GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) {
                socket.emit('makeChoice', { roomId, choice: 'useUltimate', token });
            } else {
                socket.emit('makeChoice', { roomId, choice: 'specialAbility', token });
            }
        });
    }

    // Listeners para Edificações
    document.querySelectorAll('.buildings-container .building-slot').forEach(slot => {
        slot.addEventListener('click', () => {
            // Verificar se o container atual pertence ao jogador ativo (mesmo número)
            const parentId = slot.parentElement.id; // p1-buildings ou p2-buildings
            if (parentId !== `p${myPlayerNum}-buildings`) return;
            
            const buildingId = slot.dataset.building;
            const token = sessionStorage.getItem('reconnectToken');
            const roomId = sessionStorage.getItem('roomId');
            
            socket.emit('makeChoice', { 
                roomId, 
                choice: 'buyBuilding', 
                token,
                choiceData: { buildingId }
            });
        });
    });


    document.getElementById('end-turn-button').addEventListener('click', () => {
        const token = sessionStorage.getItem('reconnectToken');
        const roomId = sessionStorage.getItem('roomId');
        socket.emit('makeChoice', { roomId, choice: 'endTurn', token });
    });

    // Loja no Multiplayer
    document.getElementById('shop-button').addEventListener('click', showShopModal);
    document.getElementById('shop-close-button').addEventListener('click', closeShopModal);
}

function selectCharacter(charId) {
    const char = CHARACTERS.find(c => c.id === charId);
    selectedCharacter = char;

    // Remover seleção anterior
    document.querySelectorAll('#character-grid .character-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Adicionar seleção ao personagem escolhido
    document.querySelector(`#character-grid .character-card[data-char-id="${charId}"]`).classList.add('selected');

    // Habilitar botão para continuar ao lobby
    continueToLobbyBtn.disabled = false;

    console.log(`Personagem selecionado: ${char.name}`);
}

function showScreen(screenName) {
    // Esconder todas as telas
    selectionScreen.style.display = 'none';
    lobbyScreen.style.display = 'none';
    waitingScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';

    // Mostrar apenas a tela solicitada
    switch(screenName) {
        case 'selection':
            selectionScreen.style.display = 'block';
            break;
        case 'lobby':
            lobbyScreen.style.display = 'block';
            break;
        case 'waiting':
            waitingScreen.style.display = 'block';
            break;
        case 'game':
            gameScreen.style.display = 'block';
            break;
        case 'gameOver':
            gameOverScreen.style.display = 'block';
            break;
    }

    console.log(`Tela alterada para: ${screenName}`);
}

function updateRoomList(rooms) {
    roomListEl.innerHTML = rooms.length === 0 ? '<p>Nenhuma sala disponível. Crie uma!</p>' : '';
    rooms.forEach(room => {
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item';
        roomItem.innerHTML = `
            <div>Sala: ${room.id}</div>
            <button class="join-room-btn" data-room-id="${room.id}">Entrar</button>
        `;
        roomListEl.appendChild(roomItem);
    });

    // Adicionar event listeners aos botões de entrar
    document.querySelectorAll('.join-room-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!selectedCharacter) {
                alert('Por favor, selecione um personagem primeiro!');
                return;
            }
            const roomId = e.target.dataset.roomId;
            socket.emit('joinRoom', { roomId, characterId: selectedCharacter.id });
        });
    });
}

function updateGameState(state) {
    selfId = sessionStorage.getItem('selfId');
    if (!selfId || !state.playerInfo[selfId]) return;
    
    currentServerState = state;
    myPlayerNum = state.playerInfo[selfId].playerNum;
    showScreen('game');

    const isMyTurn = state.currentPlayerId === selfId;
    if (waitingOverlay) {
        waitingOverlay.style.display = isMyTurn ? 'none' : 'block';
    }

    for (const playerId in state.playerStats) {
        const playerStats = state.playerStats[playerId];
        const playerInfo = state.playerInfo[playerId];
        const pNum = playerInfo?.playerNum;
        if (!pNum) continue;

        // Atualizar avatar com imagem do personagem
        const avatar = document.getElementById(`p${pNum}-avatar`);
        if (playerInfo.character && avatar) {
            avatar.style.backgroundImage = `url('${playerInfo.character.image}')`;
        }

        // Atualizar nome do personagem
        const charNameEl = document.getElementById(`p${pNum}-character-name`);
        if (charNameEl) {
            charNameEl.textContent = playerStats.charName;
        }

        const currenciesEl = document.getElementById(`p${pNum}-currencies-display`);
        if (currenciesEl) {
            currenciesEl.innerHTML = `
                <span style="display: block;">${playerStats.coins} Moedas</span>
                <span style="color: var(--color-shop);">${playerStats.briks} Briks 🧱</span>
            `;
        }

        const stats = [
            { id: 'ap', max: ACTION_POINTS_MAX, fillClass: 'ap-fill' },
            { id: 'army', max: MAX_STAT_DEFAULT, fillClass: 'army-fill' },
            { id: 'instability', max: INSTABILITY_LIMIT, fillClass: 'instability-fill' },
            { id: 'food', max: MAX_STAT_RESOURCE, fillClass: 'food-fill' },
            { id: 'influence', max: MAX_STAT_RESOURCE, fillClass: 'influence-fill' },
        ];

        stats.forEach(stat => {
            const fillEl = document.getElementById(`p${pNum}-${stat.id}-fill`);
            const valueEl = document.getElementById(`p${pNum}-${stat.id}-value`);
            
            if (fillEl && valueEl) {
                const percent = Math.min(100, (playerStats[stat.id] / stat.max) * 100);
                fillEl.style.width = `${percent}%`;
                valueEl.textContent = playerStats[stat.id];
            }
        });

        // Cooldown da mineração
        const cdFill = document.getElementById(`p${pNum}-mine-cooldown-fill`);
        const cdValue = document.getElementById(`p${pNum}-mine-cooldown-value`);
        const cdStat = document.getElementById(`p${pNum}-cooldown-stat`);
        
        if (cdFill && cdValue && cdStat) {
            const cdPercent = 100 - ((playerStats.mineCooldown / MINE_COOLDOWN_MAX) * 100);
            cdFill.style.width = `${cdPercent}%`;
            cdValue.textContent = playerStats.mineCooldown;
            cdStat.style.opacity = playerStats.mineCooldown > 0 ? 1 : 0.5;
        }

        // Status
        const statusEl = document.getElementById(`p${pNum}-status-display`);
        if (statusEl) {
            statusEl.innerHTML = '';
            if (playerStats.status) {
                playerStats.status.forEach(statusId => {
                    const def = STATUS_DEFINITIONS[statusId];
                    if (def) {
                        const token = document.createElement('span');
                        token.className = `status-token status-${def.type}`;
                        token.title = def.desc;
                        token.textContent = def.icon + ' ' + def.name;
                        statusEl.appendChild(token);
                    }
                });
            }
        }
        
        // Atualizar Edificações Visuais
        const buildContainer = document.getElementById(`p${pNum}-buildings`);
        if (buildContainer) {
            buildContainer.querySelectorAll('.building-slot').forEach(slot => {
                const bId = slot.dataset.building;
                if (playerStats.buildings && playerStats.buildings.includes(bId)) {
                    slot.classList.add('built');
                } else {
                    slot.classList.remove('built');
                }
            });
        }

        // Atualizar Barra de Ultimate
        const ultFill = document.getElementById(`p${pNum}-ultimate-fill`);
        if (ultFill) {
            const charge = playerStats.ultimateCharge || 0;
            const ultPercent = (charge / GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) * 100;
            ultFill.style.width = `${ultPercent}%`;
            
            const ultContainer = ultFill.parentElement;
            if (charge >= GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) {
                ultContainer.classList.add('ultimate-ready');
            } else {
                ultContainer.classList.remove('ultimate-ready');
            }
            
            // Reação do botão do jogador atual
            if (pNum === myPlayerNum) {
                const specialBtn = document.getElementById('special-ability-button');
                if (specialBtn) {
                    if (charge >= GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) {
                        specialBtn.classList.add('ult-ready');
                        specialBtn.innerHTML = '🔥 USAR ULTIMATE 🔥';
                    } else {
                        specialBtn.classList.remove('ult-ready');
                        specialBtn.innerHTML = '✨ HABILIDADE ESPECIAL';
                    }
                }
            }
        }

        // Indicador de turno
        const indicator = document.getElementById(`p${pNum}-turn-indicator`);
        if (indicator) {
            indicator.style.display = state.currentPlayerId === playerId ? 'block' : 'none';
            indicator.classList.toggle('active-pulse', state.currentPlayerId === playerId);
        }
    }
    
    // Informações gerais e Clima
    const turnCountEl = document.getElementById('turn-count-value');
    const rebellionEl = document.getElementById('rebellion-condition');
    
    if (turnCountEl) turnCountEl.textContent = state.turnCount;
    if (rebellionEl) rebellionEl.textContent = `Máx. Exército: ${REBELLION_ARMY_LIMIT}. Máx. Instabilidade: ${INSTABILITY_LIMIT}.`;

    // Atualizar Efeitos Sazonais (Clima)
    if (window.visualEffects && state.currentSeason) {
        window.visualEffects.applyWeather(state.currentSeason);
        
        // Exibir clima atual no header pra multiplayer 
        const titleEl = document.querySelector('.title');
        if (titleEl) {
            titleEl.textContent = `REINO EM CONFLITO - MULTIPLAYER (${state.currentSeason.toUpperCase()})`;
        }
    }

    // Atualizar ações do jogador atual
    const p = state.playerStats[selfId];
    const mineButton = document.getElementById('mine-button');
    const recruitButton = document.getElementById('recruit-button');
    const fortifyButton = document.getElementById('fortify-button');
    const warButton = document.getElementById('war-button');
    const specialAbilityButton = document.getElementById('special-ability-button');
    const endTurnButton = document.getElementById('end-turn-button');
    const shopButton = document.getElementById('shop-button');

    if (mineButton) mineButton.disabled = !isMyTurn || p.ap < 1 || p.mineCooldown > 0;
    
    let baseRecruitCost = 3;
    let baseFortifyCost = 4;
    // Opcional: puxar custo real igual no singleplayer se basearmos em configs de passiva

    if (recruitButton) recruitButton.disabled = !isMyTurn || p.ap < 1 || p.coins < baseRecruitCost || p.food < 3;
    if (fortifyButton) fortifyButton.disabled = !isMyTurn || p.ap < 1 || p.coins < baseFortifyCost || p.influence < 2;
    if (warButton) warButton.disabled = !isMyTurn || p.army < 10;
    if (specialAbilityButton) specialAbilityButton.disabled = !isMyTurn || p.ap < 1;
    if (endTurnButton) endTurnButton.disabled = !isMyTurn;
    if (shopButton) shopButton.disabled = !isMyTurn;

    // Mercado de cartas
    const marketEl = document.getElementById('card-market');
    if (marketEl && state.marketCards) {
        marketEl.innerHTML = '';
        state.marketCards.forEach((card, index) => {
            let finalCost = calculateCost(card.cost, p, true, card.type, selectedCharacter);
            const isAffordable = p.coins >= finalCost && p.ap >= 1 && isMyTurn;

            // Definir cores baseadas no tipo de carta
            const cardColor = card.color || getCardColorByType(card.type);
            const borderColor = cardColor;
            const backgroundColor = `${cardColor}20`;

            const cardButton = document.createElement('button');
            cardButton.className = 'card-buy-button';
            cardButton.disabled = !isAffordable;
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

            cardButton.onclick = () => {
                const token = sessionStorage.getItem('reconnectToken');
                const roomId = sessionStorage.getItem('roomId');
                socket.emit('buyCard', { roomId, cardIndex: index, token });
            };
            marketEl.appendChild(cardButton);
        });
    }

    // Mensagem do jogo
    const gameMessage = document.getElementById('game-message');
    if (gameMessage) {
        gameMessage.textContent = isMyTurn ? 
            `Turno ${state.turnCount} - SUA VEZ!` : 
            `Turno ${state.turnCount} - Vez do Oponente`;
    }

    // Conquistas
    checkAchievements(state.playerStats[selfId]);
}

function checkAchievements(player) {
    const display = document.getElementById('achievements-display');
    if (!display) return;
    
    let unlockedCount = 0;
    
    ACHIEVEMENTS.forEach(ach => {
        if (!ach.unlocked && ach.check(player)) {
            ach.unlocked = true;
            log(ach.log, 'log-event log-positive');
            
            // Usar novo sistema de Toast
            if (window.visualEffects) {
                window.visualEffects.showAchievementToast('Conquista Desbloqueada!', ach.name);
            }
            
            unlockedCount++;
        }
    });
    
    const list = ACHIEVEMENTS.map(ach => 
        `<span class="achievement-item ${ach.unlocked ? 'achievement-unlocked' : ''}" title="${ach.log}">${ach.name}</span>`
    ).join('');
    
    display.innerHTML = `<h3>Conquistas do Jogo</h3>${list}`;
}

// Sistema de Loja para Multiplayer
function showShopModal() {
    const token = sessionStorage.getItem('reconnectToken');
    const roomId = sessionStorage.getItem('roomId');
    
    if (!token || !roomId) {
        log('Não foi possível acessar a loja no momento.', 'log-negative');
        return;
    }
    
    renderShop();
    document.getElementById('shop-modal-overlay').style.display = 'flex';
}

function closeShopModal() {
    document.getElementById('shop-modal-overlay').style.display = 'none';
}

function renderShop() {
    const shopGrid = document.getElementById('upgrade-grid');
    if (!shopGrid) return;
    
    shopGrid.innerHTML = '';
    
    // Obter dados do jogador atual do estado do jogo
    const selfId = sessionStorage.getItem('selfId');
    const roomId = sessionStorage.getItem('roomId');
    
    if (!selfId || !roomId) return;
    
    // Em um cenário real, você obteria os dados do servidor
    // Por enquanto, vamos simular um jogador com alguns Briks
    const player = {
        briks: 5, // Exemplo
        upgrades: [] // Exemplo
    };
    
    UPGRADES.forEach(upgrade => {
        const purchased = hasUpgrade(player, upgrade.id);
        const canAfford = player.briks >= upgrade.cost;
        
        const item = document.createElement('div');
        item.className = 'upgrade-item';
        item.innerHTML = `
            <h4>${upgrade.name}</h4>
            <p>${upgrade.effect}</p>
            <div class="upgrade-cost-button">
                <span class="upgrade-cost">${upgrade.cost} 🧱 Briks</span>
                <button class="buy-upgrade-button ${purchased ? 'upgrade-purchased' : ''}" 
                        data-upgrade-id="${upgrade.id}" 
                        ${!canAfford || purchased ? 'disabled' : ''}>
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
    const token = sessionStorage.getItem('reconnectToken');
    const roomId = sessionStorage.getItem('roomId');
    
    if (!token || !roomId) {
        log('Erro ao processar compra.', 'log-negative');
        return;
    }
    
    // Em um cenário real, você enviaria uma requisição ao servidor
    // para comprar o upgrade e atualizar o estado do jogo
    log(`Compra da melhoria ${upgrade.name} processada!`, 'log-positive');
    playSound('buy_upgrade');
    
    // Fechar a loja após a compra
    closeShopModal();
}

// Socket event listeners
socket.on('connect', () => {
    console.log('Conectado ao servidor multiplayer!', socket.id);
    const token = sessionStorage.getItem('reconnectToken');
    const roomId = sessionStorage.getItem('roomId');
    if (token && roomId) {
        sessionStorage.setItem('selfId', socket.id);
        socket.emit('attemptReconnect', { token, roomId });
    }
    // Não vai para lobby automaticamente - permanece na seleção até escolher personagem
});

socket.on('reconnectFailed', () => {
    sessionStorage.clear();
    showScreen('selection'); // Voltar para seleção se falhar reconexão
});

socket.on('gameCredentials', ({ token, roomId, selfId: newSelfId }) => {
    sessionStorage.setItem('reconnectToken', token);
    sessionStorage.setItem('roomId', roomId);
    sessionStorage.setItem('selfId', newSelfId);
    selfId = newSelfId;
    currentRoomId = roomId;
});

socket.on('roomList', updateRoomList);

socket.on('roomCreated', (roomId) => { 
    roomIdDisplay.textContent = roomId; 
    showScreen('waiting'); 
});

socket.on('updateState', updateGameState);

socket.on('gameOver', ({ winner, reason }) => {
    const isWinner = winner === selfId;
    const winnerTitle = document.getElementById('winner-title');
    const reasonText = document.getElementById('reason-text');
    
    if (winnerTitle) winnerTitle.textContent = isWinner ? "🎉 VOCÊ VENCEU! 🎉" : "💀 VOCÊ PERDEU! 💀";
    if (reasonText) reasonText.textContent = reason;
    
    // Atualizar Ranks!
    if (isWinner) {
        if (window.RankSystem) window.RankSystem.addWin();
    } else {
        if (window.RankSystem) window.RankSystem.addLoss();
    }
    
    showScreen('gameOver');
});