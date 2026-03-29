// Utilitários compartilhados entre cliente e servidor para Reino em Conflito

// Importações necessárias
import { CHARACTERS } from './characters.js';
import { CARDS } from './cards.js';
import { GAME_CONSTANTS } from './constants.js';

// Função para aplicar efeito de carta (compatível com servidor)
export function applyCardEffect(card, player, opponent) {
    try {
        // Se a carta tem efeito como função (singleplayer)
        if (typeof card.effect === 'function') {
            return card.effect(player, opponent);
        }

        // Se a carta tem efeito como string (multiplayer legado)
        if (typeof card.effect === 'string') {
            const effects = card.effect.split(',');
            let result = [];

            effects.forEach(effect => {
                const trimmed = effect.trim();
                if (trimmed === 'gamble') {
                    if (Math.random() < 0.5) {
                        player.coins += 10;
                        result.push("SUCESSO! +10 Moedas");
                    } else {
                        opponent.instability = Math.max(0, opponent.instability - 2);
                        result.push("FALHA! Oponente perde -2 Instabilidade");
                    }
                } else {
                    const parts = trimmed.split('_');
                    if (parts.length === 2) {
                        const [target, operation] = parts;
                        const [stat, value] = operation.split(/(?=[+-])/);
                        const change = parseInt(value);

                        if (target === 'op') {
                            applyStatChange(opponent, stat, change, result);
                        } else {
                            applyStatChange(player, stat, change, result);
                        }
                    } else {
                        const [stat, value] = trimmed.split(/(?=[+-])/);
                        const change = parseInt(value);
                        applyStatChange(player, stat, change, result);
                    }
                }
            });

            return result.join(', ');
        }

        return "Efeito não aplicável";
    } catch (error) {
        console.error(`Erro ao aplicar efeito da carta ${card.name}:`, error);
        return "Erro no efeito da carta";
    }
}

function applyStatChange(player, stat, change, result) {
    const statNames = {
        army: 'Exército',
        coins: 'Moedas',
        food: 'Comida',
        instability: 'Instabilidade',
        influence: 'Influência'
    };

    if (stat in player) {
        player[stat] = Math.max(0, player[stat] + change);
        const statName = statNames[stat] || stat;
        result.push(`${change >= 0 ? '+' : ''}${change} ${statName}`);
    }
}

// Função para calcular custo de carta considerando modificadores de personagem
export function calculateCardCost(card, player, character) {
    let cost = card.cost;

    // Aplicar modificadores de personagem
    if (character && character.costModifier) {
        cost += character.costModifier(card);
    }

    // Aplicar modificadores de status
    if (player.status && player.status.includes('HIGH_TAXES')) {
        cost += 1;
    }

    return Math.max(1, cost);
}

// Função para criar estado inicial do jogador baseado no personagem
export function createPlayerState(characterId, playerNum) {
    const character = CHARACTERS.find(c => c.id === characterId);
    if (!character) {
        throw new Error(`Personagem ${characterId} não encontrado`);
    }

    return {
        coins: character.initial.coins,
        army: character.initial.army,
        instability: character.initial.instability,
        food: character.initial.food,
        influence: character.initial.influence,
        briks: character.initial.briks,
        ap: GAME_CONSTANTS.ACTION_POINTS_MAX,
        mineCooldown: 0,
        status: [],
        upgrades: [],
        name: `Jogador ${playerNum}`,
        charName: character.name,
        characterId: characterId,
        playerNumber: playerNum
    };
}

// Função para processar upkeep (manutenção) do jogador
export function processPlayerUpkeep(player, character) {
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

    // Aplicar efeito passivo do personagem
    if (character && character.effect) {
        character.effect(player);
    }
}

// Função para verificar condições de fim de jogo
export function checkGameEndCondition(player, opponent) {
    if (player.instability >= GAME_CONSTANTS.INSTABILITY_LIMIT) {
        return {
            gameOver: true,
            winner: opponent,
            reason: `A Instabilidade de ${player.name} atingiu o limite de ${GAME_CONSTANTS.INSTABILITY_LIMIT}.`
        };
    }

    if (opponent.army >= GAME_CONSTANTS.REBELLION_ARMY_LIMIT && player.instability >= GAME_CONSTANTS.INSTABILITY_LIMIT) {
        return {
            gameOver: true,
            winner: opponent,
            reason: `${opponent.name} tinha um Exército de ${opponent.army} e ${player.name} atingiu ${GAME_CONSTANTS.INSTABILITY_LIMIT} de Instabilidade.`
        };
    }

    return { gameOver: false };
}

// Função para rolar cartas do mercado
export function rollMarketCards(count = 5) {
    const availableCards = [...CARDS];
    shuffleArray(availableCards);
    return availableCards.slice(0, count);
}

// Função auxiliar para embaralhar array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export { CHARACTERS, CARDS, GAME_CONSTANTS };