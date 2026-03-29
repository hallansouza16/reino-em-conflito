// Funções utilitárias compartilhadas
export const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const playSound = (type) => {
    console.log(`[SOUND EFFECT]: ${type}`);
};

export const shakeElement = (elementId) => {
    const el = document.getElementById(elementId);
    if (el) {
        el.classList.add('shake-active');
        playSound('impact');
        setTimeout(() => el.classList.remove('shake-active'), 500);
    }
};

export const hasStatus = (p, statusId) => p.status && p.status.includes(statusId);
export const hasUpgrade = (p, upgradeId) => p.upgrades && p.upgrades.includes(upgradeId);

export const addStatus = (p, statusId, STATUS_DEFINITIONS) => {
    if (!p.status) p.status = [];
    if (!p.status.includes(statusId)) {
        p.status.push(statusId);
        return STATUS_DEFINITIONS[statusId].name;
    }
    return null;
};

export const removeStatus = (p, statusId, STATUS_DEFINITIONS) => {
    if (!p.status) return null;
    const index = p.status.indexOf(statusId);
    if (index > -1) {
        p.status.splice(index, 1);
        return STATUS_DEFINITIONS[statusId].name;
    }
    return null;
};

export const calculateCost = (baseCost, player, isCard = false, cardType = null, selectedCharacter = null) => {
    let cost = baseCost;
    
    if (hasStatus(player, 'HIGH_TAXES')) {
        cost += 1;
    }
    
    if (player.playerNumber === 1 && hasUpgrade(player, 'tax_reform')) {
        cost = Math.max(1, cost - 1);
    }
    
    if (isCard && player.playerNumber === 1 && selectedCharacter && selectedCharacter.costModifier) {
        if (cardType === 'Opponent' || cardType === 'Gamble') {
            cost = Math.max(1, cost + selectedCharacter.costModifier({ type: cardType }));
        }
    }
    return Math.max(1, cost);
};

export const renderCharacterSelection = (containerId, onSelect) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    import('./characters.js').then(({ CHARACTERS }) => {
        container.innerHTML = '';
        CHARACTERS.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.charId = char.id;
            card.onclick = () => onSelect(char.id);

            // Criar elementos separadamente para melhor controle
            const titleDiv = document.createElement('div');
            titleDiv.className = 'char-title';
            titleDiv.textContent = char.name;

            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'character-avatar';
            avatarDiv.style.cssText = `
                width: 100%;
                height: 140px;
                background-image: url('${char.image}');
                background-size: cover;
                background-repeat: no-repeat;
                background-position: center center;
                border: 3px solid var(--color-gold);
                border-radius: 8px;
                margin-bottom: 15px;
                background-color: #2a2a2a;
            `;

            const statsDiv = document.createElement('div');
            statsDiv.className = 'char-stats';
            statsDiv.innerHTML = `
                <p>Moedas: <strong>${char.initial.coins}</strong></p>
                <p>Exército: <strong>${char.initial.army}</strong></p>
                <p>Instabilidade: <strong>${char.initial.instability}</strong></p>
            `;

            const passiveDiv = document.createElement('div');
            passiveDiv.className = 'char-passive';
            passiveDiv.innerHTML = `<strong>Passiva:</strong> ${char.passive}`;

            // Montar o card
            card.appendChild(titleDiv);
            card.appendChild(avatarDiv);
            card.appendChild(statsDiv);
            card.appendChild(passiveDiv);

            container.appendChild(card);
        });
    });
};