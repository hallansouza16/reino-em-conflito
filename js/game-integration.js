// js/game-integration.js - INTEGRAÇÃO COMPLETA DOS SISTEMAS
class GameIntegration {
    constructor() {
        this.audioSystem = null;
        this.visualEffects = null;
        this.musicSystem = null;
        this.init();
    }

    async init() {
        console.log('🎮 Inicializando Integração do Jogo...');
        
        // Carregar sistemas
        await this.loadMusicSystem();
        await this.loadAudioSystem();
        await this.loadVisualEffects();
        
        this.setupGlobalEventListeners();
        this.integrateWithExistingGame();
        
        console.log('✅ Integração do jogo concluída');
        
        // Iniciar música do menu
        setTimeout(() => {
            if (this.musicSystem) {
                this.musicSystem.playMenuMusic();
            }
        }, 1000);
    }

    async loadMusicSystem() {
        try {
            const { default: MusicSystem } = await import('./music-system.js');
            this.musicSystem = window.musicSystem || new MusicSystem();
            window.musicSystem = this.musicSystem;
        } catch (error) {
            console.warn('❌ Erro ao carregar MusicSystem:', error);
            this.musicSystem = { 
                playMenuMusic: () => {},
                playBattleMusic: () => {},
                stopCurrentMusic: () => {},
                setVolume: () => {}
            };
        }
    }

    async loadAudioSystem() {
        try {
            const { default: AudioSystem } = await import('./audio-system.js');
            this.audioSystem = window.audioSystem || new AudioSystem();
            window.audioSystem = this.audioSystem;
        } catch (error) {
            console.warn('❌ Erro ao carregar AudioSystem:', error);
            this.audioSystem = { 
                play: () => {}, 
                playActionMine: () => {},
                playActionRecruit: () => {},
                playActionWar: () => {}
            };
        }
    }

    async loadVisualEffects() {
        try {
            const { default: VisualEffects } = await import('./visual-effects.js');
            this.visualEffects = window.visualEffects || new VisualEffects();
            window.visualEffects = this.visualEffects;
        } catch (error) {
            console.warn('❌ Erro ao carregar VisualEffects:', error);
            this.visualEffects = { 
                applyEffectById: () => {},
                playMineEffects: () => {},
                playWarEffects: () => {}
            };
        }
    }

    setupGlobalEventListeners() {
        // Efeitos de hover em botões
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('.menu-btn, .action-button, .card-buy-button, .character-card')) {
                this.visualEffects.playHoverEffects(e.target);
            }
        });

        // Efeitos de clique
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .character-card, .card-buy-button')) {
                this.visualEffects.playClickEffects(e.target);
            }
        });

        // Seleção de personagem
        document.addEventListener('click', (e) => {
            if (e.target.closest('.character-card')) {
                this.visualEffects.playSelectCharacterEffects();
            }
        });

        // Navegação entre páginas - parar música ao sair
        window.addEventListener('beforeunload', () => {
            if (this.musicSystem) {
                this.musicSystem.stopCurrentMusic();
            }
        });
    }

    integrateWithExistingGame() {
        this.integrateSingleplayer();
        this.integrateMultiplayer();
        this.integrateCombatSystem();
        this.integrateMenuSystem();
    }

    integrateMenuSystem() {
        // Música do menu toca automaticamente
        if (window.location.pathname.includes('index.html') || 
            window.location.pathname === '/' ||
            window.location.pathname.includes('singleplayer.html') && !this.isGameRunning()) {
            
            setTimeout(() => {
                if (this.musicSystem && !this.musicSystem.isPlaying) {
                    this.musicSystem.playMenuMusic();
                }
            }, 500);
        }
    }

    integrateSingleplayer() {
        if (typeof window !== 'undefined' && window.mineAction) {
            const originalMineAction = window.mineAction;
            window.mineAction = function(p) {
                const result = originalMineAction.call(this, p);
                if (result) {
                    window.visualEffects.playMineEffects();
                }
                return result;
            };
        }

        // Integrar guerra com música de batalha
        this.patchGameFunction('warAction', 'playWarEffects');
        
        // Integrar outras ações
        this.patchGameFunction('recruitAction', 'playRecruitEffects');
        this.patchGameFunction('fortifyAction', 'playFortifyEffects');
        this.patchGameFunction('specialAbilityAction', 'playMagicEffects');
    }

    integrateMultiplayer() {
        // Integrar com eventos multiplayer
        if (typeof io !== 'undefined') {
            // Os sons multiplayer serão acionados pelos eventos do socket
        }
    }

    integrateCombatSystem() {
        if (typeof window !== 'undefined' && window.combatSystem) {
            const originalStartCombat = window.combatSystem.startCombat;
            window.combatSystem.startCombat = function(...args) {
                // Tocar música de batalha
                if (window.musicSystem) {
                    window.musicSystem.playBattleMusic();
                }
                
                window.visualEffects.playWarEffects();
                return originalStartCombat.apply(this, args);
            };

            // Quando o combate terminar, voltar para música do menu
            const originalEndCombat = window.combatSystem.endCombat;
            window.combatSystem.endCombat = function(...args) {
                const result = originalEndCombat.apply(this, args);
                
                // Voltar para música do menu após 3 segundos
                setTimeout(() => {
                    if (window.musicSystem) {
                        window.musicSystem.playMenuMusic();
                    }
                }, 3000);
                
                return result;
            };
        }
    }

    patchGameFunction(functionName, effectMethod) {
        if (typeof window !== 'undefined' && window[functionName]) {
            const originalFunction = window[functionName];
            window[functionName] = function(...args) {
                const result = originalFunction.apply(this, args);
                if (result && window.visualEffects) {
                    window.visualEffects[effectMethod]();
                }
                return result;
            };
        }
    }

    isGameRunning() {
        // Verificar se o jogo está em andamento
        return document.getElementById('game-screen') && 
               document.getElementById('game-screen').style.display !== 'none';
    }

    // Métodos utilitários para uso direto
    playSound(soundId, options = {}) {
        if (this.audioSystem) {
            this.audioSystem.play(soundId, options);
        }
    }

    playEffect(effectName, elementId = null) {
        if (this.visualEffects) {
            if (elementId) {
                this.visualEffects.applyEffectById(elementId, effectName);
            } else {
                this.visualEffects.applyEffectById('game-container', effectName);
            }
        }
    }

    playMusic(musicId) {
        if (this.musicSystem) {
            this.musicSystem.playMusic(musicId);
        }
    }
}

// Inicialização automática
function initializeGameIntegration() {
    setTimeout(() => {
        if (!window.gameIntegration) {
            window.gameIntegration = new GameIntegration();
        }
    }, 1000);
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGameIntegration);
} else {
    initializeGameIntegration();
}

export default GameIntegration;