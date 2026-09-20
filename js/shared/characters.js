export const CHARACTERS = [
    {
        id: 'rei', 
        name: 'Rei', 
        image: '/images/characters/rei.png',
        initial: { coins: 10, army: 10, instability: 0, food: 15, influence: 10, briks: 0 }, 
        passive: 'Monarca: +1 Moeda extra no início de cada turno.',
        effect: (p) => { p.coins += 1; return '+1 Moeda (Monarca)'; }
    },
    {
        id: 'rainha', 
        name: 'Rainha', 
        image: '/images/characters/rainha.png',
        initial: { coins: 12, army: 8, instability: 0, food: 15, influence: 10, briks: 0 }, 
        passive: 'Consorte: -1 Instabilidade no início do turno (máx. 0).',
        effect: (p) => { p.instability = Math.max(0, p.instability - 1); return '-1 Instabilidade (Consorte)'; }
    },
    {
        id: 'ferreiro', 
        name: 'Ferreiro', 
        image: '/images/characters/ferreiro.png',
        initial: { coins: 8, army: 12, instability: 1, food: 15, influence: 10, briks: 0 }, 
        passive: 'Mestre de Armas: Custo de Recrutamento (padrão) reduzido em 1.',
        setup: () => { return { RECRUIT_COST_BASE: 2 }; }
    },
    {
        id: 'ladrao', 
        name: 'Ladrão', 
        image: '/images/characters/ladrão.png',
        initial: { coins: 15, army: 5, instability: 2, food: 15, influence: 10, briks: 0 }, 
        passive: 'Latrocínio: Ação "Minerar" dá +1 Moeda extra, mas +1 Instabilidade.',
        mineEffect: (p) => {
            p.coins += 1;
            p.instability += 1;
            return '+1 Moeda EXTRA (Latrocínio) e +1 Instabilidade';
        }
    },
    {
        id: 'amante', 
        name: 'Amante', 
        image: '/images/characters/amante.png',
        initial: { coins: 9, army: 9, instability: 1, food: 15, influence: 10, briks: 0 }, 
        passive: 'Intriga: Custos de cartas de Oponente/Interferência/Risco (Gamble) reduzidos em 1.',
        costModifier: (card) => {
            if (card.type === 'Opponent' || card.type === 'Gamble') return -1;
            return 0;
        }
    },
    {
        id: 'soldado', 
        name: 'Soldado', 
        image: '/images/characters/Soldado.png',
        initial: { coins: 5, army: 15, instability: 0, food: 15, influence: 10, briks: 0 }, 
        passive: 'Guarda Real: Limite de Exército para Rebelião aumenta para 6 (era 4).',
        setup: () => { return { REBELLION_ARMY_LIMIT: 6 }; }
    },
    {
        id: 'programador', 
        name: 'Mestre Programador', 
        image: '/images/characters/Mestre Programador.png',
        initial: { coins: 7, army: 8, instability: 0, food: 12, influence: 15, briks: 0 }, 
        passive: 'Código Eficiente: Cartas custam -2 Moedas (mínimo 1) e +1 Ação extra por turno.',
        effect: (p) => {
            p.ap = Math.min(3, p.ap + 1);
            return '+1 Ação Extra (Código Eficiente)';
        },
        costModifier: (card) => -2,
        setup: () => { return { ACTION_POINTS_MAX: 3 }; }
    },
    {
        id: 'princesa', 
        name: 'Princesa Real', 
        image: '/images/characters/Princesa Real.png',
        initial: { coins: 13, army: 6, instability: 0, food: 18, influence: 14, briks: 0 }, 
        passive: 'Herdeira Real: +2 Influência no início do turno e custo de Fortificação reduzido pela metade.',
        effect: (p) => {
            p.influence += 2;
            return '+2 Influência (Herdeira Real)';
        },
        costModifier: (card) => {
            if (card.type === 'Self' || card.type === 'Status') return -1;
            return 0;
        },
        setup: () => { return { FORTIFY_COST_BASE: 2 }; }
    },
    {
        id: 'bruxa', 
        name: 'Bruxa Sábia', 
        image: '/images/characters/bruxa.png',
        initial: { coins: 6, army: 7, instability: 1, food: 13, influence: 16, briks: 0 }, 
        passive: 'Magia Ancestral: Pode comprar 2 cartas por ação e tem 25% de chance de duplicar efeitos de cartas.',
        effect: (p) => {
            if (Math.random() < 0.3) {
                const bonus = Math.floor(Math.random() * 3) + 1;
                const resource = ['coins', 'influence', 'food'][Math.floor(Math.random() * 3)];
                p[resource] += bonus;
                return `+${bonus} ${resource === 'coins' ? 'Moedas' : resource === 'influence' ? 'Influência' : 'Comida'} (Magia Ancestral)`;
            }
            return null;
        },
        cardEffectMultiplier: () => Math.random() < 0.25 ? 2 : 1,
        specialAbility: (p, op) => {
            if (p.ap >= 1) {
                p.ap -= 1;
                const effect = Math.random();
                if (effect < 0.33) {
                    p.coins += 5;
                    return '✨ Feitiço da Prosperidade: +5 Moedas';
                } else if (effect < 0.66) {
                    op.instability += 2;
                    return '🔮 Feitiço do Caos: +2 Instabilidade no inimigo';
                } else {
                    p.army += 3;
                    return '⚡ Feitiço da Proteção: +3 Exército';
                }
            }
            return null;
        }
    }
];