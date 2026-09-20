// js/visual-effects.js - SISTEMA DE EFEITOS VISUAIS MEDIEVAIS
class VisualEffects {
    constructor() {
        this.effects = new Map();
        this.init();
    }

    init() {
        console.log('✨ Sistema de Efeitos Visuais Medieval inicializado');
        this.createEffectStyles();
    }

    createEffectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Efeitos Medievais */
            .effect-pulse-gold {
                animation: pulseGold 2s ease-in-out;
            }
            
            .effect-shake-battle {
                animation: shakeBattle 0.5s ease-in-out;
            }
            
            .effect-float-magic {
                animation: floatMagic 3s ease-in-out;
            }
            
            .effect-sparkle-treasure {
                animation: sparkleTreasure 1.5s ease-in-out;
            }
            
            .effect-glow-victory {
                animation: glowVictory 4s ease-in-out;
            }
            
            .effect-smoke-rebellion {
                animation: smokeRebellion 2s ease-in-out;
            }
            
            .effect-ripple-card {
                animation: rippleCard 1s ease-out;
            }
            
            .effect-scale-upgrade {
                animation: scaleUpgrade 0.8s ease-out;
            }

            .effect-aura-character {
                animation: auraCharacter 2s infinite alternate;
            }

            /* Animações */
            @keyframes pulseGold {
                0%, 100% { 
                    box-shadow: 0 0 5px var(--color-gold); 
                }
                50% { 
                    box-shadow: 0 0 20px var(--color-gold), 0 0 30px rgba(241, 196, 15, 0.6); 
                }
            }
            
            @keyframes shakeBattle {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-8px); }
                40%, 80% { transform: translateX(8px); }
            }
            
            @keyframes floatMagic {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-10px) scale(1.05); }
            }
            
            @keyframes sparkleTreasure {
                0%, 100% { 
                    filter: brightness(1) drop-shadow(0 0 5px var(--color-gold));
                }
                50% { 
                    filter: brightness(1.5) drop-shadow(0 0 15px var(--color-gold));
                }
            }
            
            @keyframes glowVictory {
                0%, 100% { 
                    background: rgba(39, 174, 96, 0.1);
                    box-shadow: 0 0 10px var(--color-army);
                }
                50% { 
                    background: rgba(39, 174, 96, 0.3);
                    box-shadow: 0 0 25px var(--color-army);
                }
            }
            
            @keyframes smokeRebellion {
                0% { 
                    opacity: 0;
                    transform: translateY(0) scale(0.8);
                    filter: blur(0);
                }
                50% { 
                    opacity: 1;
                    transform: translateY(-20px) scale(1.1);
                    filter: blur(2px);
                }
                100% { 
                    opacity: 0;
                    transform: translateY(-40px) scale(1.2);
                    filter: blur(4px);
                }
            }
            
            @keyframes rippleCard {
                0% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7);
                }
                70% {
                    transform: scale(1.05);
                    box-shadow: 0 0 0 15px rgba(52, 152, 219, 0);
                }
                100% {
                    transform: scale(1);
                    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
                }
            }
            
            @keyframes scaleUpgrade {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            @keyframes auraCharacter {
                0% { filter: drop-shadow(0 0 5px var(--color-gold)) brightness(1); }
                100% { filter: drop-shadow(0 0 15px var(--color-gold)) brightness(1.2); }
            }

            /* Clima */
            .weather-winter {
                filter: sepia(0.2) saturate(0.8) brightness(0.9);
                transition: filter 3s ease-in-out;
            }

            .weather-summer {
                filter: saturate(1.2) brightness(1.1) contrast(1.1);
                transition: filter 3s ease-in-out;
            }

            /* Partículas */
            .particle {
                position: absolute;
                pointer-events: none;
                z-index: 1000;
            }
            
            .particle-gold {
                background: radial-gradient(circle, var(--color-gold) 0%, transparent 70%);
                border-radius: 50%;
            }
            
            .particle-magic {
                background: radial-gradient(circle, #9b55b5 0%, transparent 70%);
                border-radius: 50%;
            }
            
            .particle-fire {
                background: radial-gradient(circle, var(--color-fire) 0%, transparent 70%);
                border-radius: 50%;
            }

            .particle-snow {
                background: white;
                border-radius: 50%;
                filter: blur(1px);
            }
        `;
        document.head.appendChild(style);
    }

    applyEffect(element, effectName, duration = 1000) {
        if (!element || typeof element.classList !== 'object') return;

        const effectClass = `effect-${effectName}`;
        
        // Remove efeito anterior
        element.classList.remove(effectClass);
        void element.offsetWidth; // Force reflow
        
        // Aplica novo efeito
        element.classList.add(effectClass);
        
        // Remove após duração
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

    // Efeitos específicos para ações medievais
    playMineEffects() {
        this.applyEffectById('mine-button', 'pulse-gold', 1500);
        this.createParticles('mine-button', 'gold', 5);
        if (window.audioSystem) window.audioSystem.playActionMine();
    }

    // --- FASE 2: NOVOS EFEITOS ---

    /**
     * Exibe um toast animado de conquista
     */
    showAchievementToast(title, desc) {
        const toast = document.getElementById('achievement-toast');
        const titleEl = document.getElementById('toast-title');
        const descEl = document.getElementById('toast-desc');

        if (!toast || !titleEl || !descEl) return;

        titleEl.textContent = title;
        descEl.textContent = desc;

        toast.classList.add('active');
        
        // Som de conquista
        if (window.audioSystem) {
            window.audioSystem.play('victory'); 
        }

        setTimeout(() => {
            toast.classList.remove('active');
        }, 5000);
    }

    /**
     * Efeito de flash na tela toda para Ultimates
     */
    playUltimateFlash(color = 'rgba(255, 106, 0, 0.4)') {
        const flash = document.getElementById('screen-flash');
        if (!flash) return;

        flash.style.backgroundColor = color;
        flash.style.opacity = '1';
        
        setTimeout(() => {
            flash.style.opacity = '0';
        }, 500);
    }

    /**
     * Partículas gigantes para Ultimate
     */
    playUltimateParticles(type, x = window.innerWidth / 2, y = window.innerHeight / 2) {
        const colors = {
            'fire': ['#ff6a00', '#f1c40f', '#e67e22'],
            'magic': ['#9b55b5', '#8e44ad', '#3498db'],
            'gold': ['#f1c40f', '#d4af37', '#ffffff']
        };

        const particleColors = colors[type] || colors.fire;
        
        for (let i = 0; i < 50; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.backgroundColor = particleColors[Math.floor(Math.random() * particleColors.length)];
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.width = (Math.random() * 15 + 10) + 'px';
            p.style.height = p.style.width;
            p.style.borderRadius = '50%';
            p.style.position = 'fixed';
            p.style.zIndex = '10000';
            p.style.pointerEvents = 'none';
            p.style.boxShadow = `0 0 15px ${p.style.backgroundColor}`;
            
            document.body.appendChild(p);
            
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 500 + 100;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            
            p.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 1500 + Math.random() * 1000,
                easing: 'cubic-bezier(0.1, 0.5, 0.1, 1)'
            }).onfinish = () => p.remove();
        }
    }

    playActionMine() {
    }

    playRecruitEffects() {
        this.applyEffectById('recruit-button', 'shake-battle', 800);
        this.applyEffectById('p1-army-value', 'pulse-gold', 1200);
        if (window.audioSystem) window.audioSystem.playActionRecruit();
    }

    playFortifyEffects() {
        this.applyEffectById('fortify-button', 'scale-upgrade', 1000);
        if (window.audioSystem) window.audioSystem.playActionFortify();
    }

    playWarEffects() {
        this.applyEffectById('war-button', 'shake-battle', 1000);
        this.applyEffectById('game-container', 'shake-battle', 800);
        this.createParticles('war-button', 'fire', 8);
        if (window.audioSystem) window.audioSystem.playActionWar();
    }

    playCardEffects(cardType) {
        this.applyEffectById('card-market', 'ripple-card', 1000);
        
        if (cardType === 'Gamble' || cardType === 'Special') {
            this.createParticles('card-market', 'magic', 6);
            if (window.audioSystem) window.audioSystem.playMagic();
        } else {
            if (window.audioSystem) window.audioSystem.playCardPlay();
        }
    }

    playCardBuyEffects() {
        this.applyEffectById('card-market', 'sparkle-treasure', 1200);
        if (window.audioSystem) window.audioSystem.playCardBuy();
    }

    playVictoryEffects() {
        this.applyEffectById('game-container', 'glow-victory', 4000);
        this.createParticles('game-container', 'gold', 15);
        if (window.audioSystem) window.audioSystem.playVictory();
    }

    playDefeatEffects() {
        this.applyEffectById('game-container', 'smoke-rebellion', 3000);
        if (window.audioSystem) window.audioSystem.playDefeat();
    }

    playUpgradeEffects() {
        this.applyEffectById('shop-button', 'scale-upgrade', 1200);
        this.applyEffectById('p1-currencies-display', 'sparkle-treasure', 1500);
        if (window.audioSystem) window.audioSystem.playUpgrade();
    }

    playRebellionEffects() {
        this.applyEffectById('game-container', 'shake-battle', 1000);
        this.createParticles('game-container', 'fire', 10);
        if (window.audioSystem) window.audioSystem.playRebellion();
    }

    playTreasureEffects() {
        this.applyEffectById('global-coin-display', 'sparkle-treasure', 2000);
        this.createParticles('global-coin-display', 'gold', 8);
        if (window.audioSystem) window.audioSystem.playTreasure();
    }

    playCelebrationEffects() {
        this.applyEffectById('game-container', 'float-magic', 3000);
        this.createParticles('game-container', 'gold', 12);
        if (window.audioSystem) window.audioSystem.playCelebration();
    }

    playHoverEffects(element) {
        this.applyEffect(element, 'pulse-gold', 500);
        if (window.audioSystem) window.audioSystem.playHover();
    }

    playClickEffects(element) {
        this.applyEffect(element, 'scale-upgrade', 300);
        if (window.audioSystem) window.audioSystem.playClick();
    }

    playSelectCharacterEffects() {
        this.applyEffectById('character-grid', 'pulse-gold', 1500);
        if (window.audioSystem) window.audioSystem.playSelectCharacter();
    }

    // Novos Efeitos de Clima e Personagens
    applyWeather(season) {
        const overlay = document.querySelector('.background-overlay');
        if (!overlay) return;

        overlay.classList.remove('weather-winter', 'weather-summer');
        
        if (season === 'Inverno') {
            overlay.classList.add('weather-winter');
            this.createParticles('game-container', 'snow', 20);
        } else if (season === 'Verão') {
            overlay.classList.add('weather-summer');
            this.createParticles('game-container', 'fire', 5); // Simular calor
        }
    }

    playPassiveFeedback(charId) {
        const targetId = 'p1-avatar';
        switch(charId) {
            case 'rei':
                this.applyEffectById(targetId, 'sparkle-treasure', 1500);
                this.createParticles(targetId, 'gold', 5);
                break;
            case 'rainha':
                this.applyEffectById(targetId, 'float-magic', 1500);
                this.createParticles(targetId, 'magic', 4);
                break;
            case 'ladrão':
                this.applyEffectById('p1-currencies-display', 'pulse-gold', 1000);
                this.createParticles('p1-currencies-display', 'gold', 3);
                break;
            case 'bruxa':
                this.applyEffectById(targetId, 'aura-character', 2000);
                this.createParticles(targetId, 'magic', 6);
                break;
            default:
                this.applyEffectById(targetId, 'pulse-gold', 1000);
        }
    }

    playSoldierShield() {
        this.applyEffectById('p1-avatar', 'aura-character', 1500);
        this.applyEffectById('p1-army-stat', 'pulse-gold', 1000);
    }

    // Sistema de partículas
    createParticles(sourceElementId, type, count = 5) {
        const sourceElement = document.getElementById(sourceElementId);
        if (!sourceElement) return;

        const rect = sourceElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < count; i++) {
            this.createParticle(centerX, centerY, type);
        }
    }

    createParticle(x, y, type) {
        const particle = document.createElement('div');
        particle.className = `particle particle-${type}`;
        
        const size = Math.random() * 8 + 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        document.body.appendChild(particle);
        
        // Animação da partícula
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50 + 30;
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;
        
        const duration = Math.random() * 1000 + 500;
        
        particle.animate([
            { 
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            { 
                transform: `translate(${targetX - x}px, ${targetY - y}px) scale(0)`,
                opacity: 0
            }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        });
        
        // Remover após animação
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, duration);
    }
}

// Instância global
if (typeof window !== 'undefined') {
    window.visualEffects = new VisualEffects();
}

export default VisualEffects;