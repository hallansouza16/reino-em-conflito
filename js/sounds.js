// js/sounds.js - SISTEMA DE SONS FUNCIONAL
class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.muted = false;
        this.volume = 0.7;
        this.globalVolume = 1.0;
        this.effectsVolume = 1.0;
        this.musicVolume = 1.0;
        this.init();
    }

    async init() {
        console.log('🎵 Inicializando SoundManager...');
        
        // Sons mais simples e confiáveis
        const soundConfigs = [
            { id: 'mine', url: 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3' },
            { id: 'recruit', url: 'https://assets.mixkit.co/sfx/preview/mixkit-sword-cutting-flesh-278.mp3' },
            { id: 'fortify', url: 'https://assets.mixkit.co/sfx/preview/mixkit-building-announcement-886.mp3' },
            { id: 'war', url: 'https://assets.mixkit.co/sfx/preview/mixkit-war-horn-2141.mp3' },
            { id: 'card_play', url: 'https://assets.mixkit.co/sfx/preview/mixkit-card-deck-shuffle-1141.mp3' },
            { id: 'end_turn', url: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3' },
            { id: 'victory', url: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3' },
            { id: 'defeat', url: 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3' },
            { id: 'error', url: 'https://assets.mixkit.co/sfx/preview/mixkit-warning-alarm-990.mp3' },
            { id: 'hover', url: 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3' },
            { id: 'click', url: 'https://assets.mixkit.co/sfx/preview/mixkit-glass-click-1136.mp3' },
            { id: 'upgrade', url: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3' },
            { id: 'gamble_win', url: 'https://assets.mixkit.co/sfx/preview/mixkit-coins-handling-1936.mp3' },
            { id: 'gamble_lose', url: 'https://assets.mixkit.co/sfx/preview/mixkit-sad-game-over-trombone-471.mp3' },
            { id: 'rebellion', url: 'https://assets.mixkit.co/sfx/preview/mixkit-crowd-riot-1031.mp3' },
            { id: 'select_character', url: 'https://assets.mixkit.co/sfx/preview/mixkit-magic-sparkles-216.mp3' }
        ];

        console.log(`📥 Carregando ${soundConfigs.length} sons...`);

        // Carregar sons sequencialmente para evitar problemas
        for (const config of soundConfigs) {
            await this.loadSound(config.id, config.url);
        }

        console.log(`✅ SoundManager pronto! ${this.sounds.size} sons carregados.`);
        
        // Teste opcional - descomente para testar
        // setTimeout(() => this.playTest(), 1000);
    }

    async loadSound(id, url) {
        return new Promise((resolve) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                console.log(`✅ ${id} carregado`);
                this.sounds.set(id, audio);
                resolve();
            });
            
            audio.addEventListener('error', (e) => {
                console.warn(`❌ Erro ao carregar ${id}:`, e);
                // Criar um fallback silencioso
                this.sounds.set(id, {
                    play: () => console.log(`Tocando ${id} (fallback)`),
                    volume: 0,
                    cloneNode: () => ({ 
                        play: () => {},
                        volume: 0
                    })
                });
                resolve();
            });
            
            audio.src = url;
            audio.volume = 0.3;
            audio.preload = 'auto';
            audio.load();

            // Timeout de segurança
            setTimeout(() => resolve(), 2000);
        });
    }

    play(soundId) {
        if (this.muted) {
            console.log(`🔇 Som ${soundId} mutado`);
            return;
        }

        const sound = this.sounds.get(soundId);
        if (!sound) {
            console.warn(`❌ Som ${soundId} não encontrado`);
            return;
        }

        try {
            // Usar cloneNode para permitir sobreposição
            const soundClone = sound.cloneNode ? sound.cloneNode() : sound;
            
            // Aplicar volumes
            let finalVolume = this.volume;
            if (window.soundSettings) {
                finalVolume = window.soundSettings.getEffectiveVolume();
            }
            
            soundClone.volume = finalVolume;
            
            // Reproduzir
            const playPromise = soundClone.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`⚠️ Erro ao reproduzir ${soundId}:`, error);
                });
            }
            
            console.log(`🔊 Tocando: ${soundId} (volume: ${finalVolume})`);
            
        } catch (error) {
            console.warn(`❌ Erro ao tocar ${soundId}:`, error);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log(`🎚️ Volume definido para: ${this.volume}`);
    }

    toggleMute() {
        this.muted = !this.muted;
        console.log(this.muted ? '🔇 Som mutado' : '🔊 Som ativado');
        return this.muted;
    }

    setGlobalVolume(volume) {
        this.globalVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    setEffectsVolume(volume) {
        this.effectsVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
    }

    updateAllVolumes() {
        // Esta função será usada pelas configurações
        console.log(`🎛️ Volumes atualizados - Global: ${this.globalVolume}, Efeitos: ${this.effectsVolume}`);
    }

    // Métodos específicos para facilitar o uso
    playMine() { this.play('mine'); }
    playRecruit() { this.play('recruit'); }
    playFortify() { this.play('fortify'); }
    playWar() { this.play('war'); }
    playCard() { this.play('card_play'); }
    playVictory() { this.play('victory'); }
    playDefeat() { this.play('defeat'); }
    playUpgrade() { this.play('upgrade'); }
    playGambleWin() { this.play('gamble_win'); }
    playGambleLose() { this.play('gamble_lose'); }
    playRebellion() { this.play('rebellion'); }
    playHover() { this.play('hover'); }
    playClick() { this.play('click'); }
    playSelectCharacter() { this.play('select_character'); }

    // Método de teste
    playTest() {
        console.log('🎵 Testando sons...');
        this.play('click');
        setTimeout(() => this.play('upgrade'), 300);
        setTimeout(() => this.play('victory'), 600);
    }

    // Verificar status dos sons
    getStatus() {
        return {
            loaded: this.sounds.size,
            muted: this.muted,
            volume: this.volume,
            globalVolume: this.globalVolume,
            effectsVolume: this.effectsVolume,
            musicVolume: this.musicVolume
        };
    }
}

// Instância global segura
if (typeof window !== 'undefined') {
    window.soundManager = new SoundManager();
    
    // Adicionar ao global para debug
    window.debugSounds = () => {
        console.log('🔊 Status do SoundManager:', window.soundManager.getStatus());
    };
}

export default SoundManager;