// js/settings.js - SISTEMA DE CONFIGURAÇÕES COMPLETO COM MÚSICA
class SoundSettings {
    constructor() {
        this.settings = {
            // Configurações de áudio
            masterVolume: 0.6,
            musicVolume: 0.4,
            effectsVolume: 0.7,
            mutedSounds: [],
            musicMuted: false,
            
            // Configurações de efeitos visuais
            enableParticles: true,
            enableScreenShake: true,
            enableAnimations: true,
            effectsIntensity: 0.8
        };
        
        this.soundDefinitions = [
            // Ações básicas
            { id: 'mine', name: 'Mineração', desc: 'Som de minerar/plantar', icon: '⛏️', category: 'actions' },
            { id: 'recruit', name: 'Recrutamento', desc: 'Som de recrutar exército', icon: '⚔️', category: 'actions' },
            { id: 'fortify', name: 'Fortificação', desc: 'Som de fortificar muralhas', icon: '🏰', category: 'actions' },
            { id: 'war', name: 'Guerra', desc: 'Som de declarar guerra', icon: '⚔️', category: 'combat' },
            
            // Interface
            { id: 'click', name: 'Clique', desc: 'Som de clique na interface', icon: '👆', category: 'interface' },
            { id: 'hover', name: 'Hover', desc: 'Som ao passar mouse', icon: '🖱️', category: 'interface' },
            { id: 'select_character', name: 'Seleção', desc: 'Som de selecionar personagem', icon: '👑', category: 'interface' },
            
            // Cartas
            { id: 'card_play', name: 'Jogar Carta', desc: 'Som de jogar carta', icon: '🎴', category: 'cards' },
            { id: 'card_buy', name: 'Compra Carta', desc: 'Som de comprar carta', icon: '💰', category: 'cards' },
            
            // Eventos
            { id: 'victory', name: 'Vitória', desc: 'Som de vitória no jogo', icon: '🎉', category: 'events' },
            { id: 'defeat', name: 'Derrota', desc: 'Som de derrota no jogo', icon: '💀', category: 'events' },
            { id: 'upgrade', name: 'Upgrade', desc: 'Som de comprar upgrade', icon: '🔼', category: 'events' },
            { id: 'rebellion', name: 'Rebelião', desc: 'Som de rebelião', icon: '🔥', category: 'events' },
            
            // Especiais
            { id: 'magic', name: 'Magia', desc: 'Som de efeitos mágicos', icon: '✨', category: 'special' },
            { id: 'treasure', name: 'Tesouro', desc: 'Som de encontrar tesouro', icon: '💎', category: 'special' },
            { id: 'celebration', name: 'Celebração', desc: 'Som de celebração', icon: '🎊', category: 'special' }
        ];

        this.musicDefinitions = [
            { id: 'menu', name: 'Música do Menu', desc: 'Tema principal do menu', icon: '🏰', category: 'music' },
            { id: 'battle', name: 'Música de Batalha', desc: 'Tema épico para combates', icon: '⚔️', category: 'music' },
            { id: 'victory', name: 'Música da Vitória', desc: 'Tema para vitórias', icon: '🎉', category: 'music' },
            { id: 'exploration', name: 'Música de Exploração', desc: 'Tema para exploração', icon: '🗺️', category: 'music' }
        ];

        this.effectDefinitions = [
            { id: 'particles', name: 'Partículas', desc: 'Efeitos de partículas em ações', icon: '✨', category: 'visual' },
            { id: 'screen_shake', name: 'Tremer Tela', desc: 'Tela treme em batalhas', icon: '🌋', category: 'visual' },
            { id: 'animations', name: 'Animações', desc: 'Animações de interface', icon: '🎬', category: 'visual' },
            { id: 'glow_effects', name: 'Efeitos de Brilho', desc: 'Brilho em botões e elementos', icon: '💫', category: 'visual' }
        ];
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.createSettingsButton();
        this.createSettingsPanel();
        this.setupEventListeners();
        this.applySettings();
        console.log('🎵 SoundSettings inicializado com suporte a música');

        // Teste imediato para verificar se está funcionando
        setTimeout(() => {
            console.log('🔧 Teste SoundSettings:', {
                button: !!this.gearBtn,
                overlay: !!this.overlay,
                settings: this.settings
            });
        }, 1000);
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('reinoConflitoSoundSettings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
                console.log('⚙️ Configurações carregadas:', this.settings);
            }
        } catch (e) {
            console.warn('❌ Erro ao carregar configurações, usando padrões');
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('reinoConflitoSoundSettings', JSON.stringify(this.settings));
            console.log('💾 Configurações salvas');
        } catch (e) {
            console.warn('❌ Erro ao salvar configurações');
        }
    }

    applySettings() {
        // Aplicar configurações de áudio
        if (window.audioSystem) {
            window.audioSystem.setVolume(this.settings.masterVolume);
            console.log('🔊 Configurações aplicadas ao AudioSystem');
        }

        // Aplicar configurações de música
        if (window.musicSystem) {
            window.musicSystem.setVolume(this.settings.musicVolume);
            // Aplicar estado de mute apenas se for diferente do atual
            const shouldBeMuted = this.settings.musicMuted;
            const currentlyMuted = window.musicSystem.muted;
            if (shouldBeMuted !== currentlyMuted) {
                window.musicSystem.toggleMute();
            }
            console.log('🎵 Configurações aplicadas ao MusicSystem');
        }

        // Aplicar configurações de efeitos visuais
        this.applyVisualEffectsSettings();
    }

    applyVisualEffectsSettings() {
        // Aplicar intensidade dos efeitos
        const intensity = this.settings.effectsIntensity;
        document.documentElement.style.setProperty('--effects-intensity', intensity);
        
        console.log('✨ Configurações visuais aplicadas:', {
            particles: this.settings.enableParticles,
            screenShake: this.settings.enableScreenShake,
            animations: this.settings.enableAnimations,
            intensity: intensity
        });
    }

    createSettingsButton() {
        // Remove botão existente se houver
        const existingBtn = document.querySelector('.settings-gear');
        if (existingBtn) {
            existingBtn.remove();
        }

        const gearBtn = document.createElement('button');
        gearBtn.className = 'settings-gear';
        gearBtn.innerHTML = '⚙️';
        gearBtn.title = 'Configurações de Som, Música e Efeitos';
        gearBtn.setAttribute('aria-label', 'Abrir configurações de som, música e efeitos');
        
        document.body.appendChild(gearBtn);
        this.gearBtn = gearBtn;
    }

    createSettingsPanel() {
        // Remove overlay existente se houver
        const existingOverlay = document.querySelector('.settings-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'settings-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    generateSettingsHTML() {
        return `
            <div class="settings-panel">
                <div class="settings-header">
                    <h2>🎵 Configurações de Som & Música</h2>
                    <button class="settings-close" title="Fechar (ESC)" aria-label="Fechar configurações">×</button>
                </div>

                <!-- Controles de Volume Principal -->
                <div class="settings-section">
                    <h3>🔊 Controles de Volume</h3>
                    
                    <div class="volume-control">
                        <div class="volume-icon">🔊</div>
                        <input type="range" class="volume-slider" id="master-volume" 
                               min="0" max="100" value="${this.settings.masterVolume * 100}" 
                               data-setting="masterVolume" aria-label="Volume Mestre">
                        <div class="volume-value" id="master-volume-value">${Math.round(this.settings.masterVolume * 100)}%</div>
                    </div>
                    
                    <div class="volume-control">
                        <div class="volume-icon">🎮</div>
                        <input type="range" class="volume-slider" id="effects-volume" 
                               min="0" max="100" value="${this.settings.effectsVolume * 100}" 
                               data-setting="effectsVolume" aria-label="Volume dos Efeitos">
                        <div class="volume-value" id="effects-volume-value">${Math.round(this.settings.effectsVolume * 100)}%</div>
                    </div>

                    <div class="volume-control">
                        <div class="volume-icon">🎵</div>
                        <input type="range" class="volume-slider" id="music-volume" 
                               min="0" max="100" value="${this.settings.musicVolume * 100}" 
                               data-setting="musicVolume" aria-label="Volume da Música">
                        <div class="volume-value" id="music-volume-value">${Math.round(this.settings.musicVolume * 100)}%</div>
                    </div>

                    <!-- Intensidade dos Efeitos Visuais -->
                    <div class="volume-control">
                        <div class="volume-icon">✨</div>
                        <input type="range" class="volume-slider" id="effects-intensity" 
                               min="0" max="100" value="${this.settings.effectsIntensity * 100}" 
                               data-setting="effectsIntensity" aria-label="Intensidade dos Efeitos Visuais">
                        <div class="volume-value" id="effects-intensity-value">${Math.round(this.settings.effectsIntensity * 100)}%</div>
                    </div>
                </div>

                <!-- Configurações de Música -->
                <div class="settings-section">
                    <h3>🎵 Controles de Música</h3>
                    
                    <div class="music-controls-grid">
                        <div class="music-control-buttons">
                            <button class="action-btn test-btn" id="test-music" type="button" style="flex: 1;">
                                🎵 Testar Músicas
                            </button>
                            <button class="action-btn ${this.settings.musicMuted ? 'unmute-all-btn' : 'mute-all-btn'}" id="toggle-music" type="button" style="flex: 1;">
                                ${this.settings.musicMuted ? '🔊 Ativar Música' : '🔇 Mutar Música'}
                            </button>
                        </div>
                        
                        <div class="music-tracks">
                            <h4>🎼 Faixas Musicais</h4>
                            ${this.generateMusicTracks()}
                        </div>
                    </div>
                </div>

                <!-- Configurações de Efeitos Visuais -->
                <div class="settings-section">
                    <h3>✨ Efeitos Visuais</h3>
                    
                    <div class="effects-grid">
                        ${this.generateEffectsGrid()}
                    </div>
                </div>

                <!-- Sons Individuais -->
                <div class="settings-section">
                    <h3>🎯 Sons Individuais</h3>
                    <div class="sounds-grid" id="sounds-grid">
                        ${this.generateSoundsGrid()}
                    </div>
                </div>

                <!-- Status do Sistema -->
                <div class="settings-section">
                    <h3>📊 Status do Sistema</h3>
                    <div style="margin-bottom: 10px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 3px; font-size: 0.85em; color: var(--color-text-light);">
                        <strong>💡 Dica:</strong> Se os controles de áudio não funcionarem, clique em qualquer lugar da página primeiro para ativar o áudio (política de autoplay dos navegadores).
                    </div>
                    <div id="system-status" style="color: var(--color-text-light); font-size: 0.9em; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
                        ${this.generateSystemStatus()}
                    </div>
                </div>

                <!-- Ações Rápidas -->
                <div class="settings-actions">
                    <button class="action-btn mute-all-btn" id="mute-all" type="button">🔇 Mutar Todos</button>
                    <button class="action-btn unmute-all-btn" id="unmute-all" type="button">🔊 Ativar Todos</button>
                    <button class="action-btn test-btn" id="test-sounds" type="button">🎵 Testar Sons</button>
                    <button class="action-btn test-btn" id="test-effects" type="button">✨ Testar Efeitos</button>
                    <button class="action-btn reset-btn" id="reset-settings" type="button">🔄 Redefinir</button>
                </div>
            </div>
        `;
    }

    generateMusicTracks() {
        return this.musicDefinitions.map(music => {
            const isCurrent = window.musicSystem && window.musicSystem.currentMusic === music.id;
            return `
                <div class="music-track ${isCurrent ? 'music-track-current' : ''}" data-music-id="${music.id}">
                    <div class="music-track-info">
                        <span class="music-icon">${music.icon}</span>
                        <div class="music-details">
                            <span class="music-name">${music.name}</span>
                            <span class="music-desc">${music.desc}</span>
                        </div>
                    </div>
                    <div class="music-track-controls">
                        <button class="music-play-btn" data-music-id="${music.id}" 
                                title="Tocar ${music.name}">
                            ${isCurrent ? '⏸️' : '▶️'}
                        </button>
                        <span class="music-status">${isCurrent ? 'Tocando' : 'Parada'}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateEffectsGrid() {
        return `
            <div class="effect-category">
                <div class="effect-toggle">
                    <label for="enable-particles">
                        <span class="effect-icon">✨</span>
                        <span class="effect-info">
                            <span class="effect-name">Partículas</span>
                            <span class="effect-desc">Efeitos de partículas em ações</span>
                        </span>
                    </label>
                    <input type="checkbox" id="enable-particles" ${this.settings.enableParticles ? 'checked' : ''} 
                           data-setting="enableParticles" class="effect-toggle-checkbox">
                </div>

                <div class="effect-toggle">
                    <label for="enable-screen-shake">
                        <span class="effect-icon">🌋</span>
                        <span class="effect-info">
                            <span class="effect-name">Tremer Tela</span>
                            <span class="effect-desc">Tela treme em batalhas</span>
                        </span>
                    </label>
                    <input type="checkbox" id="enable-screen-shake" ${this.settings.enableScreenShake ? 'checked' : ''} 
                           data-setting="enableScreenShake" class="effect-toggle-checkbox">
                </div>

                <div class="effect-toggle">
                    <label for="enable-animations">
                        <span class="effect-icon">🎬</span>
                        <span class="effect-info">
                            <span class="effect-name">Animações</span>
                            <span class="effect-desc">Animações de interface</span>
                        </span>
                    </label>
                    <input type="checkbox" id="enable-animations" ${this.settings.enableAnimations ? 'checked' : ''} 
                           data-setting="enableAnimations" class="effect-toggle-checkbox">
                </div>
            </div>
        `;
    }

    generateSoundsGrid() {
        const categories = {
            actions: '🎯 Ações',
            combat: '⚔️ Combate', 
            cards: '🎴 Cartas',
            events: '🎉 Eventos',
            interface: '🖱️ Interface',
            special: '✨ Especiais'
        };

        let html = '';
        
        for (const [category, title] of Object.entries(categories)) {
            const categorySounds = this.soundDefinitions.filter(sound => sound.category === category);
            
            if (categorySounds.length > 0) {
                html += `<div class="sound-category"><h4>${title}</h4>`;
                html += categorySounds.map(sound => {
                    const isMuted = this.settings.mutedSounds.includes(sound.id);
                    return `
                        <div class="sound-item" data-sound-id="${sound.id}">
                            <div class="sound-icon">${sound.icon}</div>
                            <div class="sound-info">
                                <div class="sound-name">${sound.name}</div>
                                <div class="sound-desc">${sound.desc}</div>
                            </div>
                            <div class="sound-controls">
                                <button class="sound-toggle ${isMuted ? 'muted' : ''}" 
                                        data-sound-id="${sound.id}" type="button"
                                        aria-label="${isMuted ? 'Ativar' : 'Desativar'} ${sound.name}">
                                    ${isMuted ? '🔇' : '🔊'}
                                </button>
                                <button class="sound-test" data-sound-id="${sound.id}" type="button"
                                        aria-label="Testar ${sound.name}">
                                    ▶️
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
                html += '</div>';
            }
        }
        
        return html;
    }

    generateSystemStatus() {
        const audioStatus = window.audioSystem ? 
            `✅ AudioSystem: ${window.audioSystem.sounds ? window.audioSystem.sounds.size : 'N/A'} sons` : 
            '❌ AudioSystem: Não inicializado';
        
        const musicStatus = window.musicSystem ? 
            `✅ MusicSystem: ${window.musicSystem.music ? window.musicSystem.music.size : 'N/A'} músicas` : 
            '❌ MusicSystem: Não inicializado';
        
        const effectsStatus = window.visualEffects ? 
            '✅ VisualEffects: Pronto' : 
            '❌ VisualEffects: Não inicializado';
        
        const mutedCount = this.settings.mutedSounds.length;
        const totalSounds = this.soundDefinitions.length;
        
        const currentMusic = window.musicSystem && window.musicSystem.currentMusic ? 
            this.musicDefinitions.find(m => m.id === window.musicSystem.currentMusic)?.name : 'Nenhuma';
        
        return `
            <div><strong>Sistema de Áudio:</strong> ${audioStatus}</div>
            <div><strong>Sistema de Música:</strong> ${musicStatus}</div>
            <div><strong>Sistema de Efeitos:</strong> ${effectsStatus}</div>
            <div><strong>Música Atual:</strong> ${currentMusic}</div>
            <div><strong>Sons Carregados:</strong> ${window.audioSystem && window.audioSystem.sounds ? window.audioSystem.sounds.size : 0}/${totalSounds}</div>
            <div><strong>Sons Mutados:</strong> ${mutedCount}/${totalSounds}</div>
            <div><strong>Volume Mestre:</strong> ${Math.round(this.settings.masterVolume * 100)}%</div>
            <div><strong>Volume Música:</strong> ${Math.round(this.settings.musicVolume * 100)}%</div>
            <div><strong>Intensidade Efeitos:</strong> ${Math.round(this.settings.effectsIntensity * 100)}%</div>
            <div><strong>Partículas:</strong> ${this.settings.enableParticles ? '✅' : '❌'}</div>
            <div><strong>Tremer Tela:</strong> ${this.settings.enableScreenShake ? '✅' : '❌'}</div>
            <div><strong>Música:</strong> ${this.settings.musicMuted ? '🔇' : '🔊'}</div>
        `;
    }

    setupEventListeners() {
        // Botão de engrenagem
        this.gearBtn.addEventListener('click', () => this.openSettings());

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.closeSettings();
            }
        });

        // Fechar ao clicar fora
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.closeSettings();
            }
        });
    }

    setupPanelEventListeners() {
        console.log('🎵 Configurando event listeners do painel de configurações...');

        // Delegation para eventos dinâmicos do painel
        this.overlay.addEventListener('click', (e) => {
            const target = e.target.closest('button') || e.target;

            console.log('🎵 Clique detectado no elemento:', target.id || target.className);

            if (target.classList.contains('settings-close')) {
                console.log('🎵 Fechando configurações');
                this.closeSettings();
                return;
            }

            if (target.classList.contains('sound-toggle')) {
                console.log('🎵 Toggle som:', target.dataset.soundId);
                this.toggleSound(target.dataset.soundId);
                return;
            }

            if (target.classList.contains('sound-test')) {
                console.log('🎵 Testando som:', target.dataset.soundId);
                this.testSound(target.dataset.soundId);
                return;
            }

            if (target.classList.contains('music-play-btn')) {
                console.log('🎵 Controle música:', target.dataset.musicId);
                this.playMusicTrack(target.dataset.musicId);
                return;
            }

            if (target.id === 'mute-all') {
                console.log('🎵 Mutando todos os sons');
                this.muteAllSounds();
                return;
            }

            if (target.id === 'unmute-all') {
                console.log('🎵 Ativando todos os sons');
                this.unmuteAllSounds();
                return;
            }

            if (target.id === 'test-sounds') {
                console.log('🎵 Testando todos os sons');
                this.testAllSounds();
                return;
            }

            if (target.id === 'test-effects') {
                console.log('🎵 Testando efeitos visuais');
                this.testAllEffects();
                return;
            }

            if (target.id === 'test-music') {
                console.log('🎵 Testando músicas');
                this.testAllMusic();
                return;
            }

            if (target.id === 'toggle-music') {
                console.log('🎵 Toggle música');
                this.toggleMusic();
                return;
            }

            if (target.id === 'reset-settings') {
                console.log('🎵 Resetando configurações');
                this.resetSettings();
                return;
            }
        });

        // Sliders de volume e intensidade
        this.overlay.addEventListener('input', (e) => {
            if (e.target.classList.contains('volume-slider')) {
                console.log('🎵 Volume alterado:', e.target.id, e.target.value);
                this.handleVolumeChange(e.target);
            }
        });

        // Toggles de efeitos visuais
        this.overlay.addEventListener('change', (e) => {
            if (e.target.classList.contains('effect-toggle-checkbox')) {
                console.log('🎵 Toggle efeito visual:', e.target.id, e.target.checked);
                this.handleEffectToggle(e.target);
            }
        });

        console.log('✅ Event listeners do painel configurados');
    }

    handleVolumeChange(slider) {
        const setting = slider.dataset.setting;
        const value = parseInt(slider.value) / 100;
        
        this.settings[setting] = value;
        this.updateVolumeDisplay(slider);
        this.saveSettings();
        this.applySettings();
        this.updateSystemStatus();
    }

    handleEffectToggle(checkbox) {
        const setting = checkbox.dataset.setting;
        this.settings[setting] = checkbox.checked;
        this.saveSettings();
        this.applySettings();
        this.updateSystemStatus();
    }

    updateVolumeDisplay(slider) {
        const valueDisplay = document.getElementById(`${slider.id}-value`);
        if (valueDisplay) {
            valueDisplay.textContent = `${slider.value}%`;
        }
    }

    toggleSound(soundId) {
        const index = this.settings.mutedSounds.indexOf(soundId);
        
        if (index > -1) {
            this.settings.mutedSounds.splice(index, 1);
        } else {
            this.settings.mutedSounds.push(soundId);
        }
        
        this.saveSettings();
        this.updateSoundToggleUI(soundId);
        this.updateSystemStatus();
    }

    updateSoundToggleUI(soundId) {
        const toggleBtn = this.overlay.querySelector(`.sound-toggle[data-sound-id="${soundId}"]`);
        const isMuted = this.settings.mutedSounds.includes(soundId);
        
        if (toggleBtn) {
            toggleBtn.textContent = isMuted ? '🔇' : '🔊';
            toggleBtn.classList.toggle('muted', isMuted);
            toggleBtn.setAttribute('aria-label', `${isMuted ? 'Ativar' : 'Desativar'} ${this.getSoundName(soundId)}`);
        }
    }

    getSoundName(soundId) {
        const sound = this.soundDefinitions.find(s => s.id === soundId);
        return sound ? sound.name : soundId;
    }

    testSound(soundId) {
        console.log(`🔊 Testando som: ${soundId}`);

        if (window.audioSystem) {
            // Forçar reprodução mesmo se o som estiver mutado (para teste)
            const originalMuted = window.audioSystem.muted;
            window.audioSystem.muted = false; // Temporariamente desmutar

            // Criar uma versão temporária do play que ignora as configurações de mute
            const originalPlay = window.audioSystem.play;
            window.audioSystem.play = function(soundId, options = {}) {
                if (!this.sounds.has(soundId)) {
                    return;
                }

                const sound = this.sounds.get(soundId);
                const volume = options.volume || this.volume;
                const pitch = options.pitch || 1.0;

                console.log(`🔊 [TESTE] Tocando som medieval: ${soundId}`);

                // Mesmo código do play normal, mas sem verificar mute
                if (this.audioContext && this.audioContext.state === 'running') {
                    try {
                        this.playMedievalSound(sound, volume, pitch);
                    } catch (error) {
                        console.warn(`❌ Erro no teste do som ${soundId}, usando fallback:`, error);
                        this.playFallbackSound(sound, volume);
                    }
                } else if (this.audioContext && this.audioContext.state === 'suspended') {
                    console.log(`🔊 AudioContext suspenso, tentando retomar para teste ${soundId}`);
                    this.audioContext.resume().then(() => {
                        try {
                            this.playMedievalSound(sound, volume, pitch);
                        } catch (error) {
                            console.warn(`❌ Erro após resume no teste, usando fallback:`, error);
                            this.playFallbackSound(sound, volume);
                        }
                    }).catch(error => {
                        console.warn(`❌ Falha ao retomar AudioContext no teste:`, error);
                        this.playFallbackSound(sound, volume);
                    });
                } else {
                    console.log(`🔊 AudioContext indisponível (${this.audioContext?.state}), usando fallback para teste`);
                    this.playFallbackSound(sound, volume);
                }
            };

            // Tocar o som
            window.audioSystem.play(soundId);

            // Restaurar o método original
            window.audioSystem.play = originalPlay;
            window.audioSystem.muted = originalMuted;

        } else {
            console.warn(`❌ AudioSystem não disponível para testar ${soundId}`);
        }
    }

    testAllSounds() {
        console.log('🎵 Testando todos os sons...');
        let delay = 0;
        
        this.soundDefinitions.forEach(sound => {
            if (!this.settings.mutedSounds.includes(sound.id)) {
                setTimeout(() => {
                    this.testSound(sound.id);
                }, delay);
                delay += 300; // 300ms entre cada som
            }
        });
    }

    testAllEffects() {
        console.log('✨ Testando todos os efeitos visuais...');
        
        if (!window.visualEffects) {
            console.warn('❌ VisualEffects não disponível');
            return;
        }

        // Sequência de testes de efeitos
        window.visualEffects.playMineEffects();
        
        setTimeout(() => {
            window.visualEffects.playRecruitEffects();
        }, 800);
        
        setTimeout(() => {
            window.visualEffects.playWarEffects();
        }, 1600);
        
        setTimeout(() => {
            window.visualEffects.playVictoryEffects();
        }, 2400);
        
        setTimeout(() => {
            window.visualEffects.playMagicEffects();
        }, 3200);
    }

    testAllMusic() {
        console.log('🎵 Testando todas as músicas...');
        
        if (!window.musicSystem) {
            console.warn('❌ MusicSystem não disponível');
            return;
        }
        
        const musicTypes = ['menu', 'battle', 'victory', 'exploration'];
        let currentIndex = 0;
        
        const playNextMusic = () => {
            if (currentIndex < musicTypes.length) {
                const musicId = musicTypes[currentIndex];
                console.log(`🎵 Tocando: ${musicId}`);
                window.musicSystem.playMusic(musicId);
                currentIndex++;
                setTimeout(playNextMusic, 5000); // 5 segundos cada música
            } else {
                // Voltar para música do menu
                setTimeout(() => {
                    window.musicSystem.playMenuMusic();
                }, 1000);
            }
        };
        
        playNextMusic();
        this.updateMusicTracksUI();
    }

    playMusicTrack(musicId) {
        console.log(`🎵 Tentando controlar música: ${musicId}`);

        if (!window.musicSystem) {
            console.warn('❌ MusicSystem não disponível');
            return;
        }

        try {
            // Se já está tocando esta música, pausar
            if (window.musicSystem.currentMusic === musicId && window.musicSystem.isPlaying) {
                console.log(`🎵 Pausando música: ${musicId}`);
                window.musicSystem.stopCurrentMusic();
            } else {
                console.log(`🎵 Tocando música: ${musicId}`);
                window.musicSystem.playMusic(musicId);
            }

            // Pequeno delay para atualização da UI
            setTimeout(() => {
                this.updateMusicTracksUI();
            }, 100);

        } catch (error) {
            console.error(`❌ Erro ao controlar música ${musicId}:`, error);
        }
    }

    updateMusicTracksUI() {
        if (!this.overlay) return;

        const musicTracks = this.overlay.querySelectorAll('.music-track');
        musicTracks.forEach(track => {
            const musicId = track.dataset.musicId;
            const isCurrent = window.musicSystem && window.musicSystem.currentMusic === musicId;
            const isPlaying = window.musicSystem && window.musicSystem.isPlaying;

            track.classList.toggle('music-track-current', isCurrent && isPlaying);

            const playBtn = track.querySelector('.music-play-btn');
            const status = track.querySelector('.music-status');

            if (playBtn) {
                playBtn.textContent = (isCurrent && isPlaying) ? '⏸️' : '▶️';
                playBtn.title = (isCurrent && isPlaying) ? `Pausar ${track.dataset.musicId}` : `Tocar ${track.dataset.musicId}`;
            }

            if (status) {
                if (isCurrent && isPlaying) {
                    status.textContent = 'Tocando';
                    status.style.color = 'var(--color-army)';
                } else if (isCurrent && !isPlaying) {
                    status.textContent = 'Pausada';
                    status.style.color = 'var(--color-gold)';
                } else {
                    status.textContent = 'Parada';
                    status.style.color = 'var(--color-text-light)';
                }
            }
        });

        // Atualizar botão de toggle de música
        const toggleBtn = this.overlay.querySelector('#toggle-music');
        if (toggleBtn && window.musicSystem) {
            const isMuted = window.musicSystem.muted;
            toggleBtn.textContent = isMuted ? '🔊 Ativar Música' : '🔇 Mutar Música';
            toggleBtn.className = `action-btn ${isMuted ? 'unmute-all-btn' : 'mute-all-btn'}`;
        }

        this.updateSystemStatus();
    }

    toggleMusic() {
        console.log('🎵 Toggle música chamado');

        if (!window.musicSystem) {
            console.warn('❌ MusicSystem não disponível para toggle');
            return;
        }

        try {
            const isMuted = window.musicSystem.toggleMute();
            console.log(`🎵 Música ${isMuted ? 'mutada' : 'ativada'}`);

            this.settings.musicMuted = isMuted;

            // Atualizar botão no painel
            const button = document.getElementById('toggle-music');
            if (button) {
                button.textContent = isMuted ? '🔊 Ativar Música' : '🔇 Mutar Música';
                button.className = `action-btn ${isMuted ? 'unmute-all-btn' : 'mute-all-btn'}`;
            }

            this.saveSettings();
            this.updateSystemStatus();

            // Pequeno delay para garantir que a mudança seja refletida
            setTimeout(() => {
                this.updateMusicTracksUI();
            }, 100);

        } catch (error) {
            console.error('❌ Erro ao fazer toggle da música:', error);
        }
    }

    muteAllSounds() {
        this.settings.mutedSounds = this.soundDefinitions.map(sound => sound.id);
        this.saveSettings();
        this.refreshSoundsGrid();
        this.updateSystemStatus();
    }

    unmuteAllSounds() {
        this.settings.mutedSounds = [];
        this.saveSettings();
        this.refreshSoundsGrid();
        this.updateSystemStatus();
    }

    resetSettings() {
        if (confirm('Tem certeza que deseja redefinir todas as configurações de som, música e efeitos?')) {
            this.settings = {
                masterVolume: 0.6,
                musicVolume: 0.4,
                effectsVolume: 0.7,
                mutedSounds: [],
                musicMuted: false,
                enableParticles: true,
                enableScreenShake: true,
                enableAnimations: true,
                effectsIntensity: 0.8
            };
            this.saveSettings();
            this.applySettings();
            this.refreshSettingsPanel();
            console.log('🔄 Configurações redefinidas');
        }
    }

    refreshSoundsGrid() {
        const grid = this.overlay.querySelector('#sounds-grid');
        if (grid) {
            grid.innerHTML = this.generateSoundsGrid();
            // Re-aplicar classes muted após recriar a grid
            this.settings.mutedSounds.forEach(soundId => {
                this.updateSoundToggleUI(soundId);
            });
        }
    }

    updateSystemStatus() {
        const statusEl = this.overlay.querySelector('#system-status');
        if (statusEl) {
            statusEl.innerHTML = this.generateSystemStatus();
        }
    }

    refreshSettingsPanel() {
        this.overlay.innerHTML = this.generateSettingsHTML();
        this.setupPanelEventListeners();
        this.updateMusicTracksUI();
    }

    openSettings() {
        this.overlay.innerHTML = this.generateSettingsHTML();
        this.overlay.classList.add('active');
        this.overlay.setAttribute('aria-hidden', 'false');
        this.setupPanelEventListeners();
        this.updateSystemStatus();
        this.updateMusicTracksUI();

        // Iniciar atualização automática da UI da música
        this.startMusicUIUpdates();

        // Focar no botão fechar para acessibilidade
        const closeBtn = this.overlay.querySelector('.settings-close');
        if (closeBtn) closeBtn.focus();
    }

    closeSettings() {
        this.overlay.classList.remove('active');
        this.overlay.setAttribute('aria-hidden', 'true');

        // Parar atualização automática da UI da música
        this.stopMusicUIUpdates();

        // Devolver foco para o botão de engrenagem
        this.gearBtn.focus();
    }

    startMusicUIUpdates() {
        // Atualizar UI da música a cada 500ms quando o painel estiver aberto
        this.musicUIUpdateInterval = setInterval(() => {
            if (this.overlay.classList.contains('active')) {
                this.updateMusicTracksUI();
            }
        }, 500);
    }

    stopMusicUIUpdates() {
        if (this.musicUIUpdateInterval) {
            clearInterval(this.musicUIUpdateInterval);
            this.musicUIUpdateInterval = null;
        }
    }

    // Métodos para integração com o jogo
    canPlaySound(soundId) {
        return !this.settings.mutedSounds.includes(soundId);
    }

    getEffectiveVolume() {
        return this.settings.masterVolume * this.settings.effectsVolume;
    }

    shouldPlaySound(soundId) {
        return this.canPlaySound(soundId) && this.getEffectiveVolume() > 0;
    }

    // Métodos para efeitos visuais
    shouldShowParticles() {
        return this.settings.enableParticles && this.settings.effectsIntensity > 0;
    }

    shouldShakeScreen() {
        return this.settings.enableScreenShake && this.settings.effectsIntensity > 0;
    }

    shouldAnimate() {
        return this.settings.enableAnimations && this.settings.effectsIntensity > 0;
    }

    getEffectsIntensity() {
        return this.settings.effectsIntensity;
    }
}

// Inicialização automática
function initializeSoundSettings() {
    // Aguardar um pouco para garantir que o DOM está pronto
    setTimeout(() => {
        if (!window.soundSettings) {
            window.soundSettings = new SoundSettings();
            console.log('✅ SoundSettings inicializado com suporte completo a música');
        }
    }, 500);
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSoundSettings);
} else {
    initializeSoundSettings();
}

// Export para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundSettings;
}