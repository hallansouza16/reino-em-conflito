// js/audio-system.js - SISTEMA DE SONS MEDIEVAL MELHORADO
class AudioSystem {
    constructor() {
        this.sounds = new Map();
        this.muted = false;
        this.volume = 0.6;
        this.audioContext = null;
        this.init();
    }

    async init() {
        console.log('🎵 Inicializando AudioSystem Medieval...');
        
        // Sons medievais mais temáticos
        const medievalSounds = [
            // Ações básicas
            { id: 'mine', name: 'Mineração', type: 'action', freq: 300, dur: 0.3 },
            { id: 'recruit', name: 'Recrutamento', type: 'military', freq: 400, dur: 0.4 },
            { id: 'fortify', name: 'Fortificação', type: 'building', freq: 250, dur: 0.5 },
            { id: 'war', name: 'Guerra', type: 'military', freq: 150, dur: 0.8 },
            
            // Interface
            { id: 'click', name: 'Clique', type: 'ui', freq: 800, dur: 0.1 },
            { id: 'hover', name: 'Hover', type: 'ui', freq: 600, dur: 0.08 },
            { id: 'select_character', name: 'Seleção', type: 'ui', freq: 700, dur: 0.3 },
            
            // Cartas
            { id: 'card_play', name: 'Cartas', type: 'cards', freq: 500, dur: 0.2 },
            { id: 'card_buy', name: 'Compra Carta', type: 'cards', freq: 550, dur: 0.25 },
            
            // Eventos
            { id: 'victory', name: 'Vitória', type: 'events', freq: 900, dur: 1.2 },
            { id: 'defeat', name: 'Derrota', type: 'events', freq: 200, dur: 1.0 },
            { id: 'upgrade', name: 'Upgrade', type: 'events', freq: 1000, dur: 0.6 },
            { id: 'rebellion', name: 'Rebelião', type: 'events', freq: 180, dur: 0.7 },
            
            // Especiais
            { id: 'magic', name: 'Magia', type: 'special', freq: 1200, dur: 0.9 },
            { id: 'treasure', name: 'Tesouro', type: 'special', freq: 1100, dur: 0.5 },
            { id: 'celebration', name: 'Celebração', type: 'special', freq: 950, dur: 0.8 }
        ];

        this.initAudioContext();
        
        // Registrar todos os sons
        medievalSounds.forEach(config => {
            this.sounds.set(config.id, {
                id: config.id,
                name: config.name,
                type: config.type,
                frequency: config.freq,
                duration: config.dur,
                loaded: true
            });
        });

        console.log(`✅ AudioSystem pronto! ${this.sounds.size} sons medievais registrados`);
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();

                // Verificar estado inicial
                if (this.audioContext.state === 'suspended') {
                    console.log('🔊 AudioContext suspenso, aguardando interação do usuário');
                } else if (this.audioContext.state === 'running') {
                    console.log('🔊 Web Audio API inicializada e rodando');
                } else {
                    console.log('🔊 Web Audio API inicializada, estado:', this.audioContext.state);
                }

                // Adicionar listener para mudanças de estado
                this.audioContext.addEventListener('statechange', () => {
                    console.log('🔊 AudioContext estado mudou para:', this.audioContext.state);
                });

            } else {
                console.warn('❌ Web Audio API não suportada neste navegador');
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar Web Audio API:', error);
            this.audioContext = null;
        }
    }

    play(soundId, options = {}) {
        if (this.muted || !this.sounds.has(soundId)) {
            return;
        }

        // Verificar se o som específico está mutado nas configurações
        if (window.soundSettings && !window.soundSettings.canPlaySound(soundId)) {
            console.log(`🔇 Som ${soundId} está mutado nas configurações`);
            return;
        }

        const sound = this.sounds.get(soundId);
        const volume = options.volume || this.volume;
        const pitch = options.pitch || 1.0;

        console.log(`🔊 Tocando som medieval: ${soundId}`);

        // Verificar se AudioContext está disponível e em bom estado
        if (this.audioContext && this.audioContext.state === 'running') {
            try {
                this.playMedievalSound(sound, volume, pitch);
            } catch (error) {
                console.warn(`❌ Erro no som ${soundId}, usando fallback:`, error);
                this.playFallbackSound(sound, volume);
            }
        } else if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log(`🔊 AudioContext suspenso, tentando retomar para ${soundId}`);
            this.audioContext.resume().then(() => {
                try {
                    this.playMedievalSound(sound, volume, pitch);
                } catch (error) {
                    console.warn(`❌ Erro após resume, usando fallback:`, error);
                    this.playFallbackSound(sound, volume);
                }
            }).catch(error => {
                console.warn(`❌ Falha ao retomar AudioContext:`, error);
                this.playFallbackSound(sound, volume);
            });
        } else {
            console.log(`🔊 AudioContext indisponível (${this.audioContext?.state}), usando fallback`);
            this.playFallbackSound(sound, volume);
        }
    }

    playMedievalSound(sound, volume, pitch) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Configurar baseado no tipo de som
            switch(sound.type) {
                case 'military':
                    oscillator.type = 'sawtooth';
                    filter.type = 'lowpass';
                    filter.frequency.value = 1000;
                    break;
                case 'magic':
                case 'special':
                    oscillator.type = 'sine';
                    filter.type = 'highpass';
                    filter.frequency.value = 800;
                    break;
                case 'building':
                    oscillator.type = 'triangle';
                    filter.type = 'bandpass';
                    filter.frequency.value = 600;
                    break;
                default:
                    oscillator.type = 'sine';
                    filter.type = 'lowpass';
                    filter.frequency.value = 1200;
            }

            oscillator.frequency.value = sound.frequency * pitch;
            
            // Envelope suave
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, now + sound.duration * 0.7);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);

            oscillator.start(now);
            oscillator.stop(now + sound.duration);

        } catch (error) {
            console.warn('Erro no som medieval, usando fallback');
            this.playFallbackSound(sound, volume);
        }
    }

    playFallbackSound(sound, volume) {
        // Fallback simples usando o sistema de áudio básico
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.value = sound.frequency;

            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(volume, now + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);

            oscillator.start(now);
            oscillator.stop(now + sound.duration);

        } catch (error) {
            console.log(`🔊 ${sound.name} (fallback)`);
        }
    }

    // Métodos específicos para ações do jogo
    playActionMine() { 
        this.play('mine', { volume: 0.5 }); 
    }
    
    playActionRecruit() { 
        this.play('recruit', { volume: 0.6 }); 
    }
    
    playActionFortify() { 
        this.play('fortify', { volume: 0.5 }); 
    }
    
    playActionWar() { 
        this.play('war', { volume: 0.7 }); 
    }
    
    playCardPlay() { 
        this.play('card_play', { volume: 0.4 }); 
    }
    
    playCardBuy() { 
        this.play('card_buy', { volume: 0.4 }); 
    }
    
    playVictory() { 
        this.play('victory', { volume: 0.8 }); 
    }
    
    playDefeat() { 
        this.play('defeat', { volume: 0.6 }); 
    }
    
    playUpgrade() { 
        this.play('upgrade', { volume: 0.5 }); 
    }
    
    playRebellion() { 
        this.play('rebellion', { volume: 0.7 }); 
    }
    
    playMagic() { 
        this.play('magic', { volume: 0.5, pitch: 1.2 }); 
    }
    
    playTreasure() { 
        this.play('treasure', { volume: 0.4 }); 
    }
    
    playCelebration() { 
        this.play('celebration', { volume: 0.6 }); 
    }
    
    playClick() { 
        this.play('click', { volume: 0.3 }); 
    }
    
    playHover() { 
        this.play('hover', { volume: 0.2 }); 
    }
    
    playSelectCharacter() { 
        this.play('select_character', { volume: 0.4 }); 
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        console.log(`🎚️ Volume medieval definido para: ${this.volume}`);
    }

    toggleMute() {
        this.muted = !this.muted;
        console.log(this.muted ? '🔇 Sons medievais mutados' : '🔊 Sons medievais ativados');
        return this.muted;
    }

    resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
            console.log('🔊 AudioContext medieval retomado');
        }
    }
}

// Instância global
if (typeof window !== 'undefined') {
    window.audioSystem = new AudioSystem();
    
    // Ativar áudio na primeira interação do usuário
    document.addEventListener('click', () => {
        window.audioSystem.resumeAudio();
    });
    
    // Debug
    window.debugAudio = () => {
        console.log('🔊 Status do AudioSystem:', {
            sounds: window.audioSystem.sounds.size,
            muted: window.audioSystem.muted,
            volume: window.audioSystem.volume
        });
    };
}

export default AudioSystem;