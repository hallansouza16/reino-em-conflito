// ============================================================
//  constants.js — Reino em Conflito Remaster
//  Todas as constantes, personagens, cartas, edifícios, etc.
// ============================================================

export const GAME_CONSTANTS = {
  MINE_COOLDOWN_MAX:           3,
  REBELLION_ARMY_LIMIT:        4,
  INSTABILITY_LIMIT:           10,
  FOOD_UPKEEP_PER_ARMY:        0.5,
  INFLUENCE_UPKEEP_PER_INSTABILITY: 0.3,
  RECRUIT_COST_BASE:           3,
  FORTIFY_COST_BASE:           4,
  ACTION_POINTS_MAX:           2,
  MARKET_SLOTS:                5,
  EVENT_CHANCE:                0.25,
  WAR_ARMY_BASE_ATTACK:        10,
  ULTIMATE_CHARGE_MAX:         10,
};

// ============================================================
//  PERSONAGENS (9)
// ============================================================

export const CHARACTERS = [
  {
    id: 'rei',
    name: 'Rei',
    image: 'assets/images/characters/rei.png',
    initial: {
      coins: 8,
      army: 3,
      instability: 2,
      food: 4,
      influence: 6,
      briks: 2,
    },
    passive: 'Autoridade Real: a cada turno ganha +1 de influência extra.',
    effect(player) {
      player.influence += 1;
      return '+1 influência (Autoridade Real)';
    },
  },

  {
    id: 'rainha',
    name: 'Rainha',
    image: 'assets/images/characters/rainha.png',
    initial: {
      coins: 6,
      army: 2,
      instability: 1,
      food: 5,
      influence: 8,
      briks: 2,
    },
    passive: 'Diplomacia: cartas de Status custam -1 moeda (mínimo 0).',
    costModifier(player, isCard, cardType) {
      if (isCard && cardType === 'Status') return -1;
      return 0;
    },
    effect(player) {
      return null; // passiva aplicada via costModifier
    },
  },

  {
    id: 'ferreiro',
    name: 'Ferreiro',
    image: 'assets/images/characters/ferreiro.png',
    initial: {
      coins: 5,
      army: 3,
      instability: 2,
      food: 3,
      influence: 4,
      briks: 5,
    },
    passive: 'Forja: recebe +1 brik por turno e recrutar custa -1 moeda.',
    costModifier(player, isCard, cardType) {
      if (!isCard) return -1; // ações de recrutar / fortify
      return 0;
    },
    effect(player) {
      player.briks = (player.briks || 0) + 1;
      return '+1 brik (Forja)';
    },
  },

  {
    id: 'ladrao',
    name: 'Ladrão',
    image: 'assets/images/characters/ladrão.png',
    initial: {
      coins: 10,
      army: 1,
      instability: 4,
      food: 2,
      influence: 3,
      briks: 1,
    },
    passive: 'Roubo: mineração rende +1 moeda extra.',
    mineEffect(player) {
      player.coins += 1;
      return '+1 moeda extra (Roubo)';
    },
    effect(player) {
      return null;
    },
  },

  {
    id: 'amante',
    name: 'Amante',
    image: 'assets/images/characters/amante.png',
    initial: {
      coins: 6,
      army: 1,
      instability: 3,
      food: 4,
      influence: 7,
      briks: 2,
    },
    passive: 'Sedução: cartas do tipo Opponent custam -1 moeda (mínimo 0).',
    costModifier(player, isCard, cardType) {
      if (isCard && cardType === 'Opponent') return -1;
      return 0;
    },
    effect(player) {
      return null;
    },
  },

  {
    id: 'soldado',
    name: 'Soldado',
    image: 'assets/images/characters/soldado.png',
    initial: {
      coins: 5,
      army: 5,
      instability: 3,
      food: 3,
      influence: 3,
      briks: 2,
    },
    passive: 'Moral de Ferro: após vencer um combate recupera 1 exército.',
    effect(player) {
      return null; // passiva ativada em processCombatResults
    },
    specialAbility: 'combat_victory_recover',
  },

  {
    id: 'programador',
    name: 'Mestre Programador',
    image: 'assets/images/characters/mestre programador.png',
    initial: {
      coins: 7,
      army: 1,
      instability: 2,
      food: 3,
      influence: 5,
      briks: 3,
    },
    passive: 'Debug: ao comprar uma carta, 20% de chance de receber uma cópia grátis.',
    cardEffectMultiplier: 1,
    effect(player) {
      return null;
    },
    setup(player) {
      player.cardEchanceActive = true;
    },
  },

  {
    id: 'princesa',
    name: 'Princesa Real',
    image: 'assets/images/characters/princesa real.png',
    initial: {
      coins: 6,
      army: 2,
      instability: 1,
      food: 5,
      influence: 7,
      briks: 2,
    },
    passive: 'Proteção Nobre: fortify custa -1 moeda (mínimo 0).',
    costModifier(player, isCard, cardType) {
      if (!isCard && cardType === 'fortify') return -1;
      return 0;
    },
    effect(player) {
      return null;
    },
  },

  {
    id: 'bruxa',
    name: 'Bruxa',
    image: 'assets/images/characters/bruxa.png',
    initial: {
      coins: 6,
      army: 2,
      instability: 5,
      food: 3,
      influence: 6,
      briks: 2,
    },
    passive: 'Magia Negra: efeitos de carta de Gamble têm resultado dobrado.',
    cardEffectMultiplier: 2,
    effect(player) {
      return null;
    },
  },
];

// ============================================================
//  CARTAS (9)
// ============================================================

export const CARDS = [
  {
    id: 'recrutamento_rapido',
    name: 'Recrutamento Rápido',
    cost: 3,
    type: 'Self',
    desc: 'Recruta 2 exércitos imediatamente sem custo adicional.',
    image: 'assets/images/cartas/Recrapido.png',
    color: '#c0392b',
    effect(self, op) {
      self.army += 2;
      return `${self.name} recrutou 2 exércitos com Recrutamento Rápido!`;
    },
  },

  {
    id: 'comercio_prospero',
    name: 'Comércio Próspero',
    cost: 2,
    type: 'Self',
    desc: 'Ganha 4 moedas e 1 comida instantaneamente.',
    image: 'assets/images/cartas/ComércioPróspero.png',
    color: '#f39c12',
    effect(self, op) {
      self.coins += 4;
      self.food += 1;
      return `${self.name} lucrou com Comércio Próspero! +4 moedas, +1 comida.`;
    },
  },

  {
    id: 'sabotagem',
    name: 'Sabotagem',
    cost: 4,
    type: 'Opponent',
    desc: 'O oponente perde 3 moedas e +2 instabilidade.',
    image: 'assets/images/cartas/Sabotagem.png',
    color: '#8e44ad',
    effect(self, op) {
      op.coins = Math.max(0, op.coins - 3);
      op.instability += 2;
      return `${self.name} sabotou ${op.name}! -3 moedas, +2 instabilidade para o inimigo.`;
    },
  },

  {
    id: 'desinformacao',
    name: 'Desinformação',
    cost: 3,
    type: 'Opponent',
    desc: 'O oponente perde 2 de influência e +1 instabilidade.',
    image: 'assets/images/cartas/Desinformação.png',
    color: '#2c3e50',
    effect(self, op) {
      op.influence = Math.max(0, op.influence - 2);
      op.instability += 1;
      return `${self.name} espalhou Desinformação! ${op.name} perde 2 influência e +1 instabilidade.`;
    },
  },

  {
    id: 'aposta_arriscada',
    name: 'Aposta Arriscada',
    cost: 1,
    type: 'Gamble',
    desc: '50% de chance: +5 moedas. Na falha: +2 instabilidade para quem apostou.',
    image: 'assets/images/cartas/ApostaArriscada.png',
    color: '#e67e22',
    effect(self, op) {
      if (Math.random() < 0.5) {
        self.coins += 5;
        return `${self.name} ganhou a aposta! +5 moedas.`;
      } else {
        self.instability += 2;
        return `${self.name} perdeu a aposta! +2 instabilidade.`;
      }
    },
  },

  {
    id: 'boom_comercial',
    name: 'Boom Comercial',
    cost: 2,
    type: 'Status',
    desc: 'Aplica ECONOMIC_BOOM: próxima mineração rende +2 moedas extras.',
    image: 'assets/images/cartas/BoomComercial.png',
    color: '#27ae60',
    effect(self, op) {
      if (!self.status) self.status = [];
      self.status.push({
        id: 'ECONOMIC_BOOM',
        turnsLeft: 1,
        ...STATUS_DEFINITIONS.ECONOMIC_BOOM,
      });
      return `${self.name} ativou Boom Comercial! Próxima mineração +2 moedas.`;
    },
  },

  {
    id: 'inspiracao_divina',
    name: 'Inspiração Divina',
    cost: 3,
    type: 'Status',
    desc: 'Aplica INSPIRATION: próxima ação custa 0.',
    image: 'assets/images/cartas/InspiraçãoDivina.png',
    color: '#3498db',
    effect(self, op) {
      if (!self.status) self.status = [];
      self.status.push({
        id: 'INSPIRATION',
        turnsLeft: 1,
        ...STATUS_DEFINITIONS.INSPIRATION,
      });
      return `${self.name} recebeu Inspiração Divina! Próxima ação grátis.`;
    },
  },

  {
    id: 'sindicato_ganancioso',
    name: 'Sindicato Ganancioso',
    cost: 3,
    type: 'Status',
    desc: 'Aplica HIGH_TAXES no oponente: perde 1 moeda por turno por 2 turnos.',
    image: 'assets/images/cartas/SindicatoGanancioso.png',
    color: '#c0392b',
    effect(self, op) {
      if (!op.status) op.status = [];
      op.status.push({
        id: 'HIGH_TAXES',
        turnsLeft: 2,
        ...STATUS_DEFINITIONS.HIGH_TAXES,
      });
      return `${self.name} impôs o Sindicato Ganancioso! ${op.name} pagará impostos por 2 turnos.`;
    },
  },

  {
    id: 'armazem_cheio',
    name: 'Armazém Cheio',
    cost: 2,
    type: 'Self',
    desc: 'Ganha 3 comidas e reduz instabilidade em 1.',
    image: 'assets/images/cartas/ArmazémCheio.png',
    color: '#16a085',
    effect(self, op) {
      self.food += 3;
      self.instability = Math.max(0, self.instability - 1);
      return `${self.name} abasteceu o Armazém! +3 comida, -1 instabilidade.`;
    },
  },
];

// ============================================================
//  EDIFICAÇÕES (3)
// ============================================================

export const BUILDINGS = [
  {
    id: 'barracks',
    name: 'Quartel',
    cost: 5,
    effect: 'Recrutar exércitos custa -1 moeda e o limite de rebelião aumenta em +1.',
    icon: '⚔️',
  },
  {
    id: 'mill',
    name: 'Moinho',
    cost: 4,
    effect: 'Mineração rende +1 moeda extra por turno.',
    icon: '⚙️',
  },
  {
    id: 'academy',
    name: 'Academia',
    cost: 6,
    effect: 'Cartas custam -1 moeda e o cooldown de mineração reduz em 1.',
    icon: '📚',
  },
];

// ============================================================
//  STATUS
// ============================================================

export const STATUS_DEFINITIONS = {
  HIGH_TAXES: {
    name: 'Impostos Altos',
    type: 'debuff',
    icon: '💸',
    desc: 'Perde 1 moeda por turno.',
  },
  LOW_MORALE: {
    name: 'Moral Baixo',
    type: 'debuff',
    icon: '😞',
    desc: 'Próximo recrutamento/fortify custa +1 moeda.',
  },
  INSPIRATION: {
    name: 'Inspiração',
    type: 'buff',
    icon: '✨',
    desc: 'Próxima ação custa 0 moedas.',
  },
  ECONOMIC_BOOM: {
    name: 'Boom Econômico',
    type: 'buff',
    icon: '📈',
    desc: 'Próxima mineração rende +2 moedas extras.',
  },
};

// ============================================================
//  UPGRADES (4)
// ============================================================

export const UPGRADES = [
  {
    id: 'iron_sword',
    name: 'Espada de Ferro',
    cost: 4,
    currency: 'briks',
    effect: 'Ataque base em combate +3.',
    type: 'military',
  },
  {
    id: 'stone_wall',
    name: 'Muralha de Pedra',
    cost: 5,
    currency: 'briks',
    effect: 'Defesa base em combate +4.',
    type: 'defense',
  },
  {
    id: 'trade_routes',
    name: 'Rotas Comerciais',
    cost: 3,
    currency: 'coins',
    effect: 'Mineração sempre rende +1 moeda extra.',
    type: 'economic',
  },
  {
    id: 'spy_network',
    name: 'Rede de Espiões',
    cost: 4,
    currency: 'influence',
    effect: 'Vê o mercado do oponente e cartas Opponent custam -1.',
    type: 'diplomatic',
  },
];

// ============================================================
//  CONQUISTAS (3)
// ============================================================

export const ACHIEVEMENTS = [
  {
    id: 'first_victory',
    name: 'Primeira Conquista',
    check(state) {
      return state.stats && state.stats.victories >= 1;
    },
    unlocked: false,
    log: [],
  },
  {
    id: 'rich_king',
    name: 'Rei Dourado',
    check(state) {
      const player = state.players && state.players[0];
      return player && player.coins >= 20;
    },
    unlocked: false,
    log: [],
  },
  {
    id: 'warlord',
    name: 'Senhor da Guerra',
    check(state) {
      const player = state.players && state.players[0];
      return player && player.army >= 8;
    },
    unlocked: false,
    log: [],
  },
];

// ============================================================
//  EVENTOS DE ESCOLHA (4+)
// ============================================================

export const CHOICE_EVENTS = [
  {
    name: 'Colheita Abundante',
    prompt: 'Uma colheita excepcional abençoa suas terras. Como usar o excedente?',
    choiceA: {
      label: 'Distribuir ao povo (-2 instabilidade)',
      effect(player) {
        player.instability = Math.max(0, player.instability - 2);
        return '-2 instabilidade (povo satisfeito)';
      },
    },
    choiceB: {
      label: 'Vender no mercado (+4 moedas)',
      effect(player) {
        player.coins += 4;
        return '+4 moedas (venda lucrativa)';
      },
    },
  },
  {
    name: 'Espião Capturado',
    prompt: 'Seus guardas capturaram um espião inimigo. O que fazer?',
    choiceA: {
      label: 'Executar (-1 instabilidade, +2 influência)',
      effect(player) {
        player.instability = Math.max(0, player.instability - 1);
        player.influence += 2;
        return '-1 instabilidade, +2 influência';
      },
    },
    choiceB: {
      label: 'Usar como agente duplo (+1 exército, +1 influência)',
      effect(player) {
        player.army += 1;
        player.influence += 1;
        return '+1 exército, +1 influência';
      },
    },
  },
  {
    name: 'Mercadores Estrangeiros',
    prompt: 'Mercadores estrangeiros pedem permissão para se instalar. Aceitar?',
    choiceA: {
      label: 'Aceitar (+5 moedas, ECONOMIC_BOOM)',
      effect(player) {
        player.coins += 5;
        if (!player.status) player.status = [];
        player.status.push({
          id: 'ECONOMIC_BOOM',
          turnsLeft: 2,
          ...STATUS_DEFINITIONS.ECONOMIC_BOOM,
        });
        return '+5 moedas e Boom Econômico por 2 turnos';
      },
    },
    choiceB: {
      label: 'Recusar (+1 influência, -1 instabilidade)',
      effect(player) {
        player.influence += 1;
        player.instability = Math.max(0, player.instability - 1);
        return '+1 influência, -1 instabilidade (isolacionismo popular)';
      },
    },
  },
  {
    name: 'Revolta nas Minas',
    prompt: 'Trabalhadores nas minas entram em greve. Como responder?',
    choiceA: {
      label: 'Negociar (+2 instabilidade mas minas voltam logo)',
      effect(player) {
        player.instability += 2;
        return '+2 instabilidade (negociação cansativa)';
      },
    },
    choiceB: {
      label: 'Suprimir com força (-3 comida, -2 instabilidade)',
      effect(player) {
        player.food = Math.max(0, player.food - 3);
        player.instability = Math.max(0, player.instability - 2);
        return '-3 comida, -2 instabilidade (repressão custosa)';
      },
    },
  },
  {
    name: 'Festival do Reino',
    prompt: 'Um festival popular pede seu patrocínio. O tesouro é seu aliado?',
    choiceA: {
      label: 'Patrocinar (-3 moedas, INSPIRATION, -1 instabilidade)',
      effect(player) {
        player.coins = Math.max(0, player.coins - 3);
        player.instability = Math.max(0, player.instability - 1);
        if (!player.status) player.status = [];
        player.status.push({
          id: 'INSPIRATION',
          turnsLeft: 1,
          ...STATUS_DEFINITIONS.INSPIRATION,
        });
        return '-3 moedas, -1 instabilidade, Inspiração ativada';
      },
    },
    choiceB: {
      label: 'Ignorar (+1 instabilidade)',
      effect(player) {
        player.instability += 1;
        return '+1 instabilidade (povo decepcionado)';
      },
    },
  },
];
