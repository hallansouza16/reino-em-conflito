// js/sounds-fixed.js - SISTEMA DE SONS CORRIGIDO
class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.muted = false;
        this.volume = 0.7;
        this.audioContext = null;
        this.init();
    }

    async init() {
        console.log('🎵 Inicializando SoundManager...');
        
        // Sons locais simples (usando tone.js como fallback)
        const soundConfigs = [
            { id: 'click', name: 'Clique', type: 'beep' },
            { id: 'mine', name: 'Mineração', type: 'beep' },
            { id: 'recruit', name: 'Recrutamento', type: 'beep' },
            { id: 'fortify', name: 'Fortificação', type: 'beep' },
            { id: 'war', name: 'Guerra', type: 'beep' },
            { id: 'card_play', name: 'Cartas', type: 'beep' },
            { id: 'end_turn', name: 'Fim de Turno', type: 'beep' },
            { id: 'victory', name: 'Vitória', type: 'beep' },
            { id: 'defeat', name: 'Derrota', type: 'beep' },
            { id: 'error', name: 'Erro', type: 'beep' },
            { id: 'hover', name: 'Hover', type: 'beep' },
            { id: 'upgrade', name: 'Upgrade', type: 'beep' },
            { id: 'gamble_win', name: 'Aposta Ganha', type: 'beep' },
            { id: 'gamble_lose', name: 'Aposta Perdida', type: 'beep' },
            { id: 'rebellion', name: 'Rebelião', type: 'beep' },
            { id: 'select_character', name: 'Seleção', type: 'beep' }
        ];

        // Inicializar Web Audio API se disponível
        this.initAudioContext();

        // Registrar todos os sons
        soundConfigs.forEach(config => {
            this.sounds.set(config.id, {
                id: config.id,
                name: config.name,
                type: config.type,
                loaded: true
            });
        });

        console.log(`✅ SoundManager pronto! ${this.sounds.size} sons registrados`);
        
        // Teste automático
        setTimeout(() => this.playTest(), 1000);
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
                console.log('🔊 Web Audio API inicializada');
            }
        } catch (error) {
            console.warn('❌ Web Audio API não disponível, usando fallback');
        }
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

        console.log(`🔊 Tocando: ${soundId}`);

        // Tocar som baseado no tipo
        switch (sound.type) {
            case 'beep':
                this.playBeep(soundId);
                break;
            default:
                this.playBeep(soundId);
        }
    }

    playBeep(soundId) {
        const frequencies = {
            'click': 800,
            'mine': 400,
            'recruit': 300,
            'fortify': 200,
            'war': 150,
            'card_play': 600,
            'end_turn': 500,
            'victory': 900,
            'defeat': 100,
            'error': 150,
            'hover': 700,
            'upgrade': 1000,
            'gamble_win': 1200,
            'gamble_lose': 80,
            'rebellion': 180,
            'select_character': 1100
        };

        const duration = {
            'click': 0.1,
            'mine': 0.3,
            'recruit': 0.2,
            'fortify': 0.4,
            'war': 0.5,
            'card_play': 0.15,
            'end_turn': 0.25,
            'victory': 1.0,
            'defeat': 0.8,
            'error': 0.3,
            'hover': 0.08,
            'upgrade': 0.6,
            'gamble_win': 0.7,
            'gamble_lose': 0.9,
            'rebellion': 0.6,
            'select_character': 0.4
        };

        const freq = frequencies[soundId] || 440;
        const dur = duration[soundId] || 0.2;

        if (this.audioContext && this.audioContext.state === 'running') {
            this.playWebAudioBeep(freq, dur);
        } else {
            this.playHTML5Beep(freq, dur);
        }
    }

    playWebAudioBeep(frequency, duration) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);

        } catch (error) {
            console.warn('❌ Erro Web Audio, usando fallback HTML5');
            this.playHTML5Beep(frequency, duration);
        }
    }

    playHTML5Beep(frequency, duration) {
        try {
            // Fallback usando HTML5 Audio (beep simples)
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);

        } catch (error) {
            console.warn('❌ Fallback HTML5 também falhou, usando beep final');
            // Último fallback - beep do sistema
            this.playSystemBeep();
        }
    }

    playSystemBeep() {
        // Beep muito simples que deve funcionar em qualquer navegador
        try {
            const audio = new Audio();
            const source = `
                data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUgBjiN1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUgBk=`;
            audio.src = source;
            audio.volume = this.volume;
            audio.play().catch(e => console.log('🔇 Autoplay bloqueado, clique para ativar sons'));
        } catch (error) {
            console.log('🔊 Beep (fallback final)');
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

    // Métodos específicos
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

    // Verificar status
    getStatus() {
        return {
            loaded: this.sounds.size,
            muted: this.muted,
            volume: this.volume,
            audioContext: this.audioContext ? this.audioContext.state : 'unavailable'
        };
    }

    // Resumir todos os sons (para interação do usuário)
    resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
            console.log('🔊 AudioContext retomado');
        }
    }
}

// Instância global segura
if (typeof window !== 'undefined') {
    window.soundManager = new SoundManager();
    
    // Adicionar evento de clique para ativar audio
    document.addEventListener('click', () => {
        if (window.soundManager) {
            window.soundManager.resumeAudio();
        }
    });
    
    // Debug no console
    window.debugSounds = () => {
        console.log('🔊 Status do SoundManager:', window.soundManager.getStatus());
    };
}

export default SoundManager;