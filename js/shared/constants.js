// Constantes compartilhadas entre singleplayer e multiplayer
export const GAME_CONSTANTS = {
    MINE_COOLDOWN_MAX: 3,
    REBELLION_ARMY_LIMIT: 4,
    INSTABILITY_LIMIT: 10,
    FOOD_UPKEEP_PER_ARMY: 0.5,
    INFLUENCE_UPKEEP_PER_INSTABILITY: 0.3,
    RECRUIT_COST_BASE: 3,
    FORTIFY_COST_BASE: 4,
    ACTION_POINTS_MAX: 2,
    MARKET_SLOTS: 5,
    MAX_STAT_DEFAULT: 20,
    MAX_STAT_RESOURCE: 30,
    EVENT_CHANCE: 0.25,
    WAR_ARMY_BASE_ATTACK: 10
};

export const STATUS_DEFINITIONS = {
    HIGH_TAXES: { name: 'Impostos Altos', type: 'debuff', icon: '💰↑', desc: 'Custo padrão de Moedas de todas as Ações e Cartas +1 M.' },
    LOW_MORALE: { name: 'Moral Baixa', type: 'debuff', icon: '⚔️↓', desc: 'Ganho de Exército (Recrutar/Fortificar) reduzido em 1.' },
    INSPIRATION: { name: 'Inspiração', type: 'buff', icon: '🔥↓', desc: '-1 Instabilidade no início do turno.' },
    ECONOMIC_BOOM: { name: 'Boom Econômico', type: 'buff', icon: '📈', desc: '+2 Moedas em ações de Minerar e compra de cartas.' }
};

export const ACHIEVEMENTS = [
    { id: 'first_win', name: 'Primeira Vitória', check: (p) => p.winCount > 0, unlocked: false, log: 'Desbloqueou: Primeira Vitória!' },
    { id: 'rich_king', name: 'Rei Rico', check: (p) => p.coins >= 20, unlocked: false, log: 'Desbloqueou: 20 Moedas de Ouro!' },
    { id: 'army_builder', name: 'Mestre Militar', check: (p) => p.army >= 15, unlocked: false, log: 'Desbloqueou: Exército Robusto (15+ Tropas)!' },
];

export const UPGRADES = [
    { id: 'tax_reform', name: 'Reforma Tributária', cost: 2, currency: 'Briks', effect: 'Reduz o custo padrão de Moedas de todas as Ações (Minerar, Recrutar, Fortificar) em 1.', type: 'cost_reduction' },
    { id: 'agri_tech', name: 'Tecnologia Agrícola', cost: 3, currency: 'Briks', effect: 'Ação Miner/Plantar fornece +2 Comida extra.', type: 'mine_food_bonus' },
    { id: 'royal_guard', name: 'Guarda Real', cost: 4, currency: 'Briks', effect: 'Recrutar Exército fornece +1 Exército extra.', type: 'recruit_army_bonus' },
    { id: 'influence_boost', name: 'Impulsionar Influência', cost: 2, currency: 'Briks', effect: 'Ganha +1 Influência no início de cada turno.', type: 'passive_influence' },
];