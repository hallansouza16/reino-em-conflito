// ============================================================
//  state.js — Reino em Conflito Remaster
//  GameState: gerencia todo o estado do jogo sem depender de DOM
// ============================================================

import {
  GAME_CONSTANTS,
  CHARACTERS,
  CARDS,
  BUILDINGS,
  STATUS_DEFINITIONS,
  UPGRADES,
  ACHIEVEMENTS,
  CHOICE_EVENTS,
} from './constants.js';

// ============================================================
//  EventEmitter simples
// ============================================================

class EventEmitter {
  constructor() {
    this._listeners = {};
  }

  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return this;
  }

  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(l => l !== fn);
  }

  emit(event, ...args) {
    if (!this._listeners[event]) return;
    for (const fn of this._listeners[event]) fn(...args);
  }
}

// ============================================================
//  Helpers
// ============================================================

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function applyStatusTick(player) {
  const logs = [];
  if (!player.status) return logs;

  player.status = player.status.filter(s => {
    if (s.id === 'HIGH_TAXES') {
      player.coins = Math.max(0, player.coins - 1);
      logs.push(`${player.name}: -1 moeda (${s.name})`);
    }
    s.turnsLeft -= 1;
    return s.turnsLeft > 0;
  });

  return logs;
}

function consumeStatus(player, statusId) {
  if (!player.status) return false;
  const idx = player.status.findIndex(s => s.id === statusId);
  if (idx === -1) return false;
  player.status.splice(idx, 1);
  return true;
}

function hasStatus(player, statusId) {
  return player.status && player.status.some(s => s.id === statusId);
}

// ============================================================
//  GameState
// ============================================================

export class GameState extends EventEmitter {
  constructor() {
    super();
    this.players    = null;
    this.turn       = 0;         // 0 = jogador, 1 = IA
    this.round      = 1;
    this.season     = 'Primavera';
    this.market     = [];
    this.gameOver   = false;
    this.winner     = null;
    this.stats      = { victories: 0, gamesPlayed: 0 };
    this.actionPoints = GAME_CONSTANTS.ACTION_POINTS_MAX;
    this._pendingCombat = null;
  }

  // ----------------------------------------------------------
  //  Criação de jogador
  // ----------------------------------------------------------

  _createPlayer(characterId, isAI = false, aiData = null) {
    let char, initial;

    if (isAI && aiData) {
      char = aiData;
      initial = { ...aiData.initial };
    } else {
      char = CHARACTERS.find(c => c.id === characterId);
      if (!char) throw new Error(`Personagem "${characterId}" não encontrado.`);
      initial = { ...char.initial };
    }

    const player = {
      name:          isAI ? char.name : char.name,
      characterId:   char.id || characterId,
      isAI,
      coins:         initial.coins,
      army:          initial.army,
      instability:   initial.instability,
      food:          initial.food,
      influence:     initial.influence,
      briks:         initial.briks ?? 0,
      ultimateCharge: 0,
      mineCooldown:  0,
      status:        [],
      buildings:     [],
      upgrades:      [],
      hand:          [],
      char,
    };

    if (char.setup) char.setup(player);
    return player;
  }

  // ----------------------------------------------------------
  //  initGame
  // ----------------------------------------------------------

  initGame(characterId, aiCharacters) {
    // aiCharacters é o array importado de ai.js — pega um aleatório
    const aiData = pickRandom(aiCharacters);

    this.players = [
      this._createPlayer(characterId, false),
      this._createPlayer(null, true, aiData),
    ];

    this.turn          = 0;
    this.round         = 1;
    this.season        = 'Primavera';
    this.gameOver      = false;
    this.winner        = null;
    this.actionPoints  = GAME_CONSTANTS.ACTION_POINTS_MAX;
    this._pendingCombat = null;
    this.market        = this.rollMarketCards();
    this.stats.gamesPlayed += 1;

    this._log(`Jogo iniciado! ${this.players[0].name} vs ${this.players[1].name}.`);
    this.emit('stateChanged', this._snapshot());
    return this._snapshot();
  }

  // ----------------------------------------------------------
  //  Acesso a jogadores
  // ----------------------------------------------------------

  getPlayer()   { return this.players[0]; }
  getOpponent() { return this.players[1]; }

  // ----------------------------------------------------------
  //  calculateCost
  // ----------------------------------------------------------

  calculateCost(baseCost, player, isCard = false, cardType = null, character = null) {
    let cost = baseCost;
    const char = character || player.char;

    // Status INSPIRATION — próxima ação grátis
    if (hasStatus(player, 'INSPIRATION')) {
      consumeStatus(player, 'INSPIRATION');
      return 0;
    }

    // Status LOW_MORALE — +1 em recruit/fortify
    if (hasStatus(player, 'LOW_MORALE') && !isCard) {
      cost += 1;
    }

    // Modificador do personagem
    if (char && char.costModifier) {
      cost += char.costModifier(player, isCard, cardType);
    }

    // Building: quartel -1 em recrutamento
    if (!isCard && cardType === 'recruit' && player.buildings.includes('barracks')) {
      cost -= 1;
    }

    // Building: academia -1 em cartas
    if (isCard && player.buildings.includes('academy')) {
      cost -= 1;
    }

    return Math.max(0, cost);
  }

  // ----------------------------------------------------------
  //  mineAction
  // ----------------------------------------------------------

  mineAction(player) {
    if (player.mineCooldown > 0) {
      return { success: false, message: `Mineração em cooldown (${player.mineCooldown} turnos restantes).` };
    }

    let gained = 2;
    const logs = [];

    // Building: moinho +1
    if (player.buildings.includes('mill')) {
      gained += 1;
      logs.push('+1 moeda (Moinho)');
    }

    // Upgrade: rotas comerciais +1
    if (player.upgrades.includes('trade_routes')) {
      gained += 1;
      logs.push('+1 moeda (Rotas Comerciais)');
    }

    // Status ECONOMIC_BOOM
    if (consumeStatus(player, 'ECONOMIC_BOOM')) {
      gained += 2;
      logs.push('+2 moedas (Boom Econômico)');
    }

    // Passiva do personagem (mineEffect)
    if (player.char && player.char.mineEffect) {
      const mineLog = player.char.mineEffect(player);
      if (mineLog) logs.push(mineLog);
    }

    player.coins += gained;
    player.mineCooldown = GAME_CONSTANTS.MINE_COOLDOWN_MAX;

    // Building: academia reduz cooldown
    if (player.buildings.includes('academy')) {
      player.mineCooldown = Math.max(1, player.mineCooldown - 1);
    }

    // Carga de ultimate
    this._chargeUltimate(player, 1);

    const baseMsg = `${player.name} minerou! +${gained} moedas.`;
    const fullMsg = logs.length ? `${baseMsg} (${logs.join(', ')})` : baseMsg;
    this._log(fullMsg);
    this.emit('stateChanged', this._snapshot());
    return { success: true, message: fullMsg };
  }

  // ----------------------------------------------------------
  //  recruitAction
  // ----------------------------------------------------------

  recruitAction(player) {
    const cost = this.calculateCost(GAME_CONSTANTS.RECRUIT_COST_BASE, player, false, 'recruit');

    if (player.coins < cost) {
      return { success: false, message: `Moedas insuficientes (precisa ${cost}, tem ${player.coins}).` };
    }

    player.coins -= cost;
    player.army  += 1;

    // Aplica LOW_MORALE se exército muito grande
    if (player.army >= 5 && !hasStatus(player, 'LOW_MORALE')) {
      player.status.push({ id: 'LOW_MORALE', turnsLeft: 2, ...STATUS_DEFINITIONS.LOW_MORALE });
      this._log(`${player.name}: exército grande causa Moral Baixo.`);
    }

    this._chargeUltimate(player, 1);

    const msg = `${player.name} recrutou 1 exército por ${cost} moedas.`;
    this._log(msg);
    this.emit('stateChanged', this._snapshot());
    return { success: true, message: msg };
  }

  // ----------------------------------------------------------
  //  fortifyAction
  // ----------------------------------------------------------

  fortifyAction(player) {
    const cost = this.calculateCost(GAME_CONSTANTS.FORTIFY_COST_BASE, player, false, 'fortify');

    if (player.coins < cost) {
      return { success: false, message: `Moedas insuficientes para fortify (precisa ${cost}).` };
    }

    player.coins       -= cost;
    player.instability  = Math.max(0, player.instability - 2);
    player.influence   += 1;

    this._chargeUltimate(player, 1);

    const msg = `${player.name} fortificou! -2 instabilidade, +1 influência (custou ${cost}).`;
    this._log(msg);
    this.emit('stateChanged', this._snapshot());
    return { success: true, message: msg };
  }

  // ----------------------------------------------------------
  //  warAction
  // ----------------------------------------------------------

  warAction(playerNum) {
    const attacker = this.players[playerNum];
    const defender = this.players[playerNum === 0 ? 1 : 0];

    if (attacker.army <= 0) {
      return { success: false, message: 'Sem exército para declarar guerra.' };
    }

    if (playerNum === 0) {
      // Jogador humano — UI abre tela de combate
      this._pendingCombat = { attackerIndex: playerNum, defenderIndex: 1 };
      this.emit('combatNeeded', { attacker: { ...attacker }, defender: { ...defender } });
      return { success: true, needsCombat: true };
    }

    // IA — resolve automaticamente
    const { resolveAutoCombat } = this._getCombatResolver();
    const result = resolveAutoCombat(attacker, defender);
    this.processCombatResults(result, attacker, defender);
    return { success: true, needsCombat: false, result };
  }

  // Injeção de dependência para o módulo combat (evita import circular)
  _combatResolver = null;
  setCombatResolver(resolver) { this._combatResolver = resolver; }
  _getCombatResolver() {
    if (!this._combatResolver) throw new Error('CombatResolver não definido. Chame setCombatResolver.');
    return this._combatResolver;
  }

  // ----------------------------------------------------------
  //  processCombatResults
  // ----------------------------------------------------------

  processCombatResults(result, attacker, defender) {
    const { playerCasualties, enemyCasualties } = result;

    attacker.army = Math.max(0, attacker.army - playerCasualties);
    defender.army = Math.max(0, defender.army - enemyCasualties);

    let msg = '';

    if (result.result === 'victory') {
      msg = `${attacker.name} venceu o combate! Baixas: ${playerCasualties} vs ${enemyCasualties}.`;
      attacker.instability = Math.max(0, attacker.instability - 1);
      attacker.influence   += 2;

      // Passiva do soldado: recupera 1 exército ao vencer
      if (attacker.char && attacker.char.specialAbility === 'combat_victory_recover') {
        attacker.army += 1;
        msg += ` Moral de Ferro: +1 exército recuperado!`;
      }
    } else if (result.result === 'defeat') {
      msg = `${attacker.name} foi derrotado! Baixas: ${playerCasualties} vs ${enemyCasualties}.`;
      attacker.instability += 2;
    } else {
      msg = `${attacker.name} recuou do combate. Baixas: ${playerCasualties} vs ${enemyCasualties}.`;
      attacker.instability += 1;
    }

    this._chargeUltimate(attacker, 2);
    this._pendingCombat = null;

    this._log(msg);
    this.emit('stateChanged', this._snapshot());

    const over = this.checkGameOver();
    if (over) this.emit('gameOver', { winner: this.winner, reason: over.reason });

    return { success: true, message: msg };
  }

  // ----------------------------------------------------------
  //  buyCard
  // ----------------------------------------------------------

  buyCard(cardIndex, player) {
    const card = this.market[cardIndex];
    if (!card) return { success: false, message: 'Carta inválida.' };

    const cost = this.calculateCost(card.cost, player, true, card.type);

    if (player.coins < cost) {
      return { success: false, message: `Moedas insuficientes (precisa ${cost}, tem ${player.coins}).` };
    }

    const opponent = player === this.players[0] ? this.players[1] : this.players[0];

    player.coins -= cost;

    // Bruxa duplica efeitos Gamble
    let resultMsg = card.effect(player, opponent);
    if (player.char && player.char.cardEffectMultiplier === 2 && card.type === 'Gamble') {
      resultMsg += ' ' + card.effect(player, opponent) + ' (Magia Negra duplicou!)';
    }

    // Programador: 20% chance cópia grátis
    if (player.cardEchanceActive && Math.random() < 0.2) {
      card.effect(player, opponent);
      resultMsg += ' (Debug: cópia grátis!)';
    }

    // Remove do mercado e rola nova carta
    this.market.splice(cardIndex, 1);
    const newCards = this._allCardsShuffled();
    const replacement = newCards.find(c => !this.market.some(m => m.id === c.id));
    if (replacement) this.market.push(replacement);

    this._chargeUltimate(player, 1);

    this._log(resultMsg);
    this.emit('stateChanged', this._snapshot());

    const over = this.checkGameOver();
    if (over) this.emit('gameOver', { winner: this.winner, reason: over.reason });

    return { success: true, message: resultMsg };
  }

  // ----------------------------------------------------------
  //  buyBuilding
  // ----------------------------------------------------------

  buyBuilding(player, buildingId) {
    const building = BUILDINGS.find(b => b.id === buildingId);
    if (!building) return { success: false, message: 'Edificação inválida.' };
    if (player.buildings.includes(buildingId)) return { success: false, message: 'Edificação já construída.' };
    if ((player.briks || 0) < building.cost) {
      return { success: false, message: `Briks insuficientes (precisa ${building.cost}).` };
    }

    player.briks -= building.cost;
    player.buildings.push(buildingId);

    const msg = `${player.name} construiu ${building.name}!`;
    this._log(msg);
    this.emit('stateChanged', this._snapshot());
    return { success: true, message: msg };
  }

  // ----------------------------------------------------------
  //  endTurn
  // ----------------------------------------------------------

  endTurn() {
    const current = this.players[this.turn];

    // Upkeep de comida
    const foodCost = current.army * GAME_CONSTANTS.FOOD_UPKEEP_PER_ARMY;
    if (current.food >= foodCost) {
      current.food = parseFloat((current.food - foodCost).toFixed(2));
    } else {
      const shortage = foodCost - current.food;
      current.food = 0;
      current.instability += Math.ceil(shortage);
      this._log(`${current.name}: falta comida! +${Math.ceil(shortage)} instabilidade.`);
    }

    // Upkeep de influência por instabilidade
    const infCost = parseFloat((current.instability * GAME_CONSTANTS.INFLUENCE_UPKEEP_PER_INSTABILITY).toFixed(2));
    current.influence = Math.max(0, parseFloat((current.influence - infCost).toFixed(2)));

    // Tick de status
    const statusLogs = applyStatusTick(current);
    statusLogs.forEach(l => this._log(l));

    // Passiva do personagem
    if (current.char && current.char.effect) {
      const passiveMsg = current.char.effect(current);
      if (passiveMsg) this._log(`${current.name} (passiva): ${passiveMsg}`);
    }

    // Reduz cooldown de mineração
    if (current.mineCooldown > 0) current.mineCooldown -= 1;

    // Troca de turno
    this.turn = this.turn === 0 ? 1 : 0;

    // Novo round
    if (this.turn === 0) {
      this.round += 1;
      this._updateSeason();
      this.market = this.rollMarketCards();
    }

    this.actionPoints = GAME_CONSTANTS.ACTION_POINTS_MAX;

    const over = this.checkGameOver();
    if (over) {
      this.emit('gameOver', { winner: this.winner, reason: over.reason });
      return;
    }

    this._log(`--- Turno de ${this.players[this.turn].name} (Round ${this.round}) ---`);
    this.emit('stateChanged', this._snapshot());
  }

  // ----------------------------------------------------------
  //  useUltimate
  // ----------------------------------------------------------

  useUltimate(player, opponent) {
    if (player.ultimateCharge < GAME_CONSTANTS.ULTIMATE_CHARGE_MAX) {
      return { success: false, message: 'Ultimate não está carregado.' };
    }

    player.ultimateCharge = 0;
    const charId = player.characterId || (player.char && player.char.id);
    let msg = '';

    switch (charId) {
      case 'rei':
        player.influence += 5;
        opponent.instability += 2;
        msg = `${player.name} usou DECRETO REAL! +5 influência, oponente +2 instabilidade.`;
        break;
      case 'rainha':
        player.instability = Math.max(0, player.instability - 4);
        player.influence   += 3;
        msg = `${player.name} usou ALIANÇA DIPLOMÁTICA! -4 instabilidade, +3 influência.`;
        break;
      case 'ferreiro':
        player.briks  += 4;
        player.army   += 1;
        msg = `${player.name} usou FORJA LENDÁRIA! +4 briks, +1 exército.`;
        break;
      case 'ladrao':
        player.coins       += Math.floor(opponent.coins / 2);
        opponent.coins      = Math.ceil(opponent.coins / 2);
        msg = `${player.name} usou GRANDE ROUBO! Roubou metade das moedas do oponente.`;
        break;
      case 'amante':
        opponent.army = Math.max(0, opponent.army - 2);
        opponent.instability += 3;
        msg = `${player.name} usou TRAIÇÃO FATAL! Oponente perde 2 exércitos e +3 instabilidade.`;
        break;
      case 'soldado':
        player.army += 3;
        player.instability = Math.max(0, player.instability - 2);
        msg = `${player.name} usou CHAMADA ÀS ARMAS! +3 exércitos, -2 instabilidade.`;
        break;
      case 'programador':
        // Duplica efeito da próxima carta comprada
        player.status.push({ id: 'INSPIRATION', turnsLeft: 1, ...STATUS_DEFINITIONS.INSPIRATION });
        player.coins += 2;
        msg = `${player.name} usou SISTEMA OVERDRIVE! Inspiração ativada, +2 moedas.`;
        break;
      case 'princesa':
        player.instability = Math.max(0, player.instability - 3);
        player.influence   += 4;
        player.food        += 2;
        msg = `${player.name} usou GRAÇA REAL! -3 instabilidade, +4 influência, +2 comida.`;
        break;
      case 'bruxa':
        opponent.status.push({ id: 'HIGH_TAXES', turnsLeft: 3, ...STATUS_DEFINITIONS.HIGH_TAXES });
        opponent.instability += 2;
        msg = `${player.name} usou MALDIÇÃO! Oponente fica com Impostos Altos por 3 turnos e +2 instabilidade.`;
        break;
      default:
        player.coins += 3;
        msg = `${player.name} usou Ultimate! +3 moedas.`;
    }

    this._log(msg);
    this.emit('stateChanged', this._snapshot());
    return { success: true, message: msg };
  }

  // ----------------------------------------------------------
  //  checkGameOver
  // ----------------------------------------------------------

  checkGameOver() {
    for (const player of this.players) {
      const rebelionLimit = GAME_CONSTANTS.REBELLION_ARMY_LIMIT +
        (player.buildings.includes('barracks') ? 1 : 0);

      // Rebelião militar tem prioridade
      if (player.army < rebelionLimit && player.instability >= 8) {
        const winner = this.players.find(p => p !== player);
        this.gameOver = true;
        this.winner   = winner;
        if (winner === this.players[0]) this.stats.victories += 1;
        this._checkAchievements();
        return { loser: player, winner, reason: 'rebellion' };
      }

      if (player.instability >= GAME_CONSTANTS.INSTABILITY_LIMIT) {
        const winner = this.players.find(p => p !== player);
        this.gameOver = true;
        this.winner   = winner;
        if (winner === this.players[0]) this.stats.victories += 1;
        this._checkAchievements();
        return { loser: player, winner, reason: 'instability' };
      }

      if (player.army <= 0 && player.instability >= 5) {
        const winner = this.players.find(p => p !== player);
        this.gameOver = true;
        this.winner   = winner;
        if (winner === this.players[0]) this.stats.victories += 1;
        this._checkAchievements();
        return { loser: player, winner, reason: 'no_army' };
      }
    }

    return null;
  }

  // ----------------------------------------------------------
  //  rollMarketCards
  // ----------------------------------------------------------

  rollMarketCards() {
    const shuffled = this._allCardsShuffled();
    return shuffled.slice(0, GAME_CONSTANTS.MARKET_SLOTS);
  }

  // ----------------------------------------------------------
  //  triggerChoiceEvent
  // ----------------------------------------------------------

  triggerChoiceEvent(player) {
    if (Math.random() > GAME_CONSTANTS.EVENT_CHANCE) return null;
    const event = pickRandom(CHOICE_EVENTS);
    this.emit('eventTriggered', { event, player: { ...player } });
    return event;
  }

  applyEventChoice(player, event, choiceKey) {
    const choice = event[choiceKey];
    if (!choice) return { success: false };
    const msg = choice.effect(player);
    this._log(`${player.name} escolheu "${choice.label}": ${msg}`);
    this.emit('stateChanged', this._snapshot());
    return { success: true, message: msg };
  }

  // ----------------------------------------------------------
  //  _snapshot (estado serializado para a UI)
  // ----------------------------------------------------------

  _snapshot() {
    return {
      players:      this.players.map(p => ({ ...p, char: undefined })),
      turn:         this.turn,
      round:        this.round,
      season:       this.season,
      market:       [...this.market],
      gameOver:     this.gameOver,
      winner:       this.winner ? { ...this.winner, char: undefined } : null,
      actionPoints: this.actionPoints,
      stats:        { ...this.stats },
    };
  }

  // ----------------------------------------------------------
  //  Helpers internos
  // ----------------------------------------------------------

  _chargeUltimate(player, amount) {
    player.ultimateCharge = Math.min(
      GAME_CONSTANTS.ULTIMATE_CHARGE_MAX,
      (player.ultimateCharge || 0) + amount,
    );
  }

  _updateSeason() {
    const seasons = ['Primavera', 'Verão', 'Outono', 'Inverno'];
    const idx = (this.round - 1) % 4;
    const newSeason = seasons[idx];
    if (newSeason !== this.season) {
      this.season = newSeason;
      this._applySeasonEffect();
      this.emit('seasonChanged', { season: this.season });
    }
  }

  _applySeasonEffect() {
    switch (this.season) {
      case 'Verão':
        this.players.forEach(p => { p.food += 1; });
        this._log('Verão: +1 comida para todos.');
        break;
      case 'Inverno':
        this.players.forEach(p => {
          p.food = Math.max(0, p.food - 1);
          if (p.food === 0) p.instability += 1;
        });
        this._log('Inverno: -1 comida para todos.');
        break;
      case 'Outono':
        this.players.forEach(p => { p.coins += 1; });
        this._log('Outono: +1 moeda (colheita) para todos.');
        break;
      default:
        break;
    }
  }

  _allCardsShuffled() {
    const copy = [...CARDS];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  _checkAchievements() {
    for (const ach of ACHIEVEMENTS) {
      if (!ach.unlocked && ach.check(this)) {
        ach.unlocked = true;
        ach.log.push(new Date().toISOString());
        this.emit('achievementUnlocked', { achievement: ach });
      }
    }
  }

  _log(msg) {
    this.emit('log', msg);
  }
}
