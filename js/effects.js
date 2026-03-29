// js/effects.js - Sistema Modular de Efeitos Visuais
class EffectsManager {
    constructor() {
        this.effects = new Map();
        this.init();
    }

    init() {
        console.log('✨ EffectsManager inicializado');
    }

    applyEffect(element, effectName, duration = 1000) {
        if (!element || typeof element.classList !== 'object') return;

        const effectClass = `effect-${effectName}`;
        
        // Remove efeito anterior se existir
        element.classList.remove(effectClass);
        
        // Força reflow
        void element.offsetWidth;
        
        // Aplica novo efeito
        element.classList.add(effectClass);
        
        // Remove após a duração
        if (duration > 0) {
            setTimeout(() => {
                element.classList.remove(effectClass);
            }, duration);
        }
    }

    applyEffectById(elementId, effectName, duration = 1000) {
        const element = document.getElementById(elementId);
        if (element) {
            this.applyEffect(element, effectName, duration);
        }
    }

    // Efeitos específicos para ações do jogo
    pulseElement(elementId) {
        this.applyEffectById(elementId, 'pulse', 2000);
    }

    shakeElement(elementId) {
        this.applyEffectById(elementId, 'shake', 500);
    }

    floatElement(elementId) {
        this.applyEffectById(elementId, 'float', 3000);
    }

    sparkleElement(elementId) {
        this.applyEffectById(elementId, 'sparkle', 1500);
    }

    // Efeitos contextuais
    playMineEffects() {
        this.pulseElement('mine-button');
        this.sparkleElement('p1-coin-display');
    }

    playRecruitEffects() {
        this.pulseElement('recruit-button');
        this.sparkleElement('p1-army-value');
    }

    playWarEffects() {
        this.shakeElement('game-container');
        this.pulseElement('war-button');
    }

    playCardEffects(cardType) {
        if (cardType === 'Gamble') {
            this.floatElement('card-market');
        } else {
            this.pulseElement('card-market');
        }
    }

    playVictoryEffects() {
        this.applyEffectById('game-container', 'pulse', 5000);
        this.floatElement('winner-title');
    }

    playDefeatEffects() {
        this.shakeElement('game-container');
        this.applyEffectById('game-over-screen', 'pulse', 3000);
    }
}

// Instância global segura
if (typeof window !== 'undefined') {
    window.effectsManager = new EffectsManager();
}

export default EffectsManager;