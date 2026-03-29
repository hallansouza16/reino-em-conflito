// js/music-system.js - SISTEMA DE MÚSICA COM FALLBACK COMPLETO
class MusicSystem {
    constructor() {
        this.music = new Map();
        this.currentMusic = null;
        this.isPlaying = false;
        this.volume = 0.4;
        this.muted = false;
        this.currentLoop = null;
        this.audioContext = null;
        this.fallbackAudio = null;
        this.init();
    }

    async init() {
        console.log('🎵 Inicializando MusicSystem Medieval...');
        
        // Configurações das músicas - URLs corrigidas
        this.musicConfig = {
            menu: {
                name: 'Música do Menu',
                file: '/music/menu-theme.mp3',
                fallbackFile: './music/menu-theme.mp3',
                volume: 0.3,
                loop: true,
                fadeIn: 3000,
                fadeOut: 2000
            },
            battle: {
                name: 'Música de Batalha', 
                file: '/music/battle-theme.mp3',
                fallbackFile: './music/battle-theme.mp3',
                volume: 0.5,
                loop: true,
                fadeIn: 1500,
                fadeOut: 1000
            },
            victory: {
                name: 'Música da Vitória',
                file: '/music/victory-theme.mp3',
                fallbackFile: './music/victory-theme.mp3', 
                volume: 0.4,
                loop: false,
                fadeIn: 1000,
                fadeOut: 3000
            },
            exploration: {
                name: 'Música de Exploração',
                file: '/music/exploration-theme.mp3',
                fallbackFile: './music/exploration-theme.mp3',
                volume: 0.35,
                loop: true,
                fadeIn: 2000,
                fadeOut: 1500
            }
        };

        this.initAudioContext();
        await this.preloadMusic();
        console.log('✅ MusicSystem pronto!');
    }

    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();

                // Verificar estado inicial
                if (this.audioContext.state === 'suspended') {
                    console.log('🎵 AudioContext suspenso, aguardando interação do usuário');
                } else if (this.audioContext.state === 'running') {
                    console.log('🎵 AudioContext inicializado e rodando');
                } else {
                    console.log('🎵 AudioContext inicializado, estado:', this.audioContext.state);
                }

                // Adicionar listener para mudanças de estado
                this.audioContext.addEventListener('statechange', () => {
                    console.log('🎵 AudioContext estado mudou para:', this.audioContext.state);
                });

            } else {
                console.warn('❌ Web Audio API não suportada para música');
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar AudioContext para música:', error);
            this.audioContext = null;
        }
    }

    async preloadMusic() {
        console.log('📥 Pré-carregando músicas...');
        
        // Primeiro tenta carregar músicas reais, depois cria fallbacks
        const loadPromises = [];
        
        for (const [musicId, config] of Object.entries(this.musicConfig)) {
            loadPromises.push(this.loadMusicFile(musicId, config));
        }
        
        await Promise.allSettled(loadPromises);
        console.log('🎵 Todas as músicas processadas');
    }

    async loadMusicFile(musicId, config) {
        return new Promise(async (resolve) => {
            try {
                // Primeiro tenta o caminho absoluto
                let audio = await this.tryLoadAudio(config.file, config.name);
                
                // Se falhar, tenta caminho relativo
                if (!audio) {
                    audio = await this.tryLoadAudio(config.fallbackFile, config.name);
                }
                
                // Se ainda falhar, cria fallback sintetizado
                if (!audio) {
                    console.log(`🎹 Criando música sintetizada para: ${config.name}`);
                    audio = this.createSynthesizedMusic(musicId, config);
                }
                
                this.music.set(musicId, audio);
                console.log(`✅ ${config.name} carregada/gerada`);
                resolve();
                
            } catch (error) {
                console.warn(`❌ Falha ao carregar ${config.name}, criando fallback:`, error);
                const audio = this.createSynthesizedMusic(musicId, config);
                this.music.set(musicId, audio);
                resolve();
            }
        });
    }

    async tryLoadAudio(url, name) {
        return new Promise((resolve) => {
            const audio = new Audio();
            let loaded = false;
            
            const onLoaded = () => {
                if (!loaded) {
                    loaded = true;
                    audio.removeEventListener('canplaythrough', onLoaded);
                    audio.removeEventListener('error', onError);
                    console.log(`✅ ${name} carregada de: ${url}`);
                    resolve(audio);
                }
            };
            
            const onError = (e) => {
                if (!loaded) {
                    loaded = true;
                    audio.removeEventListener('canplaythrough', onLoaded);
                    audio.removeEventListener('error', onError);
                    console.warn(`❌ ${name} não encontrada em: ${url}`);
                    resolve(null);
                }
            };
            
            audio.addEventListener('canplaythrough', onLoaded, { once: true });
            audio.addEventListener('error', onError, { once: true });
            
            audio.src = url;
            audio.preload = 'auto';
            audio.load();
            
            // Timeout de segurança
            setTimeout(() => {
                if (!loaded) {
                    loaded = true;
                    console.warn(`⏰ Timeout ao carregar ${name} de: ${url}`);
                    resolve(null);
                }
            }, 3000);
        });
    }

    createSynthesizedMusic(musicId, config) {
        console.log(`🎹 Criando música sintetizada para: ${config.name}`);
        
        return {
            isSynthesized: true,
            musicId: musicId,
            config: config,
            play: () => this.playSynthesizedMusic(musicId),
            pause: () => this.stopSynthesizedMusic(),
            stop: () => this.stopSynthesizedMusic(),
            volume: config.volume,
            loop: config.loop,
            currentTime: 0
        };
    }

    playSynthesizedMusic(musicId) {
        if (!this.audioContext) {
            console.warn(`❌ AudioContext não disponível para música ${musicId}`);
            return;
        }

        if (this.audioContext.state === 'suspended') {
            console.log(`🎵 AudioContext suspenso, tentando retomar para ${musicId}`);
            this.audioContext.resume().then(() => {
                this.playSynthesizedMusic(musicId);
            }).catch(error => {
                console.warn(`❌ Falha ao retomar AudioContext para ${musicId}:`, error);
            });
            return;
        }

        if (this.audioContext.state !== 'running') {
            console.warn(`❌ AudioContext em estado inválido (${this.audioContext.state}) para ${musicId}`);
            return;
        }

        try {
            this.stopSynthesizedMusic();
            
            const config = this.musicConfig[musicId];
            const now = this.audioContext.currentTime;
            
            // Criar osciladores principais baseados no tipo de música
            const oscillators = [];
            const gains = [];
            const filters = [];
            
            switch(musicId) {
                case 'menu':
                    // Melodia suave e calma para menu
                    oscillators.push(this.createOscillator(220, 'sine', now));
                    oscillators.push(this.createOscillator(330, 'triangle', now + 0.1));
                    oscillators.push(this.createOscillator(440, 'sine', now + 0.2));
                    break;
                    
                case 'battle':
                    // Música épica e intensa para batalha
                    oscillators.push(this.createOscillator(110, 'sawtooth', now));
                    oscillators.push(this.createOscillator(165, 'square', now + 0.05));
                    oscillators.push(this.createOscillator(220, 'sawtooth', now + 0.1));
                    break;
                    
                case 'victory':
                    // Fanfarra triunfal para vitória
                    oscillators.push(this.createOscillator(440, 'sine', now));
                    oscillators.push(this.createOscillator(554.37, 'sine', now + 0.1)); // C#
                    oscillators.push(this.createOscillator(659.25, 'sine', now + 0.2)); // E
                    break;
                    
                case 'exploration':
                    // Média misteriosa para exploração
                    oscillators.push(this.createOscillator(196, 'sine', now));
                    oscillators.push(this.createOscillator(293.66, 'triangle', now + 0.15)); // D
                    oscillators.push(this.createOscillator(392, 'sine', now + 0.3)); // G
                    break;
                    
                default:
                    oscillators.push(this.createOscillator(330, 'sine', now));
                    oscillators.push(this.createOscillator(440, 'sine', now + 0.1));
            }
            
            // Configurar ganhos e filtros
            oscillators.forEach((osc, index) => {
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                // Configurar filtro baseado no tipo de música
                switch(musicId) {
                    case 'menu':
                        filter.type = 'lowpass';
                        filter.frequency.value = 1200;
                        gain.gain.value = 0.08;
                        break;
                    case 'battle':
                        filter.type = 'bandpass';
                        filter.frequency.value = 600;
                        gain.gain.value = 0.12;
                        break;
                    case 'victory':
                        filter.type = 'highpass';
                        filter.frequency.value = 200;
                        gain.gain.value = 0.15;
                        break;
                    default:
                        filter.type = 'lowpass';
                        filter.frequency.value = 1000;
                        gain.gain.value = 0.1;
                }
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                gains.push(gain);
                filters.push(filter);
            });
            
            // Fade in suave
            gains.forEach(gain => {
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(this.volume * config.volume, now + (config.fadeIn / 1000));
            });
            
            // Configurar loop se necessário
            if (config.loop) {
                const loopInterval = musicId === 'battle' ? 8 : 12; // Segundos por loop
                this.currentLoop = setInterval(() => {
                    if (this.currentMusic === musicId && this.isPlaying) {
                        this.playSynthesizedMusic(musicId);
                    }
                }, loopInterval * 1000);
            }
            
            this.fallbackAudio = {
                oscillators: oscillators,
                gains: gains,
                filters: filters,
                startTime: now,
                musicId: musicId
            };
            
        } catch (error) {
            console.warn('❌ Erro na música sintetizada:', error);
        }
    }

    createOscillator(frequency, type, startTime) {
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.start(startTime);
        
        // Adicionar variação para tornar mais orgânico
        if (type !== 'sine') {
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            
            lfo.type = 'sine';
            lfo.frequency.value = 0.5 + Math.random() * 2;
            lfoGain.gain.value = frequency * 0.02;
            
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            lfo.start(startTime);
            
            oscillator.lfo = lfo;
            oscillator.lfoGain = lfoGain;
        }
        
        return oscillator;
    }

    stopSynthesizedMusic() {
        if (this.currentLoop) {
            clearInterval(this.currentLoop);
            this.currentLoop = null;
        }
        
        if (this.fallbackAudio) {
            try {
                const now = this.audioContext.currentTime;
                const fadeOutTime = 1.0; // 1 segundo para fade out
                
                // Fade out suave
                this.fallbackAudio.gains.forEach(gain => {
                    gain.gain.linearRampToValueAtTime(0, now + fadeOutTime);
                });
                
                // Parar osciladores após fade out
                setTimeout(() => {
                    if (this.fallbackAudio) {
                        this.fallbackAudio.oscillators.forEach(osc => {
                            try {
                                osc.stop();
                                if (osc.lfo) {
                                    osc.lfo.stop();
                                }
                            } catch (e) {
                                // Ignora erros de já parado
                            }
                        });
                        this.fallbackAudio = null;
                    }
                }, fadeOutTime * 1000);
                
            } catch (error) {
                console.warn('❌ Erro ao parar música sintetizada:', error);
                this.fallbackAudio = null;
            }
        }
    }

    async playMusic(musicId, forceRestart = false) {
        if (this.muted || !this.music.has(musicId)) {
            console.warn(`❌ Música ${musicId} não disponível ou sistema mutado`);
            return;
        }

        // Se já está tocando a mesma música, não reinicia
        if (this.currentMusic === musicId && !forceRestart) {
            console.log(`🎵 Música ${musicId} já está tocando`);
            return;
        }

        console.log(`🎵 Tocando música: ${this.musicConfig[musicId]?.name || musicId}`);

        // Para música atual
        await this.stopCurrentMusic();

        const music = this.music.get(musicId);
        const config = this.musicConfig[musicId];

        if (music.isSynthesized) {
            // Usar música sintetizada
            this.currentMusic = musicId;
            this.isPlaying = true;
            music.play();
        } else {
            // Usar música carregada
            try {
                music.volume = 0;
                music.currentTime = 0;
                music.loop = config.loop;
                
                // Fade in
                const fadeInDuration = config.fadeIn || 2000;
                music.volume = 0;
                const playPromise = music.play();
                
                if (playPromise !== undefined) {
                    await playPromise.catch(error => {
                        console.warn(`❌ Erro ao reproduzir música ${musicId}:`, error);
                        // Fallback para sintetizada
                        this.createSynthesizedMusic(musicId, config);
                        this.playMusic(musicId, true);
                        return;
                    });
                }

                // Fade in suave
                this.fadeVolume(music, 0, config.volume * this.volume, fadeInDuration);
                
                this.currentMusic = musicId;
                this.isPlaying = true;

                // Configurar loop se necessário
                if (!config.loop) {
                    music.addEventListener('ended', () => {
                        this.currentMusic = null;
                        this.isPlaying = false;
                    }, { once: true });
                }

            } catch (error) {
                console.warn(`❌ Erro ao tocar música ${musicId}:`, error);
                // Fallback para sintetizada
                this.createSynthesizedMusic(musicId, config);
                this.playMusic(musicId, true);
            }
        }
    }

    async stopCurrentMusic() {
        if (!this.currentMusic || !this.isPlaying) return;

        console.log(`🎵 Parando música: ${this.musicConfig[this.currentMusic]?.name || this.currentMusic}`);

        const currentMusic = this.music.get(this.currentMusic);
        const config = this.musicConfig[this.currentMusic];

        if (currentMusic.isSynthesized) {
            this.stopSynthesizedMusic();
        } else {
            try {
                // Fade out suave
                const fadeOutDuration = config?.fadeOut || 1500;
                await this.fadeVolume(currentMusic, currentMusic.volume, 0, fadeOutDuration);
                currentMusic.pause();
                currentMusic.currentTime = 0;
            } catch (error) {
                console.warn('❌ Erro ao parar música:', error);
                currentMusic.pause();
                currentMusic.currentTime = 0;
            }
        }

        this.currentMusic = null;
        this.isPlaying = false;
    }

    fadeVolume(audioElement, startVolume, endVolume, duration) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const initialVolume = audioElement.volume;

            const updateVolume = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                audioElement.volume = initialVolume + (endVolume - initialVolume) * progress;
                
                if (progress < 1) {
                    requestAnimationFrame(updateVolume);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(updateVolume);
        });
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Atualizar volume da música atual
        if (this.currentMusic && this.isPlaying) {
            const music = this.music.get(this.currentMusic);
            const config = this.musicConfig[this.currentMusic];
            
            if (!music.isSynthesized && music.volume > 0) {
                music.volume = config.volume * this.volume;
            }
        }
        
        console.log(`🎚️ Volume da música definido para: ${Math.round(this.volume * 100)}%`);
    }

    toggleMute() {
        this.muted = !this.muted;
        
        if (this.muted) {
            this.stopCurrentMusic();
        } else if (this.currentMusic) {
            this.playMusic(this.currentMusic, true);
        }
        
        console.log(this.muted ? '🔇 Música mutada' : '🔊 Música ativada');
        return this.muted;
    }

    resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
            console.log('🔊 AudioContext da música retomado');
        }
    }

    // Métodos específicos para o jogo
    playMenuMusic() {
        this.playMusic('menu');
    }

    playBattleMusic() {
        this.playMusic('battle');
    }

    playVictoryMusic() {
        this.playMusic('victory');
    }

    playExplorationMusic() {
        this.playMusic('exploration');
    }

    // Status do sistema
    getStatus() {
        const currentMusicInfo = this.currentMusic ? {
            name: this.musicConfig[this.currentMusic]?.name,
            type: this.music.get(this.currentMusic)?.isSynthesized ? 'Sintetizada' : 'Arquivo MP3',
            volume: Math.round(this.volume * 100)
        } : null;

        return {
            currentMusic: currentMusicInfo,
            isPlaying: this.isPlaying,
            volume: this.volume,
            muted: this.muted,
            loadedMusic: Array.from(this.music.keys()).map(id => ({
                id: id,
                name: this.musicConfig[id]?.name,
                type: this.music.get(id)?.isSynthesized ? 'Sintetizada' : 'Arquivo MP3'
            }))
        };
    }

    // Debug e teste
    testAllMusic() {
        console.log('🎵 Testando todas as músicas...');
        const musicTypes = ['menu', 'battle', 'victory', 'exploration'];
        let currentIndex = 0;
        
        const playNextMusic = () => {
            if (currentIndex < musicTypes.length) {
                const musicId = musicTypes[currentIndex];
                console.log(`🎵 Tocando: ${this.musicConfig[musicId].name}`);
                this.playMusic(musicId);
                currentIndex++;
                setTimeout(playNextMusic, 6000); // 6 segundos cada música
            } else {
                // Voltar para música do menu
                setTimeout(() => {
                    this.playMenuMusic();
                }, 1000);
            }
        };
        
        playNextMusic();
    }
}

// Instância global
if (typeof window !== 'undefined') {
    window.musicSystem = new MusicSystem();
    
    // Ativar áudio na primeira interação
    document.addEventListener('click', () => {
        window.musicSystem.resumeAudio();
    });
    
    // Debug
    window.debugMusic = () => {
        console.log('🎵 Status do MusicSystem:', window.musicSystem.getStatus());
    };

    // Teste rápido
    window.testMusic = () => {
        window.musicSystem.testAllMusic();
    };
}

export default MusicSystem;