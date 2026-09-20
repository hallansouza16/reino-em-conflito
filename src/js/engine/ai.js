// ============================================================
//  ai.js — Reino em Conflito Remaster
//  Sistema de IA: personagens, comportamentos e lógica de turno
// ============================================================

import { GAME_CONSTANTS } from './constants.js';

// ============================================================
//  AI_CHARACTERS (9 personagens IA, stats levemente superiores)
// ============================================================

export const AI_CHARACTERS = [
  {
    id: 'rei_sombrio',
    name: 'Rei Sombrio',
    image: 'assets/images/characters/rei.png',
    initial: {
      coins: 10,
      army: 4,
      instability: 2,
      food: 5,
      influence: 7,
      briks: 3,
    },
    behavior: 'balanced',
    difficulty: 'normal',
    description: 'Um rei experiente que equilibra guerra e diplomacia.',
  },
  {
    id: 'rainha_gelo',
    name: 'Rainha de Gelo',
    image: 'assets/images/characters/rainha.png',
    initial: {
      coins: 7,
      army: 2,
      instability: 1,
      food: 6,
      influence: 10,
      briks: 3,
    },
    behavior: 'diplomatic',
    difficulty: 'normal',
    description: 'Mestre de cartas de status e influência política.',
  },
  {
    id: 'ferreiro_guerra',
    name: 'Ferreiro de Guerra',
    image: 'assets/images/characters/ferreiro.png',
    initial: {
      coins: 6,
      army: 4,
      instability: 2,
      food: 4,
      influence: 4,
      briks: 6,
    },
    behavior: 'military',
    difficulty: 'normal',
    description: 'Prioriza edificações e exércitos acima de tudo.',
  },
  {
    id: 'ladrao_sombras',
    name: 'Ladrão das Sombras',
    image: 'assets/images/characters/ladrão.png',
    initial: {
      coins: 12,
      army: 2,
      instability: 3,
      food: 3,
      influence: 4,
      briks: 2,
    },
    behavior: 'economic',
    difficulty: 'hard',
    description: 'Acumula moedas e sabota o inimigo constantemente.',
  },
  {
    id: 'amante_veneno',
    name: 'Amante do Veneno',
    image: 'assets/images/characters/amante.png',
    initial: {
      coins: 7,
      army: 2,
      instability: 2,
      food: 5,
      influence: 8,
      briks: 2,
    },
    behavior: 'aggressive',
    difficulty: 'hard',
    description: 'Usa cartas Opponent para destruir o adversário.',
  },
  {
    id: 'general_ferro',
    name: 'General de Ferro',
    image: 'assets/images/characters/soldado.png',
    initial: {
      coins: 6,
      army: 6,
      instability: 3,
      food: 4,
      influence: 3,
      briks: 3,
    },
    behavior: 'aggressive',
    difficulty: 'hard',
    description: 'Declara guerra toda vez que tiver oportunidade.',
  },
  {
    id: 'mago_codigo',
    name: 'Mago do Código',
    image: 'assets/images/characters/mestre programador.png',
    initial: {
      coins: 8,
      army: 2,
      instability: 2,
      food: 4,
      influence: 6,
      briks: 4,
    },
    behavior: 'strategic',
    difficulty: 'hard',
    description: 'Analisa o estado do jogo e toma decisões ótimas.',
  },
  {
    id: 'princesa_espinhos',
    name: 'Princesa dos Espinhos',
    image: 'assets/images/characters/princesa real.png',
    initial: {
      coins: 7,
      army: 3,
      instability: 1,
      food: 6,
      influence: 8,
      briks: 3,
    },
    behavior: 'balanced',
    difficulty: 'normal',
    description: 'Mantém alta influência e baixa instabilidade.',
  },
  {
    id: 'bruxa_caos',
    name: 'Bruxa do Caos',
    image: 'assets/images/characters/bruxa.png',
    initial: {
      coins: 8,
      army: 3,
      instability: 4,
      food: 3,
      influence: 7,
      briks: 2,
    },
    behavior: 'unpredictable',
    difficulty: 'hard',
    description: 'Comportamento imprevisível — pode fazer qualquer coisa.',
  },
];

// ============================================================
//  getAIBehavior — retorna pesos/prioridades por comportamento
// ============================================================

export function getAIBehavior(behavior) {
  const behaviors = {
    balanced: {
      mine:    0.35,
      recruit: 0.25,
      fortify: 0.20,
      war:     0.20,
      preferredCardTypes: ['Self', 'Gamble'],
    },
    economic: {
      mine:    0.55,
      recruit: 0.15,
      fortify: 0.15,
      war:     0.15,
      preferredCardTypes: ['Self', 'Gamble'],
    },
    military: {
      mine:    0.20,
      recruit: 0.40,
      fortify: 0.15,
      war:     0.25,
      preferredCardTypes: ['Self'],
      preferCardName: 'Recrutamento Rápido',
    },
    aggressive: {
      mine:    0.15,
      recruit: 0.25,
      fortify: 0.10,
      war:     0.50,
      preferredCardTypes: ['Opponent'],
    },
    diplomatic: {
      mine:    0.25,
      recruit: 0.15,
      fortify: 0.30,
      war:     0.10,
      preferredCardTypes: ['Status'],
    },
    strategic: {
      mine:    0.30,
      recruit: 0.25,
      fortify: 0.25,
      war:     0.20,
      preferredCardTypes: ['Self', 'Status', 'Opponent'],
    },
    unpredictable: {
      mine:    0.25,
      recruit: 0.25,
      fortify: 0.25,
      war:     0.25,
      preferredCardTypes: ['Self', 'Opponent', 'Gamble', 'Status'],
    },
  };

  return behaviors[behavior] || behaviors.balanced;
}

// ============================================================
//  _selectCardIndex — escolhe carta do mercado baseado no behavior
// ============================================================

function _selectCardIndex(market, behavior, aiPlayer) {
  const prefs = getAIBehavior(behavior);

  // Filtra cartas que a IA pode pagar
  const affordable = market
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => card.cost <= aiPlayer.coins);

  if (affordable.length === 0) return -1;

  // Tenta achar carta do tipo preferido
  const preferred = affordable.filter(({ card }) =>
    prefs.preferredCardTypes.includes(card.type),
  );

  const pool = preferred.length > 0 ? preferred : affordable;

  // Ordena por custo menor primeiro (conservadorismo econômico)
  pool.sort((a, b) => a.card.cost - b.card.cost);

  // behavior 'unpredictable' escolhe aleatório
  if (behavior === 'unpredictable') {
    return pool[Math.floor(Math.random() * pool.length)].idx;
  }

  return pool[0].idx;
}

// ============================================================
//  _shouldDeclareWar — decide se a IA ataca
// ============================================================

function _shouldDeclareWar(aiPlayer, humanPlayer, behavior) {
  const prefs = getAIBehavior(behavior);
  const advantaged = aiPlayer.army > humanPlayer.army;
  const baseChance = prefs.war;

  if (aiPlayer.army <= 1) return false;
  if (behavior === 'aggressive' && advantaged) return true;
  if (behavior === 'military' && aiPlayer.army >= 4) return Math.random() < 0.7;

  return advantaged && Math.random() < baseChance;
}

// ============================================================
//  _shouldBuyCard — decide se a IA vai ao mercado
// ============================================================

function _shouldBuyCard(aiPlayer, market, behavior) {
  const hasCheapCard = market.some(c => c.cost <= aiPlayer.coins);
  if (!hasCheapCard) return false;

  const econ = getAIBehavior(behavior);
  // economic gasta menos coins em cartas, guarda pra minerar
  const chance = behavior === 'economic' ? 0.4 : 0.65;
  return Math.random() < chance;
}

// ============================================================
//  aiTurn — executa o turno da IA e retorna array de ações
// ============================================================

export function aiTurn(gameState) {
  const ai    = gameState.getOpponent();    // players[1]
  const human = gameState.getPlayer();      // players[0]
  const behavior = ai.char && ai.char.behavior ? ai.char.behavior : 'balanced';

  const actions = [];
  let ap = GAME_CONSTANTS.ACTION_POINTS_MAX;

  const addAction = (action, delay = 600) => {
    actions.push({ action, delay: 500 + Math.floor(Math.random() * 300) });
  };

  while (ap > 0) {
    ap -= 1;

    const roll = Math.random();
    const prefs = getAIBehavior(behavior);

    const canMine    = ai.mineCooldown === 0;
    const canRecruit = ai.coins >= GAME_CONSTANTS.RECRUIT_COST_BASE;
    const canFortify = ai.coins >= GAME_CONSTANTS.FORTIFY_COST_BASE;
    const canWar     = ai.army > 0;
    const canCard    = _shouldBuyCard(ai, gameState.market, behavior);

    // Prioridade de sobrevivência: instabilidade alta → fortify
    if (ai.instability >= 7 && canFortify) {
      addAction('fortify');
      gameState.fortifyAction(ai);
      continue;
    }

    // Prioridade de sobrevivência: sem comida → compra Armazém Cheio se disponível
    if (ai.food <= 1) {
      const armazIdx = gameState.market.findIndex(c => c.id === 'armazem_cheio' && c.cost <= ai.coins);
      if (armazIdx >= 0) {
        addAction({ type: 'card', index: armazIdx });
        gameState.buyCard(armazIdx, ai);
        continue;
      }
    }

    // Decisão baseada nos pesos
    const actions_pool = [];
    if (canMine)    { for (let i = 0; i < Math.round(prefs.mine    * 10); i++) actions_pool.push('mine');    }
    if (canRecruit) { for (let i = 0; i < Math.round(prefs.recruit * 10); i++) actions_pool.push('recruit'); }
    if (canFortify) { for (let i = 0; i < Math.round(prefs.fortify * 10); i++) actions_pool.push('fortify'); }
    if (canWar)     { for (let i = 0; i < Math.round(prefs.war     * 10); i++) actions_pool.push('war');     }
    if (canCard)    { actions_pool.push('card'); actions_pool.push('card'); }

    if (actions_pool.length === 0) break;

    const chosen = actions_pool[Math.floor(Math.random() * actions_pool.length)];

    if (chosen === 'mine' && canMine) {
      addAction('mine');
      gameState.mineAction(ai);

    } else if (chosen === 'recruit' && canRecruit) {
      addAction('recruit');
      gameState.recruitAction(ai);

    } else if (chosen === 'fortify' && canFortify) {
      addAction('fortify');
      gameState.fortifyAction(ai);

    } else if (chosen === 'war' && canWar) {
      if (_shouldDeclareWar(ai, human, behavior)) {
        addAction('war');
        gameState.warAction(1); // index 1 = IA
      } else {
        addAction('mine');
        if (canMine) gameState.mineAction(ai);
      }

    } else if (chosen === 'card') {
      const cardIdx = _selectCardIndex(gameState.market, behavior, ai);
      if (cardIdx >= 0) {
        addAction({ type: 'card', index: cardIdx });
        gameState.buyCard(cardIdx, ai);
      }
    }
  }

  // Usa ultimate se disponível
  if (ai.ultimateCharge >= GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) {
    addAction('ultimate');
    gameState.useUltimate(ai, human);
  }

  return actions;
}
