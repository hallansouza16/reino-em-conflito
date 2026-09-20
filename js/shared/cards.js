export const CARDS = [
    { 
        id: 101, 
        name: "Recrutamento Rápido", 
        cost: 5, 
        type: 'Self', 
        desc: "+4 Exército (Self)", 
        effect: (self, op) => { self.army += 4; return '+4 Exército (Self)'; }, 
        image: '/images/cartas/Recrapido.png',
        color: 'var(--color-army)'
    },
    { 
        id: 102, 
        name: "Comércio Próspero", 
        cost: 6, 
        type: 'Self', 
        desc: "+6 Moedas (Self)", 
        effect: (self, op) => { self.coins += 6; return '+6 Moedas (Self)'; }, 
        image: '/images/cartas/ComércioPróspero.png',
        color: 'var(--color-gold)'
    },
    { 
        id: 103, 
        name: "Armazém Cheio", 
        cost: 4, 
        type: 'Self', 
        desc: "+8 Comida (Self)", 
        effect: (self, op) => { self.food += 8; return '+8 Comida (Self)'; }, 
        image: '/images/cartas/ArmazémCheio.png',
        color: 'var(--color-food)'
    },
    { 
        id: 201, 
        name: "Sabotagem", 
        cost: 7, 
        type: 'Opponent', 
        desc: "Oponente perde 4 Exército e ganha +1 Instabilidade.", 
        effect: (self, op) => { op.army = Math.max(0, op.army - 4); op.instability += 1; return `Oponente perde 4 Exército e ganha +1 Instabilidade.`; }, 
        image: '/images/cartas/Sabotagem.png',
        color: 'var(--color-instability)'
    },
    { 
        id: 202, 
        name: "Desinformação", 
        cost: 5, 
        type: 'Opponent', 
        desc: "Oponente perde 2 Influência.", 
        effect: (self, op) => { op.influence = Math.max(0, op.influence - 2); return `Oponente perde 2 Influência.`; }, 
        image: '/images/cartas/Desinformação.png',
        color: 'var(--color-instability)'
    },
    { 
        id: 301, 
        name: "Aposta Arriscada", 
        cost: 4, 
        type: 'Gamble', 
        desc: "50% de chance de +10 Moedas, 50% de -2 Instabilidade no oponente.", 
        effect: (self, op) => {
            if (Math.random() < 0.5) { self.coins += 10; return `SUCESSO! +10 Moedas.`; }
            else { self.instability += 2; return `FALHA! +2 Instabilidade para você.`; }
        }, 
        image: '/images/cartas/ApostaArriscada.png',
        color: 'var(--color-shop)'
    },
    { 
        id: 401, 
        name: "Inspiração Divina", 
        cost: 5, 
        type: 'Status', 
        desc: "Ganha o status 'INSPIRATION' (-1 Inst. por turno).", 
        effect: (self, op) => { if (!self.status) self.status = []; if (!self.status.includes('INSPIRATION')) self.status.push('INSPIRATION'); return `Ganhou Status: Inspiração (-1 Instabilidade por turno).`; },
        image: '/images/cartas/InspiraçãoDivina.png',
        color: 'var(--color-influence)'
    },
    { 
        id: 402, 
        name: "Sindicato Ganancioso", 
        cost: 3, 
        type: 'Status', 
        desc: "Oponente ganha o status 'HIGH_TAXES' (+1 Custo de Ação/Carta).", 
        effect: (self, op) => { if (!op.status) op.status = []; if (!op.status.includes('HIGH_TAXES')) op.status.push('HIGH_TAXES'); return `Oponente ganhou Status: Impostos Altos (+1 custo em tudo).`; },
        image: '/images/cartas/SindicatoGanancioso.png',
        color: 'var(--color-influence)'
    },
    { 
        id: 403, 
        name: "Boom Comercial", 
        cost: 6, 
        type: 'Status', 
        desc: "Ganha o status 'ECONOMIC_BOOM' (+2 Moedas em ações).", 
        effect: (self, op) => { if (!self.status) self.status = []; if (!self.status.includes('ECONOMIC_BOOM')) self.status.push('ECONOMIC_BOOM'); return `Ganhou Status: Boom Econômico (+2 Moedas em ações).`; },
        image: '/images/cartas/BoomComercial.png',
        color: 'var(--color-influence)'
    },
];

// Versão simplificada para multiplayer
export const CARDS_MULTIPLAYER = [
    { id: 101, name: "Recrutamento Rápido", cost: 5, type: 'Self', desc: "+4 Exército (Self)", effect: 'army+4' },
    { id: 102, name: "Comércio Próspero", cost: 6, type: 'Self', desc: "+6 Moedas (Self)", effect: 'coins+6' },
    { id: 103, name: "Armazém Cheio", cost: 4, type: 'Self', desc: "+8 Comida (Self)", effect: 'food+8' },
    { id: 201, name: "Sabotagem", cost: 7, type: 'Opponent', desc: "Oponente perde 4 Exército e ganha +1 Instabilidade.", effect: 'op_army-4,op_instability+1' },
    { id: 301, name: "Aposta Arriscada", cost: 4, type: 'Gamble', desc: "50% de chance de +10 Moedas, 50% de -2 Instabilidade no oponente.", effect: 'gamble' }
];

// Função para obter cor baseada no tipo de carta
export const getCardColor = (cardType) => {
    const colorMap = {
        'Self': 'var(--color-army)',
        'Opponent': 'var(--color-instability)',
        'Gamble': 'var(--color-shop)',
        'Status': 'var(--color-influence)'
    };
    return colorMap[cardType] || 'var(--color-gold)';
};