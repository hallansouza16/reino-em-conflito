const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const crypto = require('crypto');

// Importar utilitários compartilhados
const {
    CHARACTERS,
    CARDS,
    GAME_CONSTANTS,
    applyCardEffect,
    calculateCardCost,
    createPlayerState,
    processPlayerUpkeep,
    checkGameEndCondition,
    rollMarketCards
} = require('../js/shared/server-utils.js');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 4000;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

let rooms = {};

// Funções auxiliares
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}



function createGameState(player1Id, player2Id, player1Char, player2Char) {
    const char1 = CHARACTERS.find(c => c.id === player1Char) || CHARACTERS[0];
    const char2 = CHARACTERS.find(c => c.id === player2Char) || CHARACTERS[0];

    return {
        playerInfo: {
            [player1Id]: {
                playerNum: 1,
                token: crypto.randomUUID(),
                character: char1
            },
            [player2Id]: {
                playerNum: 2,
                token: crypto.randomUUID(),
                character: char2
            }
        },
        playerStats: {
            [player1Id]: createPlayerState(player1Char, 1),
            [player2Id]: createPlayerState(player2Char, 2)
        },
        currentPlayerId: player1Id,
        turnCount: 1,
        currentSeason: 'Primavera',
        turnsInSeason: 0,
        marketCards: rollMarketCards(),
        isGameOver: false,
        createdAt: new Date().toISOString()
    };
}

function applyCardEffectServer(state, playerId, card, otherPlayerId) {
    const player = state.playerStats[playerId];
    const opponent = state.playerStats[otherPlayerId];

    // Verificar se o jogador pode comprar a carta
    if (player.coins < card.cost || player.ap < 1) {
        return false;
    }

    player.coins -= card.cost;
    player.ap -= 1;

    // Usar função compartilhada para aplicar efeito
    const effectResult = applyCardEffect(card, player, opponent);

    // Remover carta comprada do mercado
    state.marketCards = state.marketCards.filter(c => c.id !== card.id);

    // Repor cartas se necessário
    if (state.marketCards.length < 3) {
        const newCards = rollMarketCards(5 - state.marketCards.length);
        state.marketCards = state.marketCards.concat(newCards);
    }

    return effectResult;
}

function checkGameOver(state) {
    for (const playerId in state.playerStats) {
        const player = state.playerStats[playerId];
        const otherPlayerId = Object.keys(state.playerStats).find(id => id !== playerId);
        const opponent = state.playerStats[otherPlayerId];
        
        if (player.instability >= GAME_CONSTANTS.INSTABILITY_LIMIT) {
            return { 
                winner: otherPlayerId, 
                reason: `A Instabilidade de ${player.name} atingiu o limite de ${GAME_CONSTANTS.INSTABILITY_LIMIT}.` 
            };
        }
        if (opponent.army >= GAME_CONSTANTS.REBELLION_ARMY_LIMIT && player.instability >= GAME_CONSTANTS.INSTABILITY_LIMIT) {
            return { 
                winner: otherPlayerId, 
                reason: `${opponent.name} tinha um Exército de ${opponent.army} e ${player.name} atingiu ${GAME_CONSTANTS.INSTABILITY_LIMIT} de Instabilidade.` 
            };
        }
    }
    return null;
}

function processUpkeep(player) {
    const foodUpkeep = Math.floor(player.army * GAME_CONSTANTS.FOOD_UPKEEP_PER_ARMY);
    const influenceUpkeep = Math.floor(player.instability * GAME_CONSTANTS.INFLUENCE_UPKEEP_PER_INSTABILITY);
    
    player.food -= foodUpkeep;
    if (player.food < 0) {
        const penalty = Math.abs(player.food);
        player.army = Math.max(0, player.army - penalty);
        player.food = 0;
    }
    
    player.influence -= influenceUpkeep;
    if (player.influence < 0) {
        const penalty = Math.abs(player.influence);
        player.instability += penalty;
        player.influence = 0;
    }
}

// Lógica de estação (clima)
function processSeasonChanges(state) {
    state.turnsInSeason++;
    if (state.turnsInSeason >= 5) {
        state.turnsInSeason = 0;
        const seasons = ['Primavera', 'Verão', 'Outono', 'Inverno'];
        const currentIndex = seasons.indexOf(state.currentSeason);
        state.currentSeason = seasons[(currentIndex + 1) % seasons.length];
    }
    
    // Penalidade do Inverno
    if (state.currentSeason === 'Inverno') {
        const currentPlayerId = state.currentPlayerId;
        const player = state.playerStats[currentPlayerId];
        const extraFoodUpkeep = Math.floor(player.army * 0.5);
        player.food = Math.max(0, player.food - extraFoodUpkeep);
    }
}

function endTurn(state, roomId) {
    const currentPlayerId = state.currentPlayerId;
    const otherPlayerId = Object.keys(state.playerStats).find(id => id !== currentPlayerId);
    
    const player = state.playerStats[currentPlayerId];
    
    // Processar cooldown e resetar AP
    player.mineCooldown = Math.max(0, player.mineCooldown - 1);
    player.ap = GAME_CONSTANTS.ACTION_POINTS_MAX;
    
    // Processar upkeep
    processUpkeep(player);
    
    // Trocar jogador
    state.currentPlayerId = otherPlayerId;
    state.turnCount++;
    
    // Processar Clima (feito após a troca de turno para afetar o novo jogador no início do turno dele - na verdade, deve ser no turno do P1 para avançar a estação)
    if (state.playerInfo[state.currentPlayerId].playerNum === 1) {
        processSeasonChanges(state);
    } else if (state.currentSeason === 'Inverno') {
        // Se já for Inverno, aplicar a penalidade no P2 também
        const p2 = state.playerStats[state.currentPlayerId];
        const extraFoodUpkeep = Math.floor(p2.army * 0.5);
        p2.food = Math.max(0, p2.food - extraFoodUpkeep);
    }

    // Verificar fim de jogo
    const gameOverInfo = checkGameOver(state);
    if (gameOverInfo) {
        state.isGameOver = true;
        io.in(roomId).emit('gameOver', { 
            winner: gameOverInfo.winner, 
            reason: gameOverInfo.reason 
        });
        delete rooms[roomId];
        return;
    }
    
    io.in(roomId).emit('updateState', state);
}

function getAvailableRooms() { 
    return Object.values(rooms)
        .filter(r => r.players.length === 1 && !r.gameState?.isGameOver)
        .map(r => ({ 
            id: r.id, 
            playerCount: r.players.length,
            createdAt: r.createdAt 
        })); 
}

function cleanupEmptyRooms() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const roomId in rooms) {
        const room = rooms[roomId];
        const roomAge = now - new Date(room.createdAt).getTime();
        
        if (roomAge > oneHour || (room.gameState && room.gameState.isGameOver)) {
            delete rooms[roomId];
        }
    }
}

// Socket.IO
io.on('connection', (socket) => {
    console.log(`[CONECTADO] Jogador ${socket.id} conectou.`);

    // Enviar lista de salas disponíveis
    socket.emit('roomList', getAvailableRooms());

    socket.on('createRoom', (characterId) => {
        // Validar characterId
        if (!CHARACTERS.some(char => char.id === characterId)) {
            socket.emit('error', { message: 'Personagem inválido' });
            return;
        }

        const roomId = `sala_${Math.random().toString(36).substr(2, 8)}`;
        rooms[roomId] = { 
            id: roomId, 
            players: [{id: socket.id, character: characterId}], 
            gameState: null,
            createdAt: new Date().toISOString()
        };
        
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
        io.emit('roomList', getAvailableRooms());
        
        console.log(`[SALA CRIADA] ${roomId} por ${socket.id}`);
    });

    socket.on('joinRoom', (data) => {
        const { roomId, characterId } = data;
        const room = rooms[roomId];
        
        if (!room) {
            socket.emit('error', { message: 'Sala não encontrada' });
            return;
        }
        
        if (room.players.length >= 2) {
            socket.emit('error', { message: 'Sala cheia' });
            return;
        }

        if (!CHARACTERS.some(char => char.id === characterId)) {
            socket.emit('error', { message: 'Personagem inválido' });
            return;
        }

        const player1Data = room.players[0];
        const player2Data = { id: socket.id, character: characterId };
        
        room.players.push(player2Data);
        socket.join(roomId);
        
        // Criar estado do jogo
        room.gameState = createGameState(
            player1Data.id, 
            player2Data.id, 
            player1Data.character, 
            player2Data.character
        );
        
        const state = room.gameState;
        
        // Enviar credenciais para ambos os jogadores
        io.to(player1Data.id).emit('gameCredentials', { 
            token: state.playerInfo[player1Data.id].token, 
            roomId, 
            selfId: player1Data.id 
        });
        
        io.to(player2Data.id).emit('gameCredentials', { 
            token: state.playerInfo[player2Data.id].token, 
            roomId, 
            selfId: player2Data.id 
        });
        
        // Atualizar estado para ambos
        io.in(roomId).emit('updateState', state);
        io.emit('roomList', getAvailableRooms());
        
        console.log(`[JOGADOR ENTROU] ${socket.id} entrou na sala ${roomId}`);
    });
    
    socket.on('makeChoice', ({ roomId, choice, token, choiceData }) => {
        const room = rooms[roomId];
        if (!room || !room.gameState) {
            socket.emit('error', { message: 'Sala ou jogo não encontrado' });
            return;
        }
        
        const state = room.gameState;
        
        // Verificar se é a vez do jogador e token válido
        if (socket.id !== state.currentPlayerId || state.playerInfo[socket.id]?.token !== token) {
            socket.emit('error', { message: 'Não é sua vez ou token inválido' });
            return;
        }

        const otherPlayerId = Object.keys(state.playerStats).find(id => id !== socket.id);
        const player = state.playerStats[socket.id];
        const opponent = state.playerStats[otherPlayerId];
        
        let actionPerformed = false;

        switch (choice) {
            case 'mine':
                if (player.ap >= 1 && player.mineCooldown === 0) {
                    let gainCoins = 4;
                    let gainFood = 5;
                    // Bônus do Verão
                    if (state.currentSeason === 'Verão') gainCoins += 1;
                    // Bônus de Upgrades e Construções
                    if (player.buildings && player.buildings.includes('mill')) gainFood += 3;
                    if (player.upgrades && player.upgrades.includes('agri_tech')) gainFood += 2;
                    
                    player.coins += gainCoins;
                    player.food += gainFood;
                    player.ap -= 1;
                    player.mineCooldown = GAME_CONSTANTS.MINE_COOLDOWN_MAX;
                    
                    // Ultimate Charge
                    player.ultimateCharge = Math.min(GAME_CONSTANTS.ULTIMATE_CHARGE_MAX, player.ultimateCharge + 1);
                    actionPerformed = true;
                }
                break;
                
            case 'recruit':
                const recruitCost = (player.buildings && player.buildings.includes('barracks')) ? Math.max(1, 3 - 1) : 3;
                if (player.ap >= 1 && player.coins >= recruitCost && player.food >= 3) {
                    let gainArmy = 3;
                    if (player.upgrades && player.upgrades.includes('royal_guard')) gainArmy += 1;
                    if (player.buildings && player.buildings.includes('barracks')) gainArmy += 1;
                    
                    player.coins -= recruitCost;
                    player.food -= 3;
                    player.army += gainArmy;
                    player.ap -= 1;
                    actionPerformed = true;
                }
                break;
                
            case 'fortify':
                const fortifyCost = 4;
                if (player.ap >= 1 && player.coins >= fortifyCost && player.influence >= 2) {
                    player.coins -= fortifyCost;
                    player.influence -= 2;
                    player.instability = Math.max(0, player.instability - 3);
                    player.instability += 1;
                    player.ap -= 1;
                    actionPerformed = true;
                }
                break;
                
            case 'war':
                if (player.army >= 10 && player.ap >= 1) {
                    player.army -= 10;
                    player.ap -= 1;
                    player.instability += 3;

                    if (player.army > opponent.army) {
                        const armyDiff = player.army - opponent.army;
                        const coinsGained = Math.min(opponent.coins, Math.floor(armyDiff / 2) + 5);
                        player.coins += coinsGained;
                        player.briks += 1;
                        opponent.coins -= coinsGained;
                        opponent.army = Math.max(0, opponent.army - armyDiff);
                    } else if (player.army < opponent.army) {
                        const armyDiff = opponent.army - player.army;
                        const coinsLost = Math.min(player.coins, Math.floor(armyDiff / 2) + 3);
                        player.coins -= coinsLost;
                        opponent.coins += coinsLost;
                        player.army = Math.max(0, player.army - armyDiff);
                    } else {
                        player.instability += 1;
                        opponent.instability += 1;
                    }
                    actionPerformed = true;
                }
                break;

            case 'specialAbility':
                if (player.ap >= 1) {
                    const charObj = CHARACTERS.find(c => c.id === player.characterId);
                    if (charObj && charObj.specialAbility) {
                        const result = charObj.specialAbility(player, opponent);
                        if (result) actionPerformed = true;
                    }
                }
                break;

            case 'useUltimate':
                if (player.ultimateCharge >= GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) {
                    player.ultimateCharge = 0;
                    const charId = player.characterId;
                    switch(charId) {
                        case 'rei':
                            player.army += 10;
                            player.food += 10;
                            break;
                        case 'bruxa':
                            opponent.ap = 0;
                            if(!opponent.status) opponent.status = [];
                            opponent.status.push('LOW_MORALE');
                            break;
                        case 'ladrão':
                            const stolen = Math.floor(opponent.coins * 0.5);
                            opponent.coins -= stolen;
                            player.coins += stolen;
                            break;
                        default:
                            player.ap += 2;
                            player.coins += 5;
                    }
                    actionPerformed = true;
                }
                break;
                
            case 'buyBuilding':
                const buildingId = choiceData && choiceData.buildingId;
                if (!buildingId) break;
                
                // Assuming GAME_CONSTANTS.BUILDINGS or similar isn't directly exposed in server-utils yet, but we can hardcode costs for now or import it correctly.
                // Let's check GAME_CONSTANTS.BUILDINGS.
                const building = GAME_CONSTANTS.BUILDINGS && GAME_CONSTANTS.BUILDINGS.find(b => b.id === buildingId);
                
                if (building && player.briks >= building.cost && !player.buildings.includes(buildingId)) {
                    player.briks -= building.cost;
                    player.buildings.push(buildingId);
                    actionPerformed = true;
                }
                break;

            case 'endTurn':
                endTurn(state, roomId);
                return;
        }

        if (actionPerformed) {
            const gameOverInfo = checkGameOver(state);
            if (gameOverInfo) {
                state.isGameOver = true;
                io.in(roomId).emit('gameOver', { 
                    winner: gameOverInfo.winner, 
                    reason: gameOverInfo.reason 
                });
                delete rooms[roomId];
                return;
            }

            io.in(roomId).emit('updateState', state);
        }
    });

    socket.on('buyCard', ({ roomId, cardIndex, token }) => {
        const room = rooms[roomId];
        if (!room || !room.gameState) {
            socket.emit('error', { message: 'Sala ou jogo não encontrado' });
            return;
        }
        
        const state = room.gameState;
        if (socket.id !== state.currentPlayerId || state.playerInfo[socket.id]?.token !== token) {
            socket.emit('error', { message: 'Não é sua vez ou token inválido' });
            return;
        }

        const otherPlayerId = Object.keys(state.playerStats).find(id => id !== socket.id);
        const card = state.marketCards[cardIndex];
        
        if (!card) {
            socket.emit('error', { message: 'Carta não encontrada' });
            return;
        }

        const effectResult = applyCardEffectServer(state, socket.id, card, otherPlayerId);
        
        if (effectResult !== false) {
            const gameOverInfo = checkGameOver(state);
            if (gameOverInfo) {
                state.isGameOver = true;
                io.in(roomId).emit('gameOver', { 
                    winner: gameOverInfo.winner, 
                    reason: gameOverInfo.reason 
                });
                delete rooms[roomId];
                return;
            }
            
            io.in(roomId).emit('updateState', state);
        }
    });

    socket.on('attemptReconnect', ({ token, roomId }) => {
        const room = rooms[roomId];
        if (!room || !room.gameState) { 
            socket.emit('reconnectFailed'); 
            return; 
        }
        
        const state = room.gameState;
        let oldPlayerId = Object.keys(state.playerInfo).find(id => state.playerInfo[id].token === token);

        if (oldPlayerId && oldPlayerId !== socket.id) {
            // Transferir dados do jogador para o novo socket ID
            state.playerInfo[socket.id] = state.playerInfo[oldPlayerId];
            delete state.playerInfo[oldPlayerId];
            
            state.playerStats[socket.id] = state.playerStats[oldPlayerId];
            delete state.playerStats[oldPlayerId];
            
            if (state.currentPlayerId === oldPlayerId) {
                state.currentPlayerId = socket.id;
            }
            
            // Atualizar na lista de players da sala
            const playerIndex = room.players.findIndex(p => p.id === oldPlayerId);
            if (playerIndex > -1) {
                room.players[playerIndex].id = socket.id;
            }
            
            socket.join(roomId);
            io.to(socket.id).emit('gameCredentials', { token, roomId, selfId: socket.id });
            io.in(roomId).emit('updateState', state);
            
            console.log(`[RECONECTADO] ${oldPlayerId} -> ${socket.id} na sala ${roomId}`);
        } else if (oldPlayerId === socket.id) {
            socket.join(roomId);
            socket.emit('updateState', state);
        } else {
            socket.emit('reconnectFailed');
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`[DESCONECTADO] Jogador ${socket.id} desconectou. Motivo: ${reason}`);
        io.emit('roomList', getAvailableRooms());
    });
});

// Limpeza periódica de salas
setInterval(cleanupEmptyRooms, 30 * 60 * 1000); // A cada 30 minutos

server.listen(PORT, () => { 
    console.log(`🎮 Servidor multiplayer rodando na porta ${PORT}`);
    console.log(`📁 Servindo arquivos estáticos de: ${path.join(__dirname, '..')}`);
});